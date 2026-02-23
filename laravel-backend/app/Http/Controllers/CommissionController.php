<?php

namespace App\Http\Controllers;

use App\Models\Commission;
use Illuminate\Http\Request;

class CommissionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $agencyId = $request->attributes->get('agency_id');

        $query = Commission::with(['policy.carrierProduct.carrier', 'policy.user']);

        // Agency owners see all agents' commissions; agents see only their own
        if ($user->role === 'agency_owner' && $agencyId) {
            $query->where('agency_id', $agencyId);
        } else {
            $query->where('agent_id', $user->id);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $commissions = $query->orderByDesc('created_at')->paginate(20);

        // Summary — same scope as list
        $summaryQuery = Commission::query();
        if ($user->role === 'agency_owner' && $agencyId) {
            $summaryQuery->where('agency_id', $agencyId);
        } else {
            $summaryQuery->where('agent_id', $user->id);
        }

        $summary = [
            'total_earned' => (clone $summaryQuery)->sum('commission_amount'),
            'total_paid' => (clone $summaryQuery)->where('status', 'paid')->sum('commission_amount'),
            'total_pending' => (clone $summaryQuery)->where('status', 'pending')->sum('commission_amount'),
        ];

        return response()->json([
            'commissions' => $commissions,
            'summary' => $summary,
        ]);
    }

    public function show(Commission $commission)
    {
        $commission->load(['policy.carrierProduct.carrier', 'policy.user']);
        return response()->json($commission);
    }
}
