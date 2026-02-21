<?php

namespace App\Http\Controllers;

use App\Models\InsuranceProfile;
use App\Models\Policy;
use Illuminate\Http\Request;

class PolicyController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $agencyId = $request->attributes->get('agency_id');
        $query = Policy::with(['carrierProduct.carrier', 'agent', 'user']);

        // Tenant scoping
        if ($agencyId) {
            $query->where('agency_id', $agencyId);
        }

        if ($user->role === 'consumer') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'agent') {
            $query->where('agent_id', $user->id);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $policies = $query->orderByDesc('created_at')->paginate(20);

        return response()->json($policies);
    }

    public function show(Policy $policy)
    {
        $policy->load(['carrierProduct.carrier', 'agent', 'user', 'application', 'commissions']);
        return response()->json($policy);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'application_id' => 'nullable|exists:applications,id',
            'user_id' => 'required|exists:users,id',
            'agent_id' => 'nullable|exists:users,id',
            'carrier_product_id' => 'required|exists:carrier_products,id',
            'type' => 'required|string',
            'carrier_name' => 'required|string',
            'monthly_premium' => 'required|numeric',
            'annual_premium' => 'required|numeric',
            'deductible' => 'nullable|numeric',
            'coverage_limit' => 'nullable|string',
            'coverage_details' => 'nullable|array',
            'effective_date' => 'required|date',
            'expiration_date' => 'required|date',
            'profile_id' => 'nullable|integer|exists:insurance_profiles,id',
        ]);

        $agencyId = $request->attributes->get('agency_id');

        $policy = Policy::create([
            'application_id' => $data['application_id'] ?? null,
            'user_id' => $data['user_id'],
            'agent_id' => $data['agent_id'] ?? null,
            'carrier_product_id' => $data['carrier_product_id'],
            'type' => $data['type'],
            'carrier_name' => $data['carrier_name'],
            'monthly_premium' => $data['monthly_premium'],
            'annual_premium' => $data['annual_premium'],
            'deductible' => $data['deductible'] ?? null,
            'coverage_limit' => $data['coverage_limit'] ?? null,
            'coverage_details' => $data['coverage_details'] ?? null,
            'effective_date' => $data['effective_date'],
            'expiration_date' => $data['expiration_date'],
            'agency_id' => $agencyId,
            'policy_number' => 'POL-' . strtoupper(uniqid()),
            'status' => 'active',
        ]);

        // Advance UIP to policy stage + mark converted
        $profile = null;
        if (!empty($data['profile_id'])) {
            $profile = InsuranceProfile::find($data['profile_id']);
        }
        if (!$profile && $data['application_id']) {
            $profile = InsuranceProfile::where('application_id', $data['application_id'])->first();
        }
        if (!$profile) {
            $profile = InsuranceProfile::where('user_id', $data['user_id'])
                ->where('insurance_type', $data['type'])
                ->where('status', 'active')
                ->latest()
                ->first();
        }

        if ($profile) {
            $profile->advanceTo('policy', [
                'policy_id' => $policy->id,
                'monthly_premium' => $data['monthly_premium'],
                'annual_premium' => $data['annual_premium'],
                'status' => 'converted',
            ]);
        }

        return response()->json($policy, 201);
    }

    public function updateStatus(Request $request, Policy $policy)
    {
        $data = $request->validate([
            'status' => 'required|in:active,expiring_soon,expired,cancelled',
        ]);

        $policy->update($data);

        // Update UIP status if policy is cancelled
        if ($data['status'] === 'cancelled') {
            InsuranceProfile::where('policy_id', $policy->id)
                ->update(['status' => 'lost']);
        }

        return response()->json($policy);
    }
}
