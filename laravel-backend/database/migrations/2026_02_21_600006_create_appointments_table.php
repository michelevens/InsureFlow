<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('consumer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->enum('type', ['consultation', 'review', 'follow_up', 'claim', 'renewal', 'other'])->default('consultation');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->enum('status', ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])->default('scheduled');
            $table->string('location')->nullable(); // address or "virtual"
            $table->string('video_link')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['agent_id', 'date']);
            $table->index(['consumer_id', 'date']);
        });

        Schema::create('agent_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week'); // 0=Sun, 6=Sat
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['agent_id', 'day_of_week']);
        });

        Schema::create('agent_blocked_dates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
            $table->date('blocked_date');
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->unique(['agent_id', 'blocked_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_blocked_dates');
        Schema::dropIfExists('agent_availability');
        Schema::dropIfExists('appointments');
    }
};
