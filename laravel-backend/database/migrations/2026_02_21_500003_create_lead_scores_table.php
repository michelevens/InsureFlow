<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('insurance_profile_id')->constrained()->onDelete('cascade');
            $table->unsignedTinyInteger('score')->default(0); // 0–100
            $table->json('factors')->nullable(); // breakdown of scoring factors
            $table->string('model_version')->default('rule-v1');
            $table->timestamps();

            $table->unique('insurance_profile_id');
            $table->index('score');
        });

        Schema::create('lead_engagement_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('insurance_profile_id')->constrained()->onDelete('cascade');
            $table->string('event_type'); // page_view, quote_viewed, application_started, document_uploaded, message_sent, etc.
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['insurance_profile_id', 'created_at']);
            $table->index('event_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_engagement_events');
        Schema::dropIfExists('lead_scores');
    }
};
