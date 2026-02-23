<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_scenarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('scenario_name');
            $table->string('product_type'); // Matches Policy.product_type
            $table->tinyInteger('priority')->default(3); // 1=highest 5=lowest

            // Lifecycle
            $table->string('status')->default('draft'); // draft, quoting, quoted, comparing, selected, applied, bound, declined, expired
            $table->foreignId('selected_carrier_id')->nullable()->constrained('carriers')->nullOnDelete();

            // Risk assessment (JSON — violations, claims history, health conditions, etc.)
            $table->json('risk_factors')->nullable();

            // Financials
            $table->decimal('target_premium_monthly', 10, 2)->nullable();
            $table->decimal('best_quoted_premium', 10, 2)->nullable();
            $table->integer('total_applications')->default(0);
            $table->integer('total_quotes_received')->default(0);

            // Dates
            $table->date('effective_date_desired')->nullable();
            $table->date('current_policy_expiration')->nullable();

            // Current coverage (if replacing)
            $table->string('current_carrier')->nullable();
            $table->decimal('current_premium_monthly', 10, 2)->nullable();
            $table->string('current_policy_number')->nullable();

            // Escape hatch: rare carrier/product-specific intake fields
            $table->json('metadata_json')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['lead_id', 'status']);
            $table->index(['product_type', 'status']);
        });

        // ──────────────────────────────────────────────────────────────
        // InsuredObject — what's being insured (polymorphic across
        // LeadScenario, Application, Policy)
        // ──────────────────────────────────────────────────────────────
        Schema::create('insured_objects', function (Blueprint $table) {
            $table->id();
            $table->morphs('insurable'); // insurable_type + insurable_id

            $table->string('object_type'); // person, vehicle, property, business, other
            $table->string('name'); // Person name, "2024 Toyota Camry", "123 Main St", "Acme LLC"
            $table->string('relationship')->nullable(); // primary, spouse, child, additional_driver, additional_insured, dependent, officer

            // Core normalized fields (shared across types)
            $table->date('date_of_birth')->nullable(); // persons
            $table->string('gender')->nullable(); // persons
            $table->string('address_line1')->nullable(); // property / garaging / business
            $table->string('address_line2')->nullable();
            $table->string('city')->nullable();
            $table->string('state', 2)->nullable();
            $table->string('zip', 10)->nullable();

            // Vehicle-specific normalized fields
            $table->integer('vehicle_year')->nullable();
            $table->string('vehicle_make')->nullable();
            $table->string('vehicle_model')->nullable();
            $table->string('vin', 17)->nullable();

            // Property-specific normalized fields
            $table->integer('year_built')->nullable();
            $table->integer('square_footage')->nullable();
            $table->string('construction_type')->nullable();

            // Business-specific normalized fields
            $table->string('fein', 20)->nullable();
            $table->string('naics_code', 10)->nullable();
            $table->decimal('annual_revenue', 14, 2)->nullable();
            $table->integer('employee_count')->nullable();

            // Person health/risk normalized fields (life, health, disability, LTC)
            $table->integer('height_inches')->nullable();
            $table->integer('weight_lbs')->nullable();
            $table->boolean('tobacco_use')->nullable();
            $table->string('occupation')->nullable();
            $table->decimal('annual_income', 12, 2)->nullable();

            // Escape hatch for type-specific fields that don't justify a column
            $table->json('details_json')->nullable();

            $table->tinyInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['insurable_type', 'insurable_id', 'object_type']);
        });

        // ──────────────────────────────────────────────────────────────
        // Coverage / Benefit — uniform coverage model (polymorphic
        // across LeadScenario, Application, Policy)
        // ──────────────────────────────────────────────────────────────
        Schema::create('coverages', function (Blueprint $table) {
            $table->id();
            $table->morphs('coverable'); // coverable_type + coverable_id

            $table->string('coverage_type'); // bodily_injury, property_damage, dwelling, personal_property, death_benefit, monthly_disability_benefit, daily_ltc_benefit, etc.
            $table->string('coverage_category'); // liability, property, medical, life, disability, specialty

            $table->decimal('limit_amount', 14, 2)->nullable(); // e.g., $300K bodily injury limit
            $table->decimal('per_occurrence_limit', 14, 2)->nullable(); // per-occurrence vs aggregate
            $table->decimal('aggregate_limit', 14, 2)->nullable();
            $table->decimal('deductible_amount', 10, 2)->nullable();
            $table->decimal('benefit_amount', 14, 2)->nullable(); // e.g., $500K death benefit, $5K/mo disability
            $table->string('benefit_period')->nullable(); // "10_years", "to_age_65", "lifetime", "26_weeks"
            $table->integer('elimination_period_days')->nullable(); // disability/LTC waiting period
            $table->decimal('coinsurance_pct', 5, 2)->nullable(); // e.g., 80%
            $table->decimal('copay_amount', 8, 2)->nullable();
            $table->boolean('is_included')->default(true);
            $table->decimal('premium_allocated', 10, 2)->nullable();

            // Escape hatch for riders, endorsements, special terms
            $table->json('details_json')->nullable();

            $table->tinyInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['coverable_type', 'coverable_id', 'coverage_category']);
        });

        // ──────────────────────────────────────────────────────────────
        // Product extension tables (1:1 with Policy, thin)
        // ──────────────────────────────────────────────────────────────
        Schema::create('policy_auto_extensions', function (Blueprint $table) {
            $table->foreignId('policy_id')->primary()->constrained()->cascadeOnDelete();
            $table->boolean('multi_car_discount')->default(false);
            $table->boolean('good_driver_discount')->default(false);
            $table->boolean('sr22_filing')->default(false);
            $table->string('prior_insurance_carrier')->nullable();
            $table->integer('prior_insurance_years')->nullable();
            $table->string('garaging_state', 2)->nullable();
        });

        Schema::create('policy_home_extensions', function (Blueprint $table) {
            $table->foreignId('policy_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('protection_class')->nullable();
            $table->string('roof_type')->nullable();
            $table->integer('roof_age')->nullable();
            $table->string('heating_type')->nullable();
            $table->string('foundation_type')->nullable();
            $table->boolean('swimming_pool')->default(false);
            $table->string('mortgage_company')->nullable();
            $table->string('mortgage_loan_number')->nullable();
        });

        Schema::create('policy_life_extensions', function (Blueprint $table) {
            $table->foreignId('policy_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('life_product_subtype')->nullable(); // term_10, term_20, whole, UL, IUL, VUL, GUL, final_expense
            $table->string('health_class')->nullable(); // preferred_plus, preferred, standard_plus, standard, substandard
            $table->decimal('face_amount', 14, 2)->nullable();
            $table->integer('term_length_years')->nullable();
            $table->decimal('cash_value', 14, 2)->nullable();
            $table->string('death_benefit_option')->nullable(); // level, increasing
            $table->string('premium_payment_mode')->nullable(); // life, 10_pay, 20_pay, paid_up_65
            $table->string('dividend_option')->nullable();
        });

        Schema::create('policy_health_extensions', function (Blueprint $table) {
            $table->foreignId('policy_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('plan_type')->nullable(); // HMO, PPO, EPO, POS, HDHP
            $table->string('metal_tier')->nullable(); // bronze, silver, gold, platinum
            $table->string('network_name')->nullable();
            $table->boolean('hsa_eligible')->default(false);
            $table->decimal('out_of_pocket_max', 10, 2)->nullable();
            $table->boolean('includes_dental')->default(false);
            $table->boolean('includes_vision')->default(false);
            $table->string('marketplace_plan_id')->nullable();
        });

        Schema::create('policy_disability_extensions', function (Blueprint $table) {
            $table->foreignId('policy_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('disability_type')->nullable(); // short_term, long_term
            $table->decimal('benefit_percentage', 5, 2)->nullable();
            $table->string('definition_of_disability')->nullable(); // own_occupation, any_occupation, transitional
            $table->boolean('cola_rider')->default(false);
            $table->boolean('residual_disability_rider')->default(false);
            $table->string('mental_nervous_limitation')->nullable();
        });

        Schema::create('policy_ltc_extensions', function (Blueprint $table) {
            $table->foreignId('policy_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('ltc_type')->nullable(); // traditional, hybrid_life, hybrid_annuity
            $table->string('inflation_protection')->nullable(); // none, 3_simple, 3_compound, 5_compound, cpi
            $table->boolean('shared_care')->default(false);
            $table->boolean('home_care_included')->default(true);
            $table->boolean('assisted_living_included')->default(true);
            $table->boolean('nursing_home_included')->default(true);
        });

        Schema::create('policy_commercial_extensions', function (Blueprint $table) {
            $table->foreignId('policy_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('commercial_line_type')->nullable(); // gl, property, bop, wc, commercial_auto, professional, cyber, do, epli
            $table->decimal('experience_mod', 5, 3)->nullable();
            $table->string('governing_class_code')->nullable();
            $table->string('audit_type')->nullable(); // annual, self, waived
            $table->date('retroactive_date')->nullable();
            $table->string('sic_code', 10)->nullable();
        });

        // ──────────────────────────────────────────────────────────────
        // Add product_type to policies + link applications to scenarios
        // ──────────────────────────────────────────────────────────────
        Schema::table('policies', function (Blueprint $table) {
            if (!Schema::hasColumn('policies', 'product_type')) {
                $table->string('product_type')->nullable()->after('type');
            }
            if (!Schema::hasColumn('policies', 'agency_id')) {
                $table->foreignId('agency_id')->nullable()->after('agent_id');
            }
        });

        Schema::table('applications', function (Blueprint $table) {
            if (!Schema::hasColumn('applications', 'lead_scenario_id')) {
                $table->foreignId('lead_scenario_id')->nullable()->after('agency_id')
                    ->constrained('lead_scenarios')->nullOnDelete();
            }
            if (!Schema::hasColumn('applications', 'lead_id')) {
                $table->foreignId('lead_id')->nullable()->after('lead_scenario_id')
                    ->constrained()->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropForeign(['lead_scenario_id']);
            $table->dropForeign(['lead_id']);
            $table->dropColumn(['lead_scenario_id', 'lead_id']);
        });

        Schema::table('policies', function (Blueprint $table) {
            $table->dropColumn(['product_type', 'agency_id']);
        });

        Schema::dropIfExists('policy_commercial_extensions');
        Schema::dropIfExists('policy_ltc_extensions');
        Schema::dropIfExists('policy_disability_extensions');
        Schema::dropIfExists('policy_health_extensions');
        Schema::dropIfExists('policy_life_extensions');
        Schema::dropIfExists('policy_home_extensions');
        Schema::dropIfExists('policy_auto_extensions');
        Schema::dropIfExists('coverages');
        Schema::dropIfExists('insured_objects');
        Schema::dropIfExists('lead_scenarios');
    }
};
