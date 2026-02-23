<?php

namespace App\Http\Controllers;

use App\Console\Commands\StateLicenseSources;
use App\Models\AgentProfile;
use Illuminate\Http\Request;

class ProfileClaimController extends Controller
{
    /**
     * Search for unclaimed profiles by NPN or name.
     * Used during onboarding so agents can find & claim their existing profile.
     */
    public function search(Request $request)
    {
        $request->validate([
            'npn' => 'nullable|string|max:20',
            'name' => 'nullable|string|max:255',
            'license_number' => 'nullable|string|max:50',
            'state' => 'nullable|string|max:2',
        ]);

        $query = AgentProfile::unclaimed();

        $npn = $request->input('npn');
        $name = $request->input('name');
        $licenseNumber = $request->input('license_number');
        $state = $request->input('state');

        // Must have at least one search criterion
        if (!$npn && !$name && !$licenseNumber) {
            return response()->json(['profiles' => [], 'message' => 'Provide NPN, name, or license number to search']);
        }

        // NPN is the most precise match
        if ($npn) {
            $query->where('npn', $npn);
        }

        if ($licenseNumber) {
            $query->where('license_number', $licenseNumber);
        }

        if ($name) {
            $query->where('full_name', 'ilike', "%{$name}%");
        }

        if ($state) {
            $query->where('state', $state);
        }

        $profiles = $query->limit(20)->get([
            'id', 'full_name', 'npn', 'license_number', 'license_type',
            'license_status', 'license_states', 'city', 'state', 'county',
            'license_lookup_url', 'npn_verified', 'source', 'lines_of_authority',
            'license_issue_date', 'license_expiration_date',
        ]);

        return response()->json(['profiles' => $profiles]);
    }

    /**
     * Claim an unclaimed profile — links it to the authenticated user.
     */
    public function claim(Request $request, AgentProfile $profile)
    {
        $user = $request->user();

        // Must be an agent or agency_owner
        if (!in_array($user->role, ['agent', 'agency_owner'])) {
            return response()->json(['message' => 'Only agents and agency owners can claim profiles'], 403);
        }

        // Profile must be unclaimed
        if ($profile->is_claimed) {
            return response()->json(['message' => 'This profile has already been claimed'], 409);
        }

        // Check user doesn't already have a claimed profile
        $existingProfile = AgentProfile::where('user_id', $user->id)->where('is_claimed', true)->first();
        if ($existingProfile) {
            // Merge data from unclaimed profile into existing profile
            $this->mergeProfiles($existingProfile, $profile);
            // Delete the unclaimed shell
            $profile->delete();

            return response()->json([
                'message' => 'Profile data merged into your existing profile',
                'profile' => $existingProfile->fresh(),
            ]);
        }

        // Claim the profile
        $profile->update([
            'user_id' => $user->id,
            'is_claimed' => true,
            'claimed_by' => $user->id,
            'claimed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Profile claimed successfully',
            'profile' => $profile->fresh(),
        ]);
    }

    /**
     * Get unclaimed profile stats for admin dashboard.
     */
    public function stats()
    {
        $total = AgentProfile::unclaimed()->count();
        $totalClaimed = AgentProfile::where('is_claimed', true)->count();

        $bySource = AgentProfile::unclaimed()
            ->selectRaw("source, count(*) as count")
            ->groupBy('source')
            ->orderByDesc('count')
            ->pluck('count', 'source');

        $byState = AgentProfile::unclaimed()
            ->selectRaw("state, count(*) as count")
            ->groupBy('state')
            ->orderByDesc('count')
            ->pluck('count', 'state');

        return response()->json([
            'total_unclaimed' => $total,
            'total_claimed' => $totalClaimed,
            'by_source' => $bySource,
            'by_state' => $byState,
        ]);
    }

    /**
     * List all supported state DOI data sources for admin reference.
     */
    public function sources()
    {
        $states = StateLicenseSources::all();

        // Enrich with import counts from DB
        $importCounts = AgentProfile::where('is_claimed', false)
            ->selectRaw("source, state, count(*) as count")
            ->groupBy('source', 'state')
            ->get()
            ->groupBy('state')
            ->map(fn($group) => $group->sum('count'));

        $result = [];
        foreach ($states as $abbr => $config) {
            $result[] = [
                'state' => $abbr,
                'name' => $config['name'],
                'source_key' => $config['source_key'],
                'bulk_url' => $config['bulk_url'],
                'lookup_url' => $config['lookup_url'],
                'format' => $config['format'],
                'notes' => $config['notes'],
                'imported_count' => $importCounts[$abbr] ?? 0,
            ];
        }

        return response()->json(['sources' => $result]);
    }

    /**
     * Merge data from an unclaimed profile into an existing claimed profile.
     * Only fills in fields that are empty on the existing profile.
     */
    private function mergeProfiles(AgentProfile $existing, AgentProfile $unclaimed): void
    {
        $fieldsToMerge = [
            'npn', 'license_number', 'license_type', 'license_status',
            'license_issue_date', 'license_expiration_date', 'license_lookup_url',
            'county', 'full_name', 'lines_of_authority',
        ];

        $updates = [];
        foreach ($fieldsToMerge as $field) {
            if (empty($existing->{$field}) && !empty($unclaimed->{$field})) {
                $updates[$field] = $unclaimed->{$field};
            }
        }

        // If unclaimed has verified NPN and existing doesn't, adopt it
        if ($unclaimed->npn_verified === 'verified' && $existing->npn_verified !== 'verified') {
            $updates['npn_verified'] = 'verified';
            $updates['npn_verified_at'] = $unclaimed->npn_verified_at ?? now();
            $updates['npn_verified_by'] = 'State DOI Import (' . ($unclaimed->source ?? 'unknown') . ')';
        }

        // Merge license states
        $existingStates = $existing->license_states ?? [];
        $unclaimedStates = $unclaimed->license_states ?? [];
        $mergedStates = array_unique(array_merge($existingStates, $unclaimedStates));
        if (count($mergedStates) > count($existingStates)) {
            $updates['license_states'] = $mergedStates;
        }

        if (!empty($updates)) {
            $existing->update($updates);
        }
    }
}
