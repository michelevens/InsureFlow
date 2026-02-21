<?php

namespace App\Http\Controllers;

use App\Models\InsuranceProfile;
use App\Services\RoutingEngine;
use Illuminate\Http\Request;

class InsuranceProfileController extends Controller
{
    public function __construct(
        private RoutingEngine $router,
    ) {}

    /**
     * List insurance profiles (tenant-scoped).
     * Agents see only their assigned profiles.
     * Agency owners see all profiles in their agency.
     * Consumers see only their own profiles.
     * Admins see all (optionally scoped to agency_id query param).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $agencyId = $request->attributes->get('agency_id');
        $isAdmin = $request->attributes->get('is_platform_admin');

        $query = InsuranceProfile::with(['assignedAgent', 'quoteRequest', 'lead']);

        // Tenant scoping
        if ($isAdmin && !$agencyId) {
            // Platform admins see all unless agency_id filter is set
        } elseif ($agencyId) {
            $query->where('agency_id', $agencyId);
        }

        // Role-based filtering within agency
        if ($user->role === 'agent') {
            $query->where('assigned_agent_id', $user->id);
        } elseif ($user->role === 'consumer') {
            $query->where('user_id', $user->id);
        }

        // Filters
        if ($stage = $request->query('stage')) {
            $query->where('current_stage', $stage);
        }
        if ($type = $request->query('insurance_type')) {
            $query->where('insurance_type', $type);
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

        $profiles = $query->orderByDesc('updated_at')->paginate(20);

        // Stage counts for pipeline view
        $countQuery = InsuranceProfile::query();
        if ($agencyId) $countQuery->where('agency_id', $agencyId);
        if ($user->role === 'agent') $countQuery->where('assigned_agent_id', $user->id);

        $stageCounts = $countQuery->where('status', 'active')
            ->selectRaw("current_stage, count(*) as count")
            ->groupBy('current_stage')
            ->pluck('count', 'current_stage');

        return response()->json([
            'profiles' => $profiles,
            'stage_counts' => $stageCounts,
        ]);
    }

    /**
     * Get a single insurance profile with full journey data.
     */
    public function show(Request $request, InsuranceProfile $profile)
    {
        $this->authorizeAccess($request, $profile);

        $profile->load([
            'user', 'assignedAgent', 'agency',
            'quoteRequest.quotes.carrierProduct.carrier',
            'lead.activities',
            'application.carrierProduct.carrier',
            'policy',
        ]);

        // Build data snapshot
        $profile->data_snapshot = $profile->snapshotData();
        $profile->save();

        return response()->json($profile);
    }

    /**
     * Update an insurance profile.
     */
    public function update(Request $request, InsuranceProfile $profile)
    {
        $this->authorizeAccess($request, $profile);

        $data = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'zip_code' => 'nullable|string|max:10',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:active,converted,lost,archived',
        ]);

        $profile->update($data);
        return response()->json($profile);
    }

    /**
     * Advance a profile to the next pipeline stage.
     */
    public function advanceStage(Request $request, InsuranceProfile $profile)
    {
        $this->authorizeAccess($request, $profile);

        $data = $request->validate([
            'stage' => 'required|in:intake,quoted,lead,application,policy,renewal',
            'lead_id' => 'nullable|integer|exists:leads,id',
            'application_id' => 'nullable|integer|exists:applications,id',
            'policy_id' => 'nullable|integer|exists:policies,id',
            'monthly_premium' => 'nullable|numeric',
            'annual_premium' => 'nullable|numeric',
            'estimated_value' => 'nullable|numeric',
        ]);

        $attributes = array_filter([
            'lead_id' => $data['lead_id'] ?? null,
            'application_id' => $data['application_id'] ?? null,
            'policy_id' => $data['policy_id'] ?? null,
            'monthly_premium' => $data['monthly_premium'] ?? null,
            'annual_premium' => $data['annual_premium'] ?? null,
            'estimated_value' => $data['estimated_value'] ?? null,
        ], fn ($v) => $v !== null);

        $profile->advanceTo($data['stage'], $attributes);

        // Auto-route if advancing to lead stage and no agent assigned
        if ($data['stage'] === 'lead' && !$profile->assigned_agent_id) {
            $this->router->route($profile);
            $profile->refresh();
        }

        return response()->json($profile);
    }

    /**
     * Manually reassign a profile to a different agent.
     */
    public function reassign(Request $request, InsuranceProfile $profile)
    {
        $data = $request->validate([
            'agent_id' => 'required|integer|exists:users,id',
        ]);

        $profile->update(['assigned_agent_id' => $data['agent_id']]);

        // Update linked lead too
        if ($profile->lead_id) {
            $profile->lead()->update(['agent_id' => $data['agent_id']]);
        }

        return response()->json(['message' => 'Profile reassigned', 'profile' => $profile]);
    }

    /**
     * Get pipeline analytics for the agency.
     */
    public function pipeline(Request $request)
    {
        $agencyId = $request->attributes->get('agency_id');
        $user = $request->user();

        $query = InsuranceProfile::where('status', 'active');
        if ($agencyId) $query->where('agency_id', $agencyId);
        if ($user->role === 'agent') $query->where('assigned_agent_id', $user->id);

        $stages = ['intake', 'quoted', 'lead', 'application', 'policy', 'renewal'];
        $pipeline = [];

        foreach ($stages as $stage) {
            $stageQuery = (clone $query)->where('current_stage', $stage);
            $pipeline[$stage] = [
                'count' => $stageQuery->count(),
                'total_value' => $stageQuery->sum('estimated_value'),
                'avg_premium' => $stageQuery->avg('monthly_premium'),
            ];
        }

        // Conversion rates
        $totalProfiles = (clone $query)->count();
        $convertedProfiles = InsuranceProfile::query()
            ->when($agencyId, fn ($q) => $q->where('agency_id', $agencyId))
            ->when($user->role === 'agent', fn ($q) => $q->where('assigned_agent_id', $user->id))
            ->where('status', 'converted')
            ->count();

        return response()->json([
            'pipeline' => $pipeline,
            'total_active' => $totalProfiles,
            'total_converted' => $convertedProfiles,
            'conversion_rate' => $totalProfiles > 0
                ? round(($convertedProfiles / ($totalProfiles + $convertedProfiles)) * 100, 1)
                : 0,
        ]);
    }

    private function authorizeAccess(Request $request, InsuranceProfile $profile): void
    {
        $user = $request->user();
        $isAdmin = $request->attributes->get('is_platform_admin');

        if ($isAdmin) return;

        // Consumer can only see their own profiles
        if ($user->role === 'consumer' && $profile->user_id !== $user->id) {
            abort(403, 'Access denied');
        }

        // Agent can only see profiles assigned to them
        if ($user->role === 'agent' && $profile->assigned_agent_id !== $user->id) {
            abort(403, 'Access denied');
        }

        // Agency owner can see all profiles in their agency
        if ($user->role === 'agency_owner') {
            $agencyId = $request->attributes->get('agency_id');
            if ($profile->agency_id !== $agencyId) {
                abort(403, 'Access denied');
            }
        }
    }
}
