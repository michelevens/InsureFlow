<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Claim;
use App\Models\Lead;
use App\Models\LeadMarketplaceListing;
use App\Models\LeadMarketplaceTransaction;
use App\Models\Policy;
use App\Models\RenewalOpportunity;
use App\Models\SellerBalance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        return match ($user->role) {
            'consumer' => $this->consumerStats($user),
            'agent' => $this->agentStats($user),
            'agency_owner' => $this->agencyStats($user),
            'carrier' => $this->carrierStats($user),
            'admin', 'superadmin' => $this->adminStats(),
            default => response()->json(['message' => 'Unknown role'], 400),
        };
    }

    /**
     * Conversion funnel: lead → application → policy
     */
    public function conversionFunnel(Request $request)
    {
        $user = $request->user();
        $months = (int) $request->input('months', 6);
        $since = now()->subMonths($months);

        $baseLeadQuery = Lead::where('created_at', '>=', $since);
        $baseAppQuery = Application::where('created_at', '>=', $since);
        $basePolicyQuery = Policy::where('created_at', '>=', $since);

        if (in_array($user->role, ['agent'])) {
            $baseLeadQuery->where('agent_id', $user->id);
            $baseAppQuery->where('agent_id', $user->id);
            $basePolicyQuery->where('agent_id', $user->id);
        } elseif ($user->role === 'agency_owner' && $user->ownedAgency) {
            $agentIds = $user->ownedAgency->agents()->pluck('id');
            $baseLeadQuery->whereIn('agent_id', $agentIds);
            $baseAppQuery->whereIn('agent_id', $agentIds);
            $basePolicyQuery->whereIn('agent_id', $agentIds);
        }

        $leads = (clone $baseLeadQuery)->count();
        $contacted = (clone $baseLeadQuery)->whereIn('status', ['contacted', 'qualified', 'proposal', 'won', 'lost'])->count();
        $qualified = (clone $baseLeadQuery)->whereIn('status', ['qualified', 'proposal', 'won'])->count();
        $applications = (clone $baseAppQuery)->count();
        $submitted = (clone $baseAppQuery)->whereIn('status', ['submitted', 'under_review', 'approved', 'issued'])->count();
        $policies = (clone $basePolicyQuery)->count();

        return response()->json([
            'funnel' => [
                ['stage' => 'Leads', 'count' => $leads],
                ['stage' => 'Contacted', 'count' => $contacted],
                ['stage' => 'Qualified', 'count' => $qualified],
                ['stage' => 'Applications', 'count' => $applications],
                ['stage' => 'Submitted', 'count' => $submitted],
                ['stage' => 'Policies Bound', 'count' => $policies],
            ],
            'conversion_rate' => $leads > 0 ? round(($policies / $leads) * 100, 1) : 0,
            'period_months' => $months,
        ]);
    }

    /**
     * Revenue trends by month.
     */
    public function revenueTrends(Request $request)
    {
        $months = (int) $request->input('months', 12);

        $trends = Policy::where('created_at', '>=', now()->subMonths($months))
            ->select(
                DB::raw("TO_CHAR(created_at, 'YYYY-MM') as month"),
                DB::raw('COUNT(*) as policies_count'),
                DB::raw('SUM(annual_premium) as premium_volume')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json(['trends' => $trends]);
    }

    /**
     * Agent performance leaderboard.
     */
    public function agentPerformance(Request $request)
    {
        $months = (int) $request->input('months', 3);
        $since = now()->subMonths($months);
        $limit = min((int) $request->input('limit', 20), 50);

        $agents = User::where('role', 'agent')
            ->withCount([
                'leads as lead_count' => fn($q) => $q->where('created_at', '>=', $since),
                'policies as policy_count' => fn($q) => $q->where('created_at', '>=', $since),
            ])
            ->withSum(
                ['commissions as total_commission' => fn($q) => $q->where('created_at', '>=', $since)],
                'commission_amount'
            )
            ->having('policy_count', '>', 0)
            ->orderByDesc('total_commission')
            ->limit($limit)
            ->get(['id', 'name', 'email']);

        return response()->json(['agents' => $agents]);
    }

    /**
     * Claims analytics.
     */
    public function claimsAnalytics(Request $request)
    {
        $months = (int) $request->input('months', 6);
        $since = now()->subMonths($months);

        $byStatus = Claim::where('created_at', '>=', $since)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        $byType = Claim::where('created_at', '>=', $since)
            ->select('type', DB::raw('COUNT(*) as count'))
            ->groupBy('type')
            ->get();

        $total = Claim::where('created_at', '>=', $since)->count();
        $settled = Claim::where('created_at', '>=', $since)->where('status', 'settled')->count();
        $totalSettlement = Claim::where('created_at', '>=', $since)
            ->where('status', 'settled')
            ->sum('settlement_amount');
        $avgSettlement = $settled > 0 ? round($totalSettlement / $settled, 2) : 0;

        return response()->json([
            'by_status' => $byStatus,
            'by_type' => $byType,
            'total_claims' => $total,
            'settled_claims' => $settled,
            'total_settlement' => $totalSettlement,
            'avg_settlement' => $avgSettlement,
        ]);
    }

    /**
     * Agent ROI dashboard — proves platform value with real numbers.
     */
    public function agentRoi(Request $request)
    {
        $user = $request->user();
        $agencyId = $request->attributes->get('agency_id');

        // Time periods
        $thisMonth = now()->startOfMonth();
        $lastMonth = now()->subMonth()->startOfMonth();
        $thisQuarter = now()->startOfQuarter();
        $thisYear = now()->startOfYear();

        $agentId = $user->id;

        // Core metrics
        $totalLeads = Lead::where('agent_id', $agentId)->count();
        $leadsThisMonth = Lead::where('agent_id', $agentId)->where('created_at', '>=', $thisMonth)->count();
        $leadsLastMonth = Lead::where('agent_id', $agentId)
            ->whereBetween('created_at', [$lastMonth, $thisMonth])->count();

        $totalPolicies = Policy::where('agent_id', $agentId)->count();
        $policiesThisMonth = Policy::where('agent_id', $agentId)->where('created_at', '>=', $thisMonth)->count();

        $conversionRate = $totalLeads > 0 ? round(($totalPolicies / $totalLeads) * 100, 1) : 0;

        // Revenue
        $totalCommission = $user->commissions()->sum('commission_amount');
        $commissionThisMonth = $user->commissions()->where('created_at', '>=', $thisMonth)->sum('commission_amount');
        $commissionThisQuarter = $user->commissions()->where('created_at', '>=', $thisQuarter)->sum('commission_amount');
        $commissionThisYear = $user->commissions()->where('created_at', '>=', $thisYear)->sum('commission_amount');

        $activePremium = Policy::where('agent_id', $agentId)->where('status', 'active')->sum('annual_premium');

        // Pipeline
        $pipelineByStatus = Lead::where('agent_id', $agentId)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        // Monthly trend (last 6 months)
        $monthlyTrend = collect(range(5, 0))->map(function ($i) use ($agentId) {
            $start = now()->subMonths($i)->startOfMonth();
            $end = now()->subMonths($i)->endOfMonth();
            return [
                'month' => $start->format('M Y'),
                'leads' => Lead::where('agent_id', $agentId)->whereBetween('created_at', [$start, $end])->count(),
                'policies' => Policy::where('agent_id', $agentId)->whereBetween('created_at', [$start, $end])->count(),
                'commission' => round((float) \App\Models\Commission::where('agent_id', $agentId)
                    ->whereBetween('created_at', [$start, $end])->sum('commission_amount'), 2),
            ];
        })->values();

        // Top insurance types
        $topTypes = Lead::where('agent_id', $agentId)
            ->select('insurance_type', DB::raw('COUNT(*) as count'))
            ->groupBy('insurance_type')
            ->orderByDesc('count')
            ->limit(5)
            ->pluck('count', 'insurance_type');

        return response()->json([
            'summary' => [
                'total_leads' => $totalLeads,
                'leads_this_month' => $leadsThisMonth,
                'leads_last_month' => $leadsLastMonth,
                'total_policies' => $totalPolicies,
                'policies_this_month' => $policiesThisMonth,
                'conversion_rate' => $conversionRate,
                'active_premium' => round((float) $activePremium, 2),
            ],
            'revenue' => [
                'total_commission' => round((float) $totalCommission, 2),
                'this_month' => round((float) $commissionThisMonth, 2),
                'this_quarter' => round((float) $commissionThisQuarter, 2),
                'this_year' => round((float) $commissionThisYear, 2),
            ],
            'pipeline' => $pipelineByStatus,
            'monthly_trend' => $monthlyTrend,
            'top_insurance_types' => $topTypes,
        ]);
    }

    private function consumerStats($user)
    {
        return response()->json([
            'quotes' => $user->quoteRequests()->count(),
            'applications' => $user->applications()->count(),
            'active_policies' => $user->policies()->where('status', 'active')->count(),
            'total_premium' => $user->policies()->where('status', 'active')->sum('monthly_premium'),
        ]);
    }

    private function agentStats($user)
    {
        return response()->json([
            'total_leads' => Lead::where('agent_id', $user->id)->count(),
            'new_leads' => Lead::where('agent_id', $user->id)->where('status', 'new')->count(),
            'applications' => Application::where('agent_id', $user->id)->count(),
            'policies_bound' => Policy::where('agent_id', $user->id)->count(),
            'total_commission' => $user->commissions()->sum('commission_amount'),
            'avg_rating' => $user->agentProfile?->avg_rating ?? 0,
        ]);
    }

    private function agencyStats($user)
    {
        $agency = $user->ownedAgency;
        if (!$agency) {
            return response()->json(['message' => 'No agency found'], 404);
        }

        $agentIds = $agency->agents()->pluck('id');

        // Products offered
        $products = $agency->platformProducts()
            ->wherePivot('is_active', true)
            ->select('platform_products.id', 'platform_products.name', 'platform_products.slug', 'platform_products.category', 'platform_products.icon')
            ->get();

        // Carrier appointments
        $appointments = $agency->carrierAppointments()
            ->where('is_active', true)
            ->with('carrier:id,name,slug,am_best_rating')
            ->get()
            ->groupBy(fn($a) => $a->carrier->name ?? 'Unknown')
            ->map(fn($group) => [
                'carrier_name' => $group->first()->carrier->name ?? 'Unknown',
                'am_best_rating' => $group->first()->carrier->am_best_rating ?? null,
                'product_count' => $group->count(),
            ])
            ->values();

        // License states from all agents
        $licenseStates = $agency->agents()
            ->whereHas('agentProfile')
            ->with('agentProfile:id,user_id,license_states')
            ->get()
            ->pluck('agentProfile.license_states')
            ->flatten()
            ->unique()
            ->sort()
            ->values();

        return response()->json([
            'team_members' => $agentIds->count(),
            'total_leads' => Lead::whereIn('agent_id', $agentIds)->count(),
            'total_policies' => Policy::whereIn('agent_id', $agentIds)->count(),
            'total_revenue' => Policy::whereIn('agent_id', $agentIds)->sum('annual_premium'),
            'total_applications' => Application::whereIn('agent_id', $agentIds)->count(),
            'total_commissions' => \App\Models\Commission::whereIn('agent_id', $agentIds)->sum('commission_amount'),
            'products' => $products,
            'carriers' => $appointments,
            'license_states' => $licenseStates,
            'agency' => [
                'name' => $agency->name,
                'state' => $agency->state,
                'city' => $agency->city,
                'npn' => $agency->npn,
                'npn_verified' => $agency->npn_verified,
                'is_verified' => $agency->is_verified,
            ],
        ]);
    }

    private function carrierStats()
    {
        return response()->json([
            'active_products' => \App\Models\CarrierProduct::where('is_active', true)->count(),
            'total_applications' => Application::count(),
            'total_policies' => Policy::count(),
            'premium_volume' => Policy::where('status', 'active')->sum('annual_premium'),
        ]);
    }

    private function adminStats()
    {
        return response()->json([
            'total_users' => User::count(),
            'total_agents' => User::where('role', 'agent')->count(),
            'total_agencies' => \App\Models\Agency::count(),
            'total_leads' => Lead::count(),
            'total_policies' => Policy::count(),
            'total_applications' => Application::count(),
            'platform_revenue' => Policy::where('status', 'active')->sum('annual_premium'),
        ]);
    }

    /**
     * Marketplace seller analytics — listing performance, revenue trends, type breakdown.
     */
    public function marketplaceSeller(Request $request)
    {
        $user = $request->user();
        $agencyId = $user->agency_id ?? $user->ownedAgency?->id;
        if (!$agencyId) {
            return response()->json(['message' => 'No agency found'], 404);
        }

        // Overview stats
        $totalListings = LeadMarketplaceListing::where('seller_agency_id', $agencyId)->count();
        $activeListings = LeadMarketplaceListing::where('seller_agency_id', $agencyId)->where('status', 'active')->count();
        $soldListings = LeadMarketplaceListing::where('seller_agency_id', $agencyId)->where('status', 'sold')->count();
        $expiredListings = LeadMarketplaceListing::where('seller_agency_id', $agencyId)->where('status', 'expired')->count();
        $conversionRate = $totalListings > 0 ? round(($soldListings / $totalListings) * 100, 1) : 0;

        // Revenue
        $totalRevenue = LeadMarketplaceTransaction::where('seller_agency_id', $agencyId)
            ->where('payment_status', 'completed')
            ->sum('seller_payout');
        $thisMonthRevenue = LeadMarketplaceTransaction::where('seller_agency_id', $agencyId)
            ->where('payment_status', 'completed')
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('seller_payout');
        $avgSalePrice = LeadMarketplaceTransaction::where('seller_agency_id', $agencyId)
            ->where('payment_status', 'completed')
            ->avg('purchase_price') ?? 0;

        // Average time to sell (days between listing creation and sold_at)
        $avgDaysToSell = LeadMarketplaceListing::where('seller_agency_id', $agencyId)
            ->where('status', 'sold')
            ->whereNotNull('sold_at')
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (sold_at - created_at)) / 86400) as avg_days')
            ->value('avg_days') ?? 0;

        // Revenue by insurance type
        $revenueByType = LeadMarketplaceTransaction::where('lead_marketplace_transactions.seller_agency_id', $agencyId)
            ->where('lead_marketplace_transactions.payment_status', 'completed')
            ->join('lead_marketplace_listings', 'lead_marketplace_listings.id', '=', 'lead_marketplace_transactions.listing_id')
            ->selectRaw('lead_marketplace_listings.insurance_type, COUNT(*) as sales, SUM(lead_marketplace_transactions.seller_payout) as revenue')
            ->groupBy('lead_marketplace_listings.insurance_type')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($r) => [
                'type' => $r->insurance_type,
                'sales' => (int) $r->sales,
                'revenue' => round((float) $r->revenue, 2),
            ]);

        // Monthly trend (last 6 months)
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $start = $month->copy()->startOfMonth();
            $end = $month->copy()->endOfMonth();

            $listed = LeadMarketplaceListing::where('seller_agency_id', $agencyId)
                ->whereBetween('created_at', [$start, $end])->count();
            $sold = LeadMarketplaceListing::where('seller_agency_id', $agencyId)
                ->where('status', 'sold')
                ->whereBetween('sold_at', [$start, $end])->count();
            $rev = LeadMarketplaceTransaction::where('seller_agency_id', $agencyId)
                ->where('payment_status', 'completed')
                ->whereBetween('created_at', [$start, $end])
                ->sum('seller_payout');

            $monthlyTrend[] = [
                'month' => $month->format('M Y'),
                'listed' => $listed,
                'sold' => $sold,
                'revenue' => round((float) $rev, 2),
            ];
        }

        // Seller balance
        $balance = SellerBalance::where('agency_id', $agencyId)->first();

        return response()->json([
            'overview' => [
                'total_listings' => $totalListings,
                'active_listings' => $activeListings,
                'sold_listings' => $soldListings,
                'expired_listings' => $expiredListings,
                'conversion_rate' => $conversionRate,
                'avg_days_to_sell' => round((float) $avgDaysToSell, 1),
            ],
            'revenue' => [
                'total' => round((float) $totalRevenue, 2),
                'this_month' => round((float) $thisMonthRevenue, 2),
                'avg_sale_price' => round((float) $avgSalePrice, 2),
            ],
            'balance' => [
                'available' => round((float) ($balance?->available_amount ?? 0), 2),
                'pending' => round((float) ($balance?->pending_amount ?? 0), 2),
                'lifetime_paid' => round((float) ($balance?->lifetime_paid ?? 0), 2),
            ],
            'by_type' => $revenueByType,
            'monthly_trend' => $monthlyTrend,
        ]);
    }
}
