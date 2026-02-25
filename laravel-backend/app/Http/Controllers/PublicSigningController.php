<?php

namespace App\Http\Controllers;

use App\Mail\ApplicationReadyToSignMail;
use App\Mail\ApplicationSignedMail;
use App\Models\Application;
use App\Models\LeadScenario;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PublicSigningController extends Controller
{
    /**
     * Agent: Create an application from an accepted scenario and generate signing token.
     */
    public function createFromScenario(Request $request, LeadScenario $scenario)
    {
        $data = $request->validate([
            'carrier_product_id' => 'nullable|exists:carrier_products,id',
            'carrier_name' => 'required|string|max:255',
        ]);

        $lead = $scenario->lead;
        $user = $request->user();
        $agencyId = $request->attributes->get('agency_id');

        // Find or create consumer user account
        $consumer = User::where('email', $lead->email)->first();
        if (!$consumer) {
            $consumer = User::create([
                'name' => $lead->first_name . ' ' . $lead->last_name,
                'email' => $lead->email,
                'password' => Hash::make(Str::random(32)),
                'role' => 'consumer',
            ]);
        }

        $signingToken = Str::random(64);

        $application = Application::create([
            'reference' => 'APP-' . strtoupper(Str::random(8)),
            'user_id' => $consumer->id,
            'agent_id' => $user->id,
            'agency_id' => $agencyId,
            'carrier_product_id' => $data['carrier_product_id'],
            'lead_scenario_id' => $scenario->id,
            'lead_id' => $lead->id,
            'insurance_type' => $scenario->product_type,
            'carrier_name' => $data['carrier_name'],
            'monthly_premium' => $scenario->best_quoted_premium ?? 0,
            'status' => 'draft',
            'signing_token' => $signingToken,
        ]);

        // Copy insured objects and coverages from scenario
        foreach ($scenario->insuredObjects as $obj) {
            $copy = $obj->replicate();
            $copy->insurable_type = Application::class;
            $copy->insurable_id = $application->id;
            $copy->save();
        }

        foreach ($scenario->coverages as $cov) {
            $copy = $cov->replicate();
            $copy->coverable_type = Application::class;
            $copy->coverable_id = $application->id;
            $copy->save();
        }

        // Update scenario
        $scenario->increment('total_applications');
        if (in_array($scenario->status, ['draft', 'quoting', 'quoted', 'selected'])) {
            $scenario->update(['status' => 'applied']);
        }

        // Send signing email to consumer
        $signUrl = config('app.frontend_url', 'https://insurons.com') . '/applications/' . $signingToken . '/sign';

        try {
            Mail::to($consumer->email)->queue(new ApplicationReadyToSignMail(
                consumerName: $consumer->name,
                agentName: $user->name,
                carrierName: $data['carrier_name'],
                signUrl: $signUrl,
            ));
        } catch (\Throwable $e) {
            // Don't fail
        }

        $application->load(['insuredObjects', 'coverages', 'carrierProduct.carrier']);

        return response()->json([
            'application' => $application,
            'signing_token' => $signingToken,
            'sign_url' => $signUrl,
        ], 201);
    }

    /**
     * Public: View an application for signing (no auth).
     */
    public function view(string $token)
    {
        $application = Application::where('signing_token', $token)
            ->with(['insuredObjects', 'coverages', 'carrierProduct.carrier', 'agent:id,name', 'agency:id,name'])
            ->firstOrFail();

        return response()->json([
            'application' => $application,
            'is_signed' => $application->signed_at !== null,
        ]);
    }

    /**
     * Public: Sign an application via token (canvas signature).
     */
    public function sign(Request $request, string $token)
    {
        $data = $request->validate([
            'signer_name' => 'required|string|max:255',
            'signature_data' => 'required|string', // base64 canvas data
        ]);

        $application = Application::where('signing_token', $token)
            ->whereNull('signed_at')
            ->firstOrFail();

        $application->update([
            'signer_name' => $data['signer_name'],
            'signature_data' => $data['signature_data'],
            'signer_ip' => $request->ip(),
            'signed_at' => now(),
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        // Notify agent
        try {
            $agent = $application->agent;
            if ($agent) {
                Mail::to($agent->email)->queue(new ApplicationSignedMail(
                    agentName: $agent->name,
                    consumerName: $data['signer_name'],
                    reference: $application->reference,
                ));
            }
        } catch (\Throwable $e) {
            // Don't fail
        }

        // Fire workflow automation
        try {
            app(\App\Services\WorkflowEngine::class)->fire('application_signed', [
                'application_id' => $application->id,
                'agent_id' => $application->agent_id,
                'agency_id' => $application->agency_id,
                'consumer_id' => $application->user_id,
                'carrier_name' => $application->carrier_name,
                'insurance_type' => $application->insurance_type,
                'premium' => $application->monthly_premium,
            ]);
        } catch (\Throwable $e) {
            // Don't fail
        }

        return response()->json([
            'message' => 'Application signed successfully.',
            'reference' => $application->reference,
        ]);
    }
}
