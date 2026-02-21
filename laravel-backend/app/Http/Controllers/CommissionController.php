<?php

namespace App\Http\Controllers;

use App\Models\Commission;
use Illuminate\Http\Request;

class CommissionController extends Controller
{
    public function index(Request $request)
    {
        $query = Commission::where('agent_id', $request->user()->id)
            ->with(['policy.carrierProduct.carrier', 'policy.user']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $commissions = $query->orderByDesc('created_at')->paginate(20);

        // Summary
        $agentId = $request->user()->id;
        $summary = [
            'total_earned' => Commission::where('agent_id', $agentId)->sum('commission_amount'),
            'total_paid' => Commission::where('agent_id', $agentId)->where('status', 'paid')->sum('commission_amount'),
            'total_pending' => Commission::where('agent_id', $agentId)->where('status', 'pending')->sum('commission_amount'),
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
