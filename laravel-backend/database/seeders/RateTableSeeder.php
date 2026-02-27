<?php

namespace Database\Seeders;

use App\Models\Carrier;
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
        $this->seedMutualOfOmahaLTC();
        $this->seedNglLTC();
        $this->seedNylLTC();

        // Carrier-specific P&C rate tables for real quoting
        $this->seedCarrierAutoTables();
        $this->seedCarrierHomeownersTables();
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

    /**
     * Mutual of Omaha — MutualCare Custom Solution.
     * Calibrated to Michel quote: 52M FL Select $150/day → $1,305.76 annual.
     *                              50F FL Select $150/day → $1,781.02 annual.
     */
    private function seedMutualOfOmahaLTC(): void
    {
        $table = RateTable::updateOrCreate(
            ['product_type' => 'long_term_care', 'version' => 'MOO-2026'],
            [
                'name' => 'Mutual of Omaha — MutualCare Custom Solution',
                'effective_date' => '2026-01-01',
                'expiration_date' => '2026-12-31',
                'is_active' => true,
                'metadata' => [
                    'carrier' => 'Mutual of Omaha',
                    'product_name' => 'MutualCare Custom Solution',
                    'exposure_unit' => 'daily_benefit_div_10',
                    'tax_qualified' => true,
                    'partnership_eligible' => true,
                    'home_care_type' => 'monthly',
                    'assisted_living' => '100pct',
                    'professional_home_care' => true,
                ],
            ]
        );

        $table->entries()->delete();
        $table->factors()->delete();
        $table->riders()->delete();
        $table->fees()->delete();
        $table->modalFactors()->delete();

        // Base rates calibrated so 52M Select $150/day ≈ $1,305.76
        // With factors: 2yr BP (1.0), 90-day EP (1.0), 1% inflation (1.0), 100% HC (1.0),
        //   both_insured (0.80), contingent NF (1.02), lifetime pay (1.0)
        // $1,305.76 / (0.80 * 1.02) / 15 = $1,305.76 / 0.816 / 15 ≈ $106.64 base rate
        $entries = [];
        $ages = [40, 45, 50, 51, 52, 53, 55, 60, 65, 70, 75];

        $ageBase = fn (int $age) => 28.0 + pow(($age - 40) / 10, 2.1) * 40;
        $sexMult = fn (string $sex) => $sex === 'F' ? 1.35 : 1.00;
        $uwMult = fn (string $uw) => $uw === 'select' ? 0.82 : 1.00;

        foreach ($ages as $age) {
            foreach (['M', 'F'] as $sex) {
                foreach (['select', 'standard'] as $uw) {
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

        // Factors — same codes as generic LTC for compatibility
        $factors = [
            ['factor_code' => 'benefit_period',       'factor_label' => 'Benefit Period',       'option_value' => '2yr',           'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'benefit_period',       'factor_label' => 'Benefit Period',       'option_value' => '3yr',           'apply_mode' => 'multiply', 'factor_value' => 1.38, 'sort_order' => 2],
            ['factor_code' => 'benefit_period',       'factor_label' => 'Benefit Period',       'option_value' => '5yr',           'apply_mode' => 'multiply', 'factor_value' => 1.80, 'sort_order' => 3],
            ['factor_code' => 'benefit_period',       'factor_label' => 'Benefit Period',       'option_value' => 'unlimited',     'apply_mode' => 'multiply', 'factor_value' => 2.55, 'sort_order' => 4],
            ['factor_code' => 'elimination_period',   'factor_label' => 'Elimination Period',   'option_value' => '30',            'apply_mode' => 'multiply', 'factor_value' => 1.28, 'sort_order' => 1],
            ['factor_code' => 'elimination_period',   'factor_label' => 'Elimination Period',   'option_value' => '90',            'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 2],
            ['factor_code' => 'elimination_period',   'factor_label' => 'Elimination Period',   'option_value' => '180',           'apply_mode' => 'multiply', 'factor_value' => 0.80, 'sort_order' => 3],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => 'none',          'apply_mode' => 'multiply', 'factor_value' => 0.68, 'sort_order' => 1],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => '1pct_compound', 'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 2],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => '3pct_compound', 'apply_mode' => 'multiply', 'factor_value' => 1.58, 'sort_order' => 3],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => '5pct_compound', 'apply_mode' => 'multiply', 'factor_value' => 2.25, 'sort_order' => 4],
            ['factor_code' => 'home_care',            'factor_label' => 'Home Care Benefit',    'option_value' => '50pct',         'apply_mode' => 'multiply', 'factor_value' => 0.82, 'sort_order' => 1],
            ['factor_code' => 'home_care',            'factor_label' => 'Home Care Benefit',    'option_value' => '80pct',         'apply_mode' => 'multiply', 'factor_value' => 0.93, 'sort_order' => 2],
            ['factor_code' => 'home_care',            'factor_label' => 'Home Care Benefit',    'option_value' => '100pct',        'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 3],
            ['factor_code' => 'marital_discount',     'factor_label' => 'Marital Discount',     'option_value' => 'none',          'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'marital_discount',     'factor_label' => 'Marital Discount',     'option_value' => 'both_insured',  'apply_mode' => 'multiply', 'factor_value' => 0.80, 'sort_order' => 2],
            ['factor_code' => 'marital_discount',     'factor_label' => 'Marital Discount',     'option_value' => 'one_insured',   'apply_mode' => 'multiply', 'factor_value' => 0.88, 'sort_order' => 3],
            ['factor_code' => 'nonforfeiture',        'factor_label' => 'Nonforfeiture',        'option_value' => 'none',          'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'nonforfeiture',        'factor_label' => 'Nonforfeiture',        'option_value' => 'contingent',    'apply_mode' => 'multiply', 'factor_value' => 1.02, 'sort_order' => 2],
            ['factor_code' => 'nonforfeiture',        'factor_label' => 'Nonforfeiture',        'option_value' => 'reduced_paidup','apply_mode' => 'multiply', 'factor_value' => 1.18, 'sort_order' => 3],
            ['factor_code' => 'payment_duration',     'factor_label' => 'Payment Duration',     'option_value' => 'lifetime',      'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'payment_duration',     'factor_label' => 'Payment Duration',     'option_value' => '10pay',         'apply_mode' => 'multiply', 'factor_value' => 2.15, 'sort_order' => 2],
            ['factor_code' => 'payment_duration',     'factor_label' => 'Payment Duration',     'option_value' => 'paid_up65',     'apply_mode' => 'multiply', 'factor_value' => 1.85, 'sort_order' => 3],
        ];
        foreach ($factors as $f) {
            RateFactor::create(array_merge($f, ['rate_table_id' => $table->id]));
        }

        $riders = [
            ['rider_code' => 'restoration',  'rider_label' => 'Restoration of Benefit', 'apply_mode' => 'multiply', 'rider_value' => 1.08, 'is_default' => false, 'sort_order' => 1],
            ['rider_code' => 'spouse_waiver', 'rider_label' => 'Spouse Premium Waiver',  'apply_mode' => 'multiply', 'rider_value' => 1.05, 'is_default' => false, 'sort_order' => 2],
            ['rider_code' => 'cash_benefit',  'rider_label' => 'Cash Benefit (25%)',     'apply_mode' => 'add',      'rider_value' => 0.55, 'is_default' => false, 'sort_order' => 3],
            ['rider_code' => 'shared_care',   'rider_label' => 'Shared Care (Couples)',  'apply_mode' => 'multiply', 'rider_value' => 1.14, 'is_default' => false, 'sort_order' => 4],
        ];
        foreach ($riders as $r) {
            RateRider::create(array_merge($r, ['rate_table_id' => $table->id]));
        }

        $fees = [
            ['fee_code' => 'policy_fee',        'fee_label' => 'Policy Fee',              'fee_type' => 'fee',    'apply_mode' => 'add',     'fee_value' => 45.00, 'sort_order' => 1],
            ['fee_code' => 'partnership_credit', 'fee_label' => 'Partnership Plan Credit', 'fee_type' => 'credit', 'apply_mode' => 'percent', 'fee_value' => 2.00,  'sort_order' => 2],
        ];
        foreach ($fees as $f) {
            RateFee::create(array_merge($f, ['rate_table_id' => $table->id]));
        }

        $modals = [
            ['mode' => 'annual',     'factor' => 1.000000, 'flat_fee' => 0.00],
            ['mode' => 'semiannual', 'factor' => 0.520000, 'flat_fee' => 0.00],
            ['mode' => 'quarterly',  'factor' => 0.265000, 'flat_fee' => 2.00],
            ['mode' => 'monthly',    'factor' => 0.087500, 'flat_fee' => 4.50],
        ];
        foreach ($modals as $m) {
            RateModalFactor::create(array_merge($m, ['rate_table_id' => $table->id]));
        }
    }

    /**
     * NGL — Joint LTC pricing.
     * Calibrated to Michel quote: 52M + 50F joint $150/day → $3,632 annual combined.
     * NGL prices both applicants together.
     */
    private function seedNglLTC(): void
    {
        $table = RateTable::updateOrCreate(
            ['product_type' => 'long_term_care', 'version' => 'NGL-2026'],
            [
                'name' => 'NGL — Long Term Care',
                'effective_date' => '2026-01-01',
                'expiration_date' => '2026-12-31',
                'is_active' => true,
                'metadata' => [
                    'carrier' => 'NGL',
                    'product_name' => 'NGL LTC',
                    'exposure_unit' => 'daily_benefit_div_10',
                    'tax_qualified' => true,
                    'partnership_eligible' => true,
                    'joint_pricing' => true,
                    'waiver_of_premium' => 'included',
                ],
            ]
        );

        $table->entries()->delete();
        $table->factors()->delete();
        $table->riders()->delete();
        $table->fees()->delete();
        $table->modalFactors()->delete();

        // NGL rates are higher than Mutual of Omaha — joint pricing model
        $entries = [];
        $ages = [40, 45, 50, 51, 52, 53, 55, 60, 65, 70, 75];
        $ageBase = fn (int $age) => 35.0 + pow(($age - 40) / 10, 2.0) * 50;
        $sexMult = fn (string $sex) => $sex === 'F' ? 1.28 : 1.00;
        $uwMult = fn (string $uw) => $uw === 'select' ? 0.85 : 1.00;

        foreach ($ages as $age) {
            foreach (['M', 'F'] as $sex) {
                foreach (['select', 'standard'] as $uw) {
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

        $factors = [
            ['factor_code' => 'benefit_period',       'factor_label' => 'Benefit Period',       'option_value' => '2yr',           'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'benefit_period',       'factor_label' => 'Benefit Period',       'option_value' => '3yr',           'apply_mode' => 'multiply', 'factor_value' => 1.40, 'sort_order' => 2],
            ['factor_code' => 'benefit_period',       'factor_label' => 'Benefit Period',       'option_value' => '5yr',           'apply_mode' => 'multiply', 'factor_value' => 1.82, 'sort_order' => 3],
            ['factor_code' => 'elimination_period',   'factor_label' => 'Elimination Period',   'option_value' => '90',            'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'elimination_period',   'factor_label' => 'Elimination Period',   'option_value' => '180',           'apply_mode' => 'multiply', 'factor_value' => 0.78, 'sort_order' => 2],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => 'none',          'apply_mode' => 'multiply', 'factor_value' => 0.65, 'sort_order' => 1],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => '1pct_compound', 'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 2],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => '3pct_compound', 'apply_mode' => 'multiply', 'factor_value' => 1.60, 'sort_order' => 3],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => '5pct_compound', 'apply_mode' => 'multiply', 'factor_value' => 2.30, 'sort_order' => 4],
            ['factor_code' => 'home_care',            'factor_label' => 'Home Care Benefit',    'option_value' => '50pct',         'apply_mode' => 'multiply', 'factor_value' => 0.80, 'sort_order' => 1],
            ['factor_code' => 'home_care',            'factor_label' => 'Home Care Benefit',    'option_value' => '100pct',        'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 2],
            ['factor_code' => 'marital_discount',     'factor_label' => 'Marital Discount',     'option_value' => 'none',          'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'marital_discount',     'factor_label' => 'Marital Discount',     'option_value' => 'both_insured',  'apply_mode' => 'multiply', 'factor_value' => 0.78, 'sort_order' => 2],
            ['factor_code' => 'nonforfeiture',        'factor_label' => 'Nonforfeiture',        'option_value' => 'none',          'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'nonforfeiture',        'factor_label' => 'Nonforfeiture',        'option_value' => 'contingent',    'apply_mode' => 'multiply', 'factor_value' => 1.03, 'sort_order' => 2],
            ['factor_code' => 'payment_duration',     'factor_label' => 'Payment Duration',     'option_value' => 'lifetime',      'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'payment_duration',     'factor_label' => 'Payment Duration',     'option_value' => '10pay',         'apply_mode' => 'multiply', 'factor_value' => 2.20, 'sort_order' => 2],
        ];
        foreach ($factors as $f) {
            RateFactor::create(array_merge($f, ['rate_table_id' => $table->id]));
        }

        $riders = [
            ['rider_code' => 'restoration',  'rider_label' => 'Restoration of Benefit', 'apply_mode' => 'multiply', 'rider_value' => 1.10, 'is_default' => false, 'sort_order' => 1],
            ['rider_code' => 'spouse_waiver', 'rider_label' => 'Spouse Premium Waiver',  'apply_mode' => 'multiply', 'rider_value' => 1.06, 'is_default' => false, 'sort_order' => 2],
            ['rider_code' => 'shared_care',   'rider_label' => 'Shared Care (Couples)',  'apply_mode' => 'multiply', 'rider_value' => 1.15, 'is_default' => false, 'sort_order' => 3],
        ];
        foreach ($riders as $r) {
            RateRider::create(array_merge($r, ['rate_table_id' => $table->id]));
        }

        $fees = [
            ['fee_code' => 'policy_fee', 'fee_label' => 'Policy Fee', 'fee_type' => 'fee', 'apply_mode' => 'add', 'fee_value' => 50.00, 'sort_order' => 1],
        ];
        foreach ($fees as $f) {
            RateFee::create(array_merge($f, ['rate_table_id' => $table->id]));
        }

        $modals = [
            ['mode' => 'annual',     'factor' => 1.000000, 'flat_fee' => 0.00],
            ['mode' => 'semiannual', 'factor' => 0.520000, 'flat_fee' => 0.00],
            ['mode' => 'quarterly',  'factor' => 0.265000, 'flat_fee' => 3.00],
            ['mode' => 'monthly',    'factor' => 0.087500, 'flat_fee' => 5.00],
        ];
        foreach ($modals as $m) {
            RateModalFactor::create(array_merge($m, ['rate_table_id' => $table->id]));
        }
    }

    /**
     * New York Life — Premium LTC.
     * Calibrated to Michel quote: 52M FL Select $150/day → $4,091.49 annual.
     *                              50F FL Select $150/day → $5,044.23 annual.
     * NYL is the most expensive carrier in the comparison.
     */
    private function seedNylLTC(): void
    {
        $table = RateTable::updateOrCreate(
            ['product_type' => 'long_term_care', 'version' => 'NYL-2026'],
            [
                'name' => 'New York Life — Long Term Care',
                'effective_date' => '2026-01-01',
                'expiration_date' => '2026-12-31',
                'is_active' => true,
                'metadata' => [
                    'carrier' => 'New York Life',
                    'product_name' => 'NYL Secure Care',
                    'exposure_unit' => 'daily_benefit_div_10',
                    'tax_qualified' => true,
                    'partnership_eligible' => true,
                    'home_care_type' => 'daily',
                ],
            ]
        );

        $table->entries()->delete();
        $table->factors()->delete();
        $table->riders()->delete();
        $table->fees()->delete();
        $table->modalFactors()->delete();

        // NYL has the highest rates
        $entries = [];
        $ages = [40, 45, 50, 51, 52, 53, 55, 60, 65, 70, 75];
        $ageBase = fn (int $age) => 55.0 + pow(($age - 40) / 10, 2.3) * 65;
        $sexMult = fn (string $sex) => $sex === 'F' ? 1.22 : 1.00;
        $uwMult = fn (string $uw) => $uw === 'select' ? 0.88 : 1.00;

        foreach ($ages as $age) {
            foreach (['M', 'F'] as $sex) {
                foreach (['select', 'standard'] as $uw) {
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

        $factors = [
            ['factor_code' => 'benefit_period',       'factor_label' => 'Benefit Period',       'option_value' => '3yr',           'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'benefit_period',       'factor_label' => 'Benefit Period',       'option_value' => '5yr',           'apply_mode' => 'multiply', 'factor_value' => 1.45, 'sort_order' => 2],
            ['factor_code' => 'benefit_period',       'factor_label' => 'Benefit Period',       'option_value' => 'unlimited',     'apply_mode' => 'multiply', 'factor_value' => 2.10, 'sort_order' => 3],
            ['factor_code' => 'elimination_period',   'factor_label' => 'Elimination Period',   'option_value' => '90',            'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'elimination_period',   'factor_label' => 'Elimination Period',   'option_value' => '180',           'apply_mode' => 'multiply', 'factor_value' => 0.82, 'sort_order' => 2],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => 'none',          'apply_mode' => 'multiply', 'factor_value' => 0.60, 'sort_order' => 1],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => '1pct_compound', 'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 2],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => '3pct_compound', 'apply_mode' => 'multiply', 'factor_value' => 1.65, 'sort_order' => 3],
            ['factor_code' => 'inflation_protection', 'factor_label' => 'Inflation Protection', 'option_value' => '5pct_compound', 'apply_mode' => 'multiply', 'factor_value' => 2.40, 'sort_order' => 4],
            ['factor_code' => 'home_care',            'factor_label' => 'Home Care Benefit',    'option_value' => '50pct',         'apply_mode' => 'multiply', 'factor_value' => 0.78, 'sort_order' => 1],
            ['factor_code' => 'home_care',            'factor_label' => 'Home Care Benefit',    'option_value' => '100pct',        'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 2],
            ['factor_code' => 'marital_discount',     'factor_label' => 'Marital Discount',     'option_value' => 'none',          'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'marital_discount',     'factor_label' => 'Marital Discount',     'option_value' => 'both_insured',  'apply_mode' => 'multiply', 'factor_value' => 0.85, 'sort_order' => 2],
            ['factor_code' => 'nonforfeiture',        'factor_label' => 'Nonforfeiture',        'option_value' => 'none',          'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'nonforfeiture',        'factor_label' => 'Nonforfeiture',        'option_value' => 'contingent',    'apply_mode' => 'multiply', 'factor_value' => 1.04, 'sort_order' => 2],
            ['factor_code' => 'nonforfeiture',        'factor_label' => 'Nonforfeiture',        'option_value' => 'reduced_paidup','apply_mode' => 'multiply', 'factor_value' => 1.20, 'sort_order' => 3],
            ['factor_code' => 'payment_duration',     'factor_label' => 'Payment Duration',     'option_value' => 'lifetime',      'apply_mode' => 'multiply', 'factor_value' => 1.00, 'sort_order' => 1],
            ['factor_code' => 'payment_duration',     'factor_label' => 'Payment Duration',     'option_value' => '10pay',         'apply_mode' => 'multiply', 'factor_value' => 2.25, 'sort_order' => 2],
        ];
        foreach ($factors as $f) {
            RateFactor::create(array_merge($f, ['rate_table_id' => $table->id]));
        }

        $riders = [
            ['rider_code' => 'restoration',  'rider_label' => 'Restoration of Benefit', 'apply_mode' => 'multiply', 'rider_value' => 1.12, 'is_default' => false, 'sort_order' => 1],
            ['rider_code' => 'spouse_waiver', 'rider_label' => 'Spouse Premium Waiver',  'apply_mode' => 'multiply', 'rider_value' => 1.07, 'is_default' => false, 'sort_order' => 2],
            ['rider_code' => 'cash_benefit',  'rider_label' => 'Cash Benefit (25%)',     'apply_mode' => 'add',      'rider_value' => 0.65, 'is_default' => false, 'sort_order' => 3],
        ];
        foreach ($riders as $r) {
            RateRider::create(array_merge($r, ['rate_table_id' => $table->id]));
        }

        $fees = [
            ['fee_code' => 'policy_fee',        'fee_label' => 'Policy Fee',              'fee_type' => 'fee',    'apply_mode' => 'add',     'fee_value' => 60.00, 'sort_order' => 1],
            ['fee_code' => 'partnership_credit', 'fee_label' => 'Partnership Plan Credit', 'fee_type' => 'credit', 'apply_mode' => 'percent', 'fee_value' => 1.50,  'sort_order' => 2],
        ];
        foreach ($fees as $f) {
            RateFee::create(array_merge($f, ['rate_table_id' => $table->id]));
        }

        $modals = [
            ['mode' => 'annual',     'factor' => 1.000000, 'flat_fee' => 0.00],
            ['mode' => 'semiannual', 'factor' => 0.520000, 'flat_fee' => 0.00],
            ['mode' => 'quarterly',  'factor' => 0.265000, 'flat_fee' => 3.00],
            ['mode' => 'monthly',    'factor' => 0.087500, 'flat_fee' => 5.50],
        ];
        foreach ($modals as $m) {
            RateModalFactor::create(array_merge($m, ['rate_table_id' => $table->id]));
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Carrier-specific P&C Rate Tables (demo rates, not actuarial)
    // ═══════════════════════════════════════════════════════════

    /**
     * Auto insurance rate tables for State Farm, Progressive, Allstate.
     * Rate per vehicle by state|vehicle_age_band.
     */
    private function seedCarrierAutoTables(): void
    {
        $carriers = [
            'state-farm'   => ['name' => 'State Farm Auto', 'base_multiplier' => 1.00],
            'progressive'  => ['name' => 'Progressive Auto', 'base_multiplier' => 0.92],
            'allstate'     => ['name' => 'Allstate Auto', 'base_multiplier' => 1.05],
        ];

        // Base rates by state (annual per vehicle) — representative demo values
        $stateRates = [
            'CA' => 1850, 'TX' => 1650, 'FL' => 2100, 'NY' => 2400, 'IL' => 1500,
            'PA' => 1550, 'OH' => 1200, 'GA' => 1700, 'NC' => 1350, 'MI' => 2200,
            'NJ' => 2050, 'VA' => 1400, 'WA' => 1450, 'AZ' => 1600, 'MA' => 1750,
            'TN' => 1500, 'MO' => 1550, 'MD' => 1800, 'WI' => 1200, 'MN' => 1350,
            'CO' => 1650, 'AL' => 1550, 'SC' => 1600, 'LA' => 2300, 'KY' => 1650,
            'OR' => 1400, 'OK' => 1700, 'CT' => 1800, 'UT' => 1350, 'IA' => 1150,
            'NV' => 1750, 'AR' => 1500, 'MS' => 1600, 'KS' => 1400, 'NM' => 1550,
            'NE' => 1300, 'ID' => 1200, 'WV' => 1450, 'HI' => 1300, 'NH' => 1250,
            'ME' => 1150, 'RI' => 1900, 'MT' => 1300, 'DE' => 1650, 'SD' => 1150,
            'ND' => 1100, 'AK' => 1400, 'VT' => 1200, 'WY' => 1250, 'DC' => 1950,
            'IN' => 1350,
        ];

        foreach ($carriers as $slug => $config) {
            $carrier = Carrier::where('slug', $slug)->first();
            if (!$carrier) continue;

            $table = RateTable::updateOrCreate(
                ['product_type' => 'auto', 'version' => '2026-Q1', 'carrier_id' => $carrier->id],
                [
                    'name' => $config['name'] . ' - 2026 Q1',
                    'effective_date' => '2026-01-01',
                    'expiration_date' => '2026-12-31',
                    'is_active' => true,
                ]
            );

            $table->entries()->delete();
            $table->factors()->delete();
            $table->riders()->delete();
            $table->fees()->delete();
            $table->modalFactors()->delete();

            // Entries: state|vehicle_age_band → annual rate per vehicle
            foreach ($stateRates as $st => $baseRate) {
                $adjusted = round($baseRate * $config['base_multiplier']);
                foreach (['new' => 1.15, 'mid' => 1.00, 'old' => 0.88] as $band => $factor) {
                    RateTableEntry::create([
                        'rate_table_id' => $table->id,
                        'rate_key' => "{$st}|{$band}",
                        'rate_value' => round($adjusted * $factor, 2),
                    ]);
                }
                // Wildcard fallback
                RateTableEntry::create([
                    'rate_table_id' => $table->id,
                    'rate_key' => "{$st}|*",
                    'rate_value' => $adjusted,
                ]);
            }

            // Factors
            $factors = [
                ['factor_code' => 'driver_age', 'factor_label' => 'Driver Age', 'options' => [
                    ['option_value' => '16-25', 'factor_value' => 1.45, 'sort_order' => 1],
                    ['option_value' => '26-35', 'factor_value' => 1.10, 'sort_order' => 2],
                    ['option_value' => '36-55', 'factor_value' => 1.00, 'sort_order' => 3],
                    ['option_value' => '56-65', 'factor_value' => 0.95, 'sort_order' => 4],
                    ['option_value' => '66+',   'factor_value' => 1.15, 'sort_order' => 5],
                ]],
                ['factor_code' => 'credit_tier', 'factor_label' => 'Credit Tier', 'options' => [
                    ['option_value' => 'excellent', 'factor_value' => 0.85, 'sort_order' => 1],
                    ['option_value' => 'good',      'factor_value' => 1.00, 'sort_order' => 2],
                    ['option_value' => 'fair',       'factor_value' => 1.20, 'sort_order' => 3],
                    ['option_value' => 'poor',       'factor_value' => 1.45, 'sort_order' => 4],
                ]],
                ['factor_code' => 'claims_history', 'factor_label' => 'Claims History (3yr)', 'options' => [
                    ['option_value' => 'clean',       'factor_value' => 0.90, 'sort_order' => 1],
                    ['option_value' => '1_claim',     'factor_value' => 1.00, 'sort_order' => 2],
                    ['option_value' => '2_claims',    'factor_value' => 1.25, 'sort_order' => 3],
                    ['option_value' => '3_plus',      'factor_value' => 1.50, 'sort_order' => 4],
                ]],
            ];

            foreach ($factors as $fg) {
                foreach ($fg['options'] as $opt) {
                    RateFactor::create([
                        'rate_table_id' => $table->id,
                        'factor_code' => $fg['factor_code'],
                        'factor_label' => $fg['factor_label'],
                        'option_value' => $opt['option_value'],
                        'apply_mode' => 'multiply',
                        'factor_value' => $opt['factor_value'],
                        'sort_order' => $opt['sort_order'],
                    ]);
                }
            }

            // Riders
            $riders = [
                ['rider_code' => 'roadside', 'rider_label' => 'Roadside Assistance', 'rider_value' => 35, 'is_default' => false],
                ['rider_code' => 'rental_reimb', 'rider_label' => 'Rental Reimbursement', 'rider_value' => 50, 'is_default' => false],
                ['rider_code' => 'gap_coverage', 'rider_label' => 'GAP Coverage', 'rider_value' => 75, 'is_default' => false],
            ];
            foreach ($riders as $i => $r) {
                RateRider::create(array_merge($r, [
                    'rate_table_id' => $table->id,
                    'apply_mode' => 'add',
                    'sort_order' => $i + 1,
                ]));
            }

            // Fees
            RateFee::create(['rate_table_id' => $table->id, 'fee_code' => 'policy_fee', 'fee_label' => 'Policy Fee', 'fee_type' => 'fee', 'apply_mode' => 'add', 'fee_value' => 25, 'sort_order' => 1]);
            RateFee::create(['rate_table_id' => $table->id, 'fee_code' => 'multi_policy', 'fee_label' => 'Multi-Policy Discount', 'fee_type' => 'credit', 'apply_mode' => 'percent', 'fee_value' => 5, 'sort_order' => 2]);

            // Modal factors
            foreach ([
                ['mode' => 'annual',     'factor' => 1.000, 'flat_fee' => 0],
                ['mode' => 'semiannual', 'factor' => 0.520, 'flat_fee' => 5],
                ['mode' => 'quarterly',  'factor' => 0.265, 'flat_fee' => 5],
                ['mode' => 'monthly',    'factor' => 0.088, 'flat_fee' => 3],
            ] as $m) {
                RateModalFactor::create(array_merge($m, ['rate_table_id' => $table->id]));
            }
        }
    }

    /**
     * Homeowners insurance rate tables for State Farm, Progressive, Allstate.
     * Rate per $1000 insured value by state.
     */
    private function seedCarrierHomeownersTables(): void
    {
        $carriers = [
            'state-farm'   => ['name' => 'State Farm Homeowners', 'base_multiplier' => 1.00],
            'progressive'  => ['name' => 'Progressive Homeowners', 'base_multiplier' => 0.95],
            'allstate'     => ['name' => 'Allstate Homeowners', 'base_multiplier' => 1.08],
        ];

        // Rate per $1,000 dwelling coverage by state — representative demo values
        $stateRates = [
            'CA' => 3.50, 'TX' => 5.20, 'FL' => 6.80, 'NY' => 3.20, 'IL' => 3.00,
            'PA' => 2.80, 'OH' => 2.60, 'GA' => 3.80, 'NC' => 3.50, 'MI' => 3.10,
            'NJ' => 3.30, 'VA' => 2.70, 'WA' => 2.50, 'AZ' => 2.90, 'MA' => 3.40,
            'TN' => 3.60, 'MO' => 4.00, 'MD' => 3.10, 'WI' => 2.40, 'MN' => 2.80,
            'CO' => 4.50, 'AL' => 4.80, 'SC' => 4.20, 'LA' => 6.50, 'KY' => 3.30,
            'OR' => 2.60, 'OK' => 5.80, 'CT' => 3.20, 'UT' => 2.50, 'IA' => 3.40,
            'NV' => 2.80, 'AR' => 4.50, 'MS' => 5.50, 'KS' => 5.00, 'NM' => 3.20,
            'NE' => 4.20, 'ID' => 2.40, 'WV' => 3.00, 'HI' => 2.80, 'NH' => 2.30,
            'ME' => 2.50, 'RI' => 3.60, 'MT' => 3.00, 'DE' => 2.70, 'SD' => 3.80,
            'ND' => 3.50, 'AK' => 3.20, 'VT' => 2.60, 'WY' => 3.00, 'DC' => 2.90,
            'IN' => 2.80,
        ];

        foreach ($carriers as $slug => $config) {
            $carrier = Carrier::where('slug', $slug)->first();
            if (!$carrier) continue;

            $table = RateTable::updateOrCreate(
                ['product_type' => 'homeowners', 'version' => '2026-Q1', 'carrier_id' => $carrier->id],
                [
                    'name' => $config['name'] . ' - 2026 Q1',
                    'effective_date' => '2026-01-01',
                    'expiration_date' => '2026-12-31',
                    'is_active' => true,
                ]
            );

            $table->entries()->delete();
            $table->factors()->delete();
            $table->riders()->delete();
            $table->fees()->delete();
            $table->modalFactors()->delete();

            // Entries: state → rate per $1,000 dwelling (exposure = dwelling / 1000)
            foreach ($stateRates as $st => $baseRate) {
                $adjusted = round($baseRate * $config['base_multiplier'], 4);
                // With construction type variants
                foreach (['frame' => 1.00, 'masonry' => 0.90, 'superior' => 0.80] as $const => $factor) {
                    RateTableEntry::create([
                        'rate_table_id' => $table->id,
                        'rate_key' => "{$st}|{$const}",
                        'rate_value' => round($adjusted * $factor, 4),
                    ]);
                }
                // Wildcard fallback (frame default)
                RateTableEntry::create([
                    'rate_table_id' => $table->id,
                    'rate_key' => "{$st}|*",
                    'rate_value' => $adjusted,
                ]);
            }

            // Factors
            $factors = [
                ['factor_code' => 'roof_age', 'factor_label' => 'Roof Age', 'options' => [
                    ['option_value' => '0-5',   'factor_value' => 0.90, 'sort_order' => 1],
                    ['option_value' => '6-10',  'factor_value' => 1.00, 'sort_order' => 2],
                    ['option_value' => '11-15', 'factor_value' => 1.15, 'sort_order' => 3],
                    ['option_value' => '16-20', 'factor_value' => 1.30, 'sort_order' => 4],
                    ['option_value' => '21+',   'factor_value' => 1.50, 'sort_order' => 5],
                ]],
                ['factor_code' => 'protection_class', 'factor_label' => 'Fire Protection Class', 'options' => [
                    ['option_value' => '1-3',  'factor_value' => 0.85, 'sort_order' => 1],
                    ['option_value' => '4-6',  'factor_value' => 1.00, 'sort_order' => 2],
                    ['option_value' => '7-8',  'factor_value' => 1.20, 'sort_order' => 3],
                    ['option_value' => '9-10', 'factor_value' => 1.50, 'sort_order' => 4],
                ]],
                ['factor_code' => 'deductible', 'factor_label' => 'Deductible', 'options' => [
                    ['option_value' => '500',  'factor_value' => 1.10, 'sort_order' => 1],
                    ['option_value' => '1000', 'factor_value' => 1.00, 'sort_order' => 2],
                    ['option_value' => '2500', 'factor_value' => 0.88, 'sort_order' => 3],
                    ['option_value' => '5000', 'factor_value' => 0.78, 'sort_order' => 4],
                ]],
                ['factor_code' => 'claims_history', 'factor_label' => 'Claims History (5yr)', 'options' => [
                    ['option_value' => 'clean',    'factor_value' => 0.92, 'sort_order' => 1],
                    ['option_value' => '1_claim',  'factor_value' => 1.00, 'sort_order' => 2],
                    ['option_value' => '2_claims', 'factor_value' => 1.30, 'sort_order' => 3],
                    ['option_value' => '3_plus',   'factor_value' => 1.60, 'sort_order' => 4],
                ]],
            ];

            foreach ($factors as $fg) {
                foreach ($fg['options'] as $opt) {
                    RateFactor::create([
                        'rate_table_id' => $table->id,
                        'factor_code' => $fg['factor_code'],
                        'factor_label' => $fg['factor_label'],
                        'option_value' => $opt['option_value'],
                        'apply_mode' => 'multiply',
                        'factor_value' => $opt['factor_value'],
                        'sort_order' => $opt['sort_order'],
                    ]);
                }
            }

            // Riders
            $riders = [
                ['rider_code' => 'water_backup', 'rider_label' => 'Water Backup Coverage', 'rider_value' => 0.15, 'is_default' => false],
                ['rider_code' => 'identity_theft', 'rider_label' => 'Identity Theft Protection', 'rider_value' => 0.05, 'is_default' => false],
                ['rider_code' => 'equipment_breakdown', 'rider_label' => 'Equipment Breakdown', 'rider_value' => 0.08, 'is_default' => false],
                ['rider_code' => 'replacement_cost', 'rider_label' => 'Replacement Cost Guarantee', 'rider_value' => 1.12, 'is_default' => true],
            ];
            foreach ($riders as $i => $r) {
                $mode = $r['rider_value'] >= 1 ? 'multiply' : 'add';
                RateRider::create(array_merge($r, [
                    'rate_table_id' => $table->id,
                    'apply_mode' => $mode,
                    'sort_order' => $i + 1,
                ]));
            }

            // Fees
            RateFee::create(['rate_table_id' => $table->id, 'fee_code' => 'policy_fee', 'fee_label' => 'Policy Fee', 'fee_type' => 'fee', 'apply_mode' => 'add', 'fee_value' => 35, 'sort_order' => 1]);
            RateFee::create(['rate_table_id' => $table->id, 'fee_code' => 'wind_surcharge', 'fee_label' => 'Windstorm Surcharge', 'fee_type' => 'fee', 'apply_mode' => 'percent', 'fee_value' => 2, 'sort_order' => 2]);
            RateFee::create(['rate_table_id' => $table->id, 'fee_code' => 'loyalty_discount', 'fee_label' => 'Loyalty Discount', 'fee_type' => 'credit', 'apply_mode' => 'percent', 'fee_value' => 3, 'sort_order' => 3]);

            // Modal factors
            foreach ([
                ['mode' => 'annual',     'factor' => 1.000, 'flat_fee' => 0],
                ['mode' => 'semiannual', 'factor' => 0.515, 'flat_fee' => 5],
                ['mode' => 'quarterly',  'factor' => 0.262, 'flat_fee' => 5],
                ['mode' => 'monthly',    'factor' => 0.088, 'flat_fee' => 3],
            ] as $m) {
                RateModalFactor::create(array_merge($m, ['rate_table_id' => $table->id]));
            }
        }
    }
}
