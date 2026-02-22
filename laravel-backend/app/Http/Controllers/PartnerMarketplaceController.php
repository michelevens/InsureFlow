<?php

namespace App\Http\Controllers;

use App\Models\PartnerListing;
use App\Models\PartnerReferral;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PartnerMarketplaceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PartnerListing::where('is_active', true)
            ->with('user:id,first_name,last_name');

        if ($request->query('category')) {
            $query->where('category', $request->query('category'));
        }

        if ($request->query('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('business_name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        if ($request->query('verified')) {
            $query->where('is_verified', true);
        }

        $listings = $query->orderByDesc('rating')
            ->paginate($request->query('per_page', 20));

        return response()->json($listings);
    }

    public function show(int $listingId): JsonResponse
    {
        $listing = PartnerListing::with('user:id,first_name,last_name')
            ->withCount('referrals')
            ->findOrFail($listingId);

        return response()->json($listing);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'required|string|max:255',
            'business_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'service_area' => 'nullable|array',
            'website' => 'nullable|url|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'logo_url' => 'nullable|url|max:255',
        ]);

        $validated['user_id'] = $request->user()->id;

        $listing = PartnerListing::create($validated);

        return response()->json($listing, 201);
    }

    public function update(Request $request, int $listingId): JsonResponse
    {
        $listing = PartnerListing::findOrFail($listingId);

        $validated = $request->validate([
            'category' => 'sometimes|string|max:255',
            'business_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'service_area' => 'nullable|array',
            'website' => 'nullable|url|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'logo_url' => 'nullable|url|max:255',
            'is_active' => 'sometimes|boolean',
        ]);

        $listing->update($validated);

        return response()->json($listing);
    }

    public function destroy(int $listingId): JsonResponse
    {
        PartnerListing::findOrFail($listingId)->delete();

        return response()->json(['message' => 'Listing deleted']);
    }

    public function refer(Request $request, int $listingId): JsonResponse
    {
        $validated = $request->validate([
            'consumer_id' => 'nullable|exists:users,id',
        ]);

        $referral = PartnerReferral::create([
            'listing_id' => $listingId,
            'referred_by' => $request->user()->id,
            'consumer_id' => $validated['consumer_id'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json($referral, 201);
    }

    public function referrals(Request $request): JsonResponse
    {
        $referrals = PartnerReferral::where('referred_by', $request->user()->id)
            ->with(['listing:id,business_name,category', 'consumer:id,first_name,last_name'])
            ->orderByDesc('created_at')
            ->paginate($request->query('per_page', 20));

        return response()->json($referrals);
    }

    public function updateReferral(Request $request, int $referralId): JsonResponse
    {
        $referral = PartnerReferral::findOrFail($referralId);

        $validated = $request->validate([
            'status' => 'required|in:pending,contacted,converted',
            'commission_earned' => 'sometimes|numeric|min:0',
        ]);

        $referral->update($validated);

        return response()->json($referral);
    }

    // Admin: verify listing
    public function verify(int $listingId): JsonResponse
    {
        $listing = PartnerListing::findOrFail($listingId);
        $listing->update(['is_verified' => true]);

        return response()->json(['message' => 'Listing verified']);
    }
}
