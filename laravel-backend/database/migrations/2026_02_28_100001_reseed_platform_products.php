<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;

return new class extends Migration
{
    /**
     * Re-seed platform products to include all 40+ product types.
     * Production only had 13 products, causing health/commercial/disability
     * quotes to fail with "This product type is not available".
     */
    public function up(): void
    {
        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\PlatformProductSeeder',
            '--force' => true,
        ]);
    }

    public function down(): void
    {
        // Platform products are managed via seeder; no rollback needed
    }
};
