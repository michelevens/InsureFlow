<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoutingRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'agency_id', 'name', 'priority', 'is_active',
        'insurance_type', 'zip_codes', 'states', 'coverage_level', 'source',
        'assignment_type', 'target_agent_id', 'agent_pool', 'last_assigned_index',
        'daily_cap', 'daily_count', 'daily_count_date',
    ];

    protected function casts(): array
    {
        return [
            'zip_codes' => 'array',
            'states' => 'array',
            'agent_pool' => 'array',
            'is_active' => 'boolean',
            'daily_count_date' => 'date',
        ];
    }

    public function agency()
    {
        return $this->belongsTo(Agency::class);
    }

    public function targetAgent()
    {
        return $this->belongsTo(User::class, 'target_agent_id');
    }

    public function matches(InsuranceProfile $profile): bool
    {
        if ($this->insurance_type && $this->insurance_type !== $profile->insurance_type) {
            return false;
        }

        if ($this->coverage_level && $this->coverage_level !== $profile->coverage_level) {
            return false;
        }

        if ($this->source && $this->source !== $profile->source) {
            return false;
        }

        if ($this->zip_codes && $profile->zip_code) {
            $matched = false;
            foreach ($this->zip_codes as $prefix) {
                if (str_starts_with($profile->zip_code, $prefix)) {
                    $matched = true;
                    break;
                }
            }
            if (!$matched) return false;
        }

        if ($this->states && $profile->zip_code) {
            // State matching requires a zip-to-state lookup in production
            // For now, states filter is stored but not enforced at zip level
        }

        // Check daily cap
        if ($this->daily_cap) {
            $this->resetDailyCountIfNeeded();
            if ($this->daily_count >= $this->daily_cap) {
                return false;
            }
        }

        return true;
    }

    public function assignAgent(): ?int
    {
        return match ($this->assignment_type) {
            'agent' => $this->target_agent_id,
            'round_robin' => $this->roundRobinAssign(),
            'capacity' => $this->capacityAssign(),
            default => null,
        };
    }

    private function roundRobinAssign(): ?int
    {
        $pool = $this->agent_pool ?? [];
        if (empty($pool)) return null;

        $index = $this->last_assigned_index % count($pool);
        $agentId = $pool[$index];

        $this->update([
            'last_assigned_index' => $index + 1,
            'daily_count' => $this->daily_count + 1,
            'daily_count_date' => today(),
        ]);

        return $agentId;
    }

    private function capacityAssign(): ?int
    {
        $pool = $this->agent_pool ?? [];
        if (empty($pool)) return $this->target_agent_id;

        // Assign to agent with fewest active leads this month
        $agentCounts = Lead::whereIn('agent_id', $pool)
            ->where('status', '!=', 'lost')
            ->where('created_at', '>=', now()->startOfMonth())
            ->selectRaw('agent_id, count(*) as lead_count')
            ->groupBy('agent_id')
            ->pluck('lead_count', 'agent_id');

        $bestAgent = null;
        $lowestCount = PHP_INT_MAX;

        foreach ($pool as $agentId) {
            $count = $agentCounts[$agentId] ?? 0;
            if ($count < $lowestCount) {
                $lowestCount = $count;
                $bestAgent = $agentId;
            }
        }

        if ($bestAgent) {
            $this->update([
                'daily_count' => $this->daily_count + 1,
                'daily_count_date' => today(),
            ]);
        }

        return $bestAgent;
    }

    private function resetDailyCountIfNeeded(): void
    {
        if (!$this->daily_count_date || !$this->daily_count_date->isToday()) {
            $this->update(['daily_count' => 0, 'daily_count_date' => today()]);
        }
    }
}
