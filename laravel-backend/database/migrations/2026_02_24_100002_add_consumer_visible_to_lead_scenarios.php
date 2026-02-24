<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_scenarios', function (Blueprint $table) {
            $table->boolean('consumer_visible')->default(false)->after('status');
            $table->timestamp('sent_to_consumer_at')->nullable();
            $table->timestamp('consumer_viewed_at')->nullable();
            $table->string('consumer_token', 64)->nullable()->unique();
            $table->string('consumer_status', 20)->default('pending'); // pending, viewed, accepted, declined
            $table->index('consumer_token');
        });
    }

    public function down(): void
    {
        Schema::table('lead_scenarios', function (Blueprint $table) {
            $table->dropIndex(['consumer_token']);
            $table->dropColumn(['consumer_visible', 'sent_to_consumer_at', 'consumer_viewed_at', 'consumer_token', 'consumer_status']);
        });
    }
};
