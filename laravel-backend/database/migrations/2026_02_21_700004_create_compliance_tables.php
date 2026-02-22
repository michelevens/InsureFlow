<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('agent_licenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('state', 2); // US state abbreviation
            $table->string('license_number');
            $table->string('license_type')->default('producer'); // producer, surplus_lines, adjuster
            $table->json('lines_of_authority')->nullable(); // ["life", "health", "property", "casualty"]
            $table->enum('status', ['active', 'expired', 'suspended', 'revoked', 'pending'])->default('active');
            $table->date('issue_date')->nullable();
            $table->date('expiration_date');
            $table->string('npn')->nullable(); // National Producer Number
            $table->timestamps();

            $table->unique(['user_id', 'state', 'license_number']);
        });

        Schema::create('ce_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('course_name');
            $table->string('provider')->nullable();
            $table->decimal('hours', 5, 1);
            $table->string('category')->nullable(); // ethics, general, flood, long_term_care
            $table->string('state', 2)->nullable(); // state the CE applies to
            $table->date('completion_date');
            $table->string('certificate_url')->nullable();
            $table->string('course_number')->nullable();
            $table->timestamps();
        });

        Schema::create('eo_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('carrier');
            $table->string('policy_number');
            $table->decimal('coverage_amount', 12, 2);
            $table->decimal('deductible', 12, 2)->nullable();
            $table->date('effective_date');
            $table->date('expiration_date');
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $table->string('certificate_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eo_policies');
        Schema::dropIfExists('ce_credits');
        Schema::dropIfExists('agent_licenses');
    }
};
