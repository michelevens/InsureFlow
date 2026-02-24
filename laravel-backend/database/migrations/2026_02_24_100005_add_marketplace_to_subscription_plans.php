<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->integer('lead_credits_per_month')->default(0)->after('limits');
            $table->boolean('can_access_marketplace')->default(false)->after('lead_credits_per_month');
        });
    }

    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn(['lead_credits_per_month', 'can_access_marketplace']);
        });
    }
};
