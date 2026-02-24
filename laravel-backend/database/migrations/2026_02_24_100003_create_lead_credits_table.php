<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('agency_id')->nullable()->constrained()->cascadeOnDelete();
            $table->integer('credits_balance')->default(0);
            $table->integer('credits_used')->default(0);
            $table->timestamp('last_replenished_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'agency_id']);
        });

        Schema::create('credit_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_credit_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20); // credit, debit, replenish, purchase
            $table->integer('amount');
            $table->string('description')->nullable();
            $table->nullableMorphs('reference'); // reference_type, reference_id
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_transactions');
        Schema::dropIfExists('lead_credits');
    }
};
