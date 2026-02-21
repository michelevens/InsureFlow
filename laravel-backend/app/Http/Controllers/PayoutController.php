<?php

namespace App\Http\Controllers;

use App\Models\Commission;
use App\Models\CommissionPayout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PayoutController extends Controller
{
    /**
     * Create a Stripe Connect Express account for the agent.
     * POST /payouts/connect-account
     */
    public function createConnectAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role, ['agent', 'agency_owner'])) {
            return response()->json(['message' => 'Only agents can connect payout accounts'], 403);
        }

        $stripeSecret = config('services.stripe.secret');
        if (!$stripeSecret) {
            return response()->json(['message' => 'Stripe is not configured'], 503);
        }

        $stripe = new \Stripe\StripeClient($stripeSecret);

        try {
            // If they already have an account, just generate a new link
            if ($user->stripe_account_id) {
                $link = $stripe->accountLinks->create([
                    'account' => $user->stripe_account_id,
                    'refresh_url' => rtrim(config('app.frontend_url', 'https://insurons.com'), '/') . '/commissions?connect=refresh',
                    'return_url' => rtrim(config('app.frontend_url', 'https://insurons.com'), '/') . '/commissions?connected=1',
                    'type' => 'account_onboarding',
                ]);

                return response()->json([
                    'url' => $link->url,
                    'account_id' => $user->stripe_account_id,
                ]);
            }

            // Create new Express account
            $account = $stripe->accounts->create([
                'type' => 'express',
                'email' => $user->email,
                'metadata' => [
                    'user_id' => $user->id,
                    'platform' => 'insurons',
                ],
                'capabilities' => [
                    'card_payments' => ['requested' => true],
                    'transfers' => ['requested' => true],
                ],
            ]);

            $user->update([
                'stripe_account_id' => $account->id,
            ]);

            // Generate onboarding link
            $link = $stripe->accountLinks->create([
                'account' => $account->id,
                'refresh_url' => rtrim(config('app.frontend_url', 'https://insurons.com'), '/') . '/commissions?connect=refresh',
                'return_url' => rtrim(config('app.frontend_url', 'https://insurons.com'), '/') . '/commissions?connected=1',
                'type' => 'account_onboarding',
            ]);

            return response()->json([
                'url' => $link->url,
                'account_id' => $account->id,
            ]);
        } catch (\Throwable $e) {
            Log::error('Stripe Connect account creation failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to create payout account'], 500);
        }
    }

    /**
     * Check Stripe Connect account status.
     * GET /payouts/connect-status
     */
    public function connectAccountStatus(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->stripe_account_id) {
            return response()->json([
                'stripe_account_id' => null,
                'stripe_onboarded' => false,
                'charges_enabled' => false,
                'payouts_enabled' => false,
            ]);
        }

        $stripeSecret = config('services.stripe.secret');
        if (!$stripeSecret) {
            return response()->json([
                'stripe_account_id' => $user->stripe_account_id,
                'stripe_onboarded' => $user->stripe_onboarded,
            ]);
        }

        try {
            $stripe = new \Stripe\StripeClient($stripeSecret);
            $account = $stripe->accounts->retrieve($user->stripe_account_id);

            $onboarded = $account->charges_enabled && $account->payouts_enabled;
            if ($onboarded && !$user->stripe_onboarded) {
                $user->update(['stripe_onboarded' => true]);
            }

            return response()->json([
                'stripe_account_id' => $user->stripe_account_id,
                'stripe_onboarded' => $onboarded,
                'charges_enabled' => $account->charges_enabled,
                'payouts_enabled' => $account->payouts_enabled,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Stripe Connect status check failed: ' . $e->getMessage());
            return response()->json([
                'stripe_account_id' => $user->stripe_account_id,
                'stripe_onboarded' => $user->stripe_onboarded,
            ]);
        }
    }

    /**
     * Generate a fresh onboarding link for incomplete accounts.
     * POST /payouts/connect-refresh
     */
    public function refreshConnectLink(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->stripe_account_id) {
            return response()->json(['message' => 'No Connect account found'], 404);
        }

        $stripeSecret = config('services.stripe.secret');
        if (!$stripeSecret) {
            return response()->json(['message' => 'Stripe is not configured'], 503);
        }

        try {
            $stripe = new \Stripe\StripeClient($stripeSecret);
            $link = $stripe->accountLinks->create([
                'account' => $user->stripe_account_id,
                'refresh_url' => rtrim(config('app.frontend_url', 'https://insurons.com'), '/') . '/commissions?connect=refresh',
                'return_url' => rtrim(config('app.frontend_url', 'https://insurons.com'), '/') . '/commissions?connected=1',
                'type' => 'account_onboarding',
            ]);

            return response()->json(['url' => $link->url]);
        } catch (\Throwable $e) {
            Log::error('Stripe Connect refresh failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to refresh link'], 500);
        }
    }

    /**
     * Request a payout of pending commissions.
     * POST /payouts/request
     */
    public function requestPayout(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->stripe_onboarded) {
            return response()->json(['message' => 'Complete Stripe Connect onboarding first'], 422);
        }

        // Get all pending commissions for this agent
        $pendingCommissions = Commission::where('agent_id', $user->id)
            ->where('status', 'pending')
            ->get();

        if ($pendingCommissions->isEmpty()) {
            return response()->json(['message' => 'No pending commissions to pay out'], 422);
        }

        $totalAmount = $pendingCommissions->sum('commission_amount');
        $platformFeePercent = config('services.stripe.platform_fee_percent', 5);
        $platformFee = round($totalAmount * ($platformFeePercent / 100), 2);
        $payoutAmount = $totalAmount - $platformFee;

        if ($payoutAmount < 1) {
            return response()->json(['message' => 'Payout amount too small (minimum $1.00)'], 422);
        }

        $stripeSecret = config('services.stripe.secret');
        if (!$stripeSecret) {
            return response()->json(['message' => 'Stripe is not configured'], 503);
        }

        try {
            $stripe = new \Stripe\StripeClient($stripeSecret);

            // Create Stripe transfer to agent's Connected account
            $transfer = $stripe->transfers->create([
                'amount' => (int) round($payoutAmount * 100), // cents
                'currency' => 'usd',
                'destination' => $user->stripe_account_id,
                'metadata' => [
                    'agent_id' => $user->id,
                    'commission_count' => $pendingCommissions->count(),
                    'platform' => 'insurons',
                ],
            ]);

            // Create payout record
            $payout = CommissionPayout::create([
                'agent_id' => $user->id,
                'amount' => $payoutAmount,
                'platform_fee' => $platformFee,
                'stripe_transfer_id' => $transfer->id,
                'status' => 'completed',
                'period_start' => $pendingCommissions->min('created_at')?->toDateString(),
                'period_end' => now()->toDateString(),
                'commission_ids' => $pendingCommissions->pluck('id')->toArray(),
                'paid_at' => now(),
            ]);

            // Mark commissions as paid
            Commission::whereIn('id', $pendingCommissions->pluck('id'))
                ->update(['status' => 'paid', 'paid_at' => now()]);

            return response()->json([
                'message' => 'Payout processed successfully',
                'payout' => $payout,
            ]);
        } catch (\Throwable $e) {
            Log::error('Payout transfer failed: ' . $e->getMessage());

            // Record failed payout
            CommissionPayout::create([
                'agent_id' => $user->id,
                'amount' => $payoutAmount,
                'platform_fee' => $platformFee,
                'status' => 'failed',
                'period_start' => $pendingCommissions->min('created_at')?->toDateString(),
                'period_end' => now()->toDateString(),
                'commission_ids' => $pendingCommissions->pluck('id')->toArray(),
                'failure_reason' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Payout transfer failed'], 500);
        }
    }

    /**
     * Get payout history.
     * GET /payouts/history
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = CommissionPayout::where('agent_id', $user->id)
            ->orderByDesc('created_at');

        // Admin can view any agent's payouts
        if (in_array($user->role, ['admin', 'superadmin']) && $request->filled('agent_id')) {
            $query = CommissionPayout::where('agent_id', $request->agent_id)
                ->orderByDesc('created_at');
        }

        $payouts = $query->paginate(20);

        return response()->json($payouts);
    }
}
