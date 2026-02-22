<?php

namespace Database\Seeders;

use App\Models\RateFactor;
use App\Models\RateFee;
use App\Models\RateModalFactor;
use App\Models\RateRider;
use App\Models\RateTable;
use App\Models\RateTableEntry;
use Illuminate\Database\Seeder;

class RateTableSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedDisabilityLTD();
        $this->seedLifeTerm();
        $this->seedLongTermCare();
    }

    /**
     * Disability Insurance (LTD) — Gold standard reference.
     * Based on the canonical DI rating formula from di_rating_architecture.md
     */
    private function seedDisabilityLTD(): void
    {
        $table = RateTable::updateOrCreate(
            ['product_type' => 'disability_ltd', 'version' => '2026-Q1'],
            [
                'name' => 'Individual Disability LTD - 2026 Q1',
                'effective_date' => '2026-01-01',
                'expiration_date' => '2026-12-31',
                'is_active' => true,
                'metadata' => ['carrier' => 'Demo Mutual', 'benefit_unit' => 100],
            ]
        );

        // Clear existing entries for idempotency
        $table->entries()->delete();
        $table->factors()->delete();
        $table->riders()->delete();
        $table->fees()->delete();
        $table->modalFactors()->delete();

        // ─── Base Rate Entries ─────────────────────────────────
        // Rate per $100 monthly benefit, by age|sex|state|occClass|uwClass
        // Using wildcard (*) for state and uwClass for demo purposes
        $baseRates = [];
        $ages = range(25, 60, 5);
        $sexes = ['M', 'F'];
        $occClasses = ['1', '2', '3', '4A', '5A', '6A'];

        // Rate factors: female rates ~10-20% higher, rates increase with age, decrease with occ class
        $ageMultiplier = fn (int $age) => 0.5 + (($age - 25) * 0.035);
        $sexMultiplier = fn (string $sex) => $sex === 'F' ? 1.15 : 1.0;
        $occMultiplier = fn (string $occ) => match ($occ) {
            '6A' => 0.70, '5A' => 0.80, '4A' => 0.90, '3' => 1.00, '2' => 1.20, '1' => 1.50, default => 1.00,
        };

        foreach ($ages as $age) {
            foreach ($sexes as $sex) {
                foreach ($occClasses as $occ) {
                    $rate = round(1.80 * $ageMultiplier($age) * $sexMultiplier($sex) * $occMultiplier($occ), 6);
                    $baseRates[] = [
                        'rate_table_id' => $table->id,
                        'rate_key' => "{$age}|{$sex}|*|{$occ}|*",
                        'rate_value' => $rate,
                        'dimensions' => json_encode(['age' => $age, 'sex' => $sex, 'state' => '*', 'occ_class' => $occ, 'uw_class' => '*']),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        RateTableEntry::insert($baseRates);

        // ─── Factors ───────────────────────────────────────────
        $factors = [
            // Elimination Period
            ['factor_code' => 'elimination_period', 'factor_label' => 'Elimination Period', 'option_value' => '30',  'apply_mode' => 'multiply', 'factor_value' => 1.25, 'sort_order' => 1],
            ['factor_code' => 'elimination_period', 'factor_label' => 'Elimination Period', 'option_value' => '60',  'apply_mode' => 'multiply', 'factor_value' => 1.10, 'sort_order' => 2],
            ['factor_code' => 'elimination_period', 'factor_label' => 'Elimination Period', 'option_value' => '90',  'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 3],
            ['factor_code' => 'elimination_period', 'factor_label' => 'Elimination Period', 'option_value' => '180', 'apply_mode' => 'multiply', 'factor_value' => 0.85, 'sort_order' => 4],
            ['factor_code' => 'elimination_period', 'factor_label' => 'Elimination Period', 'option_value' => '365', 'apply_mode' => 'multiply', 'factor_value' => 0.70, 'sort_order' => 5],

            // Benefit Period
            ['factor_code' => 'benefit_period', 'factor_label' => 'Benefit Period', 'option_value' => '2yr',    'apply_mode' => 'multiply', 'factor_value' => 0.60, 'sort_order' => 1],
            ['factor_code' => 'benefit_period', 'factor_label' => 'Benefit Period', 'option_value' => '5yr',    'apply_mode' => 'multiply', 'factor_value' => 0.80, 'sort_order' => 2],
            ['factor_code' => 'benefit_period', 'factor_label' => 'Benefit Period', 'option_value' => 'to65',   'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 3],
            ['factor_code' => 'benefit_period', 'factor_label' => 'Benefit Period', 'option_value' => 'lifetime','apply_mode' => 'multiply', 'factor_value' => 1.40, 'sort_order' => 4],

            // Definition of Disability
            ['factor_code' => 'definition_of_disability', 'factor_label' => 'Definition of Disability', 'option_value' => 'own_occupation',       'apply_mode' => 'multiply', 'factor_value' => 1.20, 'sort_order' => 1],
            ['factor_code' => 'definition_of_disability', 'factor_label' => 'Definition of Disability', 'option_value' => 'own_occ_2yr_then_any', 'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 2],
            ['factor_code' => 'definition_of_disability', 'factor_label' => 'Definition of Disability', 'option_value' => 'any_occupation',       'apply_mode' => 'multiply', 'factor_value' => 0.80, 'sort_order' => 3],

            // Smoker Status
            ['factor_code' => 'smoker_status', 'factor_label' => 'Smoker Status', 'option_value' => 'no',  'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'smoker_status', 'factor_label' => 'Smoker Status', 'option_value' => 'yes', 'apply_mode' => 'multiply', 'factor_value' => 1.50, 'sort_order' => 2],

            // BMI/Build
            ['factor_code' => 'bmi_build', 'factor_label' => 'BMI/Build', 'option_value' => 'normal',     'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'bmi_build', 'factor_label' => 'BMI/Build', 'option_value' => 'overweight',  'apply_mode' => 'multiply', 'factor_value' => 1.10, 'sort_order' => 2],
            ['factor_code' => 'bmi_build', 'factor_label' => 'BMI/Build', 'option_value' => 'obese_1',     'apply_mode' => 'multiply', 'factor_value' => 1.30, 'sort_order' => 3],
            ['factor_code' => 'bmi_build', 'factor_label' => 'BMI/Build', 'option_value' => 'obese_2',     'apply_mode' => 'multiply', 'factor_value' => 1.60, 'sort_order' => 4],

            // Health Class
            ['factor_code' => 'health_class', 'factor_label' => 'Health Class', 'option_value' => 'preferred', 'apply_mode' => 'multiply', 'factor_value' => 0.85, 'sort_order' => 1],
            ['factor_code' => 'health_class', 'factor_label' => 'Health Class', 'option_value' => 'standard',  'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 2],
            ['factor_code' => 'health_class', 'factor_label' => 'Health Class', 'option_value' => 'substandard','apply_mode' => 'multiply', 'factor_value' => 1.50, 'sort_order' => 3],
        ];

        foreach ($factors as $f) {
            RateFactor::create(array_merge($f, ['rate_table_id' => $table->id]));
        }

        // ─── Riders ────────────────────────────────────────────
        $riders = [
            ['rider_code' => 'cola',        'rider_label' => 'COLA (Cost of Living)',    'apply_mode' => 'add',      'rider_value' => 0.35, 'is_default' => false, 'sort_order' => 1],
            ['rider_code' => 'fio',         'rider_label' => 'Future Increase Option',   'apply_mode' => 'add',      'rider_value' => 0.20, 'is_default' => false, 'sort_order' => 2],
            ['rider_code' => 'residual',    'rider_label' => 'Residual / Partial',       'apply_mode' => 'multiply', 'rider_value' => 1.15, 'is_default' => false, 'sort_order' => 3],
            ['rider_code' => 'catastrophic','rider_label' => 'Catastrophic Disability',  'apply_mode' => 'add',      'rider_value' => 0.12, 'is_default' => false, 'sort_order' => 4],
            ['rider_code' => 'retirement',  'rider_label' => 'Retirement Protection',    'apply_mode' => 'add',      'rider_value' => 0.25, 'is_default' => false, 'sort_order' => 5],
            ['rider_code' => 'student_loan','rider_label' => 'Student Loan',             'apply_mode' => 'add',      'rider_value' => 0.10, 'is_default' => false, 'sort_order' => 6],
            ['rider_code' => 'mn_buyout',   'rider_label' => 'Mental/Nervous Buy-out',   'apply_mode' => 'add',      'rider_value' => 0.08, 'is_default' => false, 'sort_order' => 7],
        ];

        foreach ($riders as $r) {
            RateRider::create(array_merge($r, ['rate_table_id' => $table->id]));
        }

        // ─── Fees & Credits ────────────────────────────────────
        $fees = [
            ['fee_code' => 'policy_fee',      'fee_label' => 'Policy Fee',           'fee_type' => 'fee',    'apply_mode' => 'add',     'fee_value' => 75.00,  'sort_order' => 1],
            ['fee_code' => 'admin_fee',        'fee_label' => 'Admin Fee',            'fee_type' => 'fee',    'apply_mode' => 'add',     'fee_value' => 25.00,  'sort_order' => 2],
            ['fee_code' => 'multi_policy',     'fee_label' => 'Multi-Policy Discount','fee_type' => 'credit', 'apply_mode' => 'percent', 'fee_value' => 5.00,   'sort_order' => 3],
            ['fee_code' => 'annual_pay',       'fee_label' => 'Annual Pay Discount',  'fee_type' => 'credit', 'apply_mode' => 'percent', 'fee_value' => 3.00,   'sort_order' => 4],
        ];

        foreach ($fees as $f) {
            RateFee::create(array_merge($f, ['rate_table_id' => $table->id]));
        }

        // ─── Modal Factors ─────────────────────────────────────
        $modals = [
            ['mode' => 'annual',     'factor' => 1.000000, 'flat_fee' => 0.00],
            ['mode' => 'semiannual', 'factor' => 0.520000, 'flat_fee' => 2.00],
            ['mode' => 'quarterly',  'factor' => 0.265000, 'flat_fee' => 3.00],
            ['mode' => 'monthly',    'factor' => 0.087500, 'flat_fee' => 5.00],
        ];

        foreach ($modals as $m) {
            RateModalFactor::create(array_merge($m, ['rate_table_id' => $table->id]));
        }
    }

    /**
     * Term Life Insurance — basic rate table for demo.
     */
    private function seedLifeTerm(): void
    {
        $table = RateTable::updateOrCreate(
            ['product_type' => 'life_term', 'version' => '2026-Q1'],
            [
                'name' => 'Term Life Insurance - 2026 Q1',
                'effective_date' => '2026-01-01',
                'expiration_date' => '2026-12-31',
                'is_active' => true,
                'metadata' => ['carrier' => 'Demo Life Co', 'face_unit' => 1000],
            ]
        );

        $table->entries()->delete();
        $table->factors()->delete();
        $table->riders()->delete();
        $table->fees()->delete();
        $table->modalFactors()->delete();

        // Base rates per $1000 face amount by age|sex|tobacco|uwClass
        $entries = [];
        foreach (range(25, 70, 5) as $age) {
            foreach (['M', 'F'] as $sex) {
                foreach (['NT', 'T'] as $tobacco) {
                    $baseRate = 0.08 + (($age - 25) * 0.006);
                    if ($sex === 'M') $baseRate *= 1.10;
                    if ($tobacco === 'T') $baseRate *= 2.00;

                    $entries[] = [
                        'rate_table_id' => $table->id,
                        'rate_key' => "{$age}|{$sex}|{$tobacco}|*",
                        'rate_value' => round($baseRate, 6),
                        'dimensions' => json_encode(['age' => $age, 'sex' => $sex, 'tobacco' => $tobacco, 'uw_class' => '*']),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }
        RateTableEntry::insert($entries);

        // Factors
        $factors = [
            ['factor_code' => 'term_length', 'factor_label' => 'Term Length', 'option_value' => '10yr', 'apply_mode' => 'multiply', 'factor_value' => 0.80, 'sort_order' => 1],
            ['factor_code' => 'term_length', 'factor_label' => 'Term Length', 'option_value' => '20yr', 'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 2],
            ['factor_code' => 'term_length', 'factor_label' => 'Term Length', 'option_value' => '30yr', 'apply_mode' => 'multiply', 'factor_value' => 1.35, 'sort_order' => 3],
            ['factor_code' => 'health_class', 'factor_label' => 'Health Class', 'option_value' => 'preferred_plus', 'apply_mode' => 'multiply', 'factor_value' => 0.70, 'sort_order' => 1],
            ['factor_code' => 'health_class', 'factor_label' => 'Health Class', 'option_value' => 'preferred',      'apply_mode' => 'multiply', 'factor_value' => 0.85, 'sort_order' => 2],
            ['factor_code' => 'health_class', 'factor_label' => 'Health Class', 'option_value' => 'standard',       'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 3],
            ['factor_code' => 'health_class', 'factor_label' => 'Health Class', 'option_value' => 'substandard',    'apply_mode' => 'multiply', 'factor_value' => 1.75, 'sort_order' => 4],
        ];
        foreach ($factors as $f) {
            RateFactor::create(array_merge($f, ['rate_table_id' => $table->id]));
        }

        // Riders
        $riders = [
            ['rider_code' => 'waiver_premium', 'rider_label' => 'Waiver of Premium',      'apply_mode' => 'add',      'rider_value' => 0.03, 'is_default' => true,  'sort_order' => 1],
            ['rider_code' => 'accidental_death','rider_label' => 'Accidental Death',       'apply_mode' => 'add',      'rider_value' => 0.02, 'is_default' => false, 'sort_order' => 2],
            ['rider_code' => 'child_rider',     'rider_label' => 'Child Term Rider',       'apply_mode' => 'add',      'rider_value' => 0.01, 'is_default' => false, 'sort_order' => 3],
            ['rider_code' => 'conversion',      'rider_label' => 'Conversion Privilege',   'apply_mode' => 'multiply', 'rider_value' => 1.05, 'is_default' => true,  'sort_order' => 4],
        ];
        foreach ($riders as $r) {
            RateRider::create(array_merge($r, ['rate_table_id' => $table->id]));
        }

        // Fees
        $fees = [
            ['fee_code' => 'policy_fee', 'fee_label' => 'Policy Fee', 'fee_type' => 'fee', 'apply_mode' => 'add', 'fee_value' => 60.00, 'sort_order' => 1],
        ];
        foreach ($fees as $f) {
            RateFee::create(array_merge($f, ['rate_table_id' => $table->id]));
        }

        // Modal
        $modals = [
            ['mode' => 'annual',     'factor' => 1.000000, 'flat_fee' => 0.00],
            ['mode' => 'semiannual', 'factor' => 0.520000, 'flat_fee' => 0.00],
            ['mode' => 'quarterly',  'factor' => 0.265000, 'flat_fee' => 2.00],
            ['mode' => 'monthly',    'factor' => 0.087500, 'flat_fee' => 3.00],
        ];
        foreach ($modals as $m) {
            RateModalFactor::create(array_merge($m, ['rate_table_id' => $table->id]));
        }
    }

    /**
     * Long Term Care Insurance — based on real-world LTC premium structures.
     * Modeled after typical carrier pricing (Mutual of Omaha, NGL, NYL style).
     * Exposure = Daily Benefit / 10 (so $150/day = 15 exposure units).
     */
    private function seedLongTermCare(): void
    {
        $table = RateTable::updateOrCreate(
            ['product_type' => 'long_term_care', 'version' => '2026-Q1'],
            [
                'name' => 'Long Term Care - 2026 Q1',
                'effective_date' => '2026-01-01',
                'expiration_date' => '2026-12-31',
                'is_active' => true,
                'metadata' => [
                    'carrier' => 'Demo LTC Mutual',
                    'exposure_unit' => 'daily_benefit_div_10',
                    'tax_qualified' => true,
                    'partnership_eligible' => true,
                ],
            ]
        );

        $table->entries()->delete();
        $table->factors()->delete();
        $table->riders()->delete();
        $table->fees()->delete();
        $table->modalFactors()->delete();

        // ─── Base Rate Entries ─────────────────────────────────
        // Rate per exposure unit (daily benefit / 10) by age|sex|state|uwClass
        // Calibrated so a 52M Select in FL with $150 daily benefit ≈ $1,300 annual
        // ($1,300 / 15 exposure units ≈ $86.67 base rate before factors)
        $entries = [];
        $ages = [40, 45, 50, 51, 52, 53, 55, 60, 65, 70, 75];
        $sexes = ['M', 'F'];
        $uwClasses = ['select', 'standard'];

        // LTC rates increase steeply with age
        $ageBase = fn (int $age) => 25.0 + pow(($age - 40) / 10, 2.2) * 35;
        // Women pay more for LTC (higher utilization)
        $sexMult = fn (string $sex) => $sex === 'F' ? 1.30 : 1.00;
        // Select UW class gets a discount
        $uwMult = fn (string $uw) => $uw === 'select' ? 0.85 : 1.00;

        foreach ($ages as $age) {
            foreach ($sexes as $sex) {
                foreach ($uwClasses as $uw) {
                    $rate = round($ageBase($age) * $sexMult($sex) * $uwMult($uw), 6);
                    $entries[] = [
                        'rate_table_id' => $table->id,
                        'rate_key' => "{$age}|{$sex}|*|{$uw}",
                        'rate_value' => $rate,
                        'dimensions' => json_encode(['age' => $age, 'sex' => $sex, 'state' => '*', 'uw_class' => $uw]),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }
        RateTableEntry::insert($entries);

        // ─── Factors ───────────────────────────────────────────
        $factors = [
            // Benefit Period
            ['factor_code' => 'benefit_period', 'factor_label' => 'Benefit Period', 'option_value' => '2yr',       'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'benefit_period', 'factor_label' => 'Benefit Period', 'option_value' => '3yr',       'apply_mode' => 'multiply', 'factor_value' => 1.35, 'sort_order' => 2],
            ['factor_code' => 'benefit_period', 'factor_label' => 'Benefit Period', 'option_value' => '5yr',       'apply_mode' => 'multiply', 'factor_value' => 1.75, 'sort_order' => 3],
            ['factor_code' => 'benefit_period', 'factor_label' => 'Benefit Period', 'option_value' => 'unlimited', 'apply_mode' => 'multiply', 'factor_value' => 2.50, 'sort_order' => 4],

            // Elimination Period
            ['factor_code' => 'elimination_period', 'factor_label' => 'Elimination Period', 'option_value' => '30',  'apply_mode' => 'multiply', 'factor_value' => 1.30, 'sort_order' => 1],
            ['factor_code' => 'elimination_period', 'factor_label' => 'Elimination Period', 'option_value' => '60',  'apply_mode' => 'multiply', 'factor_value' => 1.12, 'sort_order' => 2],
            ['factor_code' => 'elimination_period', 'factor_label' => 'Elimination Period', 'option_value' => '90',  'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 3],
            ['factor_code' => 'elimination_period', 'factor_label' => 'Elimination Period', 'option_value' => '180', 'apply_mode' => 'multiply', 'factor_value' => 0.82, 'sort_order' => 4],
            ['factor_code' => 'elimination_period', 'factor_label' => 'Elimination Period', 'option_value' => '365', 'apply_mode' => 'multiply', 'factor_value' => 0.65, 'sort_order' => 5],

            // Inflation Protection
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => 'none',         'apply_mode' => 'multiply', 'factor_value' => 0.70, 'sort_order' => 1],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => '1pct_compound','apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 2],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => '3pct_compound','apply_mode' => 'multiply', 'factor_value' => 1.55, 'sort_order' => 3],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => '5pct_compound','apply_mode' => 'multiply', 'factor_value' => 2.20, 'sort_order' => 4],

            // Home Care Benefit
            ['factor_code' => 'home_care', 'factor_label' => 'Home Care Benefit', 'option_value' => '50pct',  'apply_mode' => 'multiply', 'factor_value' => 0.85, 'sort_order' => 1],
            ['factor_code' => 'home_care', 'factor_label' => 'Home Care Benefit', 'option_value' => '80pct',  'apply_mode' => 'multiply', 'factor_value' => 0.95, 'sort_order' => 2],
            ['factor_code' => 'home_care', 'factor_label' => 'Home Care Benefit', 'option_value' => '100pct', 'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 3],

            // Marital Discount
            ['factor_code' => 'marital_discount', 'factor_label' => 'Marital Discount', 'option_value' => 'none',         'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'marital_discount', 'factor_label' => 'Marital Discount', 'option_value' => 'both_insured', 'apply_mode' => 'multiply', 'factor_value' => 0.80, 'sort_order' => 2],
            ['factor_code' => 'marital_discount', 'factor_label' => 'Marital Discount', 'option_value' => 'one_insured',  'apply_mode' => 'multiply', 'factor_value' => 0.90, 'sort_order' => 3],

            // Nonforfeiture
            ['factor_code' => 'nonforfeiture', 'factor_label' => 'Nonforfeiture', 'option_value' => 'none',          'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'nonforfeiture', 'factor_label' => 'Nonforfeiture', 'option_value' => 'contingent',    'apply_mode' => 'multiply', 'factor_value' => 1.02, 'sort_order' => 2],
            ['factor_code' => 'nonforfeiture', 'factor_label' => 'Nonforfeiture', 'option_value' => 'reduced_paidup','apply_mode' => 'multiply', 'factor_value' => 1.15, 'sort_order' => 3],

            // Payment Duration
            ['factor_code' => 'payment_duration', 'factor_label' => 'Payment Duration', 'option_value' => 'lifetime', 'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'payment_duration', 'factor_label' => 'Payment Duration', 'option_value' => '10pay',    'apply_mode' => 'multiply', 'factor_value' => 2.10, 'sort_order' => 2],
            ['factor_code' => 'payment_duration', 'factor_label' => 'Payment Duration', 'option_value' => 'paid_up65','apply_mode' => 'multiply', 'factor_value' => 1.80, 'sort_order' => 3],
        ];

        foreach ($factors as $f) {
            RateFactor::create(array_merge($f, ['rate_table_id' => $table->id]));
        }

        // ─── Riders ────────────────────────────────────────────
        $riders = [
            ['rider_code' => 'restoration',       'rider_label' => 'Restoration of Benefit',  'apply_mode' => 'multiply', 'rider_value' => 1.08, 'is_default' => false, 'sort_order' => 1],
            ['rider_code' => 'spouse_waiver',      'rider_label' => 'Spouse Premium Waiver',   'apply_mode' => 'multiply', 'rider_value' => 1.05, 'is_default' => false, 'sort_order' => 2],
            ['rider_code' => 'cash_benefit',       'rider_label' => 'Cash Benefit (25%)',      'apply_mode' => 'add',      'rider_value' => 0.50, 'is_default' => false, 'sort_order' => 3],
            ['rider_code' => 'international_care', 'rider_label' => 'International Coverage',  'apply_mode' => 'add',      'rider_value' => 0.30, 'is_default' => false, 'sort_order' => 4],
            ['rider_code' => 'shared_care',        'rider_label' => 'Shared Care (Couples)',   'apply_mode' => 'multiply', 'rider_value' => 1.12, 'is_default' => false, 'sort_order' => 5],
        ];

        foreach ($riders as $r) {
            RateRider::create(array_merge($r, ['rate_table_id' => $table->id]));
        }

        // ─── Fees & Credits ────────────────────────────────────
        $fees = [
            ['fee_code' => 'policy_fee',       'fee_label' => 'Policy Fee',              'fee_type' => 'fee',    'apply_mode' => 'add',     'fee_value' => 50.00, 'sort_order' => 1],
            ['fee_code' => 'partnership_credit','fee_label' => 'Partnership Plan Credit', 'fee_type' => 'credit', 'apply_mode' => 'percent', 'fee_value' => 2.00,  'sort_order' => 2],
        ];

        foreach ($fees as $f) {
            RateFee::create(array_merge($f, ['rate_table_id' => $table->id]));
        }

        // ─── Modal Factors ─────────────────────────────────────
        $modals = [
            ['mode' => 'annual',     'factor' => 1.000000, 'flat_fee' => 0.00],
            ['mode' => 'semiannual', 'factor' => 0.520000, 'flat_fee' => 0.00],
            ['mode' => 'quarterly',  'factor' => 0.265000, 'flat_fee' => 2.50],
            ['mode' => 'monthly',    'factor' => 0.087500, 'flat_fee' => 5.00],
        ];

        foreach ($modals as $m) {
            RateModalFactor::create(array_merge($m, ['rate_table_id' => $table->id]));
        }
    }
}
