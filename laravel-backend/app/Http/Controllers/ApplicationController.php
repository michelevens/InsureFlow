<?php

namespace App\Http\Controllers;

use App\Mail\ApplicationStatusMail;
use App\Models\Application;
use App\Models\InsuranceProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ApplicationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $agencyId = $request->attributes->get('agency_id');
        $query = Application::with(['carrierProduct.carrier', 'agent', 'user']);

        // Tenant scoping
        if ($agencyId) {
            $query->where('agency_id', $agencyId);
        }

        if ($user->role === 'consumer') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'agent') {
            $query->where('agent_id', $user->id);
        } elseif ($user->role === 'carrier') {
            $query->whereHas('carrierProduct.carrier', function ($q) {
                // In production, filter by carrier user association
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $applications = $query->orderByDesc('created_at')->paginate(20);

        return response()->json($applications);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'carrier_product_id' => 'required|exists:carrier_products,id',
            'quote_id' => 'nullable|exists:quotes,id',
            'insurance_type' => 'required|string',
            'carrier_name' => 'required|string',
            'monthly_premium' => 'required|numeric',
            'applicant_data' => 'nullable|array',
            'profile_id' => 'nullable|integer|exists:insurance_profiles,id',
        ]);

        $agencyId = $request->attributes->get('agency_id');

        $application = Application::create([
            'carrier_product_id' => $data['carrier_product_id'],
            'quote_id' => $data['quote_id'] ?? null,
            'insurance_type' => $data['insurance_type'],
            'carrier_name' => $data['carrier_name'],
            'monthly_premium' => $data['monthly_premium'],
            'applicant_data' => $data['applicant_data'] ?? null,
            'reference' => 'APP-' . strtoupper(uniqid()),
            'user_id' => $request->user()->id,
            'agency_id' => $agencyId,
            'status' => 'draft',
        ]);

        // Advance UIP to application stage
        $profile = null;
        if (!empty($data['profile_id'])) {
            $profile = InsuranceProfile::find($data['profile_id']);
        }
        if (!$profile) {
            $profile = InsuranceProfile::where('user_id', $request->user()->id)
                ->where('insurance_type', $data['insurance_type'])
                ->where('status', 'active')
                ->latest()
                ->first();
        }

        if ($profile) {
            $profile->advanceTo('application', [
                'application_id' => $application->id,
                'monthly_premium' => $data['monthly_premium'],
            ]);
        }

        return response()->json($application, 201);
    }

    public function show(Application $application)
    {
        $application->load(['carrierProduct.carrier', 'agent', 'user', 'quote', 'policy']);
        return response()->json($application);
    }

    public function submit(Application $application)
    {
        $application->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return response()->json($application);
    }

    public function updateStatus(Request $request, Application $application)
    {
        $data = $request->validate([
            'status' => 'required|in:draft,submitted,under_review,approved,declined,bound',
        ]);

        $application->update($data);

        // Send status email to the applicant
        $application->load('user');
        if ($application->user) {
            try {
                Mail::to($application->user->email)->send(new ApplicationStatusMail(
                    user: $application->user,
                    applicationId: $application->reference ?? (string) $application->id,
                    status: $data['status'],
                    insuranceType: $application->insurance_type,
                ));
            } catch (\Exception $e) {
                \Log::warning('Failed to send application status email', ['error' => $e->getMessage()]);
            }
        }

        // If declined, mark UIP as lost
        if ($data['status'] === 'declined') {
            InsuranceProfile::where('application_id', $application->id)
                ->update(['status' => 'lost']);
        }

        return response()->json($application);
    }
}
