<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scenario_quotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scenario_id')->constrained('lead_scenarios')->cascadeOnDelete();
            $table->foreignId('carrier_id')->nullable()->constrained('carriers')->nullOnDelete();
            $table->foreignId('carrier_product_id')->nullable()->constrained('carrier_products')->nullOnDelete();
            $table->string('carrier_name'); // denormalized for display
            $table->string('product_name')->nullable();

            // Pricing
            $table->decimal('premium_monthly', 10, 2)->nullable();
            $table->decimal('premium_annual', 10, 2)->nullable();
            $table->decimal('premium_semi_annual', 10, 2)->nullable();
            $table->decimal('premium_quarterly', 10, 2)->nullable();

            // Status
            $table->enum('status', ['pending', 'quoted', 'declined', 'expired', 'selected'])->default('pending');
            $table->timestamp('quoted_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('decline_reason')->nullable();

            // Rating & quality
            $table->string('am_best_rating')->nullable();
            $table->decimal('financial_strength_score', 4, 2)->nullable();

            // Details
            $table->json('coverage_details')->nullable();   // carrier-specific coverage limits/terms
            $table->json('endorsements')->nullable();        // included endorsements/riders
            $table->json('exclusions')->nullable();          // notable exclusions
            $table->json('discounts_applied')->nullable();   // discounts (multi-policy, safe driver, etc.)
            $table->text('agent_notes')->nullable();
            $table->boolean('is_recommended')->default(false); // agent recommendation flag

            $table->timestamps();

            $table->index(['scenario_id', 'status']);
            $table->index(['carrier_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scenario_quotes');
    }
};
