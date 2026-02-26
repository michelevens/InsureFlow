<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $priceMap = [
            'agent-starter' => [
                'stripe_price_id_monthly' => 'price_1T58AXIu9HZ5QC9gYwLEYcIB',
                'stripe_price_id_annual' => 'price_1T58AXIu9HZ5QC9gyE1DM9dQ',
            ],
            'agent-pro' => [
                'stripe_price_id_monthly' => 'price_1T58AYIu9HZ5QC9guKKaPboL',
                'stripe_price_id_annual' => 'price_1T58AYIu9HZ5QC9gY4gmdPIl',
            ],
            'agent-pro-plus' => [
                'stripe_price_id_monthly' => 'price_1T58AYIu9HZ5QC9g5PZVuQDv',
                'stripe_price_id_annual' => 'price_1T58AZIu9HZ5QC9gR3qzI010',
            ],
            'agency-standard' => [
                'stripe_price_id_monthly' => 'price_1T58AZIu9HZ5QC9gnNKiJLw2',
                'stripe_price_id_annual' => 'price_1T58AZIu9HZ5QC9gWknjDmPh',
            ],
            'agency-enterprise' => [
                'stripe_price_id_monthly' => 'price_1T58AaIu9HZ5QC9g1GUjn2QK',
                'stripe_price_id_annual' => 'price_1T58AaIu9HZ5QC9gP3flsz0I',
            ],
            'carrier-partner' => [
                'stripe_price_id_monthly' => 'price_1T58AbIu9HZ5QC9gAaAPrPtA',
                'stripe_price_id_annual' => 'price_1T58AbIu9HZ5QC9g9T3yqMmT',
            ],
        ];

        foreach ($priceMap as $slug => $prices) {
            DB::table('subscription_plans')
                ->where('slug', $slug)
                ->update($prices);
        }
    }

    public function down(): void
    {
        DB::table('subscription_plans')
            ->whereNotNull('stripe_price_id_monthly')
            ->update([
                'stripe_price_id_monthly' => null,
                'stripe_price_id_annual' => null,
            ]);
    }
};
