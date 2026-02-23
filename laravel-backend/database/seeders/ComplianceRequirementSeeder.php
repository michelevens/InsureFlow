<?php

namespace Database\Seeders;

use App\Models\ComplianceRequirement;
use Illuminate\Database\Seeder;

class ComplianceRequirementSeeder extends Seeder
{
    public function run(): void
    {
        $requirements = [
            // ── Universal Requirements (ALL states, ALL product types) ──
            [
                'state' => 'ALL', 'insurance_type' => 'ALL',
                'requirement_type' => 'license', 'title' => 'State Producer License',
                'description' => 'Obtain a valid insurance producer license in each state where you conduct business.',
                'details' => ['type' => 'resident_or_non_resident'],
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'State Department of Insurance',
            ],
            [
                'state' => 'ALL', 'insurance_type' => 'ALL',
                'requirement_type' => 'eo_insurance', 'title' => 'Errors & Omissions Insurance',
                'description' => 'Maintain E&O insurance with minimum coverage of $1,000,000 per occurrence / $3,000,000 aggregate.',
                'details' => ['min_per_occurrence' => 1000000, 'min_aggregate' => 3000000],
                'category' => 'insurance', 'is_required' => true, 'frequency' => 'annual',
                'authority' => 'State Department of Insurance',
            ],
            [
                'state' => 'ALL', 'insurance_type' => 'ALL',
                'requirement_type' => 'background_check', 'title' => 'Background Check & Fingerprinting',
                'description' => 'Complete a criminal background check and fingerprinting as required for initial licensure.',
                'details' => ['provider' => 'State-approved vendor (e.g., IdentoGO)'],
                'category' => 'regulatory', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'State Department of Insurance',
            ],
            [
                'state' => 'ALL', 'insurance_type' => 'ALL',
                'requirement_type' => 'other', 'title' => 'National Producer Number (NPN)',
                'description' => 'Register with NIPR and obtain a National Producer Number.',
                'details' => ['registry' => 'NIPR'],
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'National Insurance Producer Registry (NIPR)',
                'reference_url' => 'https://nipr.com',
            ],

            // ── Florida ──
            [
                'state' => 'FL', 'insurance_type' => 'ALL',
                'requirement_type' => 'ce_credit', 'title' => 'Florida CE Requirement — 24 Hours Biennial',
                'description' => 'Complete 24 hours of continuing education every 2 years, including 3 hours of ethics and 5 hours of Florida law.',
                'details' => ['total_hours' => 24, 'ethics_hours' => 3, 'state_law_hours' => 5],
                'category' => 'education', 'is_required' => true, 'frequency' => 'biennial',
                'authority' => 'Florida Department of Financial Services',
                'reference_url' => 'https://www.myfloridacfo.com/division/agents/',
            ],
            [
                'state' => 'FL', 'insurance_type' => 'life_term',
                'requirement_type' => 'license', 'title' => 'Florida License 2-14 (Life incl. Variable Annuity)',
                'description' => 'Obtain Florida Life Agent License (Line 2-14) to sell life insurance, including variable annuity products.',
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'Florida Department of Financial Services',
            ],
            [
                'state' => 'FL', 'insurance_type' => 'long_term_care',
                'requirement_type' => 'license', 'title' => 'Florida License 2-14 (Life) + LTC Training',
                'description' => 'Life license (2-14) plus initial 8-hour LTC training and 4-hour ongoing LTC CE per renewal.',
                'details' => ['initial_ltc_hours' => 8, 'ongoing_ltc_hours' => 4],
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'Florida Department of Financial Services',
            ],
            [
                'state' => 'FL', 'insurance_type' => 'health_individual',
                'requirement_type' => 'license', 'title' => 'Florida License 2-15 (Health)',
                'description' => 'Obtain Florida Health Agent License (Line 2-15) to sell health insurance.',
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'Florida Department of Financial Services',
            ],
            [
                'state' => 'FL', 'insurance_type' => 'ALL',
                'requirement_type' => 'other', 'title' => 'Florida Flood Disclosure',
                'description' => 'Provide flood insurance disclosure notice to all property insurance applicants.',
                'category' => 'regulatory', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'Florida Office of Insurance Regulation',
            ],

            // ── Texas ──
            [
                'state' => 'TX', 'insurance_type' => 'ALL',
                'requirement_type' => 'ce_credit', 'title' => 'Texas CE Requirement — 24 Hours Biennial',
                'description' => 'Complete 24 hours of CE every 2 years, including 2 hours of ethics.',
                'details' => ['total_hours' => 24, 'ethics_hours' => 2],
                'category' => 'education', 'is_required' => true, 'frequency' => 'biennial',
                'authority' => 'Texas Department of Insurance',
                'reference_url' => 'https://www.tdi.texas.gov/agent/index.html',
            ],
            [
                'state' => 'TX', 'insurance_type' => 'ALL',
                'requirement_type' => 'background_check', 'title' => 'Texas Fingerprinting via IdentoGO',
                'description' => 'Complete electronic fingerprinting through IdentoGO for Texas license application.',
                'details' => ['provider' => 'IdentoGO by IDEMIA'],
                'category' => 'regulatory', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'Texas Department of Insurance',
            ],
            [
                'state' => 'TX', 'insurance_type' => 'life_term',
                'requirement_type' => 'license', 'title' => 'Texas General Lines — Life License',
                'description' => 'Pass the Texas Life Insurance license exam to sell life products.',
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'Texas Department of Insurance',
            ],
            [
                'state' => 'TX', 'insurance_type' => 'auto',
                'requirement_type' => 'license', 'title' => 'Texas General Lines — Property & Casualty License',
                'description' => 'Pass the Texas Property & Casualty license exam to sell auto, home, and commercial insurance.',
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'Texas Department of Insurance',
            ],

            // ── California ──
            [
                'state' => 'CA', 'insurance_type' => 'ALL',
                'requirement_type' => 'ce_credit', 'title' => 'California CE Requirement — 24 Hours Biennial',
                'description' => 'Complete 24 hours of CE every 2 years, including 8 hours of ethics.',
                'details' => ['total_hours' => 24, 'ethics_hours' => 8],
                'category' => 'education', 'is_required' => true, 'frequency' => 'biennial',
                'authority' => 'California Department of Insurance',
                'reference_url' => 'https://www.insurance.ca.gov/0200-industry/0050-renew-license/',
            ],
            [
                'state' => 'CA', 'insurance_type' => 'life_term',
                'requirement_type' => 'license', 'title' => 'California Life-Only License',
                'description' => 'Pass the California Life-Only license exam. Requires pre-licensing education.',
                'details' => ['pre_license_hours' => 52],
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'California Department of Insurance',
            ],
            [
                'state' => 'CA', 'insurance_type' => 'long_term_care',
                'requirement_type' => 'ce_credit', 'title' => 'California LTC Partnership Training',
                'description' => 'Complete 8-hour initial LTC Partnership training plus 8 hours ongoing CE for LTC.',
                'details' => ['initial_hours' => 8, 'ongoing_hours' => 8],
                'category' => 'education', 'is_required' => true, 'frequency' => 'biennial',
                'authority' => 'California Department of Insurance',
            ],
            [
                'state' => 'CA', 'insurance_type' => 'ALL',
                'requirement_type' => 'other', 'title' => 'California Privacy Compliance',
                'description' => 'Comply with CCPA/CPRA requirements for handling consumer insurance data.',
                'category' => 'regulatory', 'is_required' => true, 'frequency' => 'annual',
                'authority' => 'California Privacy Protection Agency',
            ],

            // ── New York ──
            [
                'state' => 'NY', 'insurance_type' => 'ALL',
                'requirement_type' => 'ce_credit', 'title' => 'New York CE Requirement — 15 Hours Annually',
                'description' => 'Complete 15 hours of CE every year for life/health agents, including 1 hour of ethics.',
                'details' => ['total_hours' => 15, 'ethics_hours' => 1],
                'category' => 'education', 'is_required' => true, 'frequency' => 'annual',
                'authority' => 'New York Department of Financial Services',
                'reference_url' => 'https://www.dfs.ny.gov/',
            ],
            [
                'state' => 'NY', 'insurance_type' => 'ALL',
                'requirement_type' => 'ce_credit', 'title' => 'New York AML Training',
                'description' => 'Complete Anti-Money Laundering (AML) training annually as part of CE requirements.',
                'details' => ['hours' => 1, 'topic' => 'Anti-Money Laundering'],
                'category' => 'education', 'is_required' => true, 'frequency' => 'annual',
                'authority' => 'New York Department of Financial Services',
            ],
            [
                'state' => 'NY', 'insurance_type' => 'life_term',
                'requirement_type' => 'license', 'title' => 'New York Life Insurance License',
                'description' => 'Pass the New York Life Insurance license exam. Requires 40 hours pre-licensing.',
                'details' => ['pre_license_hours' => 40],
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'New York Department of Financial Services',
            ],
            [
                'state' => 'NY', 'insurance_type' => 'ALL',
                'requirement_type' => 'other', 'title' => 'New York Regulation 187 — Suitability',
                'description' => 'Comply with Reg 187 best interest / suitability standards for life and annuity sales.',
                'category' => 'regulatory', 'is_required' => true, 'frequency' => 'annual',
                'authority' => 'New York Department of Financial Services',
            ],

            // ── Georgia ──
            [
                'state' => 'GA', 'insurance_type' => 'ALL',
                'requirement_type' => 'ce_credit', 'title' => 'Georgia CE Requirement — 24 Hours Biennial',
                'description' => 'Complete 24 hours of CE every 2 years, including 3 hours of ethics.',
                'details' => ['total_hours' => 24, 'ethics_hours' => 3],
                'category' => 'education', 'is_required' => true, 'frequency' => 'biennial',
                'authority' => 'Georgia Office of Insurance and Safety Fire Commissioner',
                'reference_url' => 'https://www.oci.ga.gov/',
            ],
            [
                'state' => 'GA', 'insurance_type' => 'auto',
                'requirement_type' => 'license', 'title' => 'Georgia Property & Casualty License',
                'description' => 'Pass the Georgia P&C license exam. Requires 40 hours of pre-licensing education.',
                'details' => ['pre_license_hours' => 40],
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'Georgia Office of Insurance and Safety Fire Commissioner',
            ],

            // ── Illinois ──
            [
                'state' => 'IL', 'insurance_type' => 'ALL',
                'requirement_type' => 'ce_credit', 'title' => 'Illinois CE Requirement — 24 Hours Biennial',
                'description' => 'Complete 24 hours of CE every 2 years, including 3 hours of ethics.',
                'details' => ['total_hours' => 24, 'ethics_hours' => 3],
                'category' => 'education', 'is_required' => true, 'frequency' => 'biennial',
                'authority' => 'Illinois Department of Insurance',
                'reference_url' => 'https://doi.illinois.gov/',
            ],
            [
                'state' => 'IL', 'insurance_type' => 'ALL',
                'requirement_type' => 'other', 'title' => 'Illinois Flood Insurance Notice',
                'description' => 'Provide flood insurance availability disclosure to property insurance applicants.',
                'category' => 'regulatory', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'Illinois Department of Insurance',
            ],

            // ── Virginia ──
            [
                'state' => 'VA', 'insurance_type' => 'ALL',
                'requirement_type' => 'ce_credit', 'title' => 'Virginia CE Requirement — 24 Hours Biennial',
                'description' => 'Complete 24 hours of CE every 2 years, including 3 hours of ethics.',
                'details' => ['total_hours' => 24, 'ethics_hours' => 3],
                'category' => 'education', 'is_required' => true, 'frequency' => 'biennial',
                'authority' => 'Virginia Bureau of Insurance',
                'reference_url' => 'https://www.scc.virginia.gov/pages/Bureau-of-Insurance',
            ],
            [
                'state' => 'VA', 'insurance_type' => 'long_term_care',
                'requirement_type' => 'ce_credit', 'title' => 'Virginia LTC Partnership Training',
                'description' => 'Complete initial 8-hour LTC training plus 4 hours LTC-specific CE per renewal.',
                'details' => ['initial_hours' => 8, 'ongoing_hours' => 4],
                'category' => 'education', 'is_required' => true, 'frequency' => 'biennial',
                'authority' => 'Virginia Bureau of Insurance',
            ],

            // ── Arizona ──
            [
                'state' => 'AZ', 'insurance_type' => 'ALL',
                'requirement_type' => 'ce_credit', 'title' => 'Arizona CE Requirement — 24 Hours Biennial',
                'description' => 'Complete 24 hours of CE every 2 years, including 3 hours of ethics.',
                'details' => ['total_hours' => 24, 'ethics_hours' => 3],
                'category' => 'education', 'is_required' => true, 'frequency' => 'biennial',
                'authority' => 'Arizona Department of Insurance and Financial Institutions',
                'reference_url' => 'https://difi.az.gov/',
            ],
            [
                'state' => 'AZ', 'insurance_type' => 'ALL',
                'requirement_type' => 'license', 'title' => 'Arizona Producer License',
                'description' => 'Pass the Arizona insurance producer exam for relevant lines of authority.',
                'details' => ['pre_license_hours' => 40],
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'Arizona Department of Insurance and Financial Institutions',
            ],

            // ── Cross-state specialty requirements ──
            [
                'state' => 'ALL', 'insurance_type' => 'long_term_care',
                'requirement_type' => 'ce_credit', 'title' => 'LTC Partnership Certification Training',
                'description' => 'Complete state-approved LTC Partnership certification training (typically 8 hours initial).',
                'details' => ['initial_hours' => 8],
                'category' => 'education', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'State Department of Insurance',
            ],
            [
                'state' => 'ALL', 'insurance_type' => 'life_term',
                'requirement_type' => 'appointment', 'title' => 'Carrier Appointment for Life Products',
                'description' => 'Maintain active carrier appointments to sell life insurance products.',
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'annual',
                'authority' => 'Appointed Carriers',
            ],
            [
                'state' => 'ALL', 'insurance_type' => 'health_individual',
                'requirement_type' => 'ce_credit', 'title' => 'ACA / Health Reform Training',
                'description' => 'Complete Affordable Care Act training for health insurance marketplace certification.',
                'details' => ['hours' => 5, 'topic' => 'ACA Marketplace'],
                'category' => 'education', 'is_required' => true, 'frequency' => 'annual',
                'authority' => 'CMS / State Insurance Marketplace',
            ],
            [
                'state' => 'ALL', 'insurance_type' => 'medicare_supplement',
                'requirement_type' => 'ce_credit', 'title' => 'Medicare AHIP Certification',
                'description' => 'Complete America\'s Health Insurance Plans (AHIP) Medicare training and certification annually.',
                'details' => ['provider' => 'AHIP', 'hours' => 6],
                'category' => 'education', 'is_required' => true, 'frequency' => 'annual',
                'authority' => 'CMS / AHIP',
                'reference_url' => 'https://www.ahip.org/',
            ],
            [
                'state' => 'ALL', 'insurance_type' => 'disability_ltd',
                'requirement_type' => 'license', 'title' => 'Life & Health License (for DI products)',
                'description' => 'A Life & Health or Accident & Health license is required to sell disability insurance.',
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'State Department of Insurance',
            ],
            [
                'state' => 'ALL', 'insurance_type' => 'commercial_gl',
                'requirement_type' => 'license', 'title' => 'Property & Casualty License',
                'description' => 'P&C license required for commercial general liability insurance sales.',
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'State Department of Insurance',
            ],
            [
                'state' => 'ALL', 'insurance_type' => 'workers_comp',
                'requirement_type' => 'license', 'title' => 'Property & Casualty License (Workers Comp)',
                'description' => 'P&C license with workers compensation line of authority.',
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'one_time',
                'authority' => 'State Department of Insurance',
            ],
            [
                'state' => 'ALL', 'insurance_type' => 'ALL',
                'requirement_type' => 'other', 'title' => 'Annual License Renewal',
                'description' => 'Renew insurance producer license before expiration date. Pay renewal fees and confirm CE compliance.',
                'category' => 'licensing', 'is_required' => true, 'frequency' => 'annual',
                'authority' => 'State Department of Insurance',
            ],
            [
                'state' => 'ALL', 'insurance_type' => 'ALL',
                'requirement_type' => 'other', 'title' => 'Record Retention Policy',
                'description' => 'Maintain client records, applications, and correspondence for minimum 5 years as required by state regulations.',
                'details' => ['retention_years' => 5],
                'category' => 'documentation', 'is_required' => true, 'frequency' => 'annual',
                'authority' => 'State Department of Insurance',
            ],
            [
                'state' => 'ALL', 'insurance_type' => 'ALL',
                'requirement_type' => 'other', 'title' => 'Privacy & Data Security Compliance',
                'description' => 'Implement and maintain data security program compliant with NAIC Insurance Data Security Model Law.',
                'category' => 'regulatory', 'is_required' => true, 'frequency' => 'annual',
                'authority' => 'NAIC / State Department of Insurance',
            ],
        ];

        foreach ($requirements as $req) {
            ComplianceRequirement::updateOrCreate(
                ['state' => $req['state'], 'insurance_type' => $req['insurance_type'], 'title' => $req['title']],
                $req
            );
        }
    }
}
