<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Versioned rate tables — one per product_type + version
        Schema::create('rate_tables', function (Blueprint $table) {
            $table->id();
            $table->string('product_type', 60)->index();
            $table->string('version', 20);           // e.g. "2026-Q1"
            $table->string('name');                    // human-readable
            $table->date('effective_date');
            $table->date('expiration_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();      // carrier, region, etc.
            $table->timestamps();
            $table->unique(['product_type', 'version']);
        });

        // Base rate entries — lookup rows keyed by dimensions
        Schema::create('rate_table_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rate_table_id')->constrained('rate_tables')->cascadeOnDelete();
            $table->string('rate_key', 255);           // composite key: "35|M|NY|4A|standard"
            $table->decimal('rate_value', 12, 6);      // base rate per unit
            $table->json('dimensions')->nullable();     // { age:35, sex:"M", state:"NY", occ_class:"4A", uw_class:"standard" }
            $table->timestamps();
            $table->index(['rate_table_id', 'rate_key']);
        });

        // Configurable factors — multiplicative or additive
        Schema::create('rate_factors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rate_table_id')->constrained('rate_tables')->cascadeOnDelete();
            $table->string('factor_code', 60);         // e.g. "elimination_period", "benefit_period", "smoker"
            $table->string('factor_label');
            $table->string('option_value', 120);       // the selected option: "90", "5yr", "yes"
            $table->string('apply_mode', 20)->default('multiply'); // multiply | add | subtract
            $table->decimal('factor_value', 10, 6);    // the factor or flat amount
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->index(['rate_table_id', 'factor_code']);
        });

        // Rider definitions — additive or multiplicative pricing
        Schema::create('rate_riders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rate_table_id')->constrained('rate_tables')->cascadeOnDelete();
            $table->string('rider_code', 60);          // e.g. "cola", "fio", "residual", "catastrophic"
            $table->string('rider_label');
            $table->string('apply_mode', 20)->default('add'); // add | multiply
            $table->decimal('rider_value', 10, 6);     // flat add or multiplier
            $table->string('rate_key_pattern', 255)->nullable(); // optional per-class rate key
            $table->boolean('is_default')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->index(['rate_table_id', 'rider_code']);
        });

        // Fees and credits
        Schema::create('rate_fees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rate_table_id')->constrained('rate_tables')->cascadeOnDelete();
            $table->string('fee_code', 60);            // e.g. "policy_fee", "admin_fee", "multi_policy_credit"
            $table->string('fee_label');
            $table->string('fee_type', 20);            // fee | credit
            $table->string('apply_mode', 20)->default('add'); // add | percent
            $table->decimal('fee_value', 10, 4);       // flat amount or percentage
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->index(['rate_table_id', 'fee_code']);
        });

        // Modal factors (annual, semi, quarterly, monthly)
        Schema::create('rate_modal_factors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rate_table_id')->constrained('rate_tables')->cascadeOnDelete();
            $table->string('mode', 20);                // annual, semiannual, quarterly, monthly
            $table->decimal('factor', 8, 6)->default(1.000000);
            $table->decimal('flat_fee', 8, 2)->default(0.00);
            $table->timestamps();
            $table->unique(['rate_table_id', 'mode']);
        });

        // Rating audit log — every run is recorded
        Schema::create('rating_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scenario_id')->nullable()->constrained('lead_scenarios')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('product_type', 60);
            $table->string('rate_table_version', 20)->nullable();
            $table->string('engine_version', 20)->default('1.0');
            $table->string('input_hash', 64);          // SHA-256 of input for reproducibility
            $table->json('input_snapshot');              // full input at time of rating
            $table->json('output_snapshot');              // full output (premium breakdown)
            $table->decimal('final_premium_annual', 12, 2)->nullable();
            $table->decimal('final_premium_monthly', 12, 2)->nullable();
            $table->string('status', 20)->default('completed'); // completed | error | ineligible
            $table->text('error_message')->nullable();
            $table->integer('duration_ms')->nullable();
            $table->timestamps();
            $table->index(['scenario_id']);
            $table->index(['product_type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rating_runs');
        Schema::dropIfExists('rate_modal_factors');
        Schema::dropIfExists('rate_fees');
        Schema::dropIfExists('rate_riders');
        Schema::dropIfExists('rate_factors');
        Schema::dropIfExists('rate_table_entries');
        Schema::dropIfExists('rate_tables');
    }
};
