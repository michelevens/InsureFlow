<?php

namespace App\Console\Commands;

use App\Models\SubscriptionPlan;
use Illuminate\Console\Command;
use Stripe\Price;
use Stripe\Product;
use Stripe\Stripe;

class StripeSyncPlans extends Command
{
    protected $signature = 'stripe:sync-plans {--force : Overwrite existing price IDs}';
    protected $description = 'Create Stripe products and prices from subscription plans';

    public function handle(): int
    {
        $secret = config('services.stripe.secret');
        if (!$secret) {
            $this->error('STRIPE_SECRET_KEY not configured. Set it in your environment variables.');
            return 1;
        }

        Stripe::setApiKey($secret);
        $plans = SubscriptionPlan::all();

        if ($plans->isEmpty()) {
            $this->warn('No subscription plans found in database.');
            return 0;
        }

        $this->info("Syncing {$plans->count()} plans to Stripe...\n");
        $rows = [];

        foreach ($plans as $plan) {
            // Skip plans that already have both price IDs (unless --force)
            if (!$this->option('force') && $plan->stripe_price_id_monthly && $plan->stripe_price_id_annual) {
                $rows[] = [$plan->name, $plan->target_role, 'Skipped', $plan->stripe_price_id_monthly, $plan->stripe_price_id_annual];
                continue;
            }

            // Skip free plans (price = 0)
            if ($plan->monthly_price <= 0 && $plan->annual_price <= 0) {
                $rows[] = [$plan->name, $plan->target_role, 'Free (skipped)', '-', '-'];
                continue;
            }

            try {
                // Create a Stripe product for this plan
                $product = Product::create([
                    'name' => "InsureFlow {$plan->name}",
                    'description' => $plan->description ?? "InsureFlow {$plan->name} plan for {$plan->target_role}",
                    'metadata' => [
                        'plan_id' => (string) $plan->id,
                        'slug' => $plan->slug,
                        'target_role' => $plan->target_role,
                    ],
                ]);

                $monthlyPriceId = $plan->stripe_price_id_monthly;
                $annualPriceId = $plan->stripe_price_id_annual;

                // Create monthly price if needed
                if ($plan->monthly_price > 0 && ($this->option('force') || !$monthlyPriceId)) {
                    $monthlyPrice = Price::create([
                        'product' => $product->id,
                        'unit_amount' => (int) round($plan->monthly_price * 100),
                        'currency' => 'usd',
                        'recurring' => ['interval' => 'month'],
                        'metadata' => [
                            'plan_id' => (string) $plan->id,
                            'billing_cycle' => 'monthly',
                        ],
                    ]);
                    $monthlyPriceId = $monthlyPrice->id;
                }

                // Create annual price if needed
                if ($plan->annual_price > 0 && ($this->option('force') || !$annualPriceId)) {
                    $annualPrice = Price::create([
                        'product' => $product->id,
                        'unit_amount' => (int) round($plan->annual_price * 100),
                        'currency' => 'usd',
                        'recurring' => ['interval' => 'year'],
                        'metadata' => [
                            'plan_id' => (string) $plan->id,
                            'billing_cycle' => 'annual',
                        ],
                    ]);
                    $annualPriceId = $annualPrice->id;
                }

                // Update the plan in the database
                $plan->update([
                    'stripe_price_id_monthly' => $monthlyPriceId,
                    'stripe_price_id_annual' => $annualPriceId,
                ]);

                $rows[] = [$plan->name, $plan->target_role, 'Synced', $monthlyPriceId ?? '-', $annualPriceId ?? '-'];
            } catch (\Exception $e) {
                $this->error("  Failed to sync plan '{$plan->name}': {$e->getMessage()}");
                $rows[] = [$plan->name, $plan->target_role, 'FAILED', '-', '-'];
            }
        }

        $this->newLine();
        $this->table(['Plan', 'Role', 'Status', 'Monthly Price ID', 'Annual Price ID'], $rows);
        $this->newLine();
        $this->info('Done! Plans synced to Stripe.');
        return 0;
    }
}
