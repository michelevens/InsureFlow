<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coverage extends Model
{
    use HasFactory;

    protected $fillable = [
        'coverable_type', 'coverable_id',
        'coverage_type', 'coverage_category',
        'limit_amount', 'per_occurrence_limit', 'aggregate_limit',
        'deductible_amount', 'benefit_amount', 'benefit_period',
        'elimination_period_days', 'coinsurance_pct', 'copay_amount',
        'is_included', 'premium_allocated', 'details_json', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'details_json' => 'array',
            'limit_amount' => 'decimal:2',
            'per_occurrence_limit' => 'decimal:2',
            'aggregate_limit' => 'decimal:2',
            'deductible_amount' => 'decimal:2',
            'benefit_amount' => 'decimal:2',
            'coinsurance_pct' => 'decimal:2',
            'copay_amount' => 'decimal:2',
            'premium_allocated' => 'decimal:2',
            'is_included' => 'boolean',
        ];
    }

    public function coverable()
    {
        return $this->morphTo();
    }

    /**
     * Coverage categories that group coverage types.
     */
    public static function categories(): array
    {
        return ['liability', 'property', 'medical', 'life', 'disability', 'specialty'];
    }

    /**
     * Common coverage types by category.
     */
    public static function typesByCategory(): array
    {
        return [
            'liability' => [
                'bodily_injury_per_person', 'bodily_injury_per_accident', 'property_damage',
                'personal_injury', 'advertising_injury', 'medical_payments',
                'uninsured_motorist', 'underinsured_motorist',
                'general_liability_each_occurrence', 'general_liability_aggregate',
                'products_completed_operations', 'professional_liability',
                'employers_liability', 'personal_umbrella', 'commercial_umbrella',
            ],
            'property' => [
                'comprehensive', 'collision', 'dwelling', 'other_structures',
                'personal_property', 'loss_of_use', 'business_personal_property',
                'building', 'business_income', 'extra_expense', 'inland_marine',
                'equipment_breakdown', 'flood', 'earthquake',
                'rental_reimbursement', 'gap_coverage', 'roadside_assistance',
            ],
            'medical' => [
                'medical_expense', 'hospitalization', 'prescription_drug',
                'preventive_care', 'emergency_services', 'mental_health',
                'maternity', 'dental', 'vision', 'hearing',
                'out_of_pocket_maximum', 'pip', 'med_pay',
            ],
            'life' => [
                'death_benefit', 'accidental_death_benefit', 'cash_value',
                'waiver_of_premium', 'child_rider', 'spouse_rider',
                'accelerated_death_benefit', 'return_of_premium',
                'guaranteed_insurability', 'conversion_privilege',
                'long_term_care_rider',
            ],
            'disability' => [
                'short_term_disability_benefit', 'long_term_disability_benefit',
                'residual_disability', 'cost_of_living_adjustment',
                'future_purchase_option', 'own_occupation',
                'daily_ltc_benefit', 'monthly_ltc_benefit',
                'home_care', 'assisted_living', 'nursing_home', 'respite_care',
            ],
            'specialty' => [
                'cyber_first_party', 'cyber_third_party', 'ransomware',
                'social_engineering', 'directors_officers_side_a',
                'directors_officers_side_b', 'directors_officers_side_c',
                'epli', 'fiduciary', 'crime_employee_dishonesty',
                'surety_bond', 'event_cancellation', 'trip_cancellation',
                'pet_accident', 'pet_illness', 'identity_theft',
                'water_backup', 'scheduled_personal_property',
            ],
        ];
    }
}
