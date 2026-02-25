<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScenarioQuote extends Model
{
    protected $fillable = [
        'scenario_id', 'carrier_id', 'carrier_product_id',
        'carrier_name', 'product_name',
        'premium_monthly', 'premium_annual', 'premium_semi_annual', 'premium_quarterly',
        'status', 'quoted_at', 'expires_at', 'decline_reason',
        'am_best_rating', 'financial_strength_score',
        'coverage_details', 'endorsements', 'exclusions', 'discounts_applied',
        'agent_notes', 'is_recommended',
    ];

    protected function casts(): array
    {
        return [
            'premium_monthly' => 'decimal:2',
            'premium_annual' => 'decimal:2',
            'premium_semi_annual' => 'decimal:2',
            'premium_quarterly' => 'decimal:2',
            'financial_strength_score' => 'decimal:2',
            'coverage_details' => 'array',
            'endorsements' => 'array',
            'exclusions' => 'array',
            'discounts_applied' => 'array',
            'is_recommended' => 'boolean',
            'quoted_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(LeadScenario::class, 'scenario_id');
    }

    public function carrier(): BelongsTo
    {
        return $this->belongsTo(Carrier::class);
    }

    public function carrierProduct(): BelongsTo
    {
        return $this->belongsTo(CarrierProduct::class);
    }
}
