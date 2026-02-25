<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeadScenario extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id', 'agent_id', 'scenario_name', 'product_type', 'priority', 'status',
        'selected_carrier_id', 'risk_factors',
        'target_premium_monthly', 'best_quoted_premium', 'total_applications',
        'total_quotes_received', 'effective_date_desired', 'current_policy_expiration',
        'current_carrier', 'current_premium_monthly', 'current_policy_number',
        'metadata_json', 'notes',
        'consumer_visible', 'sent_to_consumer_at', 'consumer_viewed_at',
        'consumer_token', 'consumer_status',
    ];

    protected function casts(): array
    {
        return [
            'risk_factors' => 'array',
            'metadata_json' => 'array',
            'target_premium_monthly' => 'decimal:2',
            'best_quoted_premium' => 'decimal:2',
            'current_premium_monthly' => 'decimal:2',
            'effective_date_desired' => 'date',
            'current_policy_expiration' => 'date',
            'consumer_visible' => 'boolean',
            'sent_to_consumer_at' => 'datetime',
            'consumer_viewed_at' => 'datetime',
        ];
    }

    // ── Relationships ─────────────────────────────────

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function selectedCarrier()
    {
        return $this->belongsTo(Carrier::class, 'selected_carrier_id');
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    /**
     * Insured objects for this scenario (persons, vehicles, properties, businesses).
     */
    public function insuredObjects()
    {
        return $this->morphMany(InsuredObject::class, 'insurable')->orderBy('sort_order');
    }

    /**
     * Coverage/benefit requirements for this scenario.
     */
    public function coverages()
    {
        return $this->morphMany(Coverage::class, 'coverable')->orderBy('sort_order');
    }

    /**
     * Carrier quotes for comparison within this scenario.
     */
    public function quotes()
    {
        return $this->hasMany(ScenarioQuote::class, 'scenario_id')->orderBy('premium_monthly');
    }

    /**
     * The recommended/selected carrier quote.
     */
    public function selectedQuote()
    {
        return $this->hasOne(ScenarioQuote::class, 'scenario_id')->where('status', 'selected');
    }

    /**
     * The agent-recommended carrier quote.
     */
    public function recommendedQuote()
    {
        return $this->hasOne(ScenarioQuote::class, 'scenario_id')->where('is_recommended', true);
    }

    // ── Product Type Registry ─────────────────────────

    /**
     * All supported product types grouped by line of business.
     */
    public static function productTypes(): array
    {
        return [
            'Personal Lines' => [
                'auto' => 'Auto Insurance',
                'homeowners' => 'Homeowners Insurance',
                'renters' => 'Renters Insurance',
                'condo' => 'Condo Insurance (HO-6)',
                'flood' => 'Flood Insurance',
                'umbrella_personal' => 'Personal Umbrella',
                'motorcycle' => 'Motorcycle Insurance',
                'boat_watercraft' => 'Boat & Watercraft',
                'rv_motorhome' => 'RV / Motorhome',
                'jewelry_valuables' => 'Jewelry & Valuables',
            ],
            'Life Insurance' => [
                'life_term' => 'Term Life',
                'life_whole' => 'Whole Life',
                'life_universal' => 'Universal Life (UL / IUL / VUL / GUL)',
                'life_final_expense' => 'Final Expense / Burial',
                'annuity' => 'Annuity',
            ],
            'Health Insurance' => [
                'health_individual' => 'Individual Health',
                'health_group' => 'Group Health',
                'dental' => 'Dental',
                'vision' => 'Vision',
                'medicare_supplement' => 'Medicare Supplement (Medigap)',
                'medicare_advantage' => 'Medicare Advantage (Part C)',
                'prescription_drug' => 'Medicare Part D',
            ],
            'Disability & Long-Term Care' => [
                'disability_short_term' => 'Short-Term Disability (STD)',
                'disability_long_term' => 'Long-Term Disability (LTD)',
                'long_term_care' => 'Long-Term Care (LTC)',
            ],
            'Commercial Lines' => [
                'commercial_gl' => 'Commercial General Liability',
                'commercial_property' => 'Commercial Property',
                'bop' => 'Business Owners Policy (BOP)',
                'workers_comp' => 'Workers Compensation',
                'commercial_auto' => 'Commercial Auto',
                'professional_liability' => 'Professional Liability (E&O)',
                'cyber_liability' => 'Cyber Liability',
                'directors_officers' => 'Directors & Officers (D&O)',
                'epli' => 'Employment Practices Liability',
                'surety_bond' => 'Surety Bonds',
                'umbrella_commercial' => 'Commercial Umbrella / Excess',
                'inland_marine' => 'Inland Marine / Equipment',
            ],
            'Specialty' => [
                'event_liability' => 'Event / Special Event',
                'travel' => 'Travel Insurance',
                'pet' => 'Pet Insurance',
            ],
        ];
    }

    /**
     * Get the primary insured-object type for a product type.
     */
    public static function primaryObjectType(string $productType): string
    {
        $personTypes = [
            'life_term', 'life_whole', 'life_universal', 'life_final_expense',
            'health_individual', 'health_group', 'dental', 'vision',
            'disability_short_term', 'disability_long_term', 'long_term_care',
            'medicare_supplement', 'medicare_advantage', 'prescription_drug',
            'annuity', 'travel', 'pet',
        ];

        $vehicleTypes = ['auto', 'motorcycle', 'boat_watercraft', 'rv_motorhome', 'commercial_auto'];
        $propertyTypes = ['homeowners', 'renters', 'condo', 'flood', 'jewelry_valuables'];
        $businessTypes = [
            'commercial_gl', 'commercial_property', 'bop', 'workers_comp',
            'professional_liability', 'cyber_liability', 'directors_officers',
            'epli', 'surety_bond', 'umbrella_commercial', 'inland_marine',
        ];

        if (in_array($productType, $personTypes)) return 'person';
        if (in_array($productType, $vehicleTypes)) return 'vehicle';
        if (in_array($productType, $propertyTypes)) return 'property';
        if (in_array($productType, $businessTypes)) return 'business';

        return 'other';
    }

    /**
     * Suggested coverage types for a given product type.
     */
    public static function suggestedCoverages(string $productType): array
    {
        $map = [
            'auto' => [
                ['coverage_type' => 'bodily_injury_per_person', 'coverage_category' => 'liability', 'limit_amount' => 100000],
                ['coverage_type' => 'bodily_injury_per_accident', 'coverage_category' => 'liability', 'limit_amount' => 300000],
                ['coverage_type' => 'property_damage', 'coverage_category' => 'liability', 'limit_amount' => 100000],
                ['coverage_type' => 'comprehensive', 'coverage_category' => 'property', 'deductible_amount' => 500],
                ['coverage_type' => 'collision', 'coverage_category' => 'property', 'deductible_amount' => 500],
                ['coverage_type' => 'uninsured_motorist', 'coverage_category' => 'liability', 'limit_amount' => 100000],
                ['coverage_type' => 'med_pay', 'coverage_category' => 'medical', 'limit_amount' => 5000],
            ],
            'homeowners' => [
                ['coverage_type' => 'dwelling', 'coverage_category' => 'property'],
                ['coverage_type' => 'other_structures', 'coverage_category' => 'property'],
                ['coverage_type' => 'personal_property', 'coverage_category' => 'property'],
                ['coverage_type' => 'loss_of_use', 'coverage_category' => 'property'],
                ['coverage_type' => 'personal_injury', 'coverage_category' => 'liability', 'limit_amount' => 300000],
                ['coverage_type' => 'medical_expense', 'coverage_category' => 'medical', 'limit_amount' => 5000],
            ],
            'life_term' => [
                ['coverage_type' => 'death_benefit', 'coverage_category' => 'life'],
                ['coverage_type' => 'waiver_of_premium', 'coverage_category' => 'life', 'is_included' => false],
                ['coverage_type' => 'accidental_death_benefit', 'coverage_category' => 'life', 'is_included' => false],
                ['coverage_type' => 'accelerated_death_benefit', 'coverage_category' => 'life', 'is_included' => true],
            ],
            'life_whole' => [
                ['coverage_type' => 'death_benefit', 'coverage_category' => 'life'],
                ['coverage_type' => 'cash_value', 'coverage_category' => 'life'],
                ['coverage_type' => 'waiver_of_premium', 'coverage_category' => 'life', 'is_included' => false],
                ['coverage_type' => 'guaranteed_insurability', 'coverage_category' => 'life', 'is_included' => false],
            ],
            'disability_long_term' => [
                ['coverage_type' => 'long_term_disability_benefit', 'coverage_category' => 'disability'],
                ['coverage_type' => 'residual_disability', 'coverage_category' => 'disability', 'is_included' => false],
                ['coverage_type' => 'cost_of_living_adjustment', 'coverage_category' => 'disability', 'is_included' => false],
                ['coverage_type' => 'future_purchase_option', 'coverage_category' => 'disability', 'is_included' => false],
            ],
            'long_term_care' => [
                ['coverage_type' => 'daily_ltc_benefit', 'coverage_category' => 'disability'],
                ['coverage_type' => 'home_care', 'coverage_category' => 'disability', 'is_included' => true],
                ['coverage_type' => 'assisted_living', 'coverage_category' => 'disability', 'is_included' => true],
                ['coverage_type' => 'nursing_home', 'coverage_category' => 'disability', 'is_included' => true],
                ['coverage_type' => 'respite_care', 'coverage_category' => 'disability', 'is_included' => false],
            ],
            'commercial_gl' => [
                ['coverage_type' => 'general_liability_each_occurrence', 'coverage_category' => 'liability', 'limit_amount' => 1000000],
                ['coverage_type' => 'general_liability_aggregate', 'coverage_category' => 'liability', 'limit_amount' => 2000000],
                ['coverage_type' => 'products_completed_operations', 'coverage_category' => 'liability', 'limit_amount' => 2000000],
                ['coverage_type' => 'personal_injury', 'coverage_category' => 'liability', 'limit_amount' => 1000000],
                ['coverage_type' => 'medical_expense', 'coverage_category' => 'medical', 'limit_amount' => 10000],
            ],
        ];

        return $map[$productType] ?? [];
    }
}
