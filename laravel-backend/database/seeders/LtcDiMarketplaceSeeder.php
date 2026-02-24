<?php

namespace Database\Seeders;

use App\Models\Agency;
use App\Models\Coverage;
use App\Models\InsuredObject;
use App\Models\Lead;
use App\Models\LeadScenario;
use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LtcDiMarketplaceSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Creating LTC/Disability marketplace demo with 3 clients...');

        $agencies = Agency::where('is_active', true)->with('owner')->get();
        $this->command->info("Found {$agencies->count()} agencies.");

        $clients = $this->getClientDefinitions();
        $carriers = $this->getCarrierScenarios();

        foreach ($clients as $clientNum => $clientDef) {
            $this->command->info("\n═══ Client {$clientNum}: {$clientDef['name']} ({$clientDef['email']}) ═══");

            // ── Create consumer user ────────────────────────────────────
            $consumer = User::updateOrCreate(
                ['email' => $clientDef['email']],
                [
                    'name' => $clientDef['name'],
                    'password' => 'password',
                    'role' => 'consumer',
                    'phone' => $clientDef['phone'],
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            // ── Create marketplace quote request ────────────────────────
            $quoteRequest = QuoteRequest::create([
                'user_id' => $consumer->id,
                'first_name' => $clientDef['first_name'],
                'last_name' => $clientDef['last_name'],
                'email' => $clientDef['email'],
                'phone' => $clientDef['phone'],
                'insurance_type' => 'long_term_care',
                'zip_code' => $clientDef['zip'],
                'state' => $clientDef['state'],
                'coverage_level' => $clientDef['coverage_level'],
                'description' => $clientDef['description'],
                'details' => $clientDef['details'],
                'date_of_birth' => $clientDef['dob'],
                'is_marketplace' => true,
                'expires_at' => now()->addDays(30),
            ]);
            $this->command->info("  Quote Request #{$quoteRequest->id}");

            // ── Create leads + scenarios for ALL agencies ────────────────
            foreach ($agencies as $index => $agency) {
                $agent = $agency->owner;
                if (!$agent) continue;

                $lead = Lead::create([
                    'agent_id' => $agent->id,
                    'agency_id' => $agency->id,
                    'quote_request_id' => $quoteRequest->id,
                    'consumer_id' => $consumer->id,
                    'first_name' => $clientDef['first_name'],
                    'last_name' => $clientDef['last_name'],
                    'email' => $clientDef['email'],
                    'phone' => $clientDef['phone'],
                    'insurance_type' => 'long_term_care',
                    'status' => 'quoted',
                    'source' => 'marketplace',
                    'estimated_value' => rand(3000, 8000),
                    'notes' => "Marketplace request: {$clientDef['short_desc']}",
                ]);

                // Each agency gets a different carrier (cycle through list)
                $ltcCarrier = $carriers['ltc'][$index % count($carriers['ltc'])];
                $ltdCarrier = $carriers['ltd'][$index % count($carriers['ltd'])];

                // Adjust premiums per client profile (age/health/income factors)
                $ltcAdjusted = $this->adjustLtcForClient($ltcCarrier, $clientDef);
                $ltdAdjusted = $this->adjustLtdForClient($ltdCarrier, $clientDef);

                $ltcScenario = $this->createLtcScenario($lead, $agent, $ltcAdjusted, $clientDef);
                $ltdScenario = $this->createLtdScenario($lead, $agent, $ltdAdjusted, $clientDef);

                $this->command->info("  {$agency->name}: LTC \${$ltcScenario->best_quoted_premium}/mo | LTD \${$ltdScenario->best_quoted_premium}/mo");
            }
        }

        $this->command->info("\n════════════════════════════════════════");
        $this->command->info("Done! 3 clients × {$agencies->count()} agencies × 2 scenarios each");
        $this->command->info("Logins (all password: 'password'):");
        foreach ($clients as $num => $c) {
            $this->command->info("  Client {$num}: {$c['email']}");
        }
        $this->command->info("Consumer portal: /portal/quotes");
    }

    // ── Client Definitions ──────────────────────────────────────────────

    private function getClientDefinitions(): array
    {
        return [
            1 => [
                'email' => 'contact+ltd1@ennhealth.com',
                'name' => 'Michel Duvalier',
                'first_name' => 'Michel',
                'last_name' => 'Duvalier',
                'phone' => '(305) 555-8801',
                'dob' => '1971-03-15',
                'age' => 55,
                'gender' => 'male',
                'state' => 'FL',
                'zip' => '33137',
                'occupation' => 'Financial Advisor',
                'annual_income' => 120000,
                'height_inches' => 70,
                'weight_lbs' => 175,
                'tobacco' => false,
                'coverage_level' => 'premium',
                'short_desc' => 'Couple 55 & 52, seeking LTC + LTD comparison.',
                'description' => 'Couple aged 55 & 52, looking for Long-Term Care and Disability coverage. '
                    . 'Both healthy, non-smokers. Financial advisor + registered nurse. '
                    . 'Interested in comparing plans with inflation protection and home care. '
                    . 'Combined household income $180,000/year.',
                'details' => [
                    'applicant_age' => 55, 'spouse_age' => 52,
                    'household_income' => 180000, 'health_status' => 'excellent',
                    'tobacco' => false, 'existing_coverage' => 'none',
                    'priorities' => ['home_care', 'inflation_protection', 'shared_benefit'],
                ],
                'spouse' => [
                    'name' => 'Marie Duvalier',
                    'dob' => '1974-07-22',
                    'gender' => 'female',
                    'occupation' => 'Registered Nurse',
                    'annual_income' => 60000,
                    'height_inches' => 64,
                    'weight_lbs' => 135,
                ],
                'premium_factor' => 1.0,  // baseline
            ],
            2 => [
                'email' => 'contact+ltd2@ennhealth.com',
                'name' => 'Robert Chen',
                'first_name' => 'Robert',
                'last_name' => 'Chen',
                'phone' => '(404) 555-8802',
                'dob' => '1966-08-22',
                'age' => 59,
                'gender' => 'male',
                'state' => 'GA',
                'zip' => '30305',
                'occupation' => 'Physician (Internal Medicine)',
                'annual_income' => 285000,
                'height_inches' => 68,
                'weight_lbs' => 180,
                'tobacco' => false,
                'coverage_level' => 'premium',
                'short_desc' => 'Physician 59, high income, seeking premium LTC + DI.',
                'description' => 'Physician aged 59, Internal Medicine practice. Single, no dependents. '
                    . 'Annual income $285K. Seeking maximum LTC daily benefit and own-occupation '
                    . 'disability coverage. Wants 5% compound inflation and partnership plan. '
                    . 'Prefers top-rated carriers.',
                'details' => [
                    'applicant_age' => 59, 'spouse_age' => null,
                    'household_income' => 285000, 'health_status' => 'good',
                    'tobacco' => false, 'existing_coverage' => 'group_ltd_employer',
                    'priorities' => ['max_benefit', 'own_occupation', 'inflation_5pct'],
                ],
                'spouse' => null,
                'premium_factor' => 1.35,  // older = higher premiums
            ],
            3 => [
                'email' => 'contact+ltd3@ennhealth.com',
                'name' => 'Patricia & James Williams',
                'first_name' => 'Patricia',
                'last_name' => 'Williams',
                'phone' => '(813) 555-8803',
                'dob' => '1976-11-05',
                'age' => 49,
                'gender' => 'female',
                'state' => 'FL',
                'zip' => '33607',
                'occupation' => 'Marketing Director',
                'annual_income' => 95000,
                'height_inches' => 66,
                'weight_lbs' => 145,
                'tobacco' => false,
                'coverage_level' => 'standard',
                'short_desc' => 'Couple 49 & 51, budget-conscious LTC + LTD.',
                'description' => 'Couple aged 49 & 51. Both working, combined income $175K. '
                    . 'Looking for affordable LTC and disability coverage. '
                    . 'Prefer lower premiums even if it means lower daily benefit. '
                    . 'Open to hybrid plans. No existing LTC coverage.',
                'details' => [
                    'applicant_age' => 49, 'spouse_age' => 51,
                    'household_income' => 175000, 'health_status' => 'excellent',
                    'tobacco' => false, 'existing_coverage' => 'none',
                    'priorities' => ['affordability', 'home_care', 'hybrid_plan'],
                ],
                'spouse' => [
                    'name' => 'James Williams',
                    'dob' => '1975-04-18',
                    'gender' => 'male',
                    'occupation' => 'IT Manager',
                    'annual_income' => 80000,
                    'height_inches' => 72,
                    'weight_lbs' => 195,
                ],
                'premium_factor' => 0.75,  // younger = lower premiums
            ],
        ];
    }

    // ── Premium Adjustments Per Client ───────────────────────────────────

    private function adjustLtcForClient(array $carrier, array $client): array
    {
        $factor = $client['premium_factor'];
        $carrier['monthly_premium'] = round($carrier['monthly_premium'] * $factor);
        return $carrier;
    }

    private function adjustLtdForClient(array $carrier, array $client): array
    {
        $factor = $client['premium_factor'];
        // Also adjust benefit based on income (60% replacement ratio)
        $maxBenefit = round($client['annual_income'] / 12 * 0.6 / 100) * 100;
        $carrier['monthly_benefit'] = min($carrier['monthly_benefit'], $maxBenefit);
        $carrier['monthly_premium'] = round($carrier['monthly_premium'] * $factor);
        return $carrier;
    }

    // ── Scenario Creators ───────────────────────────────────────────────

    private function createLtcScenario(Lead $lead, User $agent, array $carrier, array $client): LeadScenario
    {
        $token = Str::random(64);

        $scenario = LeadScenario::create([
            'lead_id' => $lead->id,
            'agent_id' => $agent->id,
            'scenario_name' => $carrier['name'] . ' — LTC Plan',
            'product_type' => 'long_term_care',
            'priority' => $carrier['priority'],
            'status' => 'quoted',
            'target_premium_monthly' => $carrier['monthly_premium'],
            'best_quoted_premium' => $carrier['monthly_premium'],
            'effective_date_desired' => now()->addDays(30)->format('Y-m-d'),
            'metadata_json' => [
                'carrier' => $carrier['name'],
                'product_name' => $carrier['product'],
                'daily_benefit' => $carrier['daily_benefit'],
                'benefit_period' => $carrier['benefit_period'],
                'inflation_protection' => $carrier['inflation'],
                'elimination_period' => $carrier['elimination_period'],
                'home_care_benefit' => $carrier['home_care'],
                'pool_of_money' => $carrier['daily_benefit'] * $carrier['benefit_days'],
                'partnership_plan' => $carrier['partnership'] ?? false,
                'nonforfeiture' => $carrier['nonforfeiture'] ?? 'contingent',
                'marital_discount' => $carrier['marital_discount'] ?? '15%',
                'payment_mode' => 'monthly',
            ],
            'notes' => $carrier['notes'],
            'consumer_visible' => true,
            'consumer_token' => $token,
            'sent_to_consumer_at' => now()->subHours(rand(1, 48)),
            'consumer_status' => 'pending',
        ]);

        // Primary applicant
        InsuredObject::create([
            'insurable_type' => LeadScenario::class,
            'insurable_id' => $scenario->id,
            'object_type' => 'person',
            'name' => $client['first_name'] . ' ' . $client['last_name'],
            'relationship' => 'self',
            'date_of_birth' => $client['dob'],
            'gender' => $client['gender'],
            'state' => $client['state'],
            'zip' => $client['zip'],
            'tobacco_use' => $client['tobacco'],
            'occupation' => $client['occupation'],
            'annual_income' => $client['annual_income'],
            'height_inches' => $client['height_inches'],
            'weight_lbs' => $client['weight_lbs'],
            'sort_order' => 1,
        ]);

        // Spouse if applicable
        if ($client['spouse']) {
            InsuredObject::create([
                'insurable_type' => LeadScenario::class,
                'insurable_id' => $scenario->id,
                'object_type' => 'person',
                'name' => $client['spouse']['name'],
                'relationship' => 'spouse',
                'date_of_birth' => $client['spouse']['dob'],
                'gender' => $client['spouse']['gender'],
                'state' => $client['state'],
                'zip' => $client['zip'],
                'tobacco_use' => false,
                'occupation' => $client['spouse']['occupation'],
                'annual_income' => $client['spouse']['annual_income'],
                'height_inches' => $client['spouse']['height_inches'],
                'weight_lbs' => $client['spouse']['weight_lbs'],
                'sort_order' => 2,
            ]);
        }

        // Coverages
        foreach ([
            ['coverage_type' => 'daily_ltc_benefit', 'benefit_amount' => $carrier['daily_benefit'], 'benefit_period' => $carrier['benefit_period'], 'elimination_period_days' => $carrier['elimination_period'], 'is_included' => true, 'sort_order' => 1],
            ['coverage_type' => 'home_care', 'benefit_amount' => $carrier['daily_benefit'] * ($carrier['home_care_pct'] / 100), 'is_included' => true, 'sort_order' => 2],
            ['coverage_type' => 'assisted_living', 'benefit_amount' => $carrier['daily_benefit'], 'is_included' => true, 'sort_order' => 3],
            ['coverage_type' => 'nursing_home', 'benefit_amount' => $carrier['daily_benefit'], 'is_included' => true, 'sort_order' => 4],
            ['coverage_type' => 'respite_care', 'benefit_amount' => round($carrier['daily_benefit'] * 0.5), 'is_included' => $carrier['respite'] ?? true, 'sort_order' => 5],
        ] as $cov) {
            Coverage::create(array_merge($cov, [
                'coverable_type' => LeadScenario::class,
                'coverable_id' => $scenario->id,
                'coverage_category' => 'disability',
            ]));
        }

        return $scenario;
    }

    private function createLtdScenario(Lead $lead, User $agent, array $carrier, array $client): LeadScenario
    {
        $token = Str::random(64);

        $scenario = LeadScenario::create([
            'lead_id' => $lead->id,
            'agent_id' => $agent->id,
            'scenario_name' => $carrier['name'] . ' — LTD Plan',
            'product_type' => 'disability_long_term',
            'priority' => $carrier['priority'],
            'status' => 'quoted',
            'target_premium_monthly' => $carrier['monthly_premium'],
            'best_quoted_premium' => $carrier['monthly_premium'],
            'effective_date_desired' => now()->addDays(30)->format('Y-m-d'),
            'metadata_json' => [
                'carrier' => $carrier['name'],
                'product_name' => $carrier['product'],
                'monthly_benefit' => $carrier['monthly_benefit'],
                'benefit_period' => $carrier['benefit_period'],
                'elimination_period_days' => $carrier['elimination_period'],
                'occupation_class' => $carrier['occ_class'],
                'definition_of_disability' => $carrier['definition'],
                'cola' => $carrier['cola'] ?? false,
                'residual' => $carrier['residual'] ?? false,
                'fio' => $carrier['fio'] ?? false,
                'payment_mode' => 'monthly',
            ],
            'notes' => $carrier['notes'],
            'consumer_visible' => true,
            'consumer_token' => $token,
            'sent_to_consumer_at' => now()->subHours(rand(1, 48)),
            'consumer_status' => 'pending',
        ]);

        // Primary applicant only for DI
        InsuredObject::create([
            'insurable_type' => LeadScenario::class,
            'insurable_id' => $scenario->id,
            'object_type' => 'person',
            'name' => $client['first_name'] . ' ' . $client['last_name'],
            'relationship' => 'self',
            'date_of_birth' => $client['dob'],
            'gender' => $client['gender'],
            'state' => $client['state'],
            'zip' => $client['zip'],
            'tobacco_use' => $client['tobacco'],
            'occupation' => $client['occupation'],
            'annual_income' => $client['annual_income'],
            'height_inches' => $client['height_inches'],
            'weight_lbs' => $client['weight_lbs'],
            'sort_order' => 1,
        ]);

        // Coverages
        foreach ([
            ['coverage_type' => 'long_term_disability_benefit', 'benefit_amount' => $carrier['monthly_benefit'], 'benefit_period' => $carrier['benefit_period'], 'elimination_period_days' => $carrier['elimination_period'], 'is_included' => true, 'sort_order' => 1],
            ['coverage_type' => 'residual_disability', 'benefit_amount' => round($carrier['monthly_benefit'] * 0.5), 'is_included' => $carrier['residual'], 'sort_order' => 2],
            ['coverage_type' => 'cost_of_living_adjustment', 'is_included' => $carrier['cola'], 'sort_order' => 3],
            ['coverage_type' => 'future_purchase_option', 'is_included' => $carrier['fio'], 'sort_order' => 4],
            ['coverage_type' => 'own_occupation', 'is_included' => $carrier['definition'] === 'own_occupation', 'sort_order' => 5],
        ] as $cov) {
            Coverage::create(array_merge($cov, [
                'coverable_type' => LeadScenario::class,
                'coverable_id' => $scenario->id,
                'coverage_category' => 'disability',
            ]));
        }

        return $scenario;
    }

    // ── Carrier Data ────────────────────────────────────────────────────

    private function getCarrierScenarios(): array
    {
        return [
            'ltc' => [
                ['name' => 'Mutual of Omaha', 'product' => 'MutualCare Solutions', 'daily_benefit' => 150, 'benefit_period' => '3 years', 'benefit_days' => 1095, 'inflation' => '3% compound', 'elimination_period' => 90, 'home_care' => '100%', 'home_care_pct' => 100, 'respite' => true, 'partnership' => true, 'nonforfeiture' => 'contingent', 'marital_discount' => '15%', 'monthly_premium' => 285, 'priority' => 1, 'notes' => 'Strong A+ rated carrier. 3% compound inflation, full home care, partnership qualified. 15% couple discount applied.'],
                ['name' => 'National Guardian Life (NGL)', 'product' => 'NGL Freedom LTC', 'daily_benefit' => 175, 'benefit_period' => '4 years', 'benefit_days' => 1460, 'inflation' => '3% compound', 'elimination_period' => 90, 'home_care' => '100%', 'home_care_pct' => 100, 'respite' => true, 'partnership' => true, 'nonforfeiture' => 'reduced_paidup', 'marital_discount' => '10%', 'monthly_premium' => 342, 'priority' => 2, 'notes' => 'Competitive NGL plan with $175/day, 4-year benefit period, reduced paid-up nonforfeiture. Partnership plan.'],
                ['name' => 'New York Life', 'product' => 'NYL Secure Care', 'daily_benefit' => 200, 'benefit_period' => '5 years', 'benefit_days' => 1825, 'inflation' => '5% compound', 'elimination_period' => 90, 'home_care' => '100%', 'home_care_pct' => 100, 'respite' => true, 'partnership' => true, 'nonforfeiture' => 'reduced_paidup', 'marital_discount' => '20%', 'monthly_premium' => 478, 'priority' => 1, 'notes' => 'Premium NYL plan: $200/day, 5-year benefit, 5% compound inflation. Highest pool-of-money at $365,000. 20% couple discount.'],
                ['name' => 'OneAmerica', 'product' => 'Asset Care', 'daily_benefit' => 150, 'benefit_period' => '6 years', 'benefit_days' => 2190, 'inflation' => '3% compound', 'elimination_period' => 0, 'home_care' => '100%', 'home_care_pct' => 100, 'respite' => true, 'partnership' => false, 'nonforfeiture' => 'return_of_premium', 'marital_discount' => '10%', 'monthly_premium' => 395, 'priority' => 2, 'notes' => 'Hybrid asset-based plan with 0-day elimination. Return of premium feature. 6-year benefit pool.'],
                ['name' => 'Lincoln Financial', 'product' => 'MoneyGuard Plus', 'daily_benefit' => 175, 'benefit_period' => '3 years', 'benefit_days' => 1095, 'inflation' => '3% simple', 'elimination_period' => 90, 'home_care' => '80%', 'home_care_pct' => 80, 'respite' => false, 'partnership' => true, 'nonforfeiture' => 'contingent', 'marital_discount' => '12%', 'monthly_premium' => 265, 'priority' => 3, 'notes' => 'Budget-friendly hybrid plan. 3% simple inflation (not compound). 80% home care. Good value option.'],
                ['name' => 'Pacific Life', 'product' => 'PremierCare LTC', 'daily_benefit' => 200, 'benefit_period' => '4 years', 'benefit_days' => 1460, 'inflation' => '5% compound', 'elimination_period' => 60, 'home_care' => '100%', 'home_care_pct' => 100, 'respite' => true, 'partnership' => true, 'nonforfeiture' => 'reduced_paidup', 'marital_discount' => '15%', 'monthly_premium' => 425, 'priority' => 1, 'notes' => 'Premium plan with 60-day elimination (shorter wait). $200/day, 5% compound, partnership qualified.'],
                ['name' => 'Transamerica', 'product' => 'TransCare III', 'daily_benefit' => 150, 'benefit_period' => '3 years', 'benefit_days' => 1095, 'inflation' => '3% compound', 'elimination_period' => 90, 'home_care' => '100%', 'home_care_pct' => 100, 'respite' => true, 'partnership' => true, 'nonforfeiture' => 'contingent', 'marital_discount' => '10%', 'monthly_premium' => 248, 'priority' => 3, 'notes' => 'Most affordable traditional LTC option. Solid A-rated carrier. Partnership plan with 10% couple discount.'],
                ['name' => 'Securian Financial', 'product' => 'SecureCare Universal', 'daily_benefit' => 175, 'benefit_period' => '5 years', 'benefit_days' => 1825, 'inflation' => '3% compound', 'elimination_period' => 90, 'home_care' => '100%', 'home_care_pct' => 100, 'respite' => true, 'partnership' => true, 'nonforfeiture' => 'reduced_paidup', 'marital_discount' => '15%', 'monthly_premium' => 358, 'priority' => 2, 'notes' => 'Hybrid universal life + LTC. 5-year benefit period, $175/day. Death benefit if LTC not used.'],
                ['name' => 'Genworth', 'product' => 'Privileged Choice Flex 3', 'daily_benefit' => 200, 'benefit_period' => '3 years', 'benefit_days' => 1095, 'inflation' => '3% compound', 'elimination_period' => 90, 'home_care' => '100%', 'home_care_pct' => 100, 'respite' => true, 'partnership' => true, 'nonforfeiture' => 'contingent', 'marital_discount' => '20%', 'monthly_premium' => 312, 'priority' => 2, 'notes' => 'Good value with $200/day benefit. 20% couple discount. Note: Genworth has had rate increase history.'],
                ['name' => 'Nationwide', 'product' => 'CareMatters II', 'daily_benefit' => 150, 'benefit_period' => '4 years', 'benefit_days' => 1460, 'inflation' => '3% compound', 'elimination_period' => 90, 'home_care' => '100%', 'home_care_pct' => 100, 'respite' => true, 'partnership' => false, 'nonforfeiture' => 'return_of_premium', 'marital_discount' => '10%', 'monthly_premium' => 335, 'priority' => 2, 'notes' => 'Hybrid linked-benefit plan. Return of premium if LTC not used. A+ rated Nationwide.'],
            ],
            'ltd' => [
                ['name' => 'Guardian', 'product' => 'ProVider Plus', 'monthly_benefit' => 6500, 'benefit_period' => 'to age 65', 'elimination_period' => 90, 'occ_class' => '4A', 'definition' => 'own_occupation', 'cola' => true, 'residual' => true, 'fio' => true, 'monthly_premium' => 185, 'priority' => 1, 'notes' => 'Top-tier own-occ definition to age 65. Includes COLA, residual, and FIO riders.'],
                ['name' => 'Principal', 'product' => 'Individual Disability Income', 'monthly_benefit' => 6500, 'benefit_period' => 'to age 65', 'elimination_period' => 90, 'occ_class' => '5A', 'definition' => 'own_occupation', 'cola' => true, 'residual' => true, 'fio' => false, 'monthly_premium' => 168, 'priority' => 1, 'notes' => 'Strong own-occ carrier with competitive rates. Class 5A. COLA + residual included.'],
                ['name' => 'MassMutual', 'product' => 'Radius Choice', 'monthly_benefit' => 6000, 'benefit_period' => 'to age 67', 'elimination_period' => 90, 'occ_class' => '4A', 'definition' => 'own_occupation', 'cola' => true, 'residual' => true, 'fio' => true, 'monthly_premium' => 198, 'priority' => 1, 'notes' => 'Benefit to age 67 (extra 2 years). Premium own-occ. COLA + residual + FIO.'],
                ['name' => 'Ameritas', 'product' => 'DInamic Foundation', 'monthly_benefit' => 6500, 'benefit_period' => 'to age 65', 'elimination_period' => 60, 'occ_class' => '4A', 'definition' => 'own_occupation', 'cola' => false, 'residual' => true, 'fio' => true, 'monthly_premium' => 155, 'priority' => 2, 'notes' => 'Budget-friendly with 60-day elimination. No COLA but includes residual and FIO.'],
                ['name' => 'Northwestern Mutual', 'product' => 'Income Protection', 'monthly_benefit' => 7000, 'benefit_period' => 'to age 65', 'elimination_period' => 90, 'occ_class' => '5A', 'definition' => 'own_occupation', 'cola' => true, 'residual' => true, 'fio' => true, 'monthly_premium' => 225, 'priority' => 1, 'notes' => 'Highest benefit ($7K/mo). Premier own-occ carrier. Full rider package. A++ rated.'],
                ['name' => 'Standard Insurance', 'product' => 'Platinum Advantage', 'monthly_benefit' => 6500, 'benefit_period' => 'to age 65', 'elimination_period' => 90, 'occ_class' => '4M', 'definition' => 'own_occupation', 'cola' => true, 'residual' => true, 'fio' => false, 'monthly_premium' => 172, 'priority' => 2, 'notes' => 'Solid mid-tier from The Standard. Class 4M. COLA + residual. Smooth claims.'],
                ['name' => 'Illinois Mutual', 'product' => 'Income Protector', 'monthly_benefit' => 5500, 'benefit_period' => '5 years', 'elimination_period' => 90, 'occ_class' => '3A', 'definition' => 'modified_own_occ', 'cola' => false, 'residual' => true, 'fio' => false, 'monthly_premium' => 118, 'priority' => 3, 'notes' => 'Most affordable option. 5-year benefit. Modified own-occ. Basic protection.'],
                ['name' => 'Mutual of Omaha', 'product' => 'Income Advantage', 'monthly_benefit' => 6500, 'benefit_period' => 'to age 65', 'elimination_period' => 90, 'occ_class' => '4A', 'definition' => 'own_occupation', 'cola' => true, 'residual' => true, 'fio' => true, 'monthly_premium' => 178, 'priority' => 1, 'notes' => 'Full-featured plan from A+ Mutual of Omaha. Own-occ, COLA, residual, FIO.'],
                ['name' => 'Ohio National', 'product' => 'ContinuON', 'monthly_benefit' => 6000, 'benefit_period' => 'to age 65', 'elimination_period' => 90, 'occ_class' => '4A', 'definition' => 'own_occupation', 'cola' => true, 'residual' => false, 'fio' => true, 'monthly_premium' => 158, 'priority' => 2, 'notes' => 'Strong own-occ. No residual but includes COLA + FIO. Good value.'],
                ['name' => 'Unum', 'product' => 'Individual DI', 'monthly_benefit' => 6500, 'benefit_period' => 'to age 65', 'elimination_period' => 90, 'occ_class' => '4A', 'definition' => 'modified_own_occ', 'cola' => true, 'residual' => true, 'fio' => false, 'monthly_premium' => 145, 'priority' => 2, 'notes' => 'Lowest premium for $6.5K benefit. Modified own-occ (24mo then any-occ). Largest DI carrier.'],
            ],
        ];
    }
}
