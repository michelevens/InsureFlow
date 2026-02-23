<?php

namespace App\Http\Controllers;

use App\Models\Agency;
use App\Models\AgentLicense;
use App\Models\CompliancePackItem;
use App\Models\ComplianceRequirement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CompliancePackController extends Controller
{
    /**
     * Get current user's compliance pack items.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $items = CompliancePackItem::with('requirement')
            ->where('user_id', $user->id)
            ->get();

        $now = Carbon::today();

        return response()->json([
            'items' => $items,
            'summary' => [
                'total' => $items->count(),
                'completed' => $items->where('status', 'completed')->count(),
                'pending' => $items->where('status', 'pending')->count(),
                'in_progress' => $items->where('status', 'in_progress')->count(),
                'waived' => $items->where('status', 'waived')->count(),
                'overdue' => $items->filter(fn ($i) => $i->due_date && $i->due_date->lt($now) && !in_array($i->status, ['completed', 'waived']))->count(),
            ],
        ]);
    }

    /**
     * Auto-generate compliance pack for current user.
     */
    public function generate(Request $request)
    {
        $user = $request->user();
        $this->generateForUser($user);

        return $this->index($request);
    }

    /**
     * Update a compliance pack item.
     */
    public function update(Request $request, CompliancePackItem $item)
    {
        $user = $request->user();

        if ($item->user_id !== $user->id && !in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'status' => 'sometimes|in:pending,in_progress,completed,waived,expired',
            'evidence_url' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
        ]);

        if (isset($data['status']) && $data['status'] === 'completed' && !$item->completed_date) {
            $data['completed_date'] = now();
        }

        $item->update($data);
        $item->load('requirement');

        return response()->json($item);
    }

    // ── SuperAdmin Endpoints ──

    /**
     * List all compliance requirements (admin).
     */
    public function requirements(Request $request)
    {
        $query = ComplianceRequirement::query();

        if ($state = $request->query('state')) {
            $query->where('state', $state);
        }
        if ($type = $request->query('insurance_type')) {
            $query->where('insurance_type', $type);
        }
        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        return response()->json($query->orderBy('state')->orderBy('category')->get());
    }

    /**
     * Create a compliance requirement (superadmin).
     */
    public function storeRequirement(Request $request)
    {
        $data = $request->validate([
            'state' => 'required|string|max:5',
            'insurance_type' => 'required|string|max:100',
            'requirement_type' => 'required|string|max:30',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'details' => 'nullable|array',
            'category' => 'required|string|max:30',
            'is_required' => 'sometimes|boolean',
            'frequency' => 'required|string|max:20',
            'authority' => 'nullable|string|max:255',
            'reference_url' => 'nullable|string|max:500',
        ]);

        $requirement = ComplianceRequirement::create($data);
        return response()->json($requirement, 201);
    }

    /**
     * Update a compliance requirement (superadmin).
     */
    public function updateRequirement(Request $request, ComplianceRequirement $requirement)
    {
        $data = $request->validate([
            'state' => 'sometimes|string|max:5',
            'insurance_type' => 'sometimes|string|max:100',
            'requirement_type' => 'sometimes|string|max:30',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'details' => 'nullable|array',
            'category' => 'sometimes|string|max:30',
            'is_required' => 'sometimes|boolean',
            'frequency' => 'sometimes|string|max:20',
            'authority' => 'nullable|string|max:255',
            'reference_url' => 'nullable|string|max:500',
        ]);

        $requirement->update($data);
        return response()->json($requirement);
    }

    /**
     * Delete a compliance requirement (superadmin).
     */
    public function deleteRequirement(ComplianceRequirement $requirement)
    {
        $requirement->delete();
        return response()->json(['message' => 'Requirement deleted']);
    }

    /**
     * Platform-wide compliance overview (superadmin).
     */
    public function overview()
    {
        $totalItems = CompliancePackItem::count();
        $completed = CompliancePackItem::where('status', 'completed')->count();
        $overdue = CompliancePackItem::where('status', '!=', 'completed')
            ->where('status', '!=', 'waived')
            ->whereNotNull('due_date')
            ->where('due_date', '<', Carbon::today())
            ->count();

        $usersWithPacks = CompliancePackItem::distinct('user_id')->count('user_id');

        $byCategory = CompliancePackItem::join('compliance_requirements', 'compliance_pack_items.compliance_requirement_id', '=', 'compliance_requirements.id')
            ->selectRaw('compliance_requirements.category, count(*) as total, sum(case when compliance_pack_items.status = \'completed\' then 1 else 0 end) as completed_count')
            ->groupBy('compliance_requirements.category')
            ->get();

        return response()->json([
            'total_items' => $totalItems,
            'completed' => $completed,
            'overdue' => $overdue,
            'compliance_rate' => $totalItems > 0 ? round(($completed / $totalItems) * 100, 1) : 0,
            'users_with_packs' => $usersWithPacks,
            'by_category' => $byCategory,
        ]);
    }

    // ── Shared Logic ──

    /**
     * Generate compliance pack for a user based on their states and products.
     */
    public function generateForUser(User $user): void
    {
        // Determine user's states
        $states = $this->getUserStates($user);

        // Determine user's insurance types/products
        $insuranceTypes = $this->getUserInsuranceTypes($user);

        if (empty($states) && empty($insuranceTypes)) {
            return;
        }

        // Find matching requirements
        $requirements = ComplianceRequirement::where(function ($q) use ($states) {
            $q->whereIn('state', $states)->orWhere('state', 'ALL');
        })->where(function ($q) use ($insuranceTypes) {
            $q->whereIn('insurance_type', $insuranceTypes)->orWhere('insurance_type', 'ALL');
        })->get();

        $agencyId = $user->agency_id ?? $user->ownedAgency?->id;

        foreach ($requirements as $req) {
            CompliancePackItem::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'compliance_requirement_id' => $req->id,
                ],
                [
                    'agency_id' => $agencyId,
                    'status' => 'pending',
                    'due_date' => $this->calculateDueDate($req),
                ]
            );
        }
    }

    private function getUserStates(User $user): array
    {
        $states = [];

        // From agent licenses
        $licenseStates = AgentLicense::where('user_id', $user->id)->pluck('state')->toArray();
        $states = array_merge($states, $licenseStates);

        // From agency
        $agency = $user->agency ?? $user->ownedAgency;
        if ($agency && $agency->state) {
            $states[] = $agency->state;
        }

        // From onboarding data
        if ($user->onboarding_data) {
            $onboardingData = is_array($user->onboarding_data) ? $user->onboarding_data : json_decode($user->onboarding_data, true);
            if (!empty($onboardingData['license_states'])) {
                $states = array_merge($states, (array) $onboardingData['license_states']);
            }
        }

        return array_unique(array_filter($states));
    }

    private function getUserInsuranceTypes(User $user): array
    {
        $types = [];

        $agency = $user->agency ?? $user->ownedAgency;
        if ($agency) {
            $agencyProducts = $agency->platformProducts()->where('agency_products.is_active', true)->pluck('slug')->toArray();
            $types = array_merge($types, $agencyProducts);
        }

        return array_unique(array_filter($types));
    }

    private function calculateDueDate(ComplianceRequirement $req): ?string
    {
        return match ($req->frequency) {
            'annual' => Carbon::today()->addYear()->toDateString(),
            'biennial' => Carbon::today()->addYears(2)->toDateString(),
            'triennial' => Carbon::today()->addYears(3)->toDateString(),
            default => null, // one_time has no due date
        };
    }
}
