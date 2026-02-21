<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Unified Insurance Profile — canonical consumer record
        Schema::create('insurance_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Consumer identity (normalized once)
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->string('phone', 20)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('zip_code', 10)->nullable();

            // Insurance context
            $table->string('insurance_type'); // auto, home, life, health, etc.
            $table->string('coverage_level')->default('standard'); // basic, standard, premium

            // Journey stage tracking
            $table->enum('current_stage', [
                'intake',       // initial quote request
                'quoted',       // quotes generated
                'lead',         // contact captured, lead created
                'application',  // application submitted
                'policy',       // policy bound
                'renewal',      // active policy approaching renewal
            ])->default('intake');

            // Foreign keys linking to each pipeline stage
            $table->foreignId('quote_request_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('application_id')->nullable();
            $table->unsignedBigInteger('policy_id')->nullable();
            $table->foreignId('assigned_agent_id')->nullable()->constrained('users')->nullOnDelete();

            // Denormalized current state (for fast queries)
            $table->decimal('estimated_value', 10, 2)->nullable();
            $table->decimal('monthly_premium', 10, 2)->nullable();
            $table->decimal('annual_premium', 10, 2)->nullable();

            // Source + metadata
            $table->string('source')->default('calculator'); // calculator, marketplace, referral, direct, embed
            $table->json('details')->nullable(); // flexible coverage preferences snapshot
            $table->json('data_snapshot')->nullable(); // unified view of all stage data
            $table->text('notes')->nullable();

            // Status
            $table->enum('status', ['active', 'converted', 'lost', 'archived'])->default('active');
            $table->timestamp('stage_updated_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            // Foreign key constraints for application and policy
            $table->foreign('application_id')->references('id')->on('applications')->nullOnDelete();
            $table->foreign('policy_id')->references('id')->on('policies')->nullOnDelete();

            // Composite indexes for tenant-scoped queries
            $table->index(['agency_id', 'status']);
            $table->index(['agency_id', 'insurance_type', 'status']);
            $table->index(['agency_id', 'current_stage']);
            $table->index(['agency_id', 'assigned_agent_id']);
            $table->index(['email', 'agency_id']);
            $table->index(['user_id']);
        });

        // Routing rules — configurable lead assignment per agency
        Schema::create('routing_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->integer('priority')->default(0); // higher = matched first
            $table->boolean('is_active')->default(true);

            // Match criteria (all nullable — null means "match any")
            $table->string('insurance_type')->nullable();
            $table->json('zip_codes')->nullable(); // array of zip prefixes or full codes
            $table->json('states')->nullable(); // array of state abbreviations
            $table->string('coverage_level')->nullable();
            $table->string('source')->nullable();

            // Assignment target
            $table->enum('assignment_type', ['agent', 'round_robin', 'capacity'])->default('round_robin');
            $table->foreignId('target_agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('agent_pool')->nullable(); // array of agent IDs for round_robin
            $table->unsignedInteger('last_assigned_index')->default(0); // round-robin pointer

            // Limits
            $table->unsignedInteger('daily_cap')->nullable();
            $table->unsignedInteger('daily_count')->default(0);
            $table->date('daily_count_date')->nullable();

            $table->timestamps();

            $table->index(['agency_id', 'is_active', 'priority']);
        });

        // Add agency_id to existing tables for tenant scoping
        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('agency_id')->nullable()->after('agent_id')->constrained()->nullOnDelete();
            $table->index('agency_id');
        });

        Schema::table('applications', function (Blueprint $table) {
            $table->foreignId('agency_id')->nullable()->after('agent_id')->constrained()->nullOnDelete();
            $table->index('agency_id');
        });

        Schema::table('policies', function (Blueprint $table) {
            $table->foreignId('agency_id')->nullable()->after('agent_id')->constrained()->nullOnDelete();
            $table->index('agency_id');
        });

        Schema::table('quote_requests', function (Blueprint $table) {
            $table->foreignId('agency_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->index('agency_id');
        });
    }

    public function down(): void
    {
        Schema::table('quote_requests', function (Blueprint $table) {
            $table->dropForeign(['agency_id']);
            $table->dropColumn('agency_id');
        });

        Schema::table('policies', function (Blueprint $table) {
            $table->dropForeign(['agency_id']);
            $table->dropColumn('agency_id');
        });

        Schema::table('applications', function (Blueprint $table) {
            $table->dropForeign(['agency_id']);
            $table->dropColumn('agency_id');
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['agency_id']);
            $table->dropColumn('agency_id');
        });

        Schema::dropIfExists('routing_rules');
        Schema::dropIfExists('insurance_profiles');
    }
};
