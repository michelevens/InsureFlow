<?php

namespace App\Console\Commands;

use App\Mail\LeadAgingEscalationMail;
use App\Mail\LeadAgingReminderMail;
use App\Models\InsuranceProfile;
use App\Models\LeadEngagementEvent;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

class CheckLeadAging extends Command
{
    protected $signature = 'leads:check-aging';
    protected $description = 'Alert agents and escalate leads that have not been contacted within SLA windows';

    public function handle(NotificationService $notifications): int
    {
        $now = Carbon::now();

        // ── 48h+ leads: escalate to agency owner ──
        $escalated = $this->escalateStaleLeads($now, $notifications);

        // ── 24h+ leads (not yet escalated): remind assigned agent ──
        $reminded = $this->remindAgents($now, $notifications);

        $this->info("Lead aging check complete: {$reminded} reminded, {$escalated} escalated.");

        return self::SUCCESS;
    }

    /**
     * Leads assigned 48h+ ago with no agent_contacted event → escalate to owner.
     */
    private function escalateStaleLeads(Carbon $now, NotificationService $notifications): int
    {
        $threshold = $now->copy()->subHours(48);
        $count = 0;

        $profiles = InsuranceProfile::query()
            ->whereNotNull('assigned_agent_id')
            ->where('status', 'active')
            ->whereIn('current_stage', ['intake', 'lead'])
            ->where('created_at', '<=', $threshold)
            ->whereDoesntHave('engagementEvents', function ($q) {
                $q->where('event_type', 'agent_contacted');
            })
            ->whereDoesntHave('engagementEvents', function ($q) {
                $q->where('event_type', 'aging_escalated');
            })
            ->with(['assignedAgent', 'agency.owner'])
            ->get();

        foreach ($profiles as $profile) {
            $owner = $profile->agency?->owner;
            if (!$owner) continue;

            $leadName = "{$profile->first_name} {$profile->last_name}";
            $hoursOld = $now->diffInHours($profile->created_at);

            // Email owner
            try {
                Mail::to($owner->email)->send(new LeadAgingEscalationMail(
                    ownerName: $owner->name,
                    agentName: $profile->assignedAgent?->name ?? 'Unassigned',
                    leadName: $leadName,
                    leadEmail: $profile->email,
                    insuranceType: $profile->insurance_type,
                    hoursOld: $hoursOld,
                    profileId: $profile->id,
                ));
            } catch (\Throwable $e) {
                \Log::warning('Failed to send lead escalation email', ['profile_id' => $profile->id, 'error' => $e->getMessage()]);
            }

            // In-app notification to owner
            $notifications->send(
                $owner->id, 'lead_escalation',
                'Lead Requires Attention',
                "{$leadName} has not been contacted in {$hoursOld}h (assigned to {$profile->assignedAgent?->name})",
                'alert-triangle', "/crm/leads",
                ['profile_id' => $profile->id],
            );

            // Mark as escalated so we don't re-escalate
            LeadEngagementEvent::create([
                'insurance_profile_id' => $profile->id,
                'event_type' => 'aging_escalated',
                'metadata' => ['hours_old' => $hoursOld, 'escalated_to' => $owner->id],
                'created_at' => now(),
            ]);

            $count++;
        }

        return $count;
    }

    /**
     * Leads assigned 24h+ ago with no agent_contacted event (and not yet escalated) → remind agent.
     */
    private function remindAgents(Carbon $now, NotificationService $notifications): int
    {
        $threshold = $now->copy()->subHours(24);
        $count = 0;

        $profiles = InsuranceProfile::query()
            ->whereNotNull('assigned_agent_id')
            ->where('status', 'active')
            ->whereIn('current_stage', ['intake', 'lead'])
            ->where('created_at', '<=', $threshold)
            ->whereDoesntHave('engagementEvents', function ($q) {
                $q->where('event_type', 'agent_contacted');
            })
            ->whereDoesntHave('engagementEvents', function ($q) {
                $q->where('event_type', 'aging_reminded');
            })
            ->whereDoesntHave('engagementEvents', function ($q) {
                $q->where('event_type', 'aging_escalated');
            })
            ->with('assignedAgent')
            ->get();

        foreach ($profiles as $profile) {
            $agent = $profile->assignedAgent;
            if (!$agent) continue;

            $leadName = "{$profile->first_name} {$profile->last_name}";
            $hoursOld = $now->diffInHours($profile->created_at);

            // Email agent
            try {
                Mail::to($agent->email)->send(new LeadAgingReminderMail(
                    agentName: $agent->name,
                    leadName: $leadName,
                    leadEmail: $profile->email,
                    insuranceType: $profile->insurance_type,
                    hoursOld: $hoursOld,
                    profileId: $profile->id,
                ));
            } catch (\Throwable $e) {
                \Log::warning('Failed to send lead aging reminder', ['profile_id' => $profile->id, 'error' => $e->getMessage()]);
            }

            // In-app notification
            $notifications->send(
                $agent->id, 'lead_aging_reminder',
                'Lead Needs Follow-Up',
                "{$leadName} submitted {$hoursOld}h ago and hasn't been contacted yet",
                'clock', "/crm/leads",
                ['profile_id' => $profile->id],
            );

            // Mark as reminded
            LeadEngagementEvent::create([
                'insurance_profile_id' => $profile->id,
                'event_type' => 'aging_reminded',
                'metadata' => ['hours_old' => $hoursOld, 'agent_id' => $agent->id],
                'created_at' => now(),
            ]);

            $count++;
        }

        return $count;
    }
}
