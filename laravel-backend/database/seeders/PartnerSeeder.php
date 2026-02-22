<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PartnerSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $agentId = DB::table('users')->where('email', 'agent@insurons.com')->value('id');

        if (!$agentId) {
            return;
        }

        $partners = [
            [
                'user_id' => $agentId,
                'category' => 'Home Inspection',
                'business_name' => 'Lone Star Home Inspectors',
                'description' => 'Certified home inspectors serving the greater Austin and Dallas-Fort Worth areas. Comprehensive inspections with same-week availability. Specializing in pre-purchase, insurance, and 4-point inspections.',
                'service_area' => json_encode(['TX']),
                'website' => 'https://lonestarhomeinspectors.com',
                'phone' => '(512) 555-0101',
                'email' => 'info@lonestarhomeinspectors.com',
                'rating' => 4.85,
                'review_count' => 234,
                'is_verified' => true,
            ],
            [
                'user_id' => $agentId,
                'category' => 'Home Inspection',
                'business_name' => 'SafeGuard Property Inspections',
                'description' => 'Licensed and insured property inspection company. We provide detailed reports with photos within 24 hours. Wind mitigation and roof certification available.',
                'service_area' => json_encode(['FL', 'GA']),
                'website' => 'https://safeguardinspections.com',
                'phone' => '(305) 555-0102',
                'email' => 'schedule@safeguardinspections.com',
                'rating' => 4.70,
                'review_count' => 178,
                'is_verified' => true,
            ],
            [
                'user_id' => $agentId,
                'category' => 'Financial Advisor',
                'business_name' => 'Meridian Wealth Partners',
                'description' => 'Fee-only fiduciary financial advisors specializing in retirement planning, estate planning, and insurance needs analysis. Perfect partner for life insurance and annuity referrals.',
                'service_area' => json_encode(['TX', 'CA', 'NY', 'FL']),
                'website' => 'https://meridianwealth.com',
                'phone' => '(214) 555-0103',
                'email' => 'partners@meridianwealth.com',
                'rating' => 4.92,
                'review_count' => 156,
                'is_verified' => true,
            ],
            [
                'user_id' => $agentId,
                'category' => 'Mortgage Broker',
                'business_name' => 'Heritage Home Loans',
                'description' => 'Full-service mortgage brokerage with access to 30+ lenders. Fast pre-approvals and competitive rates. Great referral partner for homeowners insurance bundling.',
                'service_area' => json_encode(['TX', 'OK', 'AR', 'LA']),
                'website' => 'https://heritagehomeloans.com',
                'phone' => '(512) 555-0104',
                'email' => 'referrals@heritagehomeloans.com',
                'rating' => 4.78,
                'review_count' => 312,
                'is_verified' => true,
            ],
            [
                'user_id' => $agentId,
                'category' => 'Mortgage Broker',
                'business_name' => 'Pacific Coast Lending',
                'description' => 'California-based mortgage company specializing in first-time homebuyers and investment properties. Strong referral partnership program with insurance agents.',
                'service_area' => json_encode(['CA', 'OR', 'WA']),
                'website' => 'https://pacificcoastlending.com',
                'phone' => '(415) 555-0105',
                'email' => 'agent-partners@pcl.com',
                'rating' => 4.65,
                'review_count' => 198,
                'is_verified' => true,
            ],
            [
                'user_id' => $agentId,
                'category' => 'Auto Body Shop',
                'business_name' => 'Premier Collision Center',
                'description' => 'I-CAR Gold Class certified collision repair facility. Direct repair partner with major carriers. Lifetime warranty on all repairs. Rental car coordination included.',
                'service_area' => json_encode(['TX']),
                'phone' => '(512) 555-0106',
                'email' => 'service@premiercollision.com',
                'rating' => 4.80,
                'review_count' => 445,
                'is_verified' => true,
            ],
            [
                'user_id' => $agentId,
                'category' => 'Real Estate Agent',
                'business_name' => 'Summit Realty Group',
                'description' => 'Top-producing real estate team in Central Texas. We refer all our buyers to trusted insurance agents. Looking for reliable partners who can provide fast quotes at closing.',
                'service_area' => json_encode(['TX']),
                'website' => 'https://summitrealty.com',
                'phone' => '(512) 555-0107',
                'email' => 'partners@summitrealty.com',
                'rating' => 4.88,
                'review_count' => 267,
                'is_verified' => true,
            ],
            [
                'user_id' => $agentId,
                'category' => 'Attorney',
                'business_name' => 'Wallace & Chen Law',
                'description' => 'Insurance defense and coverage attorneys. We help agents and their clients navigate complex claims, coverage disputes, and bad faith situations. Free initial consultation.',
                'service_area' => json_encode(['TX', 'CA', 'FL', 'NY', 'IL']),
                'website' => 'https://wallacechen.law',
                'phone' => '(214) 555-0108',
                'email' => 'referrals@wallacechen.law',
                'rating' => 4.75,
                'review_count' => 89,
                'is_verified' => true,
            ],
            [
                'user_id' => $agentId,
                'category' => 'Water Damage Restoration',
                'business_name' => 'RapidDry Restoration',
                'description' => '24/7 emergency water damage restoration. IICRC certified technicians. We work directly with insurance carriers and handle the claims paperwork for your clients.',
                'service_area' => json_encode(['TX', 'OK']),
                'phone' => '(512) 555-0109',
                'email' => 'dispatch@rapiddry.com',
                'rating' => 4.60,
                'review_count' => 134,
                'is_verified' => true,
            ],
            [
                'user_id' => $agentId,
                'category' => 'Tax Advisor',
                'business_name' => 'Clearview Tax & Accounting',
                'description' => 'CPA firm specializing in small business and insurance agency accounting. We help agents maximize deductions, manage 1099 income, and plan for tax-efficient business growth.',
                'service_area' => json_encode(['TX', 'CA', 'FL']),
                'website' => 'https://clearviewtax.com',
                'phone' => '(512) 555-0110',
                'email' => 'info@clearviewtax.com',
                'rating' => 4.90,
                'review_count' => 112,
                'is_verified' => false,
            ],
        ];

        foreach ($partners as $partner) {
            DB::table('partner_listings')->updateOrInsert(
                ['business_name' => $partner['business_name']],
                array_merge($partner, ['is_active' => true, 'created_at' => $now, 'updated_at' => $now])
            );
        }
    }
}
