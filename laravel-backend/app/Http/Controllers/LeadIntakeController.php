<?php

namespace App\Http\Controllers;

use App\Models\Agency;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\Request;

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
            'insurance_type' => 'required|string|max:100',
            'notes' => 'nullable|string|max:2000',
            'agent_id' => 'nullable|integer',
        ]);

        // Determine which agent to assign (if specified and belongs to agency)
        $agentId = null;
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
        }

        $lead = Lead::create([
            'agency_id' => $agency->id,
            'agent_id' => $agentId,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'insurance_type' => $data['insurance_type'],
            'notes' => $data['notes'] ?? null,
            'source' => 'intake_link',
            'status' => 'new',
        ]);

        return response()->json([
            'message' => 'Your information has been submitted successfully. An agent will contact you shortly.',
            'lead_id' => $lead->id,
        ], 201);
    }
}
