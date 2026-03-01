<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->boolean('is_pool')->default(false)->after('notes');
            $table->string('pool_status', 20)->nullable()->after('is_pool'); // open, claimed, quoted, awarded, closed
            $table->integer('max_claims')->default(5)->after('pool_status');
            $table->integer('current_claims')->default(0)->after('max_claims');
            $table->foreignId('awarded_agency_id')->nullable()->constrained('agencies')->nullOnDelete()->after('current_claims');
            $table->timestamp('pool_expires_at')->nullable()->after('awarded_agency_id');
            $table->string('zip_code', 10)->nullable()->after('phone');
            $table->string('state', 2)->nullable()->after('zip_code');

            $table->index(['is_pool', 'pool_status']);
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex(['is_pool', 'pool_status']);
            $table->dropForeign(['awarded_agency_id']);
            $table->dropColumn([
                'is_pool', 'pool_status', 'max_claims', 'current_claims',
                'awarded_agency_id', 'pool_expires_at', 'zip_code', 'state',
            ]);
        });
    }
};
