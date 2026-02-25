<?php

namespace App\Http\Controllers;

use App\Mail\LeadIntakeConfirmationMail;
use App\Models\Agency;
use App\Models\InsuranceProfile;
use App\Models\Lead;
use App\Models\LeadEngagementEvent;
use App\Models\User;
use App\Services\LeadScoringService;
use App\Services\RoutingEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class LeadIntakeController extends Controller
{
    public function __construct(
        private RoutingEngine $router,
        private LeadScoringService $scorer,
    ) {}

    /**
     * Get intake form data for a given agency code (public).
     */
    public function formData(string $agencyCode)
    {
        $agency = Agency::where('agency_code', strtoupper($agencyCode))
            ->where('is_active', true)
            ->first();

        if (!$agency) {
            return response()->json(['message' => 'Invalid or inactive agency code'], 404);
        }

        return response()->json([
            'agency_name' => $agency->name,
            'agency_code' => $agency->agency_code,
        ]);
    }

    /**
     * Submit a lead intake form (public, no auth required).
     *
     * Pipeline: validate → deduplicate → InsuranceProfile → Lead → RoutingEngine → Score → Notify
     */
    public function submit(Request $request, string $agencyCode)
    {
        $agency = Agency::where('agency_code', strtoupper($agencyCode))
            ->where('is_active', true)
            ->first();

        if (!$agency) {
            return response()->json(['message' => 'Invalid or inactive agency code'], 404);
        }

        $data = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'zip_code' => 'nullable|string|max:10',
            'insurance_type' => 'required|string|max:100',
            'urgency' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:2000',
            'agent_id' => 'nullable|integer',
            'utm_source' => 'nullable|string|max:100',
            'utm_medium' => 'nullable|string|max:100',
            'utm_campaign' => 'nullable|string|max:100',
        ]);

        // ── 1. Build notes from urgency + zip ──
        $notes = $data['notes'] ?? '';
        if (!empty($data['urgency'])) {
            $urgencyLabel = match ($data['urgency']) {
                'asap' => 'As soon as possible',
                'this_month' => 'Within the next month',
                'exploring' => 'Just exploring options',
                default => $data['urgency'],
            };
            $notes = "Timeline: {$urgencyLabel}" . ($notes ? "\n{$notes}" : '');
        }
        if (!empty($data['zip_code'])) {
            $notes = "ZIP: {$data['zip_code']}" . ($notes ? "\n{$notes}" : '');
        }

        // ── 2. Build UTM details ──
        $details = [];
        foreach (['utm_source', 'utm_medium', 'utm_campaign'] as $utm) {
            if (!empty($data[$utm])) {
                $details[$utm] = $data[$utm];
            }
        }

        // ── 3. Deduplicate: find existing profile for this email + insurance_type + agency ──
        $profile = InsuranceProfile::where('email', $data['email'])
            ->where('insurance_type', $data['insurance_type'])
            ->where('agency_id', $agency->id)
            ->first();

        $isExisting = (bool) $profile;

        if ($profile) {
            // Update existing profile with new info
            $profile->update(array_filter([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone' => $data['phone'] ?? $profile->phone,
                'zip_code' => $data['zip_code'] ?? $profile->zip_code,
                'notes' => $notes ?: $profile->notes,
                'details' => !empty($details) ? array_merge($profile->details ?? [], $details) : $profile->details,
            ]));
        } else {
            // Create new InsuranceProfile
            $profile = InsuranceProfile::create([
                'agency_id' => $agency->id,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'zip_code' => $data['zip_code'] ?? null,
                'insurance_type' => $data['insurance_type'],
                'coverage_level' => 'standard',
                'current_stage' => 'intake',
                'source' => 'intake_link',
                'status' => 'active',
                'notes' => $notes ?: null,
                'details' => !empty($details) ? $details : null,
            ]);
        }

        // ── 4. Create Lead (or find existing linked lead) ──
        $lead = $profile->lead;
        if (!$lead) {
            $lead = Lead::create([
                'agency_id' => $agency->id,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'insurance_type' => $data['insurance_type'],
                'notes' => $notes ?: null,
                'source' => 'intake_link',
                'status' => 'new',
            ]);

            // Link profile ↔ lead
            $profile->update(['lead_id' => $lead->id]);
            $profile->advanceTo('lead');
        } else {
            // Existing lead — update contact info but don't regress status
            $lead->update([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'phone' => $data['phone'] ?? $lead->phone,
                'notes' => $notes ?: $lead->notes,
            ]);
        }

        // ── 5. Route via RoutingEngine (respects agency routing rules) ──
        // If agent_id explicitly provided in URL, honor direct assignment
        if (!empty($data['agent_id'])) {
            $directAgent = User::where('id', $data['agent_id'])
                ->where('agency_id', $agency->id)
                ->where('role', 'agent')
                ->first();
            if ($directAgent) {
                // Direct assign — bypass routing rules
                $profile->update(['assigned_agent_id' => $directAgent->id]);
                $lead->update(['agent_id' => $directAgent->id]);
            } else {
                // Invalid agent_id — fall through to routing engine
                $this->router->route($profile);
                $lead->update(['agent_id' => $profile->fresh()->assigned_agent_id]);
            }
        } else {
            // Use routing engine (round-robin, capacity, geographic rules)
            $this->router->route($profile);
            $lead->update(['agent_id' => $profile->fresh()->assigned_agent_id]);
        }

        // ── 6. Score the lead ──
        try {
            $this->scorer->score($profile);
        } catch (\Throwable $e) {
            \Log::warning('Failed to score intake lead', ['profile_id' => $profile->id, 'error' => $e->getMessage()]);
        }

        // ── 7. Track engagement event ──
        LeadEngagementEvent::create([
            'insurance_profile_id' => $profile->id,
            'event_type' => $isExisting ? 'intake_resubmit' : 'intake_submit',
            'metadata' => array_filter([
                'agency_code' => $agencyCode,
                'insurance_type' => $data['insurance_type'],
                'urgency' => $data['urgency'] ?? null,
                'utm_source' => $data['utm_source'] ?? null,
                'utm_medium' => $data['utm_medium'] ?? null,
                'utm_campaign' => $data['utm_campaign'] ?? null,
            ]),
            'created_at' => now(),
        ]);

        // ── 8. Send consumer confirmation (agent email handled by RoutingEngine) ──
        try {
            Mail::to($data['email'])->send(new LeadIntakeConfirmationMail(
                firstName: $data['first_name'],
                agencyName: $agency->name,
                insuranceType: $data['insurance_type'],
            ));
        } catch (\Throwable $e) {
            \Log::warning('Failed to send intake confirmation email', ['error' => $e->getMessage()]);
        }

        // ── 9. Fire workflow automation ──
        try {
            app(\App\Services\WorkflowEngine::class)->fire('intake_form_submitted', [
                'lead_id' => $lead->id,
                'agent_id' => $lead->assigned_agent_id,
                'agency_id' => $agency->id,
                'agency_owner_id' => $agency->owner_id,
                'insurance_type' => $data['insurance_type'],
                'state' => $data['zip_code'] ?? null,
                'lead_source' => 'intake_link',
                'consumer_name' => $data['first_name'] . ' ' . $data['last_name'],
            ]);
        } catch (\Throwable $e) {
            \Log::warning('Workflow engine error on intake', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'message' => 'Your information has been submitted successfully. An agent will contact you shortly.',
            'lead_id' => $lead->id,
            'profile_id' => $profile->id,
            'is_returning' => $isExisting,
        ], 201);
    }
}
