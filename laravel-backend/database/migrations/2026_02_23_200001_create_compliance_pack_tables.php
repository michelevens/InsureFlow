<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compliance_requirements', function (Blueprint $table) {
            $table->id();
            $table->string('state', 5); // 2-letter code or 'ALL'
            $table->string('insurance_type', 100); // platform_products.slug or 'ALL'
            $table->string('requirement_type', 30); // license, ce_credit, eo_insurance, background_check, appointment, bonding, other
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('details')->nullable(); // hours, sub-requirements, specifics
            $table->string('category', 30); // licensing, education, insurance, regulatory, documentation
            $table->boolean('is_required')->default(true);
            $table->string('frequency', 20); // one_time, annual, biennial, triennial
            $table->string('authority')->nullable(); // regulatory body name
            $table->string('reference_url')->nullable();
            $table->timestamps();

            $table->index(['state', 'insurance_type']);
            $table->index('category');
        });

        Schema::create('compliance_pack_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('agency_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('compliance_requirement_id')->constrained()->onDelete('cascade');
            $table->string('status', 20)->default('pending'); // pending, in_progress, completed, waived, expired
            $table->date('due_date')->nullable();
            $table->date('completed_date')->nullable();
            $table->string('evidence_url')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'compliance_requirement_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compliance_pack_items');
        Schema::dropIfExists('compliance_requirements');
    }
};
