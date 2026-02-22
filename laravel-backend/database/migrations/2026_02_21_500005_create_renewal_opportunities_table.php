<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('renewal_opportunities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('policy_id')->constrained()->onDelete('cascade');
            $table->foreignId('agent_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('consumer_id')->constrained('users')->onDelete('cascade');
            $table->string('status')->default('upcoming'); // upcoming, contacted, requoted, renewed, lost, expired
            $table->date('renewal_date');
            $table->decimal('current_premium', 10, 2);
            $table->decimal('best_new_premium', 10, 2)->nullable();
            $table->unsignedTinyInteger('retention_score')->default(50); // 0–100
            $table->json('retention_factors')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('last_contacted_at')->nullable();
            $table->timestamps();

            $table->index(['agent_id', 'renewal_date']);
            $table->index(['status', 'renewal_date']);
            $table->index('renewal_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('renewal_opportunities');
    }
};
