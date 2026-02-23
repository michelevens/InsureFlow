<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AgencySettingController extends Controller
{
    /**
     * Get agency settings (general info + compliance + notification prefs).
     */
    public function index()
    {
        $user = Auth::user();
        $agency = $user->ownedAgency ?? $user->agency;

        if (!$agency) {
            return response()->json(['message' => 'No agency found'], 404);
        }

        $agency->load(['owner', 'agents.agentProfile', 'carrierAppointments', 'platformProducts']);

        return response()->json([
            'agency' => $agency,
            'team_count' => $agency->agents()->count(),
            'product_count' => $agency->platformProducts()->count(),
            'appointment_count' => $agency->carrierAppointments()->count(),
        ]);
    }

    /**
     * Update agency general info.
     */
    public function update(Request $request)
    {
        $user = Auth::user();
        $agency = $user->ownedAgency;

        if (!$agency) {
            return response()->json(['message' => 'Only agency owners can update settings'], 403);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:2',
            'zip_code' => 'nullable|string|max:10',
        ]);

        $agency->update($data);

        return response()->json([
            'message' => 'Agency updated successfully',
            'agency' => $agency->fresh(),
        ]);
    }

    /**
     * Get billing info: current plan, payment history.
     */
    public function billing()
    {
        $user = Auth::user();
        $agency = $user->ownedAgency ?? $user->agency;

        if (!$agency) {
            return response()->json(['message' => 'No agency found'], 404);
        }

        // Get owner's subscription
        $owner = $agency->owner;
        $subscription = $owner ? $owner->subscriptions()->latest()->first() : null;

        return response()->json([
            'plan' => $subscription ? [
                'name' => $subscription->plan_name ?? 'Free',
                'status' => $subscription->status ?? 'inactive',
                'current_period_end' => $subscription->current_period_end ?? null,
                'price' => $subscription->price ?? 0,
            ] : ['name' => 'Free', 'status' => 'active', 'current_period_end' => null, 'price' => 0],
            'stripe_connected' => (bool)($owner->stripe_account_id ?? false),
        ]);
    }

    /**
     * Get compliance summary: E&O, licenses, CE credits.
     */
    public function compliance()
    {
        $user = Auth::user();
        $agency = $user->ownedAgency ?? $user->agency;

        if (!$agency) {
            return response()->json(['message' => 'No agency found'], 404);
        }

        $agents = $agency->agents()->with('agentProfile')->get();

        // Gather compliance data from agent profiles
        $complianceData = $agents->map(function ($agent) {
            $profile = $agent->agentProfile;
            return [
                'agent_id' => $agent->id,
                'name' => $agent->name,
                'npn' => $profile->npn ?? null,
                'license_states' => $profile->license_states ?? [],
                'license_expiry' => $profile->license_expiry ?? null,
            ];
        });

        return response()->json([
            'agents' => $complianceData,
            'total_agents' => $agents->count(),
        ]);
    }

    /**
     * Get team permissions matrix.
     */
    public function teamPermissions()
    {
        $user = Auth::user();
        $agency = $user->ownedAgency;

        if (!$agency) {
            return response()->json(['message' => 'Only agency owners can view team permissions'], 403);
        }

        $agents = $agency->agents()->with('agentProfile')->get()->map(function ($agent) {
            return [
                'id' => $agent->id,
                'name' => $agent->name,
                'email' => $agent->email,
                'role' => $agent->role,
                'is_active' => $agent->is_active,
                'permissions' => $agent->agentProfile->permissions ?? [
                    'leads' => true,
                    'policies' => true,
                    'commissions' => false,
                    'reports' => false,
                    'settings' => false,
                ],
            ];
        });

        return response()->json(['agents' => $agents]);
    }
}
