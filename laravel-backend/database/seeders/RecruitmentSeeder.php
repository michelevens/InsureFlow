<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RecruitmentSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $agencyId = DB::table('agencies')->where('slug', 'martinez-insurance-group')->value('id');
        $agencyOwnerId = DB::table('users')->where('email', 'agency@insurons.com')->value('id');

        if (!$agencyOwnerId) {
            return;
        }

        $postings = [
            [
                'agency_id' => $agencyId,
                'user_id' => $agencyOwnerId,
                'title' => 'Junior Insurance Agent — Personal Lines',
                'description' => "Martinez Insurance Group is looking for a motivated junior agent to join our growing team in Austin, TX.\n\nAs a Junior Agent, you'll work with experienced mentors while building your own book of business. We provide leads, training, and carrier access — you bring the hustle.\n\n**What You'll Do:**\n- Handle inbound leads and quote requests\n- Generate quotes across multiple carriers\n- Build relationships with clients\n- Cross-sell and round out accounts\n- Maintain compliance with state regulations\n\n**What We're Looking For:**\n- Active P&C license (or willing to obtain within 30 days)\n- Strong communication skills\n- Tech-savvy (comfortable with CRM tools)\n- Self-motivated with a growth mindset\n- No experience required — we'll train you!",
                'requirements' => json_encode(['Active P&C license or willing to obtain', 'Strong communication skills', 'Tech-savvy', 'Self-motivated', 'High school diploma or equivalent']),
                'compensation' => json_encode(['type' => 'base_plus_commission', 'base_salary' => 35000, 'commission_rate' => '10-15%', 'bonus' => 'Quarterly production bonuses', 'benefits' => ['Health insurance', 'Dental', '401k match', 'PTO']]),
                'location' => 'Austin, TX',
                'is_remote' => false,
                'status' => 'active',
                'employment_type' => 'full_time',
            ],
            [
                'agency_id' => $agencyId,
                'user_id' => $agencyOwnerId,
                'title' => 'Senior Insurance Agent — Commercial Lines',
                'description' => "We're seeking an experienced commercial lines agent to lead our growing commercial division.\n\n**What You'll Do:**\n- Manage a book of commercial accounts ($500K+ revenue)\n- Develop new commercial business opportunities\n- Mentor junior agents on commercial products\n- Negotiate with underwriters for best terms\n- Build relationships with business owners\n\n**What We're Looking For:**\n- 5+ years commercial insurance experience\n- Active P&C license in TX (multi-state preferred)\n- Proven track record of commercial sales\n- Strong underwriting knowledge\n- CIC or CPCU designation preferred",
                'requirements' => json_encode(['5+ years commercial insurance experience', 'Active P&C license in TX', 'Proven commercial sales track record', 'Strong underwriting knowledge', 'CIC or CPCU preferred']),
                'compensation' => json_encode(['type' => 'base_plus_commission', 'base_salary' => 65000, 'commission_rate' => '15-25%', 'bonus' => 'Annual profit-sharing', 'benefits' => ['Health insurance', 'Dental', 'Vision', '401k match 4%', 'PTO 20 days', 'CE reimbursement']]),
                'location' => 'Austin, TX',
                'is_remote' => false,
                'status' => 'active',
                'employment_type' => 'full_time',
            ],
            [
                'agency_id' => $agencyId,
                'user_id' => $agencyOwnerId,
                'title' => 'Account Manager — Client Services',
                'description' => "Join our team as an Account Manager focused on client retention and service excellence.\n\n**What You'll Do:**\n- Manage a portfolio of 800+ personal lines accounts\n- Handle policy changes, endorsements, and renewals\n- Proactively review accounts for coverage gaps\n- Process claims and advocate for clients\n- Maintain 90%+ retention rate\n\n**What We're Looking For:**\n- 2+ years insurance industry experience\n- Active P&C license\n- Excellent attention to detail\n- Strong customer service skills\n- Experience with agency management systems",
                'requirements' => json_encode(['2+ years insurance experience', 'Active P&C license', 'Excellent attention to detail', 'Strong customer service skills', 'Agency management system experience']),
                'compensation' => json_encode(['type' => 'salary', 'base_salary' => 48000, 'bonus' => 'Retention bonus quarterly', 'benefits' => ['Health insurance', 'Dental', '401k match', 'PTO 15 days']]),
                'location' => 'Austin, TX',
                'is_remote' => true,
                'status' => 'active',
                'employment_type' => 'full_time',
            ],
            [
                'agency_id' => $agencyId,
                'user_id' => $agencyOwnerId,
                'title' => 'Sales Team Lead — Insurance Sales',
                'description' => "We're looking for a dynamic Sales Team Lead to drive our agency's growth strategy.\n\n**What You'll Do:**\n- Lead a team of 5-8 sales agents\n- Set and track sales targets and KPIs\n- Develop and execute marketing campaigns\n- Train new agents on sales processes\n- Report on team performance and pipeline\n- Maintain your own book of high-value accounts\n\n**What We're Looking For:**\n- 7+ years insurance sales experience\n- 2+ years in a leadership or management role\n- Track record of team development\n- Strategic thinker with data-driven approach\n- Multiple state licenses preferred",
                'requirements' => json_encode(['7+ years insurance sales experience', '2+ years leadership experience', 'Track record of team development', 'Strategic and data-driven', 'Multi-state licenses preferred']),
                'compensation' => json_encode(['type' => 'base_plus_commission', 'base_salary' => 80000, 'commission_rate' => '5% team override + personal commissions', 'bonus' => 'Annual performance bonus up to 20%', 'benefits' => ['Health insurance', 'Dental', 'Vision', '401k match 5%', 'PTO 25 days', 'Company car allowance', 'CE reimbursement']]),
                'location' => 'Austin, TX',
                'is_remote' => false,
                'status' => 'active',
                'employment_type' => 'full_time',
            ],
        ];

        foreach ($postings as $posting) {
            DB::table('job_postings')->updateOrInsert(
                ['title' => $posting['title'], 'agency_id' => $posting['agency_id']],
                array_merge($posting, ['created_at' => $now, 'updated_at' => $now])
            );
        }

        // Add sample applications
        $juniorPostingId = DB::table('job_postings')->where('title', 'like', '%Junior Insurance Agent%')->value('id');
        $seniorPostingId = DB::table('job_postings')->where('title', 'like', '%Senior Insurance Agent%')->value('id');

        if ($juniorPostingId) {
            $applications = [
                [
                    'job_posting_id' => $juniorPostingId,
                    'applicant_name' => 'Alex Rivera',
                    'applicant_email' => 'alex.rivera@example.com',
                    'applicant_phone' => '(512) 555-0201',
                    'cover_letter' => "I'm excited to apply for the Junior Insurance Agent position. While I'm new to the insurance industry, I have 3 years of sales experience in SaaS and a genuine passion for helping people protect what matters most. I recently passed my P&C exam and am ready to build a career in insurance.",
                    'experience' => json_encode(['3 years SaaS sales', 'P&C license obtained January 2026', 'Bachelor of Business from UT Austin']),
                    'status' => 'reviewing',
                ],
                [
                    'job_posting_id' => $juniorPostingId,
                    'applicant_name' => 'Priya Patel',
                    'applicant_email' => 'priya.patel@example.com',
                    'applicant_phone' => '(512) 555-0202',
                    'cover_letter' => "As a recent graduate with my P&C and Life licenses, I'm looking for an agency that invests in developing their agents. Martinez Insurance Group's reputation for mentorship is exactly what I'm looking for. I'm bilingual (English/Hindi) and eager to serve diverse communities.",
                    'experience' => json_encode(['P&C and Life licenses', 'Bilingual English/Hindi', 'Bachelor of Finance from Texas State', 'Insurance internship at Allstate']),
                    'status' => 'interview',
                ],
            ];

            foreach ($applications as $app) {
                DB::table('job_applications')->updateOrInsert(
                    ['applicant_email' => $app['applicant_email'], 'job_posting_id' => $app['job_posting_id']],
                    array_merge($app, ['created_at' => $now, 'updated_at' => $now])
                );
            }
        }

        if ($seniorPostingId) {
            DB::table('job_applications')->updateOrInsert(
                ['applicant_email' => 'david.thompson@example.com', 'job_posting_id' => $seniorPostingId],
                [
                    'job_posting_id' => $seniorPostingId,
                    'applicant_name' => 'David Thompson',
                    'applicant_email' => 'david.thompson@example.com',
                    'applicant_phone' => '(214) 555-0203',
                    'cover_letter' => "With 8 years in commercial insurance and a $750K book, I'm looking to join an agency where I can grow the commercial division. I hold my CIC designation and am licensed in TX, OK, and NM.",
                    'experience' => json_encode(['8 years commercial insurance', 'CIC designation', '$750K book of business', 'Licensed in TX, OK, NM', 'Former agency partner']),
                    'status' => 'submitted',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
