<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('category');
            $table->string('business_name');
            $table->text('description')->nullable();
            $table->json('service_area')->nullable();
            $table->string('website')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('logo_url')->nullable();
            $table->decimal('rating', 3, 2)->default(0);
            $table->integer('review_count')->default(0);
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('partner_referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('listing_id')->constrained('partner_listings')->cascadeOnDelete();
            $table->foreignId('referred_by')->constrained('users');
            $table->foreignId('consumer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['pending', 'contacted', 'converted'])->default('pending');
            $table->decimal('commission_earned', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_referrals');
        Schema::dropIfExists('partner_listings');
    }
};
