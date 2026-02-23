<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Change from enum to varchar to support all 35+ canonical product slugs
        DB::statement("ALTER TABLE carrier_products ALTER COLUMN insurance_type TYPE VARCHAR(100) USING insurance_type::VARCHAR");

        // Map old enum values to canonical slugs
        DB::table('carrier_products')->where('insurance_type', 'home')->update(['insurance_type' => 'homeowners']);
        DB::table('carrier_products')->where('insurance_type', 'life')->update(['insurance_type' => 'life_term']);
        DB::table('carrier_products')->where('insurance_type', 'business')->update(['insurance_type' => 'bop']);
        DB::table('carrier_products')->where('insurance_type', 'umbrella')->update(['insurance_type' => 'umbrella_personal']);
    }

    public function down(): void
    {
        // Reverse the slug mappings
        DB::table('carrier_products')->where('insurance_type', 'homeowners')->update(['insurance_type' => 'home']);
        DB::table('carrier_products')->where('insurance_type', 'life_term')->update(['insurance_type' => 'life']);
        DB::table('carrier_products')->where('insurance_type', 'bop')->update(['insurance_type' => 'business']);
        DB::table('carrier_products')->where('insurance_type', 'umbrella_personal')->update(['insurance_type' => 'umbrella']);
    }
};
