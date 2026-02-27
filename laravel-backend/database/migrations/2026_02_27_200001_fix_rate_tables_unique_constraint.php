<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rate_tables', function (Blueprint $table) {
            $table->dropUnique(['product_type', 'version']);
            $table->unique(['product_type', 'version', 'carrier_id']);
        });
    }

    public function down(): void
    {
        Schema::table('rate_tables', function (Blueprint $table) {
            $table->dropUnique(['product_type', 'version', 'carrier_id']);
            $table->unique(['product_type', 'version']);
        });
    }
};
