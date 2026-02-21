<?php

namespace App\Http\Controllers;

use App\Models\InsuranceProfile;
use App\Models\LeadEngagementEvent;
use App\Models\LeadScore;
use App\Services\LeadScoringService;
use Illuminate\Http\Request;

class LeadScoringController extends Controller
{
    public function __construct(private LeadScoringService $scoringService) {}

    /**
     * Get score for a specific insurance profile.
     */
    public function score(Request $request, int $profileId)
    {
        $profile = InsuranceProfile::findOrFail($profileId);

        // Recalculate score
        $score = $this->scoringService->score($profile);

        return response()->json($score);
    }

    /**
     * Track an engagement event.
     */
    public function trackEngagement(Request $request)
    {
        $data = $request->validate([
            'insurance_profile_id' => 'required|integer|exists:insurance_profiles,id',
            'event_type' => 'required|string|max:50',
            'metadata' => 'nullable|array',
        ]);

        $event = LeadEngagementEvent::create([
            'insurance_profile_id' => $data['insurance_profile_id'],
            'event_type' => $data['event_type'],
            'metadata' => $data['metadata'] ?? null,
            'created_at' => now(),
        ]);

        return response()->json($event, 201);
    }

    /**
     * Get top-scored leads for the pipeline view.
     */
    public function topLeads(Request $request)
    {
        $limit = min((int) $request->query('limit', 20), 100);

        $scores = LeadScore::with('insuranceProfile:id,insurance_type,stage,consumer_id,coverage_amount,created_at')
            ->orderByDesc('score')
            ->limit($limit)
            ->get();

        return response()->json($scores);
    }

    /**
     * Bulk rescore all profiles (admin/agency_owner).
     */
    public function rescoreAll(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'superadmin', 'agency_owner'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $profiles = InsuranceProfile::all();
        $count = 0;
        foreach ($profiles as $profile) {
            $this->scoringService->score($profile);
            $count++;
        }

        return response()->json(['message' => "Rescored {$count} profiles"]);
    }
}
