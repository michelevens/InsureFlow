<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\ClaimActivity;
use Illuminate\Http\Request;

class ClaimController extends Controller
{
    /**
     * List claims (role-filtered).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Claim::with(['policy:id,policy_number,insurance_type', 'consumer:id,name,email', 'agent:id,name']);

        if ($user->role === 'consumer') {
            $query->where('consumer_id', $user->id);
        } elseif (in_array($user->role, ['agent', 'agency_owner'])) {
            $query->where('agent_id', $user->id);
        }
        // admin/superadmin see all

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return response()->json(
            $query->orderByDesc('created_at')->paginate($request->input('per_page', 20))
        );
    }

    /**
     * File a new claim (consumer or agent on behalf of consumer).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'policy_id' => 'required|integer|exists:policies,id',
            'type' => 'required|string|in:property_damage,liability,auto_collision,auto_comprehensive,health,life,other',
            'date_of_loss' => 'required|date|before_or_equal:today',
            'description' => 'required|string|max:2000',
            'location' => 'nullable|string|max:255',
            'estimated_amount' => 'nullable|numeric|min:0',
            'details' => 'nullable|array',
        ]);

        $user = $request->user();

        $claim = Claim::create([
            ...$data,
            'consumer_id' => $user->role === 'consumer' ? $user->id : ($data['consumer_id'] ?? $user->id),
            'agent_id' => in_array($user->role, ['agent', 'agency_owner']) ? $user->id : null,
            'claim_number' => Claim::generateClaimNumber(),
            'status' => 'reported',
        ]);

        ClaimActivity::create([
            'claim_id' => $claim->id,
            'actor_id' => $user->id,
            'type' => 'status_change',
            'description' => 'Claim filed — status set to Reported',
            'created_at' => now(),
        ]);

        return response()->json($claim->load(['policy:id,policy_number,insurance_type', 'consumer:id,name']), 201);
    }

    /**
     * Get claim detail with timeline.
     */
    public function show(Request $request, Claim $claim)
    {
        $claim->load([
            'policy:id,policy_number,insurance_type,carrier_id',
            'consumer:id,name,email,phone',
            'agent:id,name,email',
            'activities' => fn($q) => $q->with('actor:id,name,role')->orderByDesc('created_at'),
            'claimDocuments.document',
        ]);

        return response()->json($claim);
    }

    /**
     * Update claim status.
     */
    public function updateStatus(Request $request, Claim $claim)
    {
        $data = $request->validate([
            'status' => 'required|string|in:reported,under_review,investigating,approved,denied,settled,closed',
            'approved_amount' => 'nullable|numeric|min:0',
            'settlement_amount' => 'nullable|numeric|min:0',
            'deductible_amount' => 'nullable|numeric|min:0',
            'note' => 'nullable|string|max:1000',
        ]);

        $oldStatus = $claim->status;
        $claim->status = $data['status'];

        if (isset($data['approved_amount'])) $claim->approved_amount = $data['approved_amount'];
        if (isset($data['deductible_amount'])) $claim->deductible_amount = $data['deductible_amount'];

        if ($data['status'] === 'settled') {
            $claim->settlement_amount = $data['settlement_amount'] ?? $claim->approved_amount;
            $claim->settled_at = now();
        }
        if ($data['status'] === 'closed') {
            $claim->closed_at = now();
        }

        $claim->save();

        $description = "Status changed from " . ucfirst(str_replace('_', ' ', $oldStatus))
            . " to " . ucfirst(str_replace('_', ' ', $data['status']));
        if (!empty($data['note'])) {
            $description .= ": {$data['note']}";
        }

        ClaimActivity::create([
            'claim_id' => $claim->id,
            'actor_id' => $request->user()->id,
            'type' => 'status_change',
            'description' => $description,
            'metadata' => ['old_status' => $oldStatus, 'new_status' => $data['status']],
            'created_at' => now(),
        ]);

        return response()->json($claim);
    }

    /**
     * Add a note to a claim.
     */
    public function addNote(Request $request, Claim $claim)
    {
        $data = $request->validate([
            'description' => 'required|string|max:2000',
        ]);

        $activity = ClaimActivity::create([
            'claim_id' => $claim->id,
            'actor_id' => $request->user()->id,
            'type' => 'note',
            'description' => $data['description'],
            'created_at' => now(),
        ]);

        return response()->json($activity->load('actor:id,name,role'), 201);
    }
}
