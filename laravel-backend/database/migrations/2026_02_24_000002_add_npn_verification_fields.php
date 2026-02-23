<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add NPN + verification to agent_profiles
        Schema::table('agent_profiles', function (Blueprint $table) {
            $table->string('npn', 20)->nullable()->after('license_number');
            $table->enum('npn_verified', ['unverified', 'pending', 'verified', 'rejected'])
                ->default('unverified')->after('npn');
            $table->timestamp('npn_verified_at')->nullable()->after('npn_verified');
            $table->string('npn_verified_by')->nullable()->after('npn_verified_at');
            $table->string('license_lookup_url', 500)->nullable()->after('npn_verified_by');
        });

        // Add NPN to agencies (for agency-level NPN)
        Schema::table('agencies', function (Blueprint $table) {
            $table->string('npn', 20)->nullable()->after('agency_code');
            $table->enum('npn_verified', ['unverified', 'pending', 'verified', 'rejected'])
                ->default('unverified')->after('npn');
            $table->timestamp('npn_verified_at')->nullable()->after('npn_verified');
        });
    }

    public function down(): void
    {
        Schema::table('agent_profiles', function (Blueprint $table) {
            $table->dropColumn(['npn', 'npn_verified', 'npn_verified_at', 'npn_verified_by', 'license_lookup_url']);
        });

        Schema::table('agencies', function (Blueprint $table) {
            $table->dropColumn(['npn', 'npn_verified', 'npn_verified_at']);
        });
    }
};
