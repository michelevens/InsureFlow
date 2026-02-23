<?php

namespace App\Http\Controllers;

use App\Models\Agency;
use App\Models\AgentProfile;
use App\Models\AgencyCarrierAppointment;
use App\Models\PlatformProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OnboardingController extends Controller
{
    /**
     * Get onboarding status and data for current user.
     */
    public function status(Request $request)
    {
        $user = $request->user();
        $user->load(['agentProfile', 'agency', 'ownedAgency']);

        return response()->json([
            'onboarding_completed' => (bool) $user->onboarding_completed,
            'onboarding_data' => $user->onboarding_data,
            'role' => $user->role,
            'user' => $user,
        ]);
    }

    /**
     * Save agency onboarding data (agency_owner role).
     * Creates or updates agency, sets products and carrier appointments.
     */
    public function saveAgency(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['agency_owner'])) {
            return response()->json(['message' => 'Only agency owners can complete agency onboarding'], 403);
        }

        $data = $request->validate([
            // Agency info
            'agency_name' => 'required|string|max:255',
            'agency_phone' => 'nullable|string|max:20',
            'agency_email' => 'nullable|email|max:255',
            'agency_website' => 'nullable|string|max:255',
            'agency_description' => 'nullable|string|max:2000',
            // Location
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:2',
            'zip_code' => 'nullable|string|max:10',
            // Licensing
            'license_number' => 'nullable|string|max:50',
            'npn_number' => 'nullable|string|max:20',
            'license_states' => 'nullable|array',
            'license_states.*' => 'string|max:2',
            'eo_carrier' => 'nullable|string|max:100',
            'eo_policy_number' => 'nullable|string|max:50',
            'eo_expiration' => 'nullable|date',
            // Products
            'product_ids' => 'nullable|array',
            'product_ids.*' => 'integer|exists:platform_products,id',
            // Carriers
            'carrier_ids' => 'nullable|array',
            'carrier_ids.*' => 'integer|exists:carriers,id',
        ]);

        // Create or update agency
        $agency = Agency::updateOrCreate(
            ['owner_id' => $user->id],
            [
                'name' => $data['agency_name'],
                'slug' => Str::slug($data['agency_name']),
                'agency_code' => strtoupper(Str::random(8)),
                'phone' => $data['agency_phone'] ?? null,
                'email' => $data['agency_email'] ?? $user->email,
                'website' => $data['agency_website'] ?? null,
                'description' => $data['agency_description'] ?? null,
                'address' => $data['address'] ?? null,
                'city' => $data['city'] ?? null,
                'state' => $data['state'] ?? null,
                'zip_code' => $data['zip_code'] ?? null,
                'npn' => $data['npn_number'] ?? null,
                'npn_verified' => !empty($data['npn_number']) ? 'pending' : 'unverified',
                'is_active' => true,
            ]
        );

        // Link user to agency
        if (!$user->agency_id) {
            $user->update(['agency_id' => $agency->id]);
        }

        // Sync products
        if (!empty($data['product_ids'])) {
            $pivotData = [];
            foreach ($data['product_ids'] as $productId) {
                $pivotData[$productId] = ['is_active' => true];
            }
            $agency->platformProducts()->sync($pivotData);
        }

        // Store onboarding data snapshot
        $user->update([
            'onboarding_data' => array_merge(
                (array) $user->onboarding_data,
                [
                    'agency_step' => $data,
                    'agency_id' => $agency->id,
                ]
            ),
        ]);

        return response()->json([
            'message' => 'Agency onboarding data saved',
            'agency' => $agency->fresh(),
        ]);
    }

    /**
     * Save agent profile onboarding data (agent or agency_owner role).
     */
    public function saveAgent(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['agent', 'agency_owner'])) {
            return response()->json(['message' => 'Only agents and agency owners can complete agent onboarding'], 403);
        }

        $data = $request->validate([
            'bio' => 'nullable|string|max:2000',
            'license_number' => 'nullable|string|max:50',
            'license_states' => 'nullable|array',
            'license_states.*' => 'string|max:2',
            'npn_number' => 'nullable|string|max:20',
            'specialties' => 'nullable|array',
            'specialties.*' => 'string|max:100',
            'carriers' => 'nullable|array',
            'carriers.*' => 'string|max:100',
            'years_experience' => 'nullable|integer|min:0|max:75',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:2',
            'phone' => 'nullable|string|max:20',
        ]);

        // Update user phone if provided
        if (!empty($data['phone'])) {
            $user->update(['phone' => $data['phone']]);
        }

        // Create or update agent profile
        $profile = AgentProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'bio' => $data['bio'] ?? null,
                'license_number' => $data['license_number'] ?? null,
                'npn' => $data['npn_number'] ?? null,
                'npn_verified' => !empty($data['npn_number']) ? 'pending' : 'unverified',
                'license_states' => $data['license_states'] ?? [],
                'specialties' => $data['specialties'] ?? [],
                'carriers' => $data['carriers'] ?? [],
                'years_experience' => $data['years_experience'] ?? 0,
                'city' => $data['city'] ?? null,
                'state' => $data['state'] ?? null,
            ]
        );

        // Store onboarding data snapshot
        $user->update([
            'onboarding_data' => array_merge(
                (array) $user->onboarding_data,
                ['agent_step' => $data]
            ),
        ]);

        return response()->json([
            'message' => 'Agent profile saved',
            'profile' => $profile,
        ]);
    }

    /**
     * Mark onboarding as completed.
     */
    public function complete(Request $request)
    {
        $user = $request->user();

        $user->update([
            'onboarding_completed' => true,
            'onboarding_completed_at' => now(),
        ]);

        // Auto-generate compliance pack based on states and products
        try {
            app(CompliancePackController::class)->generateForUser($user);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Compliance pack generation failed for user ' . $user->id . ': ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Onboarding completed',
            'user' => $user->fresh(['agentProfile', 'agency', 'ownedAgency']),
        ]);
    }

    /**
     * Get data needed for onboarding forms (products, carriers, etc.)
     */
    public function formData(Request $request)
    {
        $products = PlatformProduct::where('is_active', true)
            ->orderBy('category')
            ->orderBy('sort_order')
            ->get(['id', 'slug', 'name', 'category', 'icon']);

        $grouped = $products->groupBy('category');

        $carriers = \App\Models\Carrier::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'am_best_rating']);

        return response()->json([
            'products' => $products,
            'products_grouped' => $grouped,
            'carriers' => $carriers,
        ]);
    }
}
