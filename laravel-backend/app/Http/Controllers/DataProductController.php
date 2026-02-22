<?php

namespace App\Http\Controllers;

use App\Models\DataReport;
use App\Models\DataSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DataProductController extends Controller
{
    public function subscriptions(Request $request): JsonResponse
    {
        $subs = DataSubscription::where('user_id', $request->user()->id)->get();
        return response()->json($subs);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_type' => 'required|in:market_intel,competitive_analysis,agent_benchmarking,custom_reports',
            'tier' => 'sometimes|in:basic,professional,enterprise',
        ]);

        $pricing = [
            'market_intel' => ['basic' => 99, 'professional' => 299, 'enterprise' => 799],
            'competitive_analysis' => ['basic' => 149, 'professional' => 399, 'enterprise' => 999],
            'agent_benchmarking' => ['basic' => 79, 'professional' => 199, 'enterprise' => 499],
            'custom_reports' => ['basic' => 199, 'professional' => 499, 'enterprise' => 1299],
        ];

        $tier = $data['tier'] ?? 'basic';
        $price = $pricing[$data['product_type']][$tier] ?? 99;

        $sub = DataSubscription::create([
            'user_id' => $request->user()->id,
            'organization_id' => $request->user()->agency_id,
            'product_type' => $data['product_type'],
            'tier' => $tier,
            'price_monthly' => $price,
        ]);

        return response()->json($sub, 201);
    }

    public function cancelSubscription(DataSubscription $subscription): JsonResponse
    {
        $subscription->update(['is_active' => false]);
        return response()->json(['message' => 'Subscription cancelled']);
    }

    public function marketIntel(Request $request): JsonResponse
    {
        // Aggregated market data
        $state = $request->query('state');
        $insuranceType = $request->query('insurance_type');

        $data = [
            'market_overview' => [
                'total_policies' => DB::table('policies')->count(),
                'avg_premium' => DB::table('policies')->avg('annual_premium') ?? 0,
                'active_agents' => DB::table('users')->where('role', 'agent')->where('is_active', true)->count(),
                'active_agencies' => DB::table('agencies')->where('is_active', true)->count(),
            ],
            'premium_trends' => DB::table('policies')
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, AVG(annual_premium) as avg_premium, COUNT(*) as count")
                ->groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
                ->orderBy('month')
                ->limit(12)
                ->get(),
            'top_insurance_types' => DB::table('policies')
                ->selectRaw('insurance_type, COUNT(*) as count, AVG(annual_premium) as avg_premium')
                ->groupBy('insurance_type')
                ->orderByDesc('count')
                ->limit(10)
                ->get(),
        ];

        return response()->json($data);
    }

    public function competitiveAnalysis(Request $request): JsonResponse
    {
        $data = [
            'carrier_market_share' => DB::table('policies')
                ->join('carriers', 'policies.carrier_id', '=', 'carriers.id')
                ->selectRaw('carriers.name, COUNT(*) as policies, SUM(annual_premium) as total_premium')
                ->groupBy('carriers.name')
                ->orderByDesc('total_premium')
                ->limit(20)
                ->get(),
            'average_bind_time' => DB::table('applications')
                ->whereNotNull('bound_at')
                ->selectRaw('AVG(DATEDIFF(bound_at, created_at)) as avg_days')
                ->value('avg_days') ?? 0,
            'quote_to_bind_ratio' => [
                'quotes' => DB::table('quote_requests')->count(),
                'applications' => DB::table('applications')->count(),
                'bound' => DB::table('applications')->where('status', 'bound')->count(),
            ],
        ];

        return response()->json($data);
    }

    public function agentBenchmarking(Request $request): JsonResponse
    {
        $data = [
            'top_agents' => DB::table('users')
                ->where('role', 'agent')
                ->leftJoin('policies', 'users.id', '=', 'policies.agent_id')
                ->selectRaw('users.id, users.name, COUNT(policies.id) as policy_count, COALESCE(SUM(policies.annual_premium), 0) as total_premium')
                ->groupBy('users.id', 'users.name')
                ->orderByDesc('total_premium')
                ->limit(25)
                ->get(),
            'conversion_benchmarks' => [
                'avg_lead_to_quote' => 45,
                'avg_quote_to_bind' => 22,
                'top_10_lead_to_quote' => 68,
                'top_10_quote_to_bind' => 41,
            ],
            'retention_benchmarks' => [
                'platform_avg' => 84,
                'top_quartile' => 93,
            ],
        ];

        return response()->json($data);
    }

    // Reports
    public function reports(Request $request): JsonResponse
    {
        $reports = DataReport::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json($reports);
    }

    public function generateReport(Request $request): JsonResponse
    {
        $data = $request->validate([
            'report_type' => 'required|string',
            'title' => 'required|string|max:255',
            'parameters' => 'nullable|array',
        ]);

        $report = DataReport::create([
            'user_id' => $request->user()->id,
            'report_type' => $data['report_type'],
            'title' => $data['title'],
            'parameters' => $data['parameters'] ?? [],
            'status' => 'completed',
            'results' => ['generated_at' => now()->toISOString(), 'note' => 'Report data placeholder'],
        ]);

        return response()->json($report, 201);
    }
}
