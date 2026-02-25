<?php

namespace App\Http\Controllers;

use App\Models\Commission;
use App\Models\CommissionSplit;
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
        $commission->load(['policy.carrierProduct.carrier', 'policy.user', 'splits.agent:id,name']);
        return response()->json($commission);
    }

    public function splits(Commission $commission)
    {
        return response()->json([
            'splits' => $commission->splits()->with('agent:id,name')->get(),
        ]);
    }

    public function storeSplit(Request $request, Commission $commission)
    {
        $data = $request->validate([
            'agent_id' => 'required|exists:users,id',
            'split_percentage' => 'required|numeric|min:0.01|max:100',
            'role' => 'nullable|string|in:primary,secondary,referral,override',
            'notes' => 'nullable|string|max:500',
        ]);

        // Check total doesn't exceed 100%
        $existingTotal = $commission->splits()->sum('split_percentage');
        if ($existingTotal + $data['split_percentage'] > 100) {
            return response()->json([
                'message' => 'Total split percentage cannot exceed 100%. Current total: ' . $existingTotal . '%',
            ], 422);
        }

        $data['split_amount'] = round($commission->commission_amount * ($data['split_percentage'] / 100), 2);
        $data['role'] = $data['role'] ?? 'secondary';

        $split = $commission->splits()->create($data);
        $split->load('agent:id,name');

        return response()->json(['split' => $split], 201);
    }

    public function updateSplit(Request $request, Commission $commission, CommissionSplit $split)
    {
        $data = $request->validate([
            'split_percentage' => 'sometimes|numeric|min:0.01|max:100',
            'role' => 'nullable|string|in:primary,secondary,referral,override',
            'notes' => 'nullable|string|max:500',
        ]);

        if (isset($data['split_percentage'])) {
            $existingTotal = $commission->splits()->where('id', '!=', $split->id)->sum('split_percentage');
            if ($existingTotal + $data['split_percentage'] > 100) {
                return response()->json([
                    'message' => 'Total split percentage cannot exceed 100%. Other splits total: ' . $existingTotal . '%',
                ], 422);
            }
            $data['split_amount'] = round($commission->commission_amount * ($data['split_percentage'] / 100), 2);
        }

        $split->update($data);
        $split->load('agent:id,name');

        return response()->json(['split' => $split]);
    }

    public function destroySplit(Commission $commission, CommissionSplit $split)
    {
        $split->delete();
        return response()->json(['message' => 'Split removed.']);
    }
}
