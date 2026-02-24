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

class CarrierRateTableSeeder extends Seeder
{
    /*
    |--------------------------------------------------------------------------
    | LTC Carriers (3 existing + 7 new)
    |--------------------------------------------------------------------------
    */
    private array $ltcCarriers = [
        ['name' => 'Mutual of Omaha',     'slug' => 'mutual-of-omaha',     'version' => 'MOO-2026', 'mult' => 1.05, 'am_best' => 'A+',  'existing' => true],
        ['name' => 'NGL',                  'slug' => 'ngl',                 'version' => 'NGL-2026', 'mult' => 1.12, 'am_best' => 'A',   'existing' => true],
        ['name' => 'New York Life',        'slug' => 'new-york-life',       'version' => 'NYL-2026', 'mult' => 1.35, 'am_best' => 'A++', 'existing' => true],
        ['name' => 'OneAmerica',           'slug' => 'oneamerica',          'version' => 'OAM-2026', 'mult' => 0.95, 'am_best' => 'A+',  'existing' => false],
        ['name' => 'Lincoln Financial',    'slug' => 'lincoln-financial',   'version' => 'LFG-2026', 'mult' => 1.10, 'am_best' => 'A+',  'existing' => false],
        ['name' => 'Pacific Life',         'slug' => 'pacific-life',        'version' => 'PAC-2026', 'mult' => 0.92, 'am_best' => 'A+',  'existing' => false],
        ['name' => 'Transamerica',         'slug' => 'transamerica',        'version' => 'TAM-2026', 'mult' => 1.03, 'am_best' => 'A',   'existing' => false],
        ['name' => 'Securian Financial',   'slug' => 'securian-financial',  'version' => 'SEC-2026', 'mult' => 0.98, 'am_best' => 'A+',  'existing' => false],
        ['name' => 'Genworth',             'slug' => 'genworth',            'version' => 'GEN-2026', 'mult' => 1.18, 'am_best' => 'A-',  'existing' => false],
        ['name' => 'Nationwide',           'slug' => 'nationwide-ltc',      'version' => 'NAT-2026', 'mult' => 0.88, 'am_best' => 'A+',  'existing' => false],
    ];

    /*
    |--------------------------------------------------------------------------
    | LTD Carriers (10 new)
    |--------------------------------------------------------------------------
    */
    private array $ltdCarriers = [
        ['name' => 'Guardian',             'slug' => 'guardian',              'version' => 'GRD-2026', 'mult' => 1.00, 'am_best' => 'A++'],
        ['name' => 'Principal Financial',  'slug' => 'principal',             'version' => 'PRI-2026', 'mult' => 0.95, 'am_best' => 'A+'],
        ['name' => 'MassMutual',           'slug' => 'massmutual',            'version' => 'MML-2026', 'mult' => 1.08, 'am_best' => 'A++'],
        ['name' => 'Ameritas',             'slug' => 'ameritas',              'version' => 'AMR-2026', 'mult' => 0.90, 'am_best' => 'A'],
        ['name' => 'Northwestern Mutual',  'slug' => 'northwestern-mutual',   'version' => 'NWM-2026', 'mult' => 1.15, 'am_best' => 'A++'],
        ['name' => 'The Standard',         'slug' => 'the-standard',          'version' => 'STD-2026', 'mult' => 0.97, 'am_best' => 'A'],
        ['name' => 'Illinois Mutual',      'slug' => 'illinois-mutual',       'version' => 'ILM-2026', 'mult' => 0.85, 'am_best' => 'A-'],
        ['name' => 'Mutual of Omaha',      'slug' => 'mutual-of-omaha-ltd',   'version' => 'MOL-2026', 'mult' => 1.02, 'am_best' => 'A+'],
        ['name' => 'Ohio National',        'slug' => 'ohio-national',         'version' => 'OHN-2026', 'mult' => 0.93, 'am_best' => 'A'],
        ['name' => 'Unum',                 'slug' => 'unum',                  'version' => 'UNM-2026', 'mult' => 1.05, 'am_best' => 'A+'],
    ];

    private const LTC_AGES    = [40, 45, 50, 51, 52, 53, 55, 60, 65, 70, 75];
    private const LTC_SEXES   = ['M', 'F'];
    private const LTC_UW      = ['select', 'standard'];

    private const LTD_SEXES   = ['M', 'F'];
    private const LTD_OCC     = ['1', '2', '3', '4A', '5A', '6A'];

    public function run(): void
    {
        $this->command->info('CarrierRateTableSeeder: starting...');

        // Step 1 — Backfill carrier_id on existing LTC rate tables
        $this->backfillExistingRateTables();

        // Step 2 — Seed new LTC carrier rate tables
        foreach ($this->ltcCarriers as $idx => $def) {
            $carrier = $this->upsertCarrier($def, 'ltc');

            if ($def['existing']) {
                $this->command->info("  [LTC] {$def['name']} — carrier_id backfilled (existing table {$def['version']})");
                continue;
            }

            $this->seedLtcTable($carrier, $def['version'], $def['mult'], $idx);
            $this->command->info("  [LTC] {$def['name']} — {$def['version']} seeded");
        }

        // Step 3 — Seed LTD carrier rate tables
        foreach ($this->ltdCarriers as $idx => $def) {
            $carrier = $this->upsertCarrier($def, 'ltd');
            $this->seedLtdTable($carrier, $def['version'], $def['mult'], $idx);
            $this->command->info("  [LTD] {$def['name']} — {$def['version']} seeded");
        }

        $this->command->info('CarrierRateTableSeeder: done.');
    }

    private function backfillExistingRateTables(): void
    {
        $existingMap = [
            'MOO-2026' => 'mutual-of-omaha',
            'NGL-2026' => 'ngl',
            'NYL-2026' => 'new-york-life',
        ];

        foreach ($existingMap as $version => $slug) {
            $carrierDef = collect($this->ltcCarriers)->firstWhere('slug', $slug);
            $carrier    = $this->upsertCarrier($carrierDef, 'ltc');

            $updated = RateTable::where('version', $version)
                ->whereNull('carrier_id')
                ->update(['carrier_id' => $carrier->id]);

            if ($updated) {
                $this->command->info("  Backfilled carrier_id on {$version} → {$carrier->name}");
            }
        }
    }

    private function upsertCarrier(array $def, string $line): Carrier
    {
        return Carrier::updateOrCreate(
            ['slug' => $def['slug']],
            [
                'name'             => $def['name'],
                'description'      => "{$def['name']} — " . strtoupper($line) . ' insurance carrier',
                'am_best_rating'   => $def['am_best'],
                'states_available' => $this->defaultStates(),
                'is_active'        => true,
            ]
        );
    }

    private function seedLtcTable(Carrier $carrier, string $version, float $mult, int $carrierIdx): void
    {
        $rateTable = RateTable::updateOrCreate(
            ['product_type' => 'ltc', 'version' => $version],
            [
                'carrier_id'  => $carrier->id,
                'name'        => "{$carrier->name} LTC {$version}",
                'is_active'   => true,
            ]
        );

        $this->clearRateTableChildren($rateTable);

        $entries = [];
        $now     = now();

        foreach (self::LTC_AGES as $age) {
            $ageBase = 25.0 + pow(($age - 40) / 10, 2.2) * 35;

            foreach (self::LTC_SEXES as $sex) {
                $sexMult = $sex === 'F' ? 1.30 : 1.00;

                foreach (self::LTC_UW as $uw) {
                    $uwMult  = $uw === 'select' ? 0.85 : 1.00;
                    $rate    = round($ageBase * $sexMult * $uwMult * $mult, 4);

                    $entries[] = [
                        'rate_table_id' => $rateTable->id,
                        'rate_key'      => "{$age}|{$sex}|*|{$uw}",
                        'rate_value'    => $rate,
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ];
                }
            }
        }

        RateTableEntry::insert($entries);

        $this->seedLtcFactors($rateTable, $carrierIdx);
        $this->seedLtcRiders($rateTable, $carrierIdx);
        $this->seedLtcFees($rateTable, $carrierIdx);
        $this->seedLtcModalFactors($rateTable, $carrierIdx);
    }

    private function seedLtdTable(Carrier $carrier, string $version, float $mult, int $carrierIdx): void
    {
        $rateTable = RateTable::updateOrCreate(
            ['product_type' => 'ltd', 'version' => $version],
            [
                'carrier_id'  => $carrier->id,
                'name'        => "{$carrier->name} LTD {$version}",
                'is_active'   => true,
            ]
        );

        $this->clearRateTableChildren($rateTable);

        $entries = [];
        $now     = now();
        $ages    = range(25, 60, 5);

        $occMultipliers = [
            '6A' => 0.70, '5A' => 0.80, '4A' => 0.90,
            '3'  => 1.00, '2'  => 1.20, '1'  => 1.50,
        ];

        foreach ($ages as $age) {
            $ageMult = 0.5 + (($age - 25) * 0.035);

            foreach (self::LTD_SEXES as $sex) {
                $sexMult = $sex === 'F' ? 1.15 : 1.00;

                foreach (self::LTD_OCC as $occ) {
                    $occMult = $occMultipliers[$occ];
                    $rate    = round(1.80 * $ageMult * $sexMult * $occMult * $mult, 4);

                    $entries[] = [
                        'rate_table_id' => $rateTable->id,
                        'rate_key'      => "{$age}|{$sex}|*|{$occ}|*",
                        'rate_value'    => $rate,
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ];
                }
            }
        }

        RateTableEntry::insert($entries);

        $this->seedLtdFactors($rateTable, $carrierIdx);
        $this->seedLtdRiders($rateTable, $carrierIdx);
        $this->seedLtdFees($rateTable, $carrierIdx);
        $this->seedLtdModalFactors($rateTable, $carrierIdx);
    }

    private function seedLtcFactors(RateTable $rt, int $ci): void
    {
        $v = fn (float $lo, float $hi): float => round($lo + (($ci * 0.131) - floor($ci * 0.131)) * ($hi - $lo), 4);

        $groups = [
            'benefit_period' => [
                ['option_value' => '2yr',        'factor_value' => 1.00],
                ['option_value' => '3yr',        'factor_value' => $v(1.33, 1.42)],
                ['option_value' => '5yr',        'factor_value' => $v(1.70, 1.85)],
                ['option_value' => 'unlimited',  'factor_value' => $v(2.40, 2.60)],
            ],
            'elimination_period' => [
                ['option_value' => '30',  'factor_value' => $v(1.25, 1.35)],
                ['option_value' => '60',  'factor_value' => $v(1.08, 1.15)],
                ['option_value' => '90',  'factor_value' => 1.00],
                ['option_value' => '180', 'factor_value' => $v(0.78, 0.85)],
                ['option_value' => '365', 'factor_value' => $v(0.60, 0.70)],
            ],
            'inflation_protection' => [
                ['option_value' => 'none',           'factor_value' => $v(0.65, 0.72)],
                ['option_value' => '1pct_compound',  'factor_value' => 1.00],
                ['option_value' => '3pct_compound',  'factor_value' => $v(1.52, 1.65)],
                ['option_value' => '5pct_compound',  'factor_value' => $v(2.15, 2.40)],
            ],
            'home_care' => [
                ['option_value' => '50pct',  'factor_value' => $v(0.78, 0.87)],
                ['option_value' => '80pct',  'factor_value' => $v(0.92, 0.96)],
                ['option_value' => '100pct', 'factor_value' => 1.00],
            ],
            'marital_discount' => [
                ['option_value' => 'none',         'factor_value' => 1.00],
                ['option_value' => 'both_insured', 'factor_value' => $v(0.78, 0.85)],
                ['option_value' => 'one_insured',  'factor_value' => $v(0.87, 0.92)],
            ],
            'nonforfeiture' => [
                ['option_value' => 'none',           'factor_value' => 1.00],
                ['option_value' => 'contingent',     'factor_value' => $v(1.02, 1.05)],
                ['option_value' => 'reduced_paidup', 'factor_value' => $v(1.12, 1.20)],
            ],
            'payment_duration' => [
                ['option_value' => 'lifetime',  'factor_value' => 1.00],
                ['option_value' => '10pay',     'factor_value' => $v(2.05, 2.25)],
                ['option_value' => 'paid_up65', 'factor_value' => $v(1.75, 1.90)],
            ],
        ];

        foreach ($groups as $factorGroup => $options) {
            foreach ($options as $opt) {
                RateFactor::create([
                    'rate_table_id' => $rt->id,
                    'factor_code'   => $factorGroup,
                    'factor_label'  => ucwords(str_replace('_', ' ', $factorGroup)),
                    'apply_mode'    => 'multiply',
                    'option_value'  => $opt['option_value'],
                    'factor_value'  => $opt['factor_value'],
                ]);
            }
        }
    }

    private function seedLtcRiders(RateTable $rt, int $ci): void
    {
        $v = fn (float $lo, float $hi): float => round($lo + (($ci * 0.173) - floor($ci * 0.173)) * ($hi - $lo), 4);

        $allRiders = [
            ['rider_code' => 'restoration',       'rider_label' => 'Restoration of Benefit',  'apply_mode' => 'multiply', 'rider_value' => $v(1.06, 1.14)],
            ['rider_code' => 'spouse_waiver',      'rider_label' => 'Spouse Premium Waiver',   'apply_mode' => 'multiply', 'rider_value' => $v(1.04, 1.08)],
            ['rider_code' => 'cash_benefit',       'rider_label' => 'Cash Benefit 25%',        'apply_mode' => 'add',      'rider_value' => $v(0.40, 0.65)],
            ['rider_code' => 'international_care', 'rider_label' => 'International Coverage',  'apply_mode' => 'add',      'rider_value' => $v(0.25, 0.40)],
            ['rider_code' => 'shared_care',        'rider_label' => 'Shared Care Couples',     'apply_mode' => 'multiply', 'rider_value' => $v(1.10, 1.18)],
        ];

        $offerCount = 3 + ($ci % 3);
        $riders     = array_slice($allRiders, 0, $offerCount);

        foreach ($riders as $rider) {
            RateRider::create(array_merge($rider, ['rate_table_id' => $rt->id]));
        }
    }

    private function seedLtcFees(RateTable $rt, int $ci): void
    {
        $v = fn (float $lo, float $hi): float => round($lo + (($ci * 0.197) - floor($ci * 0.197)) * ($hi - $lo), 2);

        RateFee::create([
            'rate_table_id' => $rt->id,
            'fee_code'      => 'policy_fee',
            'fee_label'      => 'Policy Fee',
            'fee_type'      => 'fee',
            'apply_mode'   => 'add',
            'fee_value'     => $v(40, 65),
        ]);

        RateFee::create([
            'rate_table_id' => $rt->id,
            'fee_code'      => 'partnership_credit',
            'fee_label'      => 'Partnership Program Credit',
            'fee_type'      => 'credit',
            'apply_mode'   => 'percent',
            'fee_value'     => $v(1.0, 3.0),
        ]);
    }

    private function seedLtcModalFactors(RateTable $rt, int $ci): void
    {
        $v = fn (float $lo, float $hi): float => round($lo + (($ci * 0.149) - floor($ci * 0.149)) * ($hi - $lo), 2);

        $modals = [
            ['mode' => 'annual',      'factor' => 1.0,    'flat_fee' => 0],
            ['mode' => 'semiannual',  'factor' => 0.52,   'flat_fee' => 0],
            ['mode' => 'quarterly',   'factor' => 0.265,  'flat_fee' => $v(2.00, 3.50)],
            ['mode' => 'monthly',     'factor' => 0.0875, 'flat_fee' => $v(4.00, 6.00)],
        ];

        foreach ($modals as $m) {
            RateModalFactor::create(array_merge($m, ['rate_table_id' => $rt->id]));
        }
    }

    private function seedLtdFactors(RateTable $rt, int $ci): void
    {
        $v = fn (float $lo, float $hi): float => round($lo + (($ci * 0.137) - floor($ci * 0.137)) * ($hi - $lo), 4);

        $groups = [
            'elimination_period' => [
                ['option_value' => '30',  'factor_value' => $v(1.20, 1.30)],
                ['option_value' => '60',  'factor_value' => $v(1.08, 1.13)],
                ['option_value' => '90',  'factor_value' => 1.00],
                ['option_value' => '180', 'factor_value' => $v(0.82, 0.88)],
                ['option_value' => '365', 'factor_value' => $v(0.65, 0.75)],
            ],
            'benefit_period' => [
                ['option_value' => '2yr',      'factor_value' => $v(0.55, 0.65)],
                ['option_value' => '5yr',      'factor_value' => $v(0.77, 0.85)],
                ['option_value' => 'to65',     'factor_value' => 1.00],
                ['option_value' => 'lifetime', 'factor_value' => $v(1.35, 1.45)],
            ],
            'definition_of_disability' => [
                ['option_value' => 'own_occupation',           'factor_value' => $v(1.15, 1.25)],
                ['option_value' => 'own_occ_2yr_then_any',     'factor_value' => 1.00],
                ['option_value' => 'any_occupation',           'factor_value' => $v(0.78, 0.85)],
            ],
            'smoker_status' => [
                ['option_value' => 'no',  'factor_value' => 1.00],
                ['option_value' => 'yes', 'factor_value' => $v(1.40, 1.60)],
            ],
            'bmi_build' => [
                ['option_value' => 'normal',     'factor_value' => 1.00],
                ['option_value' => 'overweight',  'factor_value' => $v(1.08, 1.15)],
                ['option_value' => 'obese_1',     'factor_value' => $v(1.25, 1.35)],
                ['option_value' => 'obese_2',     'factor_value' => $v(1.50, 1.70)],
            ],
            'health_class' => [
                ['option_value' => 'preferred',   'factor_value' => $v(0.82, 0.88)],
                ['option_value' => 'standard',    'factor_value' => 1.00],
                ['option_value' => 'substandard', 'factor_value' => $v(1.40, 1.60)],
            ],
        ];

        foreach ($groups as $factorGroup => $options) {
            foreach ($options as $opt) {
                RateFactor::create([
                    'rate_table_id' => $rt->id,
                    'factor_code'   => $factorGroup,
                    'factor_label'  => ucwords(str_replace('_', ' ', $factorGroup)),
                    'apply_mode'    => 'multiply',
                    'option_value'  => $opt['option_value'],
                    'factor_value'  => $opt['factor_value'],
                ]);
            }
        }
    }

    private function seedLtdRiders(RateTable $rt, int $ci): void
    {
        $v = fn (float $lo, float $hi): float => round($lo + (($ci * 0.163) - floor($ci * 0.163)) * ($hi - $lo), 4);

        $allRiders = [
            ['rider_code' => 'cola',         'rider_label' => 'COLA',                     'apply_mode' => 'add',      'rider_value' => $v(0.30, 0.42)],
            ['rider_code' => 'fio',          'rider_label' => 'Future Increase Option',   'apply_mode' => 'add',      'rider_value' => $v(0.15, 0.28)],
            ['rider_code' => 'residual',     'rider_label' => 'Residual/Partial',         'apply_mode' => 'multiply', 'rider_value' => $v(1.10, 1.20)],
            ['rider_code' => 'catastrophic', 'rider_label' => 'Catastrophic Disability',  'apply_mode' => 'add',      'rider_value' => $v(0.08, 0.18)],
            ['rider_code' => 'retirement',   'rider_label' => 'Retirement Protection',    'apply_mode' => 'add',      'rider_value' => $v(0.20, 0.32)],
            ['rider_code' => 'student_loan', 'rider_label' => 'Student Loan',             'apply_mode' => 'add',      'rider_value' => $v(0.07, 0.14)],
            ['rider_code' => 'mn_buyout',    'rider_label' => 'Mental/Nervous Buy-out',   'apply_mode' => 'add',      'rider_value' => $v(0.05, 0.12)],
        ];

        $offerCount = 4 + ($ci % 4);
        $riders     = array_slice($allRiders, 0, $offerCount);

        foreach ($riders as $rider) {
            RateRider::create(array_merge($rider, ['rate_table_id' => $rt->id]));
        }
    }

    private function seedLtdFees(RateTable $rt, int $ci): void
    {
        $v = fn (float $lo, float $hi): float => round($lo + (($ci * 0.211) - floor($ci * 0.211)) * ($hi - $lo), 2);

        RateFee::create([
            'rate_table_id' => $rt->id,
            'fee_code'      => 'policy_fee',
            'fee_label'      => 'Policy Fee',
            'fee_type'      => 'fee',
            'apply_mode'   => 'add',
            'fee_value'     => $v(60, 90),
        ]);

        RateFee::create([
            'rate_table_id' => $rt->id,
            'fee_code'      => 'admin_fee',
            'fee_label'      => 'Administrative Fee',
            'fee_type'      => 'fee',
            'apply_mode'   => 'add',
            'fee_value'     => $v(15, 30),
        ]);

        RateFee::create([
            'rate_table_id' => $rt->id,
            'fee_code'      => 'multi_policy',
            'fee_label'      => 'Multi-Policy Discount',
            'fee_type'      => 'credit',
            'apply_mode'   => 'percent',
            'fee_value'     => $v(3, 7),
        ]);

        RateFee::create([
            'rate_table_id' => $rt->id,
            'fee_code'      => 'annual_pay',
            'fee_label'      => 'Annual Payment Discount',
            'fee_type'      => 'credit',
            'apply_mode'   => 'percent',
            'fee_value'     => $v(2, 4),
        ]);
    }

    private function seedLtdModalFactors(RateTable $rt, int $ci): void
    {
        $v = fn (float $lo, float $hi): float => round($lo + (($ci * 0.149) - floor($ci * 0.149)) * ($hi - $lo), 2);

        $modals = [
            ['mode' => 'annual',      'factor' => 1.0,    'flat_fee' => 0],
            ['mode' => 'semiannual',  'factor' => 0.52,   'flat_fee' => 0],
            ['mode' => 'quarterly',   'factor' => 0.265,  'flat_fee' => $v(2.00, 3.50)],
            ['mode' => 'monthly',     'factor' => 0.0875, 'flat_fee' => $v(4.00, 6.00)],
        ];

        foreach ($modals as $m) {
            RateModalFactor::create(array_merge($m, ['rate_table_id' => $rt->id]));
        }
    }

    private function clearRateTableChildren(RateTable $rt): void
    {
        RateTableEntry::where('rate_table_id', $rt->id)->delete();
        RateFactor::where('rate_table_id', $rt->id)->delete();
        RateRider::where('rate_table_id', $rt->id)->delete();
        RateFee::where('rate_table_id', $rt->id)->delete();
        RateModalFactor::where('rate_table_id', $rt->id)->delete();
    }

    private function defaultStates(): array
    {
        return [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
            'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
            'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
            'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
            'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI',
            'WY',
        ];
    }
}
