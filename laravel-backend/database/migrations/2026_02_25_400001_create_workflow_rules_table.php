<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('workflow_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('trigger_event'); // lead_created, lead_assigned, application_signed, policy_issued, renewal_approaching, claim_filed, etc.
            $table->json('conditions')->nullable(); // [{field, operator, value}]
            $table->json('actions'); // [{type, config}] — e.g. send_email, assign_agent, update_status, create_task, webhook
            $table->integer('delay_minutes')->default(0); // delay before execution
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(50); // lower = higher priority
            $table->integer('execution_count')->default(0);
            $table->timestamp('last_executed_at')->nullable();
            $table->timestamps();

            $table->index(['agency_id', 'trigger_event', 'is_active']);
        });

        Schema::create('workflow_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_rule_id')->constrained()->cascadeOnDelete();
            $table->foreignId('agency_id')->nullable()->constrained()->nullOnDelete();
            $table->string('trigger_event');
            $table->json('trigger_data')->nullable(); // snapshot of the trigger context
            $table->json('actions_executed')->nullable(); // which actions ran and their results
            $table->string('status')->default('pending'); // pending, running, completed, failed, skipped
            $table->text('error_message')->nullable();
            $table->integer('duration_ms')->nullable();
            $table->timestamps();

            $table->index(['workflow_rule_id', 'status']);
            $table->index(['agency_id', 'created_at']);
        });

        Schema::create('commission_splits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('split_percentage', 5, 2); // e.g. 60.00
            $table->decimal('split_amount', 12, 2)->default(0);
            $table->string('role')->default('primary'); // primary, secondary, referral, override
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['commission_id', 'agent_id']);
        });

        // Add agency_id to commissions if missing
        if (!Schema::hasColumn('commissions', 'agency_id')) {
            Schema::table('commissions', function (Blueprint $table) {
                $table->foreignId('agency_id')->nullable()->after('agent_id')->constrained()->nullOnDelete();
                $table->index('agency_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('commissions', 'agency_id')) {
            Schema::table('commissions', function (Blueprint $table) {
                $table->dropForeign(['agency_id']);
                $table->dropColumn('agency_id');
            });
        }
        Schema::dropIfExists('commission_splits');
        Schema::dropIfExists('workflow_executions');
        Schema::dropIfExists('workflow_rules');
    }
};
