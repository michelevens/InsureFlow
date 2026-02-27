<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carrier_products', function (Blueprint $table) {
            $table->string('product_code', 30)->nullable()->after('insurance_type');
            $table->string('rate_table_product_type', 60)->nullable()->after('product_code');
            $table->string('underwriting_type', 30)->nullable()->after('rate_table_product_type');
            $table->json('eligible_states')->nullable()->after('states_available');
        });
    }

    public function down(): void
    {
        Schema::table('carrier_products', function (Blueprint $table) {
            $table->dropColumn(['product_code', 'rate_table_product_type', 'underwriting_type', 'eligible_states']);
        });
    }
};
