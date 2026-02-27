<?php
namespace App\Http\Controllers;

use App\Models\LeadCredit;
use App\Models\LeadMarketplaceListing;
use App\Models\LeadMarketplaceTransaction;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
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
                'success_url' => rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://insurons.com')), '/') . '/billing?success=true',
                'cancel_url' => rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://insurons.com')), '/') . '/pricing?canceled=true',
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

    public function portal(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = Subscription::where('user_id', $user->id)
            ->whereNotNull('stripe_customer_id')
            ->latest()
            ->first();

        if (!$subscription || !$subscription->stripe_customer_id) {
            return response()->json(['error' => 'No billing account found'], 404);
        }

        $stripeSecret = config('services.stripe.secret');
        if (!$stripeSecret) {
            return response()->json(['error' => 'Payment system not configured'], 503);
        }

        Stripe::setApiKey($stripeSecret);

        try {
            $portalSession = \Stripe\BillingPortal\Session::create([
                'customer' => $subscription->stripe_customer_id,
                'return_url' => rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://insurons.com')), '/') . '/billing',
            ]);

            return response()->json(['portal_url' => $portalSession->url]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create billing portal session'], 503);
        }
    }

    public function billingOverview(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = Subscription::where('user_id', $user->id)
            ->with('plan')
            ->latest()
            ->first();

        $credit = LeadCredit::where('user_id', $user->id)->first();

        return response()->json([
            'subscription' => $subscription,
            'plan' => $subscription?->plan,
            'credits' => $credit ? [
                'balance' => $credit->credits_balance,
                'used' => $credit->credits_used,
                'plan_allowance' => $subscription?->plan?->lead_credits_per_month ?? 0,
                'last_replenished' => $credit->last_replenished_at,
            ] : null,
        ]);
    }

    public function creditTopUp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pack' => 'required|in:starter,pro,bulk',
        ]);

        $packs = [
            'starter' => ['credits' => 10, 'price' => 2900, 'label' => 'Starter Pack (10 credits)'],
            'pro'     => ['credits' => 25, 'price' => 5900, 'label' => 'Pro Pack (25 credits)'],
            'bulk'    => ['credits' => 100, 'price' => 17900, 'label' => 'Bulk Pack (100 credits)'],
        ];

        $pack = $packs[$data['pack']];

        $stripeSecret = config('services.stripe.secret');
        if (!$stripeSecret) {
            return response()->json(['error' => 'Payment system not configured'], 503);
        }

        Stripe::setApiKey($stripeSecret);

        try {
            $session = StripeSession::create([
                'payment_method_types' => ['card'],
                'mode' => 'payment',
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'usd',
                        'unit_amount' => $pack['price'],
                        'product_data' => ['name' => $pack['label']],
                    ],
                    'quantity' => 1,
                ]],
                'customer_email' => $request->user()->email,
                'metadata' => [
                    'type' => 'credit_top_up',
                    'user_id' => $request->user()->id,
                    'pack' => $data['pack'],
                    'credits' => $pack['credits'],
                ],
                'success_url' => rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://insurons.com')), '/') . '/billing?success=true&credits=' . $pack['credits'],
                'cancel_url' => rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://insurons.com')), '/') . '/billing?canceled=true',
            ]);

            return response()->json(['checkout_url' => $session->url]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create checkout session'], 503);
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
                // Route marketplace lead purchases to dedicated handler
                $type = $session->metadata->type ?? null;
                if ($type === 'marketplace_lead_purchase') {
                    $this->handleMarketplacePurchaseCompleted($session);
                } elseif ($type === 'credit_top_up') {
                    $this->handleCreditTopUpCompleted($session);
                } else {
                    $this->handleCheckoutCompleted($session);
                }
                break;
            case 'payment_intent.succeeded':
                $paymentIntent = $event->data->object;
                if (($paymentIntent->metadata->type ?? null) === 'marketplace_lead_purchase') {
                    $this->handleMarketplacePaymentIntentSucceeded($paymentIntent);
                }
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

    private function handleCreditTopUpCompleted($session): void
    {
        $userId = $session->metadata->user_id ?? null;
        $credits = (int) ($session->metadata->credits ?? 0);
        $pack = $session->metadata->pack ?? 'unknown';

        if (!$userId || $credits <= 0) {
            \Log::warning('Credit top-up webhook missing metadata', ['session_id' => $session->id]);
            return;
        }

        $creditRecord = LeadCredit::firstOrCreate(
            ['user_id' => $userId],
            ['credits_balance' => 0, 'credits_used' => 0]
        );

        $creditRecord->addCredits($credits, "Credit top-up: {$pack} pack ({$credits} credits)");

        \Log::info('Credit top-up completed', [
            'user_id' => $userId,
            'pack' => $pack,
            'credits' => $credits,
            'new_balance' => $creditRecord->fresh()->credits_balance,
        ]);
    }

    /**
     * Handle Stripe Checkout completion for a marketplace lead purchase.
     */
    private function handleMarketplacePurchaseCompleted($session): void
    {
        $listingId = $session->metadata->listing_id ?? null;
        $buyerId = $session->metadata->buyer_id ?? null;

        if (!$listingId || !$buyerId) {
            \Log::warning('Marketplace checkout webhook missing metadata', ['session_id' => $session->id]);
            return;
        }

        $transaction = LeadMarketplaceTransaction::where('stripe_checkout_session_id', $session->id)
            ->where('payment_status', 'pending')
            ->first();

        if (!$transaction) {
            \Log::warning('No pending transaction found for checkout session', ['session_id' => $session->id]);
            return;
        }

        $listing = LeadMarketplaceListing::find($listingId);
        $buyer = User::find($buyerId);

        if (!$listing || !$buyer) {
            \Log::error('Marketplace webhook: listing or buyer not found', ['listing_id' => $listingId, 'buyer_id' => $buyerId]);
            return;
        }

        // Update transaction with payment intent from the checkout session
        $transaction->update([
            'stripe_payment_intent_id' => $session->payment_intent ?? null,
        ]);

        try {
            app(LeadMarketplaceController::class)->completePurchase($listing, $buyer, $transaction);
        } catch (\Throwable $e) {
            \Log::error('Marketplace purchase completion failed after checkout', [
                'session_id' => $session->id,
                'listing_id' => $listingId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle Stripe PaymentIntent success for a marketplace lead purchase (in-app payment flow).
     */
    private function handleMarketplacePaymentIntentSucceeded($paymentIntent): void
    {
        $listingId = $paymentIntent->metadata->listing_id ?? null;
        $buyerId = $paymentIntent->metadata->buyer_id ?? null;

        if (!$listingId || !$buyerId) {
            \Log::warning('Marketplace payment_intent webhook missing metadata', ['pi_id' => $paymentIntent->id]);
            return;
        }

        $transaction = LeadMarketplaceTransaction::where('stripe_payment_intent_id', $paymentIntent->id)
            ->where('payment_status', 'pending')
            ->first();

        if (!$transaction) {
            \Log::warning('No pending transaction found for payment intent', ['pi_id' => $paymentIntent->id]);
            return;
        }

        $listing = LeadMarketplaceListing::find($listingId);
        $buyer = User::find($buyerId);

        if (!$listing || !$buyer) {
            \Log::error('Marketplace webhook: listing or buyer not found', ['listing_id' => $listingId, 'buyer_id' => $buyerId]);
            return;
        }

        try {
            app(LeadMarketplaceController::class)->completePurchase($listing, $buyer, $transaction);
        } catch (\Throwable $e) {
            \Log::error('Marketplace purchase completion failed after payment_intent', [
                'pi_id' => $paymentIntent->id,
                'listing_id' => $listingId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
