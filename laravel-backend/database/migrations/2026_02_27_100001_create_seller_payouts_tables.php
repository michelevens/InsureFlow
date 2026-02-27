<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Running balance per agency for marketplace earnings
        Schema::create('seller_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')->constrained()->cascadeOnDelete();
            $table->decimal('pending_amount', 10, 2)->default(0);   // Earned but in hold period
            $table->decimal('available_amount', 10, 2)->default(0); // Ready to withdraw
            $table->decimal('lifetime_earned', 10, 2)->default(0);  // Total ever earned
            $table->decimal('lifetime_paid', 10, 2)->default(0);    // Total ever paid out
            $table->timestamps();

            $table->unique('agency_id');
        });

        // Payout requests with admin approval workflow
        Schema::create('seller_payout_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('status', 30)->default('pending'); // pending, approved, rejected, processing, completed, failed
            $table->string('payout_method', 30)->default('stripe_connect'); // stripe_connect, manual, check
            $table->string('stripe_transfer_id')->nullable();
            $table->string('stripe_account_id')->nullable();
            $table->text('admin_notes')->nullable();
            $table->text('failure_reason')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['agency_id', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seller_payout_requests');
        Schema::dropIfExists('seller_balances');
    }
};
