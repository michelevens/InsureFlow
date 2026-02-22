<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('host_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('guest_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('organization_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['scheduled', 'waiting', 'in_progress', 'completed', 'cancelled'])->default('scheduled');
            $table->enum('meeting_type', ['system', 'external'])->default('system');
            $table->string('external_service')->nullable();
            $table->string('external_url')->nullable();
            $table->string('meeting_token')->unique();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('video_meeting_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('preferred_provider', ['system', 'custom'])->default('system');
            $table->string('custom_service')->nullable();
            $table->string('custom_meeting_link')->nullable();
            $table->boolean('auto_record')->default(false);
            $table->boolean('waiting_room_enabled')->default(true);
            $table->integer('early_join_minutes')->default(10);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_meeting_settings');
        Schema::dropIfExists('video_meetings');
    }
};
