<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;

return new class extends Migration
{
    /**
     * Re-seed ZIP codes with comprehensive 33K+ dataset.
     * Previous seeder only had 176 major-city ZIPs.
     */
    public function up(): void
    {
        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\ZipCodeSeeder',
            '--force' => true,
        ]);
    }

    public function down(): void
    {
        // ZIP codes managed via seeder; no rollback needed
    }
};
