<?php

namespace App\Services;

use App\Models\InsuranceProfile;
use App\Models\LeadEngagementEvent;
use App\Models\LeadScore;
use Illuminate\Support\Carbon;

class LeadScoringService
{
    /**
     * Calculate and persist a lead score for an insurance profile.
     */
    public function score(InsuranceProfile $profile): LeadScore
    {
        $factors = [];
        $total = 0;

        // 1. Profile completeness (0–20 pts)
        $completeness = $this->profileCompleteness($profile);
        $factors['profile_completeness'] = ['score' => $completeness, 'max' => 20];
        $total += $completeness;

        // 2. Coverage amount signal (0–15 pts)
        $coverageScore = $this->coverageAmountScore($profile);
        $factors['coverage_amount'] = ['score' => $coverageScore, 'max' => 15];
        $total += $coverageScore;

        // 3. Engagement recency (0–20 pts)
        $recency = $this->engagementRecency($profile);
        $factors['engagement_recency'] = ['score' => $recency, 'max' => 20];
        $total += $recency;

        // 4. Engagement frequency (0–15 pts)
        $frequency = $this->engagementFrequency($profile);
        $factors['engagement_frequency'] = ['score' => $frequency, 'max' => 15];
        $total += $frequency;

        // 5. Pipeline stage (0–15 pts)
        $stageScore = $this->stageScore($profile);
        $factors['pipeline_stage'] = ['score' => $stageScore, 'max' => 15];
        $total += $stageScore;

        // 6. Source quality (0–15 pts)
        $source = $this->sourceQuality($profile);
        $factors['source_quality'] = ['score' => $source, 'max' => 15];
        $total += $source;

        $total = min(100, max(0, $total));

        return LeadScore::updateOrCreate(
            ['insurance_profile_id' => $profile->id],
            [
                'score' => $total,
                'factors' => $factors,
                'model_version' => 'rule-v1',
            ]
        );
    }

    private function profileCompleteness(InsuranceProfile $profile): int
    {
        $fields = ['insurance_type', 'coverage_amount', 'property_type', 'address_state'];
        $filled = 0;
        foreach ($fields as $field) {
            if (!empty($profile->$field)) $filled++;
        }
        // Additional data in details JSON
        $details = $profile->details ?? [];
        if (!empty($details)) $filled++;

        return (int) round(($filled / 5) * 20);
    }

    private function coverageAmountScore(InsuranceProfile $profile): int
    {
        $amount = $profile->coverage_amount ?? 0;
        if ($amount >= 1000000) return 15;
        if ($amount >= 500000) return 12;
        if ($amount >= 250000) return 10;
        if ($amount >= 100000) return 7;
        if ($amount > 0) return 4;
        return 0;
    }

    private function engagementRecency(InsuranceProfile $profile): int
    {
        $lastEvent = LeadEngagementEvent::where('insurance_profile_id', $profile->id)
            ->orderByDesc('created_at')
            ->first();

        if (!$lastEvent) return 0;

        $daysAgo = Carbon::now()->diffInDays($lastEvent->created_at);
        if ($daysAgo <= 1) return 20;
        if ($daysAgo <= 3) return 16;
        if ($daysAgo <= 7) return 12;
        if ($daysAgo <= 14) return 8;
        if ($daysAgo <= 30) return 4;
        return 0;
    }

    private function engagementFrequency(InsuranceProfile $profile): int
    {
        $count = LeadEngagementEvent::where('insurance_profile_id', $profile->id)
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->count();

        if ($count >= 20) return 15;
        if ($count >= 10) return 12;
        if ($count >= 5) return 8;
        if ($count >= 2) return 4;
        return 0;
    }

    private function stageScore(InsuranceProfile $profile): int
    {
        return match ($profile->stage) {
            'application' => 15,
            'quoting' => 12,
            'qualified' => 10,
            'contacted' => 7,
            'new' => 3,
            default => 0,
        };
    }

    private function sourceQuality(InsuranceProfile $profile): int
    {
        $source = $profile->source ?? '';
        return match ($source) {
            'referral' => 15,
            'marketplace' => 12,
            'calculator' => 10,
            'direct' => 8,
            'import' => 5,
            default => 3,
        };
    }
}
