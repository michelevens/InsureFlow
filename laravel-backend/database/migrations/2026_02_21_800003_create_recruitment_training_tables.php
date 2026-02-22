<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('job_postings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')->nullable()->constrained('agencies')->onDelete('set null');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('requirements')->nullable();
            $table->json('compensation')->nullable();
            $table->string('location')->nullable();
            $table->boolean('is_remote')->default(false);
            $table->enum('status', ['draft', 'active', 'closed', 'filled'])->default('draft');
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'independent'])->default('full_time');
            $table->timestamps();
        });

        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_posting_id')->constrained()->onDelete('cascade');
            $table->string('applicant_name');
            $table->string('applicant_email');
            $table->string('applicant_phone')->nullable();
            $table->string('resume_url')->nullable();
            $table->text('cover_letter')->nullable();
            $table->json('experience')->nullable();
            $table->enum('status', ['submitted', 'reviewing', 'interview', 'offered', 'hired', 'rejected'])->default('submitted');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('training_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained()->onDelete('set null');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('content_type', ['video', 'article', 'quiz', 'interactive', 'document'])->default('article');
            $table->string('content_url')->nullable();
            $table->text('content_body')->nullable();
            $table->string('category')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_required')->default(false);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('training_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_module_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->integer('score')->nullable();
            $table->integer('time_spent_minutes')->nullable();
            $table->timestamps();

            $table->unique(['training_module_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_completions');
        Schema::dropIfExists('training_modules');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('job_postings');
    }
};
