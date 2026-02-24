<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_marketplace_listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_agency_id')->constrained('agencies')->cascadeOnDelete();
            $table->foreignId('insurance_profile_id')->constrained('insurance_profiles')->cascadeOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();

            // Anonymized listing details (visible to buyers before purchase)
            $table->string('insurance_type', 100);
            $table->string('state', 2)->nullable();
            $table->string('zip_prefix', 3)->nullable(); // first 3 digits of ZIP for geo targeting
            $table->string('coverage_level', 50)->nullable();
            $table->string('urgency', 50)->nullable();

            // Pricing
            $table->decimal('asking_price', 8, 2);
            $table->decimal('platform_fee', 8, 2)->default(0); // calculated on purchase
            $table->decimal('platform_fee_pct', 5, 2)->default(15.00); // default 15%

            // Lead quality signals (anonymized)
            $table->integer('lead_score')->nullable();
            $table->string('lead_grade', 1)->nullable(); // A, B, C, D, F
            $table->boolean('has_phone')->default(false);
            $table->boolean('has_email')->default(true);
            $table->integer('days_old')->default(0);

            // Status
            $table->enum('status', ['active', 'sold', 'expired', 'withdrawn'])->default('active');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('sold_at')->nullable();
            $table->text('seller_notes')->nullable();

            $table->timestamps();
            $table->index(['status', 'insurance_type']);
            $table->index(['state', 'status']);
            $table->index(['asking_price']);
        });

        Schema::create('lead_marketplace_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('listing_id')->constrained('lead_marketplace_listings')->cascadeOnDelete();
            $table->foreignId('buyer_agency_id')->constrained('agencies')->cascadeOnDelete();
            $table->foreignId('buyer_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('seller_agency_id')->constrained('agencies')->cascadeOnDelete();

            // Financial
            $table->decimal('purchase_price', 8, 2);
            $table->decimal('platform_fee', 8, 2);
            $table->decimal('seller_payout', 8, 2);

            // Resulting records
            $table->foreignId('new_profile_id')->nullable()->constrained('insurance_profiles')->nullOnDelete();
            $table->foreignId('new_lead_id')->nullable()->constrained('leads')->nullOnDelete();

            // Status
            $table->enum('status', ['completed', 'refund_requested', 'refunded'])->default('completed');
            $table->text('refund_reason')->nullable();

            $table->timestamps();
            $table->index(['buyer_agency_id', 'created_at']);
            $table->index(['seller_agency_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_marketplace_transactions');
        Schema::dropIfExists('lead_marketplace_listings');
    }
};
