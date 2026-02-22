<?php

namespace App\Http\Controllers;

use App\Models\RenewalOpportunity;
use Illuminate\Http\Request;

class RenewalController extends Controller
{
    /**
     * List renewal opportunities (role-filtered).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = RenewalOpportunity::with([
            'policy:id,policy_number,insurance_type,carrier_id',
            'consumer:id,name,email',
            'agent:id,name',
        ]);

        if ($user->role === 'consumer') {
            $query->where('consumer_id', $user->id);
        } elseif (in_array($user->role, ['agent', 'agency_owner'])) {
            $query->where('agent_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $days = (int) $request->input('days', 90);
        if ($request->boolean('upcoming_only', true)) {
            $query->upcoming($days);
        }

        $sort = $request->input('sort', 'renewal_date');
        $dir = $request->input('dir', 'asc');
        $query->orderBy($sort, $dir);

        return response()->json(
            $query->paginate($request->input('per_page', 20))
        );
    }

    /**
     * Get renewal detail.
     */
    public function show(RenewalOpportunity $renewal)
    {
        $renewal->load([
            'policy:id,policy_number,insurance_type,carrier_id,premium,start_date,end_date',
            'consumer:id,name,email,phone',
            'agent:id,name,email',
        ]);

        return response()->json($renewal);
    }

    /**
     * Update renewal status.
     */
    public function updateStatus(Request $request, RenewalOpportunity $renewal)
    {
        $data = $request->validate([
            'status' => 'required|in:upcoming,contacted,requoted,renewed,lost,expired',
            'best_new_premium' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $renewal->status = $data['status'];
        if (isset($data['best_new_premium'])) {
            $renewal->best_new_premium = $data['best_new_premium'];
        }
        if (isset($data['notes'])) {
            $renewal->notes = $data['notes'];
        }
        if ($data['status'] === 'contacted') {
            $renewal->last_contacted_at = now();
        }
        $renewal->save();

        return response()->json($renewal);
    }

    /**
     * Dashboard stats for renewals.
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();
        $baseQuery = RenewalOpportunity::query();

        if (in_array($user->role, ['agent', 'agency_owner'])) {
            $baseQuery->where('agent_id', $user->id);
        }

        $upcoming30 = (clone $baseQuery)->upcoming(30)->count();
        $upcoming60 = (clone $baseQuery)->upcoming(60)->count();
        $upcoming90 = (clone $baseQuery)->upcoming(90)->count();
        $atRisk = (clone $baseQuery)->upcoming(90)->where('retention_score', '<', 50)->count();
        $renewed = (clone $baseQuery)->where('status', 'renewed')
            ->where('updated_at', '>=', now()->startOfMonth())
            ->count();
        $lost = (clone $baseQuery)->where('status', 'lost')
            ->where('updated_at', '>=', now()->startOfMonth())
            ->count();

        $retentionRate = ($renewed + $lost) > 0
            ? round(($renewed / ($renewed + $lost)) * 100, 1)
            : null;

        return response()->json([
            'upcoming_30' => $upcoming30,
            'upcoming_60' => $upcoming60,
            'upcoming_90' => $upcoming90,
            'at_risk' => $atRisk,
            'renewed_this_month' => $renewed,
            'lost_this_month' => $lost,
            'retention_rate' => $retentionRate,
        ]);
    }
}
