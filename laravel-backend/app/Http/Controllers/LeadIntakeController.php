<?php

namespace App\Http\Controllers;

use App\Mail\LeadAssignedMail;
use App\Mail\LeadIntakeConfirmationMail;
use App\Models\Agency;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class LeadIntakeController extends Controller
{
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
        ]);

        // Determine which agent to assign (if specified and belongs to agency)
        $agentId = null;
        $agent = null;
        if (!empty($data['agent_id'])) {
            $agent = User::where('id', $data['agent_id'])
                ->where('agency_id', $agency->id)
                ->where('role', 'agent')
                ->first();
            if ($agent) {
                $agentId = $agent->id;
            }
        }

        // Fall back to agency owner if no specific agent
        if (!$agentId) {
            $agentId = $agency->owner_id;
            $agent = User::find($agentId);
        }

        // Build notes with urgency if provided
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

        $lead = Lead::create([
            'agency_id' => $agency->id,
            'agent_id' => $agentId,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'insurance_type' => $data['insurance_type'],
            'notes' => $notes ?: null,
            'source' => 'intake_link',
            'status' => 'new',
        ]);

        // Notify the assigned agent
        if ($agent) {
            try {
                Mail::to($agent->email)->send(new LeadAssignedMail(
                    agent: $agent,
                    leadName: "{$data['first_name']} {$data['last_name']}",
                    leadEmail: $data['email'],
                    insuranceType: $data['insurance_type'],
                    estimatedValue: '—',
                ));
            } catch (\Throwable $e) {
                \Log::warning('Failed to send lead assigned email', ['error' => $e->getMessage()]);
            }
        }

        // Send confirmation to consumer
        try {
            Mail::to($data['email'])->send(new LeadIntakeConfirmationMail(
                firstName: $data['first_name'],
                agencyName: $agency->name,
                insuranceType: $data['insurance_type'],
            ));
        } catch (\Throwable $e) {
            \Log::warning('Failed to send intake confirmation email', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'message' => 'Your information has been submitted successfully. An agent will contact you shortly.',
            'lead_id' => $lead->id,
        ], 201);
    }
}
