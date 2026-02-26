<?php

namespace App\Http\Controllers;

use App\Models\AgentLicense;
use App\Models\CeCredit;
use App\Models\CompliancePackItem;
use App\Models\EoPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ComplianceController extends Controller
{
    // --- Alerts (lightweight endpoint for dashboard banner) ---

    public function alerts(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Overdue compliance pack items
        $overdue = CompliancePackItem::where('user_id', $userId)
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->whereNotIn('status', ['completed', 'waived'])
            ->with('requirement:id,title,category')
            ->get()
            ->map(fn($item) => [
                'id' => $item->id,
                'title' => $item->requirement?->title ?? 'Compliance Item',
                'category' => $item->requirement?->category,
                'due_date' => $item->due_date->toDateString(),
                'days_overdue' => (int) now()->diffInDays($item->due_date),
            ]);

        // Expiring soon (within 14 days)
        $expiringSoon = $this->getExpiringItems($userId);
        $expiringSoon = array_filter($expiringSoon, fn($item) => $item['days_left'] <= 14);

        return response()->json([
            'overdue' => array_values($overdue->toArray()),
            'expiring_soon' => array_values($expiringSoon),
            'overdue_count' => $overdue->count(),
            'expiring_count' => count($expiringSoon),
        ]);
    }

    // --- Dashboard ---

    public function dashboard(Request $request): JsonResponse
    {
        $userId = $request->query('user_id', $request->user()->id);

        $licenses = AgentLicense::where('user_id', $userId)->get();
        $ceCredits = CeCredit::where('user_id', $userId)->get();
        $eoPolicy = EoPolicy::where('user_id', $userId)->latest()->first();

        $activeLicenses = $licenses->where('status', 'active')->count();
        $expiringLicenses = $licenses->filter(fn($l) => $l->status === 'active' && $l->isExpiring(60))->count();
        $totalCeHours = $ceCredits->sum('hours');
        $eoActive = $eoPolicy && $eoPolicy->status === 'active' && !$eoPolicy->isExpired();

        return response()->json([
            'licenses' => [
                'total' => $licenses->count(),
                'active' => $activeLicenses,
                'expiring_soon' => $expiringLicenses,
                'items' => $licenses,
            ],
            'ce_credits' => [
                'total_hours' => $totalCeHours,
                'this_year' => $ceCredits->filter(fn($c) => $c->completion_date->year === now()->year)->sum('hours'),
                'items' => $ceCredits->sortByDesc('completion_date')->values(),
            ],
            'eo_insurance' => [
                'active' => $eoActive,
                'policy' => $eoPolicy,
            ],
            'expiring' => $this->getExpiringItems($userId),
        ]);
    }

    protected function getExpiringItems(int $userId): array
    {
        $items = [];

        $expiringLicenses = AgentLicense::where('user_id', $userId)->expiringSoon(60)->get();
        foreach ($expiringLicenses as $l) {
            $items[] = [
                'type' => 'license',
                'label' => "{$l->state} {$l->license_type} License",
                'expires' => $l->expiration_date->toDateString(),
                'days_left' => now()->diffInDays($l->expiration_date),
                'id' => $l->id,
            ];
        }

        $expiringEo = EoPolicy::where('user_id', $userId)->expiringSoon(60)->get();
        foreach ($expiringEo as $e) {
            $items[] = [
                'type' => 'eo_policy',
                'label' => "E&O Policy ({$e->carrier})",
                'expires' => $e->expiration_date->toDateString(),
                'days_left' => now()->diffInDays($e->expiration_date),
                'id' => $e->id,
            ];
        }

        usort($items, fn($a, $b) => $a['days_left'] - $b['days_left']);
        return $items;
    }

    // --- Licenses ---

    public function licenses(Request $request): JsonResponse
    {
        $licenses = AgentLicense::where('user_id', $request->user()->id)
            ->orderBy('state')
            ->get();

        return response()->json($licenses);
    }

    public function storeLicense(Request $request): JsonResponse
    {
        $data = $request->validate([
            'state' => 'required|string|size:2',
            'license_number' => 'required|string|max:50',
            'license_type' => 'sometimes|string|max:50',
            'lines_of_authority' => 'nullable|array',
            'status' => 'sometimes|string|in:active,expired,suspended,revoked,pending',
            'issue_date' => 'nullable|date',
            'expiration_date' => 'required|date',
            'npn' => 'nullable|string|max:20',
        ]);

        $data['user_id'] = $request->user()->id;
        $license = AgentLicense::create($data);

        return response()->json($license, 201);
    }

    public function updateLicense(Request $request, AgentLicense $license): JsonResponse
    {
        $data = $request->validate([
            'state' => 'sometimes|string|size:2',
            'license_number' => 'sometimes|string|max:50',
            'license_type' => 'sometimes|string|max:50',
            'lines_of_authority' => 'nullable|array',
            'status' => 'sometimes|string|in:active,expired,suspended,revoked,pending',
            'issue_date' => 'nullable|date',
            'expiration_date' => 'sometimes|date',
            'npn' => 'nullable|string|max:20',
        ]);

        $license->update($data);
        return response()->json($license);
    }

    public function destroyLicense(AgentLicense $license): JsonResponse
    {
        $license->delete();
        return response()->json(['message' => 'License removed']);
    }

    // --- CE Credits ---

    public function ceCredits(Request $request): JsonResponse
    {
        $credits = CeCredit::where('user_id', $request->user()->id)
            ->orderByDesc('completion_date')
            ->get();

        return response()->json($credits);
    }

    public function storeCeCredit(Request $request): JsonResponse
    {
        $data = $request->validate([
            'course_name' => 'required|string|max:255',
            'provider' => 'nullable|string|max:255',
            'hours' => 'required|numeric|min:0.5|max:100',
            'category' => 'nullable|string|max:100',
            'state' => 'nullable|string|size:2',
            'completion_date' => 'required|date',
            'certificate_url' => 'nullable|url|max:500',
            'course_number' => 'nullable|string|max:50',
        ]);

        $data['user_id'] = $request->user()->id;
        $credit = CeCredit::create($data);

        return response()->json($credit, 201);
    }

    public function updateCeCredit(Request $request, CeCredit $credit): JsonResponse
    {
        $data = $request->validate([
            'course_name' => 'sometimes|string|max:255',
            'provider' => 'nullable|string|max:255',
            'hours' => 'sometimes|numeric|min:0.5|max:100',
            'category' => 'nullable|string|max:100',
            'state' => 'nullable|string|size:2',
            'completion_date' => 'sometimes|date',
            'certificate_url' => 'nullable|url|max:500',
            'course_number' => 'nullable|string|max:50',
        ]);

        $credit->update($data);
        return response()->json($credit);
    }

    public function destroyCeCredit(CeCredit $credit): JsonResponse
    {
        $credit->delete();
        return response()->json(['message' => 'CE credit removed']);
    }

    // --- E&O Insurance ---

    public function eoPolicy(Request $request): JsonResponse
    {
        $policies = EoPolicy::where('user_id', $request->user()->id)
            ->orderByDesc('effective_date')
            ->get();

        return response()->json($policies);
    }

    public function storeEoPolicy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'carrier' => 'required|string|max:255',
            'policy_number' => 'required|string|max:100',
            'coverage_amount' => 'required|numeric|min:0',
            'deductible' => 'nullable|numeric|min:0',
            'effective_date' => 'required|date',
            'expiration_date' => 'required|date|after:effective_date',
            'certificate_url' => 'nullable|url|max:500',
        ]);

        $data['user_id'] = $request->user()->id;
        $policy = EoPolicy::create($data);

        return response()->json($policy, 201);
    }

    public function updateEoPolicy(Request $request, EoPolicy $eoPolicy): JsonResponse
    {
        $data = $request->validate([
            'carrier' => 'sometimes|string|max:255',
            'policy_number' => 'sometimes|string|max:100',
            'coverage_amount' => 'sometimes|numeric|min:0',
            'deductible' => 'nullable|numeric|min:0',
            'effective_date' => 'sometimes|date',
            'expiration_date' => 'sometimes|date',
            'status' => 'sometimes|string|in:active,expired,cancelled',
            'certificate_url' => 'nullable|url|max:500',
        ]);

        $eoPolicy->update($data);
        return response()->json($eoPolicy);
    }

    public function destroyEoPolicy(EoPolicy $eoPolicy): JsonResponse
    {
        $eoPolicy->delete();
        return response()->json(['message' => 'E&O policy removed']);
    }

    // --- Admin: expiring across all agents ---

    public function expiring(Request $request): JsonResponse
    {
        $days = $request->query('days', 60);

        $licenses = AgentLicense::with('user:id,name,email')
            ->expiringSoon($days)
            ->get()
            ->map(fn($l) => [
                'type' => 'license',
                'user' => $l->user,
                'label' => "{$l->state} {$l->license_type} #{$l->license_number}",
                'expires' => $l->expiration_date->toDateString(),
                'days_left' => now()->diffInDays($l->expiration_date),
            ]);

        $eoPolicies = EoPolicy::with('user:id,name,email')
            ->expiringSoon($days)
            ->get()
            ->map(fn($e) => [
                'type' => 'eo_policy',
                'user' => $e->user,
                'label' => "E&O ({$e->carrier}) #{$e->policy_number}",
                'expires' => $e->expiration_date->toDateString(),
                'days_left' => now()->diffInDays($e->expiration_date),
            ]);

        $all = $licenses->merge($eoPolicies)->sortBy('days_left')->values();

        return response()->json($all);
    }
}
