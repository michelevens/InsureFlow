<?php

namespace App\Http\Controllers;

use App\Mail\AgentWelcomeMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

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
     * Get combined team view: agents with stats + pending invites.
     */
    public function team()
    {
        $user = Auth::user();
        $agency = $user->ownedAgency ?? $user->agency;

        if (!$agency) {
            return response()->json(['message' => 'No agency found'], 404);
        }

        $agents = $agency->agents()->with('agentProfile')->get()->map(function ($agent) {
            $profile = $agent->agentProfile;
            $leadCount = $agent->leads()->count();
            $policyCount = $agent->policies()->count();

            return [
                'id' => $agent->id,
                'name' => $agent->name,
                'email' => $agent->email,
                'phone' => $agent->phone,
                'role' => $agent->role,
                'is_active' => (bool) $agent->is_active,
                'avatar' => $agent->avatar,
                'joined_at' => $agent->created_at?->toDateString(),
                'leads_count' => $leadCount,
                'policies_count' => $policyCount,
                'avg_rating' => $profile->avg_rating ?? 0,
                'specialties' => $profile->specialties ?? [],
            ];
        });

        $invites = \App\Models\Invite::where('agency_id', $agency->id)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('created_at')
            ->get(['id', 'email', 'role', 'created_at', 'expires_at']);

        $activeCount = $agents->where('is_active', true)->count();

        return response()->json([
            'agents' => $agents,
            'invites' => $invites,
            'stats' => [
                'active_agents' => $activeCount,
                'pending_invites' => $invites->count(),
                'total_leads' => $agents->sum('leads_count'),
                'total_policies' => $agents->sum('policies_count'),
            ],
        ]);
    }

    /**
     * Toggle agent active status.
     */
    public function toggleAgentStatus(User $agent)
    {
        $user = Auth::user();
        $agency = $user->ownedAgency;

        if (!$agency || $agent->agency_id !== $agency->id) {
            return response()->json(['message' => 'Agent does not belong to your agency'], 403);
        }

        if ($agent->id === $user->id) {
            return response()->json(['message' => 'Cannot deactivate yourself'], 422);
        }

        $agent->update(['is_active' => !$agent->is_active]);

        return response()->json([
            'message' => $agent->is_active ? 'Agent activated' : 'Agent deactivated',
            'is_active' => $agent->is_active,
        ]);
    }

    /**
     * Cancel a pending invite.
     */
    public function cancelInvite(\App\Models\Invite $invite)
    {
        $user = Auth::user();
        $agency = $user->ownedAgency;

        if (!$agency || $invite->agency_id !== $agency->id) {
            return response()->json(['message' => 'Invite does not belong to your agency'], 403);
        }

        $invite->delete();

        return response()->json(['message' => 'Invite cancelled']);
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

    /**
     * Create a new agent under this agency.
     */
    public function createAgent(Request $request)
    {
        $user = Auth::user();
        $agency = $user->ownedAgency;

        if (!$agency) {
            return response()->json(['message' => 'Only agency owners can create agents'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:8',
        ]);

        $password = !empty($data['password']) ? $data['password'] : Str::random(10);

        $agent = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($password),
            'role' => 'agent',
            'agency_id' => $agency->id,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $loginUrl = rtrim(config('app.frontend_url', 'https://insurons.com'), '/') . '/login';

        try {
            Mail::to($data['email'])->send(new AgentWelcomeMail(
                agentName: $data['name'],
                agencyName: $agency->name,
                email: $data['email'],
                temporaryPassword: $password,
                loginUrl: $loginUrl,
            ));
        } catch (\Exception $e) {
            \Log::warning('Agent welcome email failed: ' . $e->getMessage());
        }

        return response()->json([
            'agent' => $agent,
            'temporary_password' => $password,
        ], 201);
    }

    /**
     * Regenerate agency code.
     */
    public function regenerateCode()
    {
        $user = Auth::user();
        $agency = $user->ownedAgency;

        if (!$agency) {
            return response()->json(['message' => 'Only agency owners can regenerate codes'], 403);
        }

        $newCode = strtoupper(Str::random(8));
        $agency->update(['agency_code' => $newCode]);

        return response()->json([
            'message' => 'Agency code regenerated',
            'agency_code' => $newCode,
        ]);
    }

    /**
     * Get the agency's lead intake URL info.
     */
    public function leadIntakeInfo()
    {
        $user = Auth::user();
        $agency = $user->ownedAgency ?? $user->agency;

        if (!$agency) {
            return response()->json(['message' => 'No agency found'], 404);
        }

        $baseUrl = config('app.frontend_url', 'https://insurons.com');

        return response()->json([
            'agency_code' => $agency->agency_code,
            'agency_intake_url' => $baseUrl . '/intake/' . $agency->agency_code,
            'agent_intake_url' => $baseUrl . '/intake/' . $agency->agency_code . '?agent=' . $user->id,
        ]);
    }

    /**
     * Reset an agent's password (must belong to agency).
     */
    public function resetAgentPassword(User $agent)
    {
        $user = Auth::user();
        $agency = $user->ownedAgency;

        if (!$agency || $agent->agency_id !== $agency->id) {
            return response()->json(['message' => 'Agent does not belong to your agency'], 403);
        }

        $tempPassword = Str::random(12);
        $agent->update(['password' => Hash::make($tempPassword)]);

        return response()->json([
            'message' => 'Password reset successfully',
            'temporary_password' => $tempPassword,
        ]);
    }
}
