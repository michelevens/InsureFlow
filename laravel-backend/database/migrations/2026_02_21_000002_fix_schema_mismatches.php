<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add am_best_rating to carriers (referenced by CarrierSeeder and Carrier model)
        Schema::table('carriers', function (Blueprint $table) {
            $table->string('am_best_rating')->nullable()->after('description');
        });

        // Add city and state to agent_profiles (referenced by DemoUserSeeder and AgentProfile model)
        Schema::table('agent_profiles', function (Blueprint $table) {
            $table->string('city')->nullable()->after('response_time');
            $table->string('state', 2)->nullable()->after('city');
        });
    }

    public function down(): void
    {
        Schema::table('carriers', function (Blueprint $table) {
            $table->dropColumn('am_best_rating');
        });

        Schema::table('agent_profiles', function (Blueprint $table) {
            $table->dropColumn(['city', 'state']);
        });
    }
};
