<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TrainingSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $modules = [
            [
                'title' => 'Welcome to Insurons: Platform Onboarding',
                'description' => 'Get started with the Insurons platform. Learn how to navigate the dashboard, set up your profile, and configure your account for success.',
                'content_type' => 'interactive',
                'content_body' => "## Welcome to Insurons!\n\nThis onboarding module will walk you through everything you need to know to get started.\n\n### What You'll Learn\n\n1. **Dashboard Navigation** — Understanding your home base\n2. **Profile Setup** — Creating your professional profile\n3. **Carrier Connections** — Linking your appointments\n4. **First Quote** — Walking through the quoting process\n5. **CRM Basics** — Managing leads and clients\n\n### Prerequisites\n- Active Insurons account\n- At least one carrier appointment\n\n### Estimated Time: 30 minutes",
                'category' => 'Onboarding',
                'duration_minutes' => 30,
                'sort_order' => 1,
                'is_required' => true,
            ],
            [
                'title' => 'Insurance Compliance Fundamentals',
                'description' => 'Essential compliance training covering state regulations, documentation requirements, and ethical practices for insurance professionals.',
                'content_type' => 'article',
                'content_body' => "## Insurance Compliance Fundamentals\n\n### Regulatory Framework\n\nInsurance is regulated at the state level. Key regulatory bodies include:\n- State Department of Insurance (DOI)\n- National Association of Insurance Commissioners (NAIC)\n- Federal regulations (ACA, TRIA, etc.)\n\n### Key Compliance Areas\n\n1. **Licensing** — Maintain valid licenses in all states you operate\n2. **Continuing Education** — Meet CE requirements annually\n3. **Disclosure** — Always disclose your role, compensation, and conflicts\n4. **Privacy** — Protect client PII per state and federal law\n5. **Anti-Fraud** — Report suspected fraud to the DOI\n6. **Market Conduct** — Follow fair practices in sales and service\n\n### Documentation Requirements\n\n- Keep records of all client interactions\n- Document coverage recommendations and client decisions\n- Retain signed applications and disclosure forms\n- Maintain files for minimum 5 years (varies by state)\n\n### Penalties for Non-Compliance\n\n- Fines ranging from $500 to $50,000+\n- License suspension or revocation\n- E&O claims\n- Criminal charges (in severe cases)",
                'category' => 'Compliance',
                'duration_minutes' => 45,
                'sort_order' => 2,
                'is_required' => true,
            ],
            [
                'title' => 'Mastering the Art of Insurance Sales',
                'description' => 'Advanced sales techniques specifically designed for insurance professionals. From prospecting to closing, learn strategies that top producers use.',
                'content_type' => 'video',
                'content_url' => 'https://training.insurons.com/videos/sales-mastery',
                'content_body' => "## Sales Mastery for Insurance Agents\n\n### Module Overview\n\nThis video series covers the complete insurance sales cycle:\n\n**Part 1: Prospecting (15 min)**\n- Identifying ideal client profiles\n- Digital marketing strategies\n- Referral generation systems\n- Community involvement\n\n**Part 2: Consultation (20 min)**\n- The needs analysis approach\n- Building rapport and trust\n- Asking the right questions\n- Active listening techniques\n\n**Part 3: Presentation (15 min)**\n- Feature vs. benefit selling\n- Handling rate comparisons\n- Creating urgency without pressure\n- Multi-policy presentation strategies\n\n**Part 4: Closing (10 min)**\n- Recognizing buying signals\n- Overcoming common objections\n- The assumptive close\n- Post-sale relationship building",
                'category' => 'Sales',
                'duration_minutes' => 60,
                'sort_order' => 3,
                'is_required' => false,
            ],
            [
                'title' => 'Auto Insurance Product Knowledge',
                'description' => 'Deep dive into auto insurance coverages, rating factors, and state-specific requirements. Essential knowledge for every P&C agent.',
                'content_type' => 'article',
                'content_body' => "## Auto Insurance Product Knowledge\n\n### Coverage Types\n\n1. **Liability** — Bodily injury & property damage\n2. **Collision** — Your vehicle in an accident\n3. **Comprehensive** — Non-collision losses (theft, weather, animals)\n4. **Uninsured/Underinsured Motorist** — Protection from uninsured drivers\n5. **PIP/Medical Payments** — Medical expenses for you/passengers\n6. **Rental Reimbursement** — Rental car during repairs\n7. **Towing & Labor** — Roadside assistance\n\n### Rating Factors\n\n- Age, gender, marital status\n- Driving history (3-5 years)\n- Credit-based insurance score\n- Vehicle year, make, model\n- Annual mileage\n- Location (zip code)\n- Coverage selections and deductibles\n\n### State Requirements\n\n- Minimum liability limits vary by state\n- No-fault vs. tort states\n- Mandatory uninsured motorist in some states\n- SR-22 filing requirements",
                'category' => 'Product Knowledge',
                'duration_minutes' => 40,
                'sort_order' => 4,
                'is_required' => false,
            ],
            [
                'title' => 'Homeowners Insurance Product Knowledge',
                'description' => 'Comprehensive guide to homeowners insurance coverages, endorsements, and common exclusions. Includes HO-3 vs HO-5 comparisons.',
                'content_type' => 'article',
                'content_body' => "## Homeowners Insurance Product Knowledge\n\n### Policy Forms\n\n| Form | Coverage A (Dwelling) | Coverage B (Personal Property) |\n|------|----------------------|-------------------------------|\n| HO-3 | Open perils | Named perils |\n| HO-5 | Open perils | Open perils |\n| HO-6 | Condo (walls-in) | Named perils |\n| HO-4 | Renters | Named perils |\n\n### Coverage Sections\n\n- **A — Dwelling**: Structure of the home\n- **B — Other Structures**: Detached garage, fences, sheds\n- **C — Personal Property**: Belongings inside the home\n- **D — Loss of Use**: Living expenses if displaced\n- **E — Personal Liability**: Legal liability protection\n- **F — Medical Payments**: Guest medical expenses\n\n### Common Exclusions\n\n- Flood (requires separate NFIP or private policy)\n- Earthquake (endorsement available)\n- Maintenance-related damage\n- Intentional acts\n- Business use of home\n\n### Key Endorsements\n\n- Scheduled personal property (jewelry, art)\n- Water backup/sump overflow\n- Home business endorsement\n- Equipment breakdown",
                'category' => 'Product Knowledge',
                'duration_minutes' => 45,
                'sort_order' => 5,
                'is_required' => false,
            ],
            [
                'title' => 'E&O Risk Management for Agents',
                'description' => 'Protect yourself from Errors & Omissions claims. Learn documentation best practices, common pitfalls, and how to minimize your exposure.',
                'content_type' => 'article',
                'content_body' => "## E&O Risk Management\n\n### Common E&O Claims\n\n1. **Failure to procure coverage** — Not placing requested coverage\n2. **Failure to advise** — Not recommending adequate limits\n3. **Policy gaps** — Failing to identify coverage gaps\n4. **Renewal errors** — Missing renewal deadlines\n5. **Application errors** — Incorrect information on applications\n\n### Prevention Strategies\n\n#### Documentation\n- Document EVERY client interaction\n- Send written confirmation of coverage decisions\n- Get signed declination forms when clients reject recommendations\n- Keep detailed notes in your CRM\n\n#### Communication\n- Explain coverages in plain language\n- Provide written coverage summaries\n- Follow up on client questions promptly\n- Send policy review letters annually\n\n#### Process\n- Use checklists for every transaction\n- Implement a second-review process\n- Maintain organized filing systems\n- Regular E&O training for all staff\n\n### If a Claim Occurs\n\n1. Notify your E&O carrier immediately\n2. Do NOT admit fault\n3. Preserve all documentation\n4. Cooperate with the investigation\n5. Do not communicate with the claimant directly",
                'category' => 'Compliance',
                'duration_minutes' => 35,
                'sort_order' => 6,
                'is_required' => true,
            ],
            [
                'title' => 'CRM & Lead Management on Insurons',
                'description' => 'Master the Insurons CRM tools — pipeline management, lead scoring, automated follow-ups, and conversion tracking.',
                'content_type' => 'interactive',
                'content_body' => "## CRM & Lead Management\n\n### Lead Pipeline Stages\n\n1. **New** — Lead just received\n2. **Contacted** — Initial outreach made\n3. **Quoting** — Gathering info for quotes\n4. **Proposal Sent** — Quotes delivered to client\n5. **Negotiating** — Discussing options\n6. **Won** — Policy bound!\n7. **Lost** — Didn't convert (track reasons)\n\n### Lead Scoring\n\nInsurens automatically scores leads based on:\n- Source quality (referral > web form > cold)\n- Engagement level (email opens, page visits)\n- Policy count potential\n- Premium estimate\n\n### Automated Follow-ups\n\nSet up automated sequences:\n- Day 0: Welcome email + text\n- Day 1: Follow-up call reminder\n- Day 3: Coverage guide email\n- Day 7: Check-in email\n- Day 14: Final follow-up\n- Day 30: Nurture sequence begins\n\n### Conversion Tracking\n\nTrack your metrics:\n- Lead-to-contact rate\n- Contact-to-quote rate\n- Quote-to-bind rate\n- Average premium per policy\n- Revenue per lead",
                'category' => 'Platform Training',
                'duration_minutes' => 25,
                'sort_order' => 7,
                'is_required' => false,
            ],
            [
                'title' => 'Commercial Lines Basics',
                'description' => 'Introduction to commercial insurance for agents looking to expand beyond personal lines. Covers BOP, GL, WC, and commercial auto.',
                'content_type' => 'video',
                'content_url' => 'https://training.insurons.com/videos/commercial-basics',
                'content_body' => "## Commercial Lines Basics\n\n### Why Commercial Lines?\n\n- Higher premiums = higher commissions\n- Less price-sensitive clients\n- Stronger retention rates\n- Cross-sell opportunities\n- Differentiation from online-only competitors\n\n### Core Products\n\n#### Business Owners Policy (BOP)\n- Combines property + liability\n- Ideal for small businesses\n- Most common first commercial sale\n\n#### General Liability (GL)\n- Bodily injury to third parties\n- Property damage to others\n- Personal & advertising injury\n- Products/completed operations\n\n#### Workers Compensation (WC)\n- Required in most states with employees\n- Medical expenses + lost wages\n- Employer's liability\n- Experience modification rating\n\n#### Commercial Auto\n- Business-owned vehicles\n- Hired & non-owned auto\n- Higher limits than personal\n\n### Getting Appointed\n\n1. Complete carrier commercial training\n2. Pass the commercial lines exam (if required)\n3. Start with BOPs and small GL\n4. Partner with a mentor for larger accounts",
                'category' => 'Product Knowledge',
                'duration_minutes' => 50,
                'sort_order' => 8,
                'is_required' => false,
            ],
        ];

        foreach ($modules as $module) {
            DB::table('training_modules')->updateOrInsert(
                ['title' => $module['title']],
                array_merge($module, [
                    'organization_id' => null,
                    'is_published' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
            );
        }

        // Add some completions for demo agents
        $agentId = DB::table('users')->where('email', 'agent@insurons.com')->value('id');
        $agent2Id = DB::table('users')->where('email', 'agent2@insurons.com')->value('id');
        $onboardingId = DB::table('training_modules')->where('title', 'Welcome to Insurons: Platform Onboarding')->value('id');
        $complianceId = DB::table('training_modules')->where('title', 'Insurance Compliance Fundamentals')->value('id');

        if ($agentId && $onboardingId) {
            DB::table('training_completions')->updateOrInsert(
                ['training_module_id' => $onboardingId, 'user_id' => $agentId],
                ['started_at' => $now->copy()->subDays(30), 'completed_at' => $now->copy()->subDays(30), 'score' => 95, 'time_spent_minutes' => 28, 'created_at' => $now, 'updated_at' => $now]
            );
        }
        if ($agentId && $complianceId) {
            DB::table('training_completions')->updateOrInsert(
                ['training_module_id' => $complianceId, 'user_id' => $agentId],
                ['started_at' => $now->copy()->subDays(25), 'completed_at' => $now->copy()->subDays(25), 'score' => 88, 'time_spent_minutes' => 42, 'created_at' => $now, 'updated_at' => $now]
            );
        }
        if ($agent2Id && $onboardingId) {
            DB::table('training_completions')->updateOrInsert(
                ['training_module_id' => $onboardingId, 'user_id' => $agent2Id],
                ['started_at' => $now->copy()->subDays(20), 'completed_at' => $now->copy()->subDays(20), 'score' => 100, 'time_spent_minutes' => 25, 'created_at' => $now, 'updated_at' => $now]
            );
        }
    }
}
