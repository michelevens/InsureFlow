<?php

namespace App\Http\Controllers;

use App\Models\SellerBalance;
use App\Models\SellerPayoutRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SellerPayoutController extends Controller
{
    // ═══════════════════════════════════════════════════════════════
    //  Agency Owner Endpoints
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get seller balance for the current user's agency.
     * GET /seller-payouts/balance
     */
    public function balance(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->agency_id) {
            return response()->json(['message' => 'No agency associated'], 403);
        }

        $balance = SellerBalance::firstOrCreate(
            ['agency_id' => $user->agency_id],
            ['pending_amount' => 0, 'available_amount' => 0, 'lifetime_earned' => 0, 'lifetime_paid' => 0]
        );

        return response()->json([
            'available' => (float) $balance->available_amount,
            'pending' => (float) $balance->pending_amount,
            'lifetime_earned' => (float) $balance->lifetime_earned,
            'lifetime_paid' => (float) $balance->lifetime_paid,
        ]);
    }

    /**
     * Request a payout of available marketplace earnings.
     * POST /seller-payouts/request
     */
    public function requestPayout(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:5',
            'payout_method' => 'sometimes|in:stripe_connect,manual',
        ]);

        $user = $request->user();
        if (!$user->agency_id) {
            return response()->json(['message' => 'No agency associated'], 403);
        }

        $amount = round((float) $request->amount, 2);

        return DB::transaction(function () use ($user, $amount, $request) {
            $balance = SellerBalance::lockForUpdate()
                ->where('agency_id', $user->agency_id)
                ->first();

            if (!$balance || $balance->available_amount < $amount) {
                return response()->json(['message' => 'Insufficient balance'], 422);
            }

            // Check for existing pending request
            $existingPending = SellerPayoutRequest::where('agency_id', $user->agency_id)
                ->where('status', 'pending')
                ->exists();

            if ($existingPending) {
                return response()->json(['message' => 'You already have a pending payout request'], 422);
            }

            // Reserve the amount
            $balance->reserveForPayout($amount);

            $payoutRequest = SellerPayoutRequest::create([
                'agency_id' => $user->agency_id,
                'requested_by' => $user->id,
                'amount' => $amount,
                'status' => 'pending',
                'payout_method' => $request->input('payout_method', 'stripe_connect'),
                'stripe_account_id' => $user->stripe_account_id,
            ]);

            return response()->json([
                'message' => 'Payout request submitted for admin review',
                'request' => $payoutRequest,
                'new_available_balance' => (float) $balance->fresh()->available_amount,
            ], 201);
        });
    }

    /**
     * Get payout request history for the agency.
     * GET /seller-payouts/history
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->agency_id) {
            return response()->json(['message' => 'No agency associated'], 403);
        }

        $requests = SellerPayoutRequest::where('agency_id', $user->agency_id)
            ->with('reviewer:id,name')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($requests);
    }

    // ═══════════════════════════════════════════════════════════════
    //  Admin Endpoints
    // ═══════════════════════════════════════════════════════════════

    /**
     * List all payout requests (admin).
     * GET /admin/seller-payouts
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = SellerPayoutRequest::with(['agency:id,name', 'requester:id,name,email'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $requests = $query->paginate(25);

        $summary = [
            'pending_count' => SellerPayoutRequest::where('status', 'pending')->count(),
            'pending_total' => (float) SellerPayoutRequest::where('status', 'pending')->sum('amount'),
            'completed_total' => (float) SellerPayoutRequest::where('status', 'completed')->sum('amount'),
        ];

        return response()->json([
            'requests' => $requests,
            'summary' => $summary,
        ]);
    }

    /**
     * Approve a payout request and optionally process it immediately.
     * PUT /admin/seller-payouts/{payoutRequest}/approve
     */
    public function approve(Request $request, SellerPayoutRequest $payoutRequest): JsonResponse
    {
        if ($payoutRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be approved'], 422);
        }

        $admin = $request->user();
        $payoutRequest->update([
            'status' => 'approved',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
            'admin_notes' => $request->input('admin_notes'),
        ]);

        // If Stripe Connect is available, process immediately
        if ($payoutRequest->payout_method === 'stripe_connect' && $payoutRequest->stripe_account_id) {
            return $this->processStripePayout($payoutRequest);
        }

        return response()->json([
            'message' => 'Payout approved — awaiting manual processing',
            'request' => $payoutRequest->fresh()->load('agency:id,name'),
        ]);
    }

    /**
     * Reject a payout request and release reserved funds.
     * PUT /admin/seller-payouts/{payoutRequest}/reject
     */
    public function reject(Request $request, SellerPayoutRequest $payoutRequest): JsonResponse
    {
        if ($payoutRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be rejected'], 422);
        }

        $admin = $request->user();

        return DB::transaction(function () use ($payoutRequest, $admin, $request) {
            $payoutRequest->update([
                'status' => 'rejected',
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
                'admin_notes' => $request->input('admin_notes', 'Rejected by admin'),
            ]);

            // Release reserved funds back to available balance
            $balance = SellerBalance::where('agency_id', $payoutRequest->agency_id)->first();
            if ($balance) {
                $balance->releaseReserved($payoutRequest->amount);
            }

            return response()->json([
                'message' => 'Payout request rejected — funds released back to seller',
                'request' => $payoutRequest->fresh()->load('agency:id,name'),
            ]);
        });
    }

    /**
     * Mark an approved payout as completed (manual processing).
     * PUT /admin/seller-payouts/{payoutRequest}/complete
     */
    public function markCompleted(Request $request, SellerPayoutRequest $payoutRequest): JsonResponse
    {
        if (!in_array($payoutRequest->status, ['approved', 'processing'])) {
            return response()->json(['message' => 'Only approved/processing requests can be completed'], 422);
        }

        return DB::transaction(function () use ($payoutRequest) {
            $payoutRequest->update([
                'status' => 'completed',
                'paid_at' => now(),
            ]);

            $balance = SellerBalance::where('agency_id', $payoutRequest->agency_id)->first();
            if ($balance) {
                $balance->confirmPayout($payoutRequest->amount);
            }

            return response()->json([
                'message' => 'Payout marked as completed',
                'request' => $payoutRequest->fresh()->load('agency:id,name'),
            ]);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    //  Internal Helpers
    // ═══════════════════════════════════════════════════════════════

    private function processStripePayout(SellerPayoutRequest $payoutRequest): JsonResponse
    {
        $stripeSecret = config('services.stripe.secret');
        if (!$stripeSecret) {
            $payoutRequest->update(['status' => 'approved']);
            return response()->json([
                'message' => 'Approved — Stripe not configured, awaiting manual processing',
                'request' => $payoutRequest->fresh()->load('agency:id,name'),
            ]);
        }

        try {
            $payoutRequest->update(['status' => 'processing']);

            $stripe = new \Stripe\StripeClient($stripeSecret);
            $transfer = $stripe->transfers->create([
                'amount' => (int) round($payoutRequest->amount * 100),
                'currency' => 'usd',
                'destination' => $payoutRequest->stripe_account_id,
                'metadata' => [
                    'payout_request_id' => $payoutRequest->id,
                    'agency_id' => $payoutRequest->agency_id,
                    'platform' => 'insurons',
                    'type' => 'marketplace_seller_payout',
                ],
            ]);

            $payoutRequest->update([
                'status' => 'completed',
                'stripe_transfer_id' => $transfer->id,
                'paid_at' => now(),
            ]);

            $balance = SellerBalance::where('agency_id', $payoutRequest->agency_id)->first();
            if ($balance) {
                $balance->confirmPayout($payoutRequest->amount);
            }

            return response()->json([
                'message' => 'Payout processed via Stripe',
                'request' => $payoutRequest->fresh()->load('agency:id,name'),
            ]);
        } catch (\Throwable $e) {
            Log::error('Seller payout Stripe transfer failed', [
                'payout_request_id' => $payoutRequest->id,
                'error' => $e->getMessage(),
            ]);

            $payoutRequest->update([
                'status' => 'failed',
                'failure_reason' => $e->getMessage(),
            ]);

            // Release funds back
            $balance = SellerBalance::where('agency_id', $payoutRequest->agency_id)->first();
            if ($balance) {
                $balance->releaseReserved($payoutRequest->amount);
            }

            return response()->json(['message' => 'Stripe transfer failed — funds released'], 500);
        }
    }
}
