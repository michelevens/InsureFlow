<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Claim;
use App\Models\Lead;
use App\Models\Policy;
use App\Models\RenewalOpportunity;
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
}
