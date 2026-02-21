<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained()->onDelete('cascade');
            $table->foreignId('consumer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('agent_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('claim_number')->unique();
            $table->string('type'); // property_damage, liability, auto_collision, auto_comprehensive, health, life, other
            $table->string('status')->default('reported'); // reported, under_review, investigating, approved, denied, settled, closed
            $table->date('date_of_loss');
            $table->text('description');
            $table->string('location')->nullable();
            $table->decimal('estimated_amount', 12, 2)->nullable();
            $table->decimal('approved_amount', 12, 2)->nullable();
            $table->decimal('deductible_amount', 12, 2)->nullable();
            $table->decimal('settlement_amount', 12, 2)->nullable();
            $table->json('details')->nullable(); // additional structured data
            $table->timestamp('settled_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['consumer_id', 'status']);
            $table->index(['agent_id', 'status']);
            $table->index(['policy_id', 'created_at']);
            $table->index('status');
        });

        Schema::create('claim_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('claim_id')->constrained()->onDelete('cascade');
            $table->foreignId('document_id')->constrained()->onDelete('cascade');
            $table->string('type')->default('supporting'); // supporting, photo, estimate, police_report, medical_record
            $table->timestamps();
        });

        Schema::create('claim_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('claim_id')->constrained()->onDelete('cascade');
            $table->foreignId('actor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('type'); // status_change, note, document_added, payment, assignment
            $table->text('description');
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['claim_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('claim_activities');
        Schema::dropIfExists('claim_documents');
        Schema::dropIfExists('claims');
    }
};
