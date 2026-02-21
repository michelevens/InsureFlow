<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Consumer Free',
                'slug' => 'consumer-free',
                'description' => 'Free access for consumers to get quotes and compare carriers.',
                'monthly_price' => 0,
                'annual_price' => 0,
                'target_role' => 'consumer',
                'features' => ['Instant quotes from 50+ carriers', 'Side-by-side comparison', 'Agent matching', 'Policy tracking'],
                'limits' => ['quotes_per_month' => 10],
                'sort_order' => 1,
            ],
            [
                'name' => 'Agent Basic',
                'slug' => 'agent-basic',
                'description' => 'Essential tools for independent agents.',
                'monthly_price' => 29,
                'annual_price' => 278,
                'target_role' => 'agent',
                'features' => ['Lead pipeline', 'Up to 50 leads/month', 'Basic CRM', 'Commission tracking', 'Profile listing'],
                'limits' => ['leads_per_month' => 50, 'team_members' => 1],
                'sort_order' => 2,
            ],
            [
                'name' => 'Agent Pro',
                'slug' => 'agent-pro',
                'description' => 'Advanced tools for high-volume agents.',
                'monthly_price' => 79,
                'annual_price' => 758,
                'target_role' => 'agent',
                'features' => ['Unlimited leads', 'Advanced CRM', 'Commission tracking', 'Priority listing', 'Analytics dashboard', 'Review management'],
                'limits' => ['leads_per_month' => -1, 'team_members' => 1],
                'sort_order' => 3,
            ],
            [
                'name' => 'Agency Standard',
                'slug' => 'agency-standard',
                'description' => 'Team management for growing agencies.',
                'monthly_price' => 149,
                'annual_price' => 1430,
                'target_role' => 'agency_owner',
                'features' => ['Up to 10 agents', 'Lead distribution', 'Team analytics', 'Agency profile', 'Commission reports', 'CRM for all agents'],
                'limits' => ['leads_per_month' => -1, 'team_members' => 10],
                'sort_order' => 4,
            ],
            [
                'name' => 'Carrier Partner',
                'slug' => 'carrier-partner',
                'description' => 'Product distribution and agent network.',
                'monthly_price' => 299,
                'annual_price' => 2870,
                'target_role' => 'carrier',
                'features' => ['Product listings', 'Agent network', 'Production reports', 'Application management', 'Analytics', 'API access'],
                'limits' => ['products' => -1],
                'sort_order' => 5,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }
    }
}
