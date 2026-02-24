<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rate_tables', function (Blueprint $table) {
            $table->foreignId('carrier_id')
                ->nullable()
                ->after('name')
                ->constrained('carriers')
                ->nullOnDelete();
            $table->index('carrier_id');
        });
    }

    public function down(): void
    {
        Schema::table('rate_tables', function (Blueprint $table) {
            $table->dropForeign(['carrier_id']);
            $table->dropColumn('carrier_id');
        });
    }
};
