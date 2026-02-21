<?php

namespace App\Services;

use App\Mail\LeadAssignedMail;
use App\Models\InsuranceProfile;
use App\Models\Lead;
use App\Models\RoutingRule;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class RoutingEngine
{
    /**
     * Route an insurance profile to the best-matching agent.
     * Returns the assigned agent ID or null if no rule matched.
     */
    public function route(InsuranceProfile $profile): ?int
    {
        if (!$profile->agency_id) {
            return $this->routePlatformLead($profile);
        }

        // Get active rules for this agency, ordered by priority (highest first)
        $rules = RoutingRule::where('agency_id', $profile->agency_id)
            ->where('is_active', true)
            ->orderByDesc('priority')
            ->get();

        foreach ($rules as $rule) {
            if ($rule->matches($profile)) {
                $agentId = $rule->assignAgent();
                if ($agentId) {
                    $this->assignToAgent($profile, $agentId);
                    return $agentId;
                }
            }
        }

        // Fallback: assign to agency owner
        return $this->fallbackToOwner($profile);
    }

    /**
     * Route a platform-level lead (no agency context).
     * Uses marketplace matching: find agents in the profile's zip code area.
     */
    private function routePlatformLead(InsuranceProfile $profile): ?int
    {
        // Find active agents with matching specialties in the profile's area
        $agents = User::where('role', 'agent')
            ->where('is_active', true)
            ->whereHas('agentProfile', function ($q) use ($profile) {
                if ($profile->zip_code) {
                    $q->where('city', '!=', null); // Agent has a location set
                }
            })
            ->inRandomOrder()
            ->limit(1)
            ->first();

        if ($agents) {
            $this->assignToAgent($profile, $agents->id);
            return $agents->id;
        }

        return null;
    }

    private function fallbackToOwner(InsuranceProfile $profile): ?int
    {
        if (!$profile->agency_id) return null;

        $agency = $profile->agency;
        if (!$agency) return null;

        $ownerId = $agency->owner_id;
        if ($ownerId) {
            $this->assignToAgent($profile, $ownerId);
            return $ownerId;
        }

        return null;
    }

    private function assignToAgent(InsuranceProfile $profile, int $agentId): void
    {
        $profile->update(['assigned_agent_id' => $agentId]);

        // If there's a linked lead, update its agent too
        if ($profile->lead_id) {
            Lead::where('id', $profile->lead_id)->update([
                'agent_id' => $agentId,
                'agency_id' => $profile->agency_id,
            ]);
        }

        // Notify the agent
        $agent = User::find($agentId);
        if ($agent) {
            try {
                Mail::to($agent->email)->send(new LeadAssignedMail(
                    agent: $agent,
                    leadName: $profile->first_name . ' ' . $profile->last_name,
                    leadEmail: $profile->email,
                    insuranceType: $profile->insurance_type,
                    estimatedValue: $profile->estimated_value ?? '0.00',
                ));
            } catch (\Exception $e) {
                // Don't fail routing if email fails
                \Log::warning('Failed to send lead assignment email', [
                    'agent_id' => $agentId,
                    'profile_id' => $profile->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
