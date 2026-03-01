<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_pool_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('agency_id')->constrained('agencies')->cascadeOnDelete();
            $table->foreignId('claimed_by')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['claimed', 'quoted', 'awarded', 'expired', 'released'])->default('claimed');
            $table->timestamp('claimed_at');
            $table->timestamp('quote_deadline')->nullable();
            $table->timestamp('quoted_at')->nullable();
            $table->integer('credits_spent')->default(0);
            $table->timestamps();

            $table->unique(['lead_id', 'agency_id']);
            $table->index(['lead_id', 'status']);
            $table->index(['agency_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_pool_claims');
    }
};
