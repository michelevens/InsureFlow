<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agent_profiles', function (Blueprint $table) {
            $table->boolean('is_claimed')->default(true)->after('state');
            $table->foreignId('claimed_by')->nullable()->after('is_claimed')->constrained('users')->nullOnDelete();
            $table->timestamp('claimed_at')->nullable()->after('claimed_by');
            $table->string('source', 50)->default('manual')->after('claimed_at'); // manual, fl_dfs, nipr, etc.
            $table->string('source_id', 100)->nullable()->after('source'); // external ID from source system
            $table->string('full_name', 255)->nullable()->after('source_id'); // name from source data
            $table->string('county', 100)->nullable()->after('full_name');
            $table->json('lines_of_authority')->nullable()->after('county');
            $table->string('license_type', 100)->nullable()->after('lines_of_authority');
            $table->date('license_issue_date')->nullable()->after('license_type');
            $table->date('license_expiration_date')->nullable()->after('license_issue_date');
            $table->string('license_status', 50)->nullable()->after('license_expiration_date');
        });
    }

    public function down(): void
    {
        Schema::table('agent_profiles', function (Blueprint $table) {
            $table->dropForeign(['claimed_by']);
            $table->dropColumn([
                'is_claimed', 'claimed_by', 'claimed_at', 'source', 'source_id',
                'full_name', 'county', 'lines_of_authority', 'license_type',
                'license_issue_date', 'license_expiration_date', 'license_status',
            ]);
        });
    }
};
