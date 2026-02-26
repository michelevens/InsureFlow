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
                'description' => 'Get instant quotes, compare carriers side-by-side, and find the right coverage — always free.',
                'monthly_price' => 0,
                'annual_price' => 0,
                'target_role' => 'consumer',
                'features' => [
                    'Instant quotes from 50+ carriers',
                    'Side-by-side comparison',
                    'Smart agent matching',
                    'Policy tracking dashboard',
                    'Email support',
                ],
                'limits' => ['quotes_per_month' => 10, 'team_members' => 1],
                'lead_credits_per_month' => 0,
                'can_access_marketplace' => false,
                'sort_order' => 1,
            ],
            [
                'name' => 'Agent Starter',
                'slug' => 'agent-starter',
                'description' => 'Essential tools for independent agents starting their book of business.',
                'monthly_price' => 29,
                'annual_price' => 278.40,
                'target_role' => 'agent',
                'features' => [
                    'Up to 50 leads/month',
                    'Basic CRM & pipeline',
                    'Commission tracking',
                    'Profile listing on marketplace',
                    'Quote comparison tools',
                    'Email support',
                ],
                'limits' => ['leads_per_month' => 50, 'team_members' => 1, 'api_access' => false, 'priority_support' => false, 'white_label' => false],
                'lead_credits_per_month' => 0,
                'can_access_marketplace' => false,
                'sort_order' => 2,
            ],
            [
                'name' => 'Agent Pro',
                'slug' => 'agent-pro',
                'description' => 'Full-featured toolkit for high-volume agents who want to grow faster.',
                'monthly_price' => 79,
                'annual_price' => 758.40,
                'target_role' => 'agent',
                'features' => [
                    'Unlimited leads',
                    'Advanced CRM & pipeline',
                    'Commission tracking & analytics',
                    'Priority marketplace listing',
                    'Analytics dashboard',
                    'Lead marketplace (10 credits/mo)',
                    'Review management',
                    'Email & chat support',
                ],
                'limits' => ['leads_per_month' => -1, 'team_members' => 1, 'api_access' => false, 'priority_support' => false, 'white_label' => false],
                'lead_credits_per_month' => 10,
                'can_access_marketplace' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Agent Pro Plus',
                'slug' => 'agent-pro-plus',
                'description' => 'Premium agent tools with API access, priority support, and white-label proposals.',
                'monthly_price' => 129,
                'annual_price' => 1238.40,
                'target_role' => 'agent',
                'features' => [
                    'Everything in Agent Pro',
                    'API access & integrations',
                    'Priority support (4hr SLA)',
                    'White-label proposals',
                    'Lead marketplace (25 credits/mo)',
                    'Custom workflow automations',
                    'Advanced analytics & reports',
                    'Dedicated onboarding',
                ],
                'limits' => ['leads_per_month' => -1, 'team_members' => 3, 'api_access' => true, 'priority_support' => true, 'white_label' => true],
                'lead_credits_per_month' => 25,
                'can_access_marketplace' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'Agency Standard',
                'slug' => 'agency-standard',
                'description' => 'Team management and lead distribution for growing agencies.',
                'monthly_price' => 149,
                'annual_price' => 1430.40,
                'target_role' => 'agency_owner',
                'features' => [
                    '5 agent seats included',
                    'Team lead distribution',
                    'Agency-wide analytics',
                    'Commission reports',
                    'CRM for all agents',
                    'Lead marketplace (50 credits/mo)',
                    'Branded intake links',
                    'Email & chat support',
                ],
                'limits' => ['leads_per_month' => -1, 'team_members' => 5, 'api_access' => false, 'priority_support' => false, 'white_label' => false, 'sso' => false],
                'lead_credits_per_month' => 50,
                'can_access_marketplace' => true,
                'sort_order' => 5,
            ],
            [
                'name' => 'Agency Enterprise',
                'slug' => 'agency-enterprise',
                'description' => 'Unlimited seats, SSO, dedicated support, and enterprise-grade controls.',
                'monthly_price' => 299,
                'annual_price' => 2870.40,
                'target_role' => 'agency_owner',
                'features' => [
                    'Unlimited agent seats',
                    'Everything in Agency Standard',
                    'SSO / SAML integration',
                    'Dedicated account manager',
                    'Priority support (2hr SLA)',
                    'Lead marketplace (200 credits/mo)',
                    'Custom workflow automations',
                    'White-label proposals',
                    'API access & webhooks',
                    'SLA guarantee (99.9% uptime)',
                ],
                'limits' => ['leads_per_month' => -1, 'team_members' => -1, 'api_access' => true, 'priority_support' => true, 'white_label' => true, 'sso' => true, 'custom_workflows' => true],
                'lead_credits_per_month' => 200,
                'can_access_marketplace' => true,
                'sort_order' => 6,
            ],
            [
                'name' => 'Carrier Partner',
                'slug' => 'carrier-partner',
                'description' => 'Product distribution, agent network access, and production analytics.',
                'monthly_price' => 499,
                'annual_price' => 4790.40,
                'target_role' => 'carrier',
                'features' => [
                    'Unlimited product listings',
                    'Agent network access',
                    'Production reports & analytics',
                    'Application management',
                    'API access & webhooks',
                    'Lead marketplace (unlimited)',
                    'Dedicated account manager',
                    'Priority support (2hr SLA)',
                    'Custom integrations',
                ],
                'limits' => ['products' => -1, 'api_access' => true, 'priority_support' => true],
                'lead_credits_per_month' => -1,
                'can_access_marketplace' => true,
                'sort_order' => 7,
            ],
        ];

        $activeSlugs = [];
        foreach ($plans as $plan) {
            $activeSlugs[] = $plan['slug'];
            SubscriptionPlan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }

        // Deactivate old plans that are no longer in the new tier structure
        SubscriptionPlan::whereNotIn('slug', $activeSlugs)
            ->update(['is_active' => false]);
    }
}
