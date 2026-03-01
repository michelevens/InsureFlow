<?php

namespace App\Http\Controllers;

use App\Models\Agency;
use App\Models\Lead;
use App\Models\LeadCredit;
use App\Models\LeadPoolClaim;
use App\Models\PlatformProduct;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadPoolController extends Controller
{
    /**
     * Browse pool leads that match the agency's products and geography.
     */
    public function browse(Request $request)
    {
        $user = $request->user();
        $agencyId = $request->attributes->get('agency_id');

        if (!$agencyId) {
            return response()->json(['error' => 'No agency context'], 403);
        }

        // Get agency's active product slugs
        $productSlugs = PlatformProduct::whereHas('agencies', fn ($q) =>
            $q->where('agencies.id', $agencyId)->where('agency_products.is_active', true)
        )->pluck('slug')->toArray();

        // If no products configured, show nothing (agency must set up products first)
        if (empty($productSlugs)) {
            return response()->json([
                'data' => [],
                'message' => 'Your agency has no active products configured. Add products in your agency settings to see matching leads.',
            ]);
        }

        // Get agency's licensed states
        $agency = Agency::find($agencyId);
        $agencyStates = array_filter([$agency?->state]);

        // Also check agents' licensed states
        $agentStates = DB::table('agent_profiles')
            ->join('users', 'agent_profiles.user_id', '=', 'users.id')
            ->where('users.agency_id', $agencyId)
            ->whereNotNull('agent_profiles.license_states')
            ->pluck('agent_profiles.license_states')
            ->flatMap(fn ($states) => is_string($states) ? json_decode($states, true) ?? [] : (is_array($states) ? $states : []))
            ->toArray();

        $allStates = array_values(array_unique(array_filter(array_merge($agencyStates, $agentStates))));

        // Also expand insurance type aliases (e.g. "auto" matches "auto", "automobile", etc.)
        $expandedSlugs = [];
        foreach ($productSlugs as $slug) {
            $expandedSlugs[] = $slug;
            $expanded = QuoteController::expandInsuranceTypes($slug);
            $expandedSlugs = array_merge($expandedSlugs, $expanded);
        }
        $expandedSlugs = array_values(array_unique($expandedSlugs));

        $query = Lead::where('is_pool', true)
            ->whereIn('pool_status', ['open', 'claimed'])
            ->where(function ($q) {
                $q->whereNull('pool_expires_at')
                  ->orWhere('pool_expires_at', '>', now());
            })
            ->whereIn('insurance_type', $expandedSlugs)
            ->whereDoesntHave('poolClaims', fn ($q) => $q->where('agency_id', $agencyId))
            ->whereColumn('current_claims', '<', 'max_claims');

        // Geographic filter
        if (!empty($allStates)) {
            $query->where(function ($q) use ($allStates) {
                $q->whereIn('state', $allStates)
                  ->orWhereNull('state'); // leads without state match all
            });
        }

        // Optional filters
        if ($type = $request->query('insurance_type')) {
            $query->where('insurance_type', $type);
        }
        if ($state = $request->query('state')) {
            $query->where('state', $state);
        }

        // Sort
        $sort = $request->query('sort', 'newest');
        match ($sort) {
            'value_desc' => $query->orderByDesc('estimated_value'),
            'value_asc' => $query->orderBy('estimated_value'),
            'oldest' => $query->orderBy('created_at'),
            default => $query->orderByDesc('created_at'),
        };

        $leads = $query->paginate(20);

        // Anonymize: strip PII before returning
        $leads->getCollection()->transform(fn (Lead $lead) => [
            'id' => $lead->id,
            'insurance_type' => $lead->insurance_type,
            'state' => $lead->state,
            'zip_prefix' => $lead->zip_code ? substr($lead->zip_code, 0, 3) . '**' : null,
            'estimated_value' => $lead->estimated_value,
            'created_at' => $lead->created_at,
            'current_claims' => $lead->current_claims,
            'max_claims' => $lead->max_claims,
            'pool_status' => $lead->pool_status,
            'credit_cost' => LeadMarketplaceController::creditCostFor($lead->insurance_type),
        ]);

        return response()->json($leads);
    }

    /**
     * Claim a pool lead for the agency. Costs credits.
     */
    public function claim(Request $request, Lead $lead)
    {
        $user = $request->user();
        $agencyId = $request->attributes->get('agency_id');

        if (!$agencyId) {
            return response()->json(['error' => 'No agency context'], 403);
        }

        // Verify it's a pool lead
        if (!$lead->is_pool || !in_array($lead->pool_status, ['open', 'claimed'])) {
            return response()->json(['error' => 'This lead is not available in the pool'], 422);
        }

        // Verify not expired
        if ($lead->pool_expires_at && $lead->pool_expires_at->isPast()) {
            return response()->json(['error' => 'This pool lead has expired'], 422);
        }

        // Verify not already claimed by this agency
        if (LeadPoolClaim::where('lead_id', $lead->id)->where('agency_id', $agencyId)->exists()) {
            return response()->json(['error' => 'Your agency has already claimed this lead'], 422);
        }

        // Verify product match
        $productSlugs = PlatformProduct::whereHas('agencies', fn ($q) =>
            $q->where('agencies.id', $agencyId)->where('agency_products.is_active', true)
        )->pluck('slug')->toArray();

        $expandedSlugs = [];
        foreach ($productSlugs as $slug) {
            $expandedSlugs[] = $slug;
            $expandedSlugs = array_merge($expandedSlugs, QuoteController::expandInsuranceTypes($slug));
        }

        if (!in_array($lead->insurance_type, array_unique($expandedSlugs))) {
            return response()->json(['error' => 'Your agency does not offer this product type'], 403);
        }

        // Check credits
        $creditCost = LeadMarketplaceController::creditCostFor($lead->insurance_type);
        $subscription = Subscription::where('user_id', $user->id)->with('plan')->latest()->first();
        $planCredits = $subscription?->plan?->lead_credits_per_month ?? 0;

        if ($planCredits !== -1) {
            $credit = LeadCredit::where('user_id', $user->id)->first();
            if (!$credit || $credit->credits_balance < $creditCost) {
                return response()->json([
                    'error' => 'Insufficient credits',
                    'credits_needed' => $creditCost,
                    'credits_available' => $credit?->credits_balance ?? 0,
                ], 402);
            }
        }

        // Atomic claim with row lock
        return DB::transaction(function () use ($lead, $agencyId, $user, $creditCost, $planCredits) {
            $lead = Lead::lockForUpdate()->find($lead->id);

            if ($lead->current_claims >= $lead->max_claims) {
                return response()->json(['error' => 'All claim slots for this lead are taken'], 422);
            }

            // Deduct credits
            if ($planCredits !== -1) {
                $credit = LeadCredit::firstOrCreate(
                    ['user_id' => $user->id, 'agency_id' => $agencyId],
                    ['credits_balance' => 0, 'credits_used' => 0]
                );
                $credit->deduct($creditCost, "Pool lead claim - lead #{$lead->id}", 'lead', $lead->id);
            }

            // Create the claim
            $claim = LeadPoolClaim::create([
                'lead_id' => $lead->id,
                'agency_id' => $agencyId,
                'claimed_by' => $user->id,
                'status' => 'claimed',
                'claimed_at' => now(),
                'quote_deadline' => now()->addHours(24),
                'credits_spent' => $creditCost,
            ]);

            // Update pool lead counters
            $lead->increment('current_claims');
            if ($lead->current_claims + 1 >= $lead->max_claims) {
                $lead->update(['pool_status' => 'claimed']);
            } elseif ($lead->pool_status === 'open') {
                // Keep as open if still has slots
            }

            return response()->json([
                'claim' => $claim,
                'lead' => $lead->fresh(),
                'credits_spent' => $creditCost,
            ], 201);
        });
    }

    /**
     * Mark a claim as quoted (agency has submitted a quote for this lead).
     */
    public function submitQuote(Request $request, Lead $lead)
    {
        $agencyId = $request->attributes->get('agency_id');

        $claim = LeadPoolClaim::where('lead_id', $lead->id)
            ->where('agency_id', $agencyId)
            ->first();

        if (!$claim) {
            return response()->json(['error' => 'Your agency has not claimed this lead'], 404);
        }

        if ($claim->status !== 'claimed') {
            return response()->json(['error' => "Claim status is '{$claim->status}', expected 'claimed'"], 422);
        }

        if ($claim->isExpired()) {
            $claim->update(['status' => 'expired']);
            return response()->json(['error' => 'Your claim has expired (24h deadline passed)'], 422);
        }

        $claim->update([
            'status' => 'quoted',
            'quoted_at' => now(),
        ]);

        // Check if all claims are now quoted or expired
        $pendingClaims = LeadPoolClaim::where('lead_id', $lead->id)
            ->where('status', 'claimed')
            ->count();

        if ($pendingClaims === 0) {
            $lead->update(['pool_status' => 'quoted']);
        }

        return response()->json(['claim' => $claim->fresh()]);
    }

    /**
     * Consumer (or admin) awards the lead to a specific agency.
     */
    public function award(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'agency_id' => 'required|integer|exists:agencies,id',
        ]);

        $winningAgencyId = $data['agency_id'];

        // Verify this agency has a quoted claim
        $winningClaim = LeadPoolClaim::where('lead_id', $lead->id)
            ->where('agency_id', $winningAgencyId)
            ->whereIn('status', ['claimed', 'quoted'])
            ->first();

        if (!$winningClaim) {
            return response()->json(['error' => 'This agency does not have an active claim on this lead'], 422);
        }

        return DB::transaction(function () use ($lead, $winningAgencyId, $winningClaim) {
            // Award the winner
            $winningClaim->update(['status' => 'awarded']);

            // Find the winning agency's owner for agent_id
            $agency = Agency::find($winningAgencyId);
            $agentId = $agency?->owner_id;

            // Release losers with partial refund (50%)
            $losingClaims = LeadPoolClaim::where('lead_id', $lead->id)
                ->where('agency_id', '!=', $winningAgencyId)
                ->whereIn('status', ['claimed', 'quoted'])
                ->get();

            foreach ($losingClaims as $claim) {
                $claim->update(['status' => 'released']);

                // 50% credit refund
                $refundAmount = (int) ceil($claim->credits_spent * 0.5);
                if ($refundAmount > 0) {
                    $credit = LeadCredit::where('agency_id', $claim->agency_id)->first();
                    if ($credit) {
                        $credit->addCredits($refundAmount, "Pool lead refund (not selected) - lead #{$lead->id}");
                    }
                }
            }

            // Expire any remaining claimed (not quoted) claims
            LeadPoolClaim::where('lead_id', $lead->id)
                ->where('status', 'claimed')
                ->update(['status' => 'expired']);

            // Assign lead to the winning agency
            $lead->update([
                'pool_status' => 'awarded',
                'awarded_agency_id' => $winningAgencyId,
                'agency_id' => $winningAgencyId,
                'agent_id' => $agentId,
            ]);

            return response()->json([
                'message' => 'Lead awarded successfully',
                'lead' => $lead->fresh(),
                'winning_claim' => $winningClaim->fresh(),
            ]);
        });
    }

    /**
     * List the current agency's pool claims.
     */
    public function myClaims(Request $request)
    {
        $agencyId = $request->attributes->get('agency_id');

        if (!$agencyId) {
            return response()->json(['error' => 'No agency context'], 403);
        }

        $claims = LeadPoolClaim::where('agency_id', $agencyId)
            ->with(['lead' => fn ($q) => $q->select('id', 'insurance_type', 'state', 'zip_code', 'estimated_value', 'pool_status', 'created_at')])
            ->orderByDesc('claimed_at')
            ->paginate(20);

        return response()->json($claims);
    }

    /**
     * Pool statistics for the agency.
     */
    public function stats(Request $request)
    {
        $agencyId = $request->attributes->get('agency_id');

        if (!$agencyId) {
            return response()->json(['error' => 'No agency context'], 403);
        }

        $claims = LeadPoolClaim::where('agency_id', $agencyId);

        return response()->json([
            'total_claims' => (clone $claims)->count(),
            'active_claims' => (clone $claims)->where('status', 'claimed')->count(),
            'quoted' => (clone $claims)->where('status', 'quoted')->count(),
            'awarded' => (clone $claims)->where('status', 'awarded')->count(),
            'expired' => (clone $claims)->where('status', 'expired')->count(),
            'total_credits_spent' => (clone $claims)->sum('credits_spent'),
        ]);
    }
}
