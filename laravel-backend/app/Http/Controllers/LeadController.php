<?php

namespace App\Http\Controllers;

use App\Models\InsuranceProfile;
use App\Models\Lead;
use App\Models\LeadActivity;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $agencyId = $request->attributes->get('agency_id');
        $isAdmin = $request->attributes->get('is_platform_admin');

        $query = Lead::with('activities');

        // Tenant scoping
        if ($agencyId) {
            $query->where('agency_id', $agencyId);
        }

        // Role-based filtering
        if ($user->role === 'agent') {
            $query->where('agent_id', $user->id);
        } elseif ($user->role === 'agency_owner') {
            // Agency owners see all leads in their agency (already scoped above)
        } elseif (!$isAdmin) {
            $query->where('agent_id', $user->id);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'ilike', "%{$search}%")
                  ->orWhere('last_name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        $leads = $query->orderByDesc('created_at')->paginate(20);

        // Get counts by status (same scope)
        $countQuery = Lead::query();
        if ($agencyId) $countQuery->where('agency_id', $agencyId);
        if ($user->role === 'agent') $countQuery->where('agent_id', $user->id);

        $counts = $countQuery->selectRaw("status, count(*) as count")
            ->groupBy('status')
            ->pluck('count', 'status');

        return response()->json([
            'leads' => $leads,
            'counts' => $counts,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:20',
            'insurance_type' => 'required|string',
            'source' => 'nullable|string',
            'estimated_value' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $agencyId = $request->attributes->get('agency_id');

        $lead = Lead::create([
            ...$data,
            'agent_id' => $request->user()->id,
            'agency_id' => $agencyId,
            'status' => 'new',
        ]);

        // Create a UIP for manually-created leads
        InsuranceProfile::create([
            'agency_id' => $agencyId,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'insurance_type' => $data['insurance_type'],
            'current_stage' => 'lead',
            'lead_id' => $lead->id,
            'assigned_agent_id' => $request->user()->id,
            'source' => $data['source'] ?? 'direct',
            'estimated_value' => $data['estimated_value'] ?? null,
            'notes' => $data['notes'] ?? null,
            'stage_updated_at' => now(),
        ]);

        return response()->json($lead, 201);
    }

    public function show(Request $request, Lead $lead)
    {
        $this->authorizeLeadAccess($request, $lead);
        $lead->load('activities.user');
        return response()->json($lead);
    }

    public function update(Request $request, Lead $lead)
    {
        $this->authorizeLeadAccess($request, $lead);

        $data = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email',
            'phone' => 'nullable|string|max:20',
            'insurance_type' => 'sometimes|string',
            'status' => 'sometimes|in:new,contacted,quoted,applied,won,lost',
            'estimated_value' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $oldStatus = $lead->status;
        $lead->update($data);

        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            LeadActivity::create([
                'lead_id' => $lead->id,
                'user_id' => $request->user()->id,
                'type' => 'status_change',
                'description' => "Status changed from {$oldStatus} to {$data['status']}",
            ]);

            // Sync lead status to UIP
            $profile = InsuranceProfile::where('lead_id', $lead->id)->first();
            if ($profile) {
                if ($data['status'] === 'won') {
                    $profile->update(['status' => 'converted']);
                } elseif ($data['status'] === 'lost') {
                    $profile->update(['status' => 'lost']);
                }
            }
        }

        return response()->json($lead);
    }

    public function addActivity(Request $request, Lead $lead)
    {
        $this->authorizeLeadAccess($request, $lead);

        $data = $request->validate([
            'type' => 'required|in:note,call,email,meeting,status_change',
            'description' => 'required|string',
            'metadata' => 'nullable|array',
        ]);

        $activity = LeadActivity::create([
            ...$data,
            'lead_id' => $lead->id,
            'user_id' => $request->user()->id,
        ]);

        return response()->json($activity, 201);
    }

    /**
     * Verify the current user has access to this lead (same agency or admin).
     */
    private function authorizeLeadAccess(Request $request, Lead $lead): void
    {
        $agencyId = $request->attributes->get('agency_id');
        $isAdmin = $request->attributes->get('is_platform_admin');

        if ($isAdmin) return;

        if ($agencyId && $lead->agency_id !== $agencyId) {
            abort(403, 'You do not have access to this lead.');
        }

        // Agents can only access their own leads
        $user = $request->user();
        if ($user->role === 'agent' && $lead->agent_id !== $user->id) {
            abort(403, 'You do not have access to this lead.');
        }
    }

    /**
     * Bulk update lead status.
     */
    public function bulkUpdateStatus(Request $request)
    {
        $data = $request->validate([
            'lead_ids' => 'required|array|min:1|max:100',
            'lead_ids.*' => 'integer|exists:leads,id',
            'status' => 'required|string|in:new,contacted,quoted,applied,won,lost',
        ]);

        $agencyId = $request->attributes->get('agency_id');

        $updated = Lead::whereIn('id', $data['lead_ids'])
            ->where('agency_id', $agencyId)
            ->update(['status' => $data['status']]);

        return response()->json(['updated' => $updated]);
    }
}
