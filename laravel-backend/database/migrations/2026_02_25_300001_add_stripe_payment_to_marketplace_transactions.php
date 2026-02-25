<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_marketplace_transactions', function (Blueprint $table) {
            $table->string('stripe_payment_intent_id')->nullable()->after('seller_payout');
            $table->string('stripe_checkout_session_id')->nullable()->after('stripe_payment_intent_id');
            $table->string('payment_status')->default('completed')->after('stripe_checkout_session_id');
            $table->decimal('platform_fee_amount', 8, 2)->nullable()->after('payment_status');
            $table->decimal('seller_payout_amount', 8, 2)->nullable()->after('platform_fee_amount');
            $table->timestamp('paid_at')->nullable()->after('seller_payout_amount');

            $table->index('stripe_payment_intent_id');
            $table->index('stripe_checkout_session_id');
            $table->index('payment_status');
        });
    }

    public function down(): void
    {
        Schema::table('lead_marketplace_transactions', function (Blueprint $table) {
            $table->dropIndex(['stripe_payment_intent_id']);
            $table->dropIndex(['stripe_checkout_session_id']);
            $table->dropIndex(['payment_status']);

            $table->dropColumn([
                'stripe_payment_intent_id',
                'stripe_checkout_session_id',
                'payment_status',
                'platform_fee_amount',
                'seller_payout_amount',
                'paid_at',
            ]);
        });
    }
};
