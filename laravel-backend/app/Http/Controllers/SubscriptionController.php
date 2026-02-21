<?php
namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Stripe;
use Stripe\Webhook;

class SubscriptionController extends Controller
{
    public function plans(): JsonResponse
    {
        $plans = SubscriptionPlan::where('is_active', true)
            ->orderBy('sort_order')
            ->get();
        return response()->json($plans);
    }

    public function current(Request $request): JsonResponse
    {
        $subscription = Subscription::where('user_id', $request->user()->id)
            ->with('plan')
            ->latest()
            ->first();
        return response()->json(['subscription' => $subscription]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
            'billing_cycle' => 'required|in:monthly,annual',
        ]);

        $plan = SubscriptionPlan::findOrFail($data['plan_id']);
        $priceId = $data['billing_cycle'] === 'annual'
            ? $plan->stripe_price_id_annual
            : $plan->stripe_price_id_monthly;

        if (!$priceId) {
            return response()->json(['error' => 'Stripe price not configured for this plan'], 422);
        }

        $stripeSecret = config('services.stripe.secret');
        if (!$stripeSecret) {
            return response()->json(['error' => 'Payment system not configured'], 503);
        }

        Stripe::setApiKey($stripeSecret);

        try {
            $session = StripeSession::create([
                'payment_method_types' => ['card'],
                'mode' => 'subscription',
                'line_items' => [['price' => $priceId, 'quantity' => 1]],
                'customer_email' => $request->user()->email,
                'metadata' => [
                    'user_id' => $request->user()->id,
                    'plan_id' => $plan->id,
                    'billing_cycle' => $data['billing_cycle'],
                ],
                'success_url' => rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://insureflow.com')), '/') . '/billing?success=true',
                'cancel_url' => rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://insureflow.com')), '/') . '/pricing?canceled=true',
            ]);

            return response()->json(['checkout_url' => $session->url]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create checkout session'], 503);
        }
    }

    public function cancel(Request $request): JsonResponse
    {
        $subscription = Subscription::where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->first();

        if (!$subscription || !$subscription->stripe_subscription_id) {
            return response()->json(['error' => 'No active subscription found'], 404);
        }

        try {
            Stripe::setApiKey(config('services.stripe.secret'));
            $stripeSubscription = \Stripe\Subscription::retrieve($subscription->stripe_subscription_id);
            $stripeSubscription->cancel_at_period_end = true;
            $stripeSubscription->save();

            $subscription->update([
                'status' => 'canceled',
                'canceled_at' => now(),
            ]);

            return response()->json(['message' => 'Subscription will cancel at end of billing period']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to cancel subscription'], 503);
        }
    }

    public function resume(Request $request): JsonResponse
    {
        $subscription = Subscription::where('user_id', $request->user()->id)
            ->where('status', 'canceled')
            ->first();

        if (!$subscription || !$subscription->stripe_subscription_id) {
            return response()->json(['error' => 'No canceled subscription found'], 404);
        }

        try {
            Stripe::setApiKey(config('services.stripe.secret'));
            $stripeSubscription = \Stripe\Subscription::retrieve($subscription->stripe_subscription_id);
            $stripeSubscription->cancel_at_period_end = false;
            $stripeSubscription->save();

            $subscription->update([
                'status' => 'active',
                'canceled_at' => null,
            ]);

            return response()->json(['message' => 'Subscription resumed']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to resume subscription'], 503);
        }
    }

    public function handleWebhook(Request $request): JsonResponse
    {
        $secret = config('services.stripe.webhook_secret');
        if (!$secret) {
            return response()->json(['error' => 'Webhook not configured'], 500);
        }

        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                $request->header('Stripe-Signature'),
                $secret
            );
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invalid webhook signature'], 400);
        }

        switch ($event->type) {
            case 'checkout.session.completed':
                $session = $event->data->object;
                $this->handleCheckoutCompleted($session);
                break;
            case 'customer.subscription.updated':
                $stripeSubscription = $event->data->object;
                $this->handleSubscriptionUpdated($stripeSubscription);
                break;
            case 'customer.subscription.deleted':
                $stripeSubscription = $event->data->object;
                $this->handleSubscriptionDeleted($stripeSubscription);
                break;
        }

        return response()->json(['received' => true]);
    }

    private function handleCheckoutCompleted($session): void
    {
        $userId = $session->metadata->user_id ?? null;
        $planId = $session->metadata->plan_id ?? null;
        $billingCycle = $session->metadata->billing_cycle ?? 'monthly';

        if (!$userId || !$planId) return;

        Subscription::updateOrCreate(
            ['user_id' => $userId],
            [
                'subscription_plan_id' => $planId,
                'stripe_subscription_id' => $session->subscription,
                'stripe_customer_id' => $session->customer,
                'status' => 'active',
                'billing_cycle' => $billingCycle,
                'current_period_start' => now(),
                'current_period_end' => $billingCycle === 'annual' ? now()->addYear() : now()->addMonth(),
            ]
        );
    }

    private function handleSubscriptionUpdated($stripeSubscription): void
    {
        $subscription = Subscription::where('stripe_subscription_id', $stripeSubscription->id)->first();
        if (!$subscription) return;

        $status = match ($stripeSubscription->status) {
            'active' => 'active',
            'past_due' => 'past_due',
            'canceled' => 'canceled',
            'trialing' => 'trialing',
            default => 'incomplete',
        };

        $subscription->update([
            'status' => $status,
            'current_period_start' => \Carbon\Carbon::createFromTimestamp($stripeSubscription->current_period_start),
            'current_period_end' => \Carbon\Carbon::createFromTimestamp($stripeSubscription->current_period_end),
        ]);
    }

    private function handleSubscriptionDeleted($stripeSubscription): void
    {
        Subscription::where('stripe_subscription_id', $stripeSubscription->id)
            ->update(['status' => 'canceled', 'canceled_at' => now()]);
    }
}
