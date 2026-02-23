<?php

namespace Database\Seeders;

use App\Models\Agency;
use App\Models\AgentProfile;
use App\Models\AgencyCarrierAppointment;
use App\Models\Carrier;
use App\Models\Lead;
use App\Models\PlatformProduct;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AgencyAgentSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding 10 agencies with 50 agents and 70 leads...');

        // Get available carriers and products for appointments
        $carrierIds = Carrier::where('is_active', true)->pluck('id')->toArray();
        $productIds = PlatformProduct::where('is_active', true)->pluck('id')->toArray();

        $agencies = $this->getAgencyDefinitions();

        $leadIndex = 0;
        $leadDefinitions = $this->getLeadDefinitions();

        foreach ($agencies as $letter => $agencyDef) {
            $this->command->info("Creating Agency {$letter}: {$agencyDef['name']}");

            // Create agency owner
            $owner = User::updateOrCreate(
                ['email' => "contact+agency{$letter}@ennhealth.com"],
                [
                    'name' => $agencyDef['owner_name'],
                    'password' => 'password',
                    'role' => 'agency_owner',
                    'phone' => $agencyDef['phone'],
                    'is_active' => true,
                    'email_verified_at' => now(),
                    'onboarding_completed' => true,
                    'onboarding_completed_at' => now(),
                ]
            );

            // Create agency
            $agency = Agency::updateOrCreate(
                ['slug' => Str::slug($agencyDef['name'])],
                [
                    'name' => $agencyDef['name'],
                    'agency_code' => strtoupper("AGY{$letter}" . str_pad(rand(100, 999), 3, '0')),
                    'owner_id' => $owner->id,
                    'description' => $agencyDef['description'],
                    'phone' => $agencyDef['phone'],
                    'email' => "contact+agency{$letter}@ennhealth.com",
                    'website' => "https://www." . Str::slug($agencyDef['name']) . ".com",
                    'address' => $agencyDef['address'],
                    'city' => $agencyDef['city'],
                    'state' => $agencyDef['state'],
                    'zip_code' => $agencyDef['zip'],
                    'is_verified' => true,
                    'is_active' => true,
                ]
            );

            // Link owner to agency
            $owner->update(['agency_id' => $agency->id]);

            // Create owner's agent profile
            AgentProfile::updateOrCreate(
                ['user_id' => $owner->id],
                [
                    'bio' => "Principal agent and owner of {$agencyDef['name']}. {$agencyDef['owner_bio']}",
                    'license_number' => $agencyDef['license_number'],
                    'license_states' => $agencyDef['license_states'],
                    'specialties' => $agencyDef['specialties'],
                    'carriers' => $agencyDef['carriers'],
                    'years_experience' => $agencyDef['years_experience'],
                    'city' => $agencyDef['city'],
                    'state' => $agencyDef['state'],
                    'avg_rating' => round(4.0 + (rand(0, 10) / 10), 2),
                    'review_count' => rand(20, 150),
                    'clients_served' => rand(100, 1000),
                ]
            );

            // Assign products to agency
            $numProducts = rand(5, min(15, count($productIds)));
            $agencyProductIds = array_slice($productIds, 0, $numProducts);
            shuffle($agencyProductIds);
            $pivotData = [];
            foreach ($agencyProductIds as $pid) {
                $pivotData[$pid] = ['is_active' => true];
            }
            $agency->platformProducts()->sync($pivotData);

            // Create carrier appointments
            $numCarriers = rand(3, min(7, count($carrierIds)));
            $selectedCarriers = array_slice($carrierIds, 0, $numCarriers);
            shuffle($selectedCarriers);
            foreach ($selectedCarriers as $cid) {
                // Appoint for 1-3 random products
                $appointProducts = array_slice($agencyProductIds, 0, rand(1, 3));
                foreach ($appointProducts as $pid) {
                    AgencyCarrierAppointment::updateOrCreate(
                        [
                            'agency_id' => $agency->id,
                            'carrier_id' => $cid,
                            'platform_product_id' => $pid,
                        ],
                        [
                            'appointment_number' => 'APT-' . strtoupper(Str::random(8)),
                            'effective_date' => now()->subMonths(rand(1, 24))->format('Y-m-d'),
                            'is_active' => true,
                        ]
                    );
                }
            }

            // Create 5 agents per agency
            $agentDefs = $this->getAgentDefinitions($letter);
            foreach ($agentDefs as $agentIndex => $agentDef) {
                $agentNum = $agentIndex + 1;
                $agentEmail = "contact+Agency{$letter}.agent{$agentNum}@ennhealth.com";

                $agent = User::updateOrCreate(
                    ['email' => $agentEmail],
                    [
                        'name' => $agentDef['name'],
                        'password' => 'password',
                        'role' => 'agent',
                        'phone' => $agentDef['phone'],
                        'agency_id' => $agency->id,
                        'is_active' => true,
                        'email_verified_at' => now(),
                        'onboarding_completed' => true,
                        'onboarding_completed_at' => now(),
                    ]
                );

                AgentProfile::updateOrCreate(
                    ['user_id' => $agent->id],
                    [
                        'bio' => $agentDef['bio'],
                        'license_number' => $agentDef['license_number'],
                        'license_states' => $agentDef['license_states'],
                        'specialties' => $agentDef['specialties'],
                        'carriers' => $agentDef['carriers'],
                        'years_experience' => $agentDef['years_experience'],
                        'city' => $agencyDef['city'],
                        'state' => $agencyDef['state'],
                        'avg_rating' => round(3.5 + (rand(0, 15) / 10), 2),
                        'review_count' => rand(5, 80),
                        'clients_served' => rand(20, 500),
                    ]
                );
            }

            // Create 7 leads per agency (70 total across 10 agencies)
            for ($l = 0; $l < 7 && $leadIndex < count($leadDefinitions); $l++) {
                $leadDef = $leadDefinitions[$leadIndex];

                // Assign to a random agent from this agency
                $agencyAgents = User::where('agency_id', $agency->id)->where('role', 'agent')->pluck('id')->toArray();
                $assignedAgentId = !empty($agencyAgents) ? $agencyAgents[array_rand($agencyAgents)] : null;

                Lead::updateOrCreate(
                    ['email' => $leadDef['email']],
                    [
                        'agent_id' => $assignedAgentId,
                        'agency_id' => $agency->id,
                        'first_name' => $leadDef['first_name'],
                        'last_name' => $leadDef['last_name'],
                        'phone' => $leadDef['phone'],
                        'insurance_type' => $leadDef['insurance_type'],
                        'status' => $leadDef['status'],
                        'source' => $leadDef['source'],
                        'estimated_value' => $leadDef['estimated_value'],
                        'notes' => $leadDef['notes'],
                    ]
                );

                $leadIndex++;
            }
        }

        $this->command->info("Created {$leadIndex} leads across 10 agencies.");
        $this->command->info('Agency & Agent seeding complete!');
    }

    private function getAgencyDefinitions(): array
    {
        return [
            'A' => [
                'name' => 'Apex Insurance Group',
                'owner_name' => 'Amanda Torres',
                'owner_bio' => 'Over 20 years specializing in personal and commercial lines.',
                'phone' => '(214) 555-0101',
                'address' => '1200 Commerce St, Suite 400',
                'city' => 'Dallas', 'state' => 'TX', 'zip' => '75201',
                'license_number' => 'TX-AGY-100001',
                'license_states' => ['TX', 'OK', 'AR', 'LA'],
                'specialties' => ['auto', 'homeowners', 'commercial_gl', 'umbrella_personal'],
                'carriers' => ['State Farm', 'Allstate', 'Progressive', 'Travelers'],
                'years_experience' => 22,
                'description' => 'Full-service insurance agency serving the greater Dallas-Fort Worth metroplex with personal and commercial lines.',
            ],
            'B' => [
                'name' => 'Beacon Risk Advisors',
                'owner_name' => 'Brian Mitchell',
                'owner_bio' => 'Expert in life, health, and benefits consulting.',
                'phone' => '(512) 555-0201',
                'address' => '500 Congress Ave, Suite 200',
                'city' => 'Austin', 'state' => 'TX', 'zip' => '78701',
                'license_number' => 'TX-AGY-100002',
                'license_states' => ['TX', 'CA', 'FL'],
                'specialties' => ['life_term', 'life_whole', 'health_individual', 'dental', 'vision'],
                'carriers' => ['MetLife', 'Allstate', 'Nationwide', 'USAA'],
                'years_experience' => 15,
                'description' => 'Life and health insurance specialists helping families and businesses plan for the future.',
            ],
            'C' => [
                'name' => 'Coastal Coverage Partners',
                'owner_name' => 'Carmen Ramirez',
                'owner_bio' => 'Specializing in flood, wind, and coastal property insurance.',
                'phone' => '(305) 555-0301',
                'address' => '2100 Biscayne Blvd',
                'city' => 'Miami', 'state' => 'FL', 'zip' => '33137',
                'license_number' => 'FL-AGY-200001',
                'license_states' => ['FL', 'GA', 'SC', 'NC'],
                'specialties' => ['homeowners', 'flood', 'renters', 'condo', 'umbrella_personal'],
                'carriers' => ['State Farm', 'Travelers', 'Liberty Mutual', 'Farmers Insurance'],
                'years_experience' => 18,
                'description' => 'Coastal property insurance experts protecting homes from Miami to the Carolinas.',
            ],
            'D' => [
                'name' => 'Dominion Commercial Insurance',
                'owner_name' => 'David Kim',
                'owner_bio' => 'Commercial lines expert with a focus on tech startups and mid-market businesses.',
                'phone' => '(415) 555-0401',
                'address' => '101 Market St, Suite 800',
                'city' => 'San Francisco', 'state' => 'CA', 'zip' => '94105',
                'license_number' => 'CA-AGY-300001',
                'license_states' => ['CA', 'OR', 'WA', 'NV'],
                'specialties' => ['bop', 'commercial_gl', 'cyber_liability', 'professional_liability', 'directors_officers'],
                'carriers' => ['Travelers', 'Nationwide', 'Liberty Mutual'],
                'years_experience' => 12,
                'description' => 'Commercial insurance for technology companies, startups, and growing businesses on the West Coast.',
            ],
            'E' => [
                'name' => 'Eagle Shield Agency',
                'owner_name' => 'Elena Volkov',
                'owner_bio' => 'Passionate about helping military families and veterans find the right coverage.',
                'phone' => '(757) 555-0501',
                'address' => '400 Granby St, Suite 300',
                'city' => 'Norfolk', 'state' => 'VA', 'zip' => '23510',
                'license_number' => 'VA-AGY-400001',
                'license_states' => ['VA', 'NC', 'MD', 'DC'],
                'specialties' => ['auto', 'homeowners', 'life_term', 'renters'],
                'carriers' => ['USAA', 'Geico', 'State Farm', 'Allstate'],
                'years_experience' => 10,
                'description' => 'Proudly serving military families and veterans with personal insurance solutions.',
            ],
            'F' => [
                'name' => 'Frontier Benefits Group',
                'owner_name' => 'Frank Castellano',
                'owner_bio' => 'Employee benefits specialist helping businesses attract and retain talent.',
                'phone' => '(312) 555-0601',
                'address' => '233 S Wacker Dr, Suite 1500',
                'city' => 'Chicago', 'state' => 'IL', 'zip' => '60606',
                'license_number' => 'IL-AGY-500001',
                'license_states' => ['IL', 'IN', 'WI', 'MI', 'OH'],
                'specialties' => ['health_group', 'dental', 'vision', 'disability_short_term', 'disability_long_term', 'life_term'],
                'carriers' => ['MetLife', 'Nationwide', 'Allstate'],
                'years_experience' => 17,
                'description' => 'Employee benefits and group insurance solutions for Midwest businesses.',
            ],
            'G' => [
                'name' => 'Guardian Insurance Associates',
                'owner_name' => 'Grace Okafor',
                'owner_bio' => 'Multi-line agency dedicated to holistic risk management.',
                'phone' => '(404) 555-0701',
                'address' => '191 Peachtree St NE, Suite 500',
                'city' => 'Atlanta', 'state' => 'GA', 'zip' => '30303',
                'license_number' => 'GA-AGY-600001',
                'license_states' => ['GA', 'SC', 'NC', 'TN', 'AL'],
                'specialties' => ['auto', 'homeowners', 'life_term', 'health_individual', 'bop', 'workers_comp'],
                'carriers' => ['State Farm', 'Progressive', 'Travelers', 'Farmers Insurance', 'MetLife'],
                'years_experience' => 20,
                'description' => 'Full-service agency providing personal and commercial insurance across the Southeast.',
            ],
            'H' => [
                'name' => 'Horizon Surety & Bonds',
                'owner_name' => 'Henry Park',
                'owner_bio' => 'Surety bond specialist with deep construction industry expertise.',
                'phone' => '(602) 555-0801',
                'address' => '2800 N Central Ave',
                'city' => 'Phoenix', 'state' => 'AZ', 'zip' => '85004',
                'license_number' => 'AZ-AGY-700001',
                'license_states' => ['AZ', 'NV', 'NM', 'CO', 'UT'],
                'specialties' => ['surety_bond', 'commercial_gl', 'workers_comp', 'commercial_auto', 'inland_marine'],
                'carriers' => ['Travelers', 'Liberty Mutual', 'Nationwide'],
                'years_experience' => 14,
                'description' => 'Surety bonds and construction insurance for contractors and builders in the Southwest.',
            ],
            'I' => [
                'name' => 'Integrity Senior Solutions',
                'owner_name' => 'Irene Washington',
                'owner_bio' => 'Helping seniors navigate Medicare and long-term care options.',
                'phone' => '(813) 555-0901',
                'address' => '3000 Bayport Dr, Suite 100',
                'city' => 'Tampa', 'state' => 'FL', 'zip' => '33607',
                'license_number' => 'FL-AGY-200002',
                'license_states' => ['FL', 'GA', 'AL', 'MS'],
                'specialties' => ['medicare_supplement', 'medicare_advantage', 'long_term_care', 'life_final_expense', 'annuity'],
                'carriers' => ['MetLife', 'Allstate', 'USAA'],
                'years_experience' => 16,
                'description' => 'Senior insurance specialists: Medicare, long-term care, final expense, and annuities.',
            ],
            'J' => [
                'name' => 'Jade Risk Management',
                'owner_name' => 'James Nguyen',
                'owner_bio' => 'Boutique agency focused on high-net-worth personal insurance.',
                'phone' => '(212) 555-1001',
                'address' => '450 Park Ave, Suite 2000',
                'city' => 'New York', 'state' => 'NY', 'zip' => '10022',
                'license_number' => 'NY-AGY-800001',
                'license_states' => ['NY', 'NJ', 'CT', 'PA', 'MA'],
                'specialties' => ['homeowners', 'auto', 'umbrella_personal', 'jewelry_valuables', 'boat_watercraft', 'event_liability'],
                'carriers' => ['Travelers', 'Liberty Mutual', 'Allstate', 'USAA', 'Farmers Insurance'],
                'years_experience' => 25,
                'description' => 'High-net-worth personal insurance: luxury homes, collections, yachts, and specialty coverage.',
            ],
        ];
    }

    private function getAgentDefinitions(string $agencyLetter): array
    {
        $pool = [
            'A' => [
                ['name' => 'Alex Rivera', 'bio' => 'Personal lines specialist with deep Texas market knowledge.', 'license_number' => 'TX-AG-A10001', 'license_states' => ['TX', 'OK'], 'specialties' => ['auto', 'homeowners'], 'carriers' => ['State Farm', 'Allstate'], 'years_experience' => 5, 'phone' => '(214) 555-0111'],
                ['name' => 'Ashley Patel', 'bio' => 'Commercial lines advisor helping small businesses protect their assets.', 'license_number' => 'TX-AG-A10002', 'license_states' => ['TX', 'AR'], 'specialties' => ['commercial_gl', 'bop'], 'carriers' => ['Travelers', 'Progressive'], 'years_experience' => 8, 'phone' => '(214) 555-0112'],
                ['name' => 'Andrew Lopez', 'bio' => 'Bilingual agent serving the DFW Hispanic community.', 'license_number' => 'TX-AG-A10003', 'license_states' => ['TX', 'LA'], 'specialties' => ['auto', 'renters', 'life_term'], 'carriers' => ['State Farm', 'Progressive'], 'years_experience' => 3, 'phone' => '(214) 555-0113'],
                ['name' => 'Alicia Chen', 'bio' => 'Umbrella and excess liability specialist.', 'license_number' => 'TX-AG-A10004', 'license_states' => ['TX'], 'specialties' => ['umbrella_personal', 'homeowners'], 'carriers' => ['Allstate', 'Travelers'], 'years_experience' => 6, 'phone' => '(214) 555-0114'],
                ['name' => 'Aaron Brooks', 'bio' => 'New business specialist focused on client acquisition.', 'license_number' => 'TX-AG-A10005', 'license_states' => ['TX', 'OK', 'AR'], 'specialties' => ['auto', 'homeowners', 'renters'], 'carriers' => ['State Farm', 'Progressive', 'Allstate'], 'years_experience' => 2, 'phone' => '(214) 555-0115'],
            ],
            'B' => [
                ['name' => 'Beth Morrison', 'bio' => 'Life insurance planner with CFP designation.', 'license_number' => 'TX-AG-B10001', 'license_states' => ['TX', 'CA'], 'specialties' => ['life_term', 'life_whole', 'annuity'], 'carriers' => ['MetLife', 'Allstate'], 'years_experience' => 10, 'phone' => '(512) 555-0211'],
                ['name' => 'Brandon Hayes', 'bio' => 'Health insurance navigator specializing in ACA marketplace.', 'license_number' => 'TX-AG-B10002', 'license_states' => ['TX', 'FL'], 'specialties' => ['health_individual', 'dental', 'vision'], 'carriers' => ['MetLife', 'Nationwide'], 'years_experience' => 7, 'phone' => '(512) 555-0212'],
                ['name' => 'Bianca Flores', 'bio' => 'Group benefits consultant for employers.', 'license_number' => 'TX-AG-B10003', 'license_states' => ['TX'], 'specialties' => ['health_group', 'dental', 'disability_short_term'], 'carriers' => ['MetLife', 'USAA'], 'years_experience' => 9, 'phone' => '(512) 555-0213'],
                ['name' => 'Bradley Cooper', 'bio' => 'Retirement and annuity planning specialist.', 'license_number' => 'TX-AG-B10004', 'license_states' => ['TX', 'CA'], 'specialties' => ['annuity', 'life_universal'], 'carriers' => ['Allstate', 'Nationwide'], 'years_experience' => 12, 'phone' => '(512) 555-0214'],
                ['name' => 'Brittany Simmons', 'bio' => 'Wellness-focused health insurance advisor.', 'license_number' => 'TX-AG-B10005', 'license_states' => ['TX'], 'specialties' => ['health_individual', 'vision', 'prescription_drug'], 'carriers' => ['MetLife'], 'years_experience' => 4, 'phone' => '(512) 555-0215'],
            ],
            'C' => [
                ['name' => 'Carlos Reyes', 'bio' => 'Flood insurance expert with NFIP certification.', 'license_number' => 'FL-AG-C10001', 'license_states' => ['FL', 'GA'], 'specialties' => ['flood', 'homeowners'], 'carriers' => ['State Farm', 'Liberty Mutual'], 'years_experience' => 8, 'phone' => '(305) 555-0311'],
                ['name' => 'Chloe Adams', 'bio' => 'Condo and renters insurance specialist for South Florida.', 'license_number' => 'FL-AG-C10002', 'license_states' => ['FL'], 'specialties' => ['condo', 'renters'], 'carriers' => ['Travelers', 'Farmers Insurance'], 'years_experience' => 5, 'phone' => '(305) 555-0312'],
                ['name' => 'Christopher Davis', 'bio' => 'Coastal property risk assessment and mitigation advisor.', 'license_number' => 'FL-AG-C10003', 'license_states' => ['FL', 'SC'], 'specialties' => ['homeowners', 'flood', 'umbrella_personal'], 'carriers' => ['State Farm', 'Travelers'], 'years_experience' => 11, 'phone' => '(305) 555-0313'],
                ['name' => 'Catalina Ortiz', 'bio' => 'Bilingual agent serving Miami-Dade community.', 'license_number' => 'FL-AG-C10004', 'license_states' => ['FL'], 'specialties' => ['homeowners', 'auto', 'renters'], 'carriers' => ['Liberty Mutual', 'State Farm'], 'years_experience' => 6, 'phone' => '(305) 555-0314'],
                ['name' => 'Colin Wright', 'bio' => 'Property portfolio specialist for investors.', 'license_number' => 'FL-AG-C10005', 'license_states' => ['FL', 'NC'], 'specialties' => ['homeowners', 'umbrella_personal', 'inland_marine'], 'carriers' => ['Travelers', 'Farmers Insurance'], 'years_experience' => 9, 'phone' => '(305) 555-0315'],
            ],
            'D' => [
                ['name' => 'Diana Wu', 'bio' => 'Cyber liability and tech E&O specialist.', 'license_number' => 'CA-AG-D10001', 'license_states' => ['CA', 'OR'], 'specialties' => ['cyber_liability', 'professional_liability'], 'carriers' => ['Travelers', 'Liberty Mutual'], 'years_experience' => 7, 'phone' => '(415) 555-0411'],
                ['name' => 'Derek Johnson', 'bio' => 'BOP and general liability for startups.', 'license_number' => 'CA-AG-D10002', 'license_states' => ['CA', 'WA'], 'specialties' => ['bop', 'commercial_gl'], 'carriers' => ['Nationwide', 'Travelers'], 'years_experience' => 5, 'phone' => '(415) 555-0412'],
                ['name' => 'Daniela Gomez', 'bio' => 'Directors & officers and EPLI specialist.', 'license_number' => 'CA-AG-D10003', 'license_states' => ['CA', 'NV'], 'specialties' => ['directors_officers', 'epli'], 'carriers' => ['Travelers', 'Liberty Mutual'], 'years_experience' => 10, 'phone' => '(415) 555-0413'],
                ['name' => 'Douglas Lee', 'bio' => 'Commercial property and inland marine advisor.', 'license_number' => 'CA-AG-D10004', 'license_states' => ['CA'], 'specialties' => ['commercial_property', 'inland_marine'], 'carriers' => ['Nationwide'], 'years_experience' => 8, 'phone' => '(415) 555-0414'],
                ['name' => 'Daisy Tran', 'bio' => 'Workers comp and commercial auto specialist.', 'license_number' => 'CA-AG-D10005', 'license_states' => ['CA', 'OR', 'WA'], 'specialties' => ['workers_comp', 'commercial_auto'], 'carriers' => ['Liberty Mutual', 'Travelers'], 'years_experience' => 6, 'phone' => '(415) 555-0415'],
            ],
            'E' => [
                ['name' => 'Evan Carter', 'bio' => 'Auto insurance specialist for military families.', 'license_number' => 'VA-AG-E10001', 'license_states' => ['VA', 'NC'], 'specialties' => ['auto', 'renters'], 'carriers' => ['USAA', 'Geico'], 'years_experience' => 4, 'phone' => '(757) 555-0511'],
                ['name' => 'Emma Foster', 'bio' => 'Home and renters insurance for service members.', 'license_number' => 'VA-AG-E10002', 'license_states' => ['VA', 'MD'], 'specialties' => ['homeowners', 'renters'], 'carriers' => ['USAA', 'State Farm'], 'years_experience' => 6, 'phone' => '(757) 555-0512'],
                ['name' => 'Ethan Powell', 'bio' => 'Life insurance planner for military transitions.', 'license_number' => 'VA-AG-E10003', 'license_states' => ['VA', 'DC'], 'specialties' => ['life_term', 'life_whole'], 'carriers' => ['Allstate', 'USAA'], 'years_experience' => 8, 'phone' => '(757) 555-0513'],
                ['name' => 'Elizabeth Gray', 'bio' => 'Multi-line agent for military bases.', 'license_number' => 'VA-AG-E10004', 'license_states' => ['VA'], 'specialties' => ['auto', 'homeowners', 'life_term'], 'carriers' => ['USAA', 'Geico', 'State Farm'], 'years_experience' => 3, 'phone' => '(757) 555-0514'],
                ['name' => 'Eric Monroe', 'bio' => 'Claims advocacy and policy review specialist.', 'license_number' => 'VA-AG-E10005', 'license_states' => ['VA', 'NC', 'MD'], 'specialties' => ['auto', 'homeowners'], 'carriers' => ['Geico', 'Allstate'], 'years_experience' => 7, 'phone' => '(757) 555-0515'],
            ],
            'F' => [
                ['name' => 'Fiona McKenzie', 'bio' => 'Group dental and vision specialist.', 'license_number' => 'IL-AG-F10001', 'license_states' => ['IL', 'WI'], 'specialties' => ['dental', 'vision', 'health_group'], 'carriers' => ['MetLife', 'Nationwide'], 'years_experience' => 9, 'phone' => '(312) 555-0611'],
                ['name' => 'Felix Ramirez', 'bio' => 'Short-term disability and leave management.', 'license_number' => 'IL-AG-F10002', 'license_states' => ['IL', 'IN'], 'specialties' => ['disability_short_term', 'disability_long_term'], 'carriers' => ['MetLife', 'Allstate'], 'years_experience' => 6, 'phone' => '(312) 555-0612'],
                ['name' => 'Faith Jennings', 'bio' => 'Employee benefits enrollment specialist.', 'license_number' => 'IL-AG-F10003', 'license_states' => ['IL', 'MI'], 'specialties' => ['health_group', 'life_term'], 'carriers' => ['Nationwide', 'MetLife'], 'years_experience' => 11, 'phone' => '(312) 555-0613'],
                ['name' => 'Frederick Cole', 'bio' => 'Benefits compliance and ACA reporting.', 'license_number' => 'IL-AG-F10004', 'license_states' => ['IL', 'OH'], 'specialties' => ['health_group', 'dental', 'vision'], 'carriers' => ['Allstate', 'MetLife'], 'years_experience' => 13, 'phone' => '(312) 555-0614'],
                ['name' => 'Francesca Bell', 'bio' => 'Wellness program integration specialist.', 'license_number' => 'IL-AG-F10005', 'license_states' => ['IL'], 'specialties' => ['health_group', 'disability_short_term'], 'carriers' => ['MetLife'], 'years_experience' => 4, 'phone' => '(312) 555-0615'],
            ],
            'G' => [
                ['name' => 'Gavin Harper', 'bio' => 'Multi-line personal insurance advisor.', 'license_number' => 'GA-AG-G10001', 'license_states' => ['GA', 'SC'], 'specialties' => ['auto', 'homeowners', 'life_term'], 'carriers' => ['State Farm', 'Progressive'], 'years_experience' => 7, 'phone' => '(404) 555-0711'],
                ['name' => 'Gina Santos', 'bio' => 'Health insurance navigator for individuals and families.', 'license_number' => 'GA-AG-G10002', 'license_states' => ['GA', 'TN'], 'specialties' => ['health_individual', 'dental'], 'carriers' => ['MetLife', 'Travelers'], 'years_experience' => 5, 'phone' => '(404) 555-0712'],
                ['name' => 'Grant Thompson', 'bio' => 'Small business insurance and BOP specialist.', 'license_number' => 'GA-AG-G10003', 'license_states' => ['GA', 'NC'], 'specialties' => ['bop', 'workers_comp'], 'carriers' => ['Farmers Insurance', 'Travelers'], 'years_experience' => 9, 'phone' => '(404) 555-0713'],
                ['name' => 'Gabriella Ellis', 'bio' => 'Commercial lines underwriting liaison.', 'license_number' => 'GA-AG-G10004', 'license_states' => ['GA', 'AL'], 'specialties' => ['commercial_gl', 'commercial_property'], 'carriers' => ['Travelers', 'Progressive'], 'years_experience' => 11, 'phone' => '(404) 555-0714'],
                ['name' => 'George Patel', 'bio' => 'Cross-selling specialist building complete coverage portfolios.', 'license_number' => 'GA-AG-G10005', 'license_states' => ['GA'], 'specialties' => ['auto', 'homeowners', 'umbrella_personal', 'life_term'], 'carriers' => ['State Farm', 'MetLife'], 'years_experience' => 6, 'phone' => '(404) 555-0715'],
            ],
            'H' => [
                ['name' => 'Hannah Burke', 'bio' => 'Construction surety bond underwriter.', 'license_number' => 'AZ-AG-H10001', 'license_states' => ['AZ', 'NV'], 'specialties' => ['surety_bond', 'commercial_gl'], 'carriers' => ['Travelers', 'Liberty Mutual'], 'years_experience' => 8, 'phone' => '(602) 555-0811'],
                ['name' => 'Hugo Mendez', 'bio' => 'Workers comp specialist for construction trades.', 'license_number' => 'AZ-AG-H10002', 'license_states' => ['AZ', 'NM'], 'specialties' => ['workers_comp', 'commercial_auto'], 'carriers' => ['Liberty Mutual', 'Nationwide'], 'years_experience' => 10, 'phone' => '(602) 555-0812'],
                ['name' => 'Holly Nguyen', 'bio' => 'Commercial auto and fleet insurance advisor.', 'license_number' => 'AZ-AG-H10003', 'license_states' => ['AZ', 'CO'], 'specialties' => ['commercial_auto', 'inland_marine'], 'carriers' => ['Travelers', 'Nationwide'], 'years_experience' => 6, 'phone' => '(602) 555-0813'],
                ['name' => 'Hector Rivera', 'bio' => 'Contractor equipment and builders risk specialist.', 'license_number' => 'AZ-AG-H10004', 'license_states' => ['AZ', 'UT'], 'specialties' => ['inland_marine', 'commercial_property'], 'carriers' => ['Liberty Mutual', 'Travelers'], 'years_experience' => 12, 'phone' => '(602) 555-0814'],
                ['name' => 'Heather Scott', 'bio' => 'Performance and bid bond specialist.', 'license_number' => 'AZ-AG-H10005', 'license_states' => ['AZ'], 'specialties' => ['surety_bond', 'commercial_gl'], 'carriers' => ['Travelers'], 'years_experience' => 5, 'phone' => '(602) 555-0815'],
            ],
            'I' => [
                ['name' => 'Isaac Martin', 'bio' => 'Medicare supplement plan comparison specialist.', 'license_number' => 'FL-AG-I10001', 'license_states' => ['FL', 'GA'], 'specialties' => ['medicare_supplement', 'medicare_advantage'], 'carriers' => ['MetLife', 'USAA'], 'years_experience' => 7, 'phone' => '(813) 555-0911'],
                ['name' => 'Ivy Zhang', 'bio' => 'Long-term care planning specialist.', 'license_number' => 'FL-AG-I10002', 'license_states' => ['FL', 'AL'], 'specialties' => ['long_term_care', 'life_final_expense'], 'carriers' => ['Allstate', 'MetLife'], 'years_experience' => 9, 'phone' => '(813) 555-0912'],
                ['name' => 'Ian Cooper', 'bio' => 'Annuity and retirement income planning.', 'license_number' => 'FL-AG-I10003', 'license_states' => ['FL'], 'specialties' => ['annuity', 'life_universal'], 'carriers' => ['MetLife', 'USAA'], 'years_experience' => 14, 'phone' => '(813) 555-0913'],
                ['name' => 'Isabelle Moreno', 'bio' => 'Final expense and burial insurance specialist.', 'license_number' => 'FL-AG-I10004', 'license_states' => ['FL', 'MS'], 'specialties' => ['life_final_expense', 'life_term'], 'carriers' => ['Allstate', 'MetLife'], 'years_experience' => 5, 'phone' => '(813) 555-0914'],
                ['name' => 'Irvin Grant', 'bio' => 'Medicare Advantage enrollment specialist.', 'license_number' => 'FL-AG-I10005', 'license_states' => ['FL', 'GA'], 'specialties' => ['medicare_advantage', 'prescription_drug'], 'carriers' => ['USAA', 'MetLife'], 'years_experience' => 6, 'phone' => '(813) 555-0915'],
            ],
            'J' => [
                ['name' => 'Julia Whitfield', 'bio' => 'High-value home insurance for luxury properties.', 'license_number' => 'NY-AG-J10001', 'license_states' => ['NY', 'NJ'], 'specialties' => ['homeowners', 'jewelry_valuables'], 'carriers' => ['Travelers', 'Liberty Mutual'], 'years_experience' => 10, 'phone' => '(212) 555-1011'],
                ['name' => 'Jordan Blake', 'bio' => 'Personal umbrella and excess liability advisor.', 'license_number' => 'NY-AG-J10002', 'license_states' => ['NY', 'CT'], 'specialties' => ['umbrella_personal', 'auto'], 'carriers' => ['Allstate', 'USAA'], 'years_experience' => 8, 'phone' => '(212) 555-1012'],
                ['name' => 'Jasmine Cheung', 'bio' => 'Yacht and watercraft insurance specialist.', 'license_number' => 'NY-AG-J10003', 'license_states' => ['NY', 'NJ', 'CT'], 'specialties' => ['boat_watercraft', 'event_liability'], 'carriers' => ['Travelers', 'Farmers Insurance'], 'years_experience' => 12, 'phone' => '(212) 555-1013'],
                ['name' => 'Jason Rivera', 'bio' => 'Classic car and specialty vehicle insurance.', 'license_number' => 'NY-AG-J10004', 'license_states' => ['NY', 'PA'], 'specialties' => ['auto', 'motorcycle', 'rv_motorhome'], 'carriers' => ['Liberty Mutual', 'USAA'], 'years_experience' => 7, 'phone' => '(212) 555-1014'],
                ['name' => 'Jenna Kim', 'bio' => 'Event and special occasion liability coverage.', 'license_number' => 'NY-AG-J10005', 'license_states' => ['NY', 'MA'], 'specialties' => ['event_liability', 'umbrella_personal'], 'carriers' => ['Allstate', 'Farmers Insurance'], 'years_experience' => 5, 'phone' => '(212) 555-1015'],
            ],
        ];

        return $pool[$agencyLetter] ?? [];
    }

    private function getLeadDefinitions(): array
    {
        $statuses = ['new', 'contacted', 'quoted', 'applied', 'won', 'lost'];
        $sources = ['website', 'referral', 'calculator', 'marketplace', 'phone', 'partner', 'social_media'];
        $types = ['auto', 'homeowners', 'life_term', 'health_individual', 'renters', 'bop', 'commercial_gl',
                  'flood', 'umbrella_personal', 'medicare_supplement', 'dental', 'workers_comp', 'cyber_liability'];

        $firstNames = ['Michael', 'Sarah', 'David', 'Jennifer', 'Robert', 'Linda', 'William', 'Patricia',
                       'Richard', 'Elizabeth', 'Joseph', 'Barbara', 'Thomas', 'Susan', 'Charles', 'Jessica',
                       'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Betty',
                       'Mark', 'Dorothy', 'Steven', 'Sandra', 'Paul', 'Ashley', 'Andrew', 'Kimberly',
                       'Joshua', 'Emily', 'Kenneth', 'Donna', 'Kevin', 'Michelle', 'Brian', 'Carol',
                       'George', 'Amanda', 'Timothy', 'Melissa', 'Ronald', 'Deborah', 'Edward', 'Stephanie',
                       'Jason', 'Rebecca', 'Jeffrey', 'Sharon', 'Ryan', 'Laura', 'Jacob', 'Cynthia',
                       'Gary', 'Kathleen', 'Nicholas', 'Amy', 'Eric', 'Angela', 'Jonathan', 'Shirley',
                       'Stephen', 'Anna', 'Larry', 'Brenda', 'Justin', 'Pamela'];

        $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
                      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
                      'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
                      'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
                      'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
                      'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
                      'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz',
                      'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales',
                      'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan'];

        $leads = [];
        for ($i = 0; $i < 70; $i++) {
            $first = $firstNames[$i % count($firstNames)];
            $last = $lastNames[$i % count($lastNames)];
            $type = $types[$i % count($types)];
            $status = $statuses[$i % count($statuses)];
            $source = $sources[$i % count($sources)];
            $num = str_pad($i + 1, 3, '0', STR_PAD_LEFT);

            $leads[] = [
                'first_name' => $first,
                'last_name' => $last,
                'email' => "contact+lead{$num}@ennhealth.com",
                'phone' => '(555) ' . rand(100, 999) . '-' . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT),
                'insurance_type' => $type,
                'status' => $status,
                'source' => $source,
                'estimated_value' => round(rand(500, 15000) / 100, 2) * 100,
                'notes' => $this->getLeadNote($type, $status),
            ];
        }

        return $leads;
    }

    private function getLeadNote(string $type, string $status): string
    {
        $notes = [
            'new' => "New {$type} inquiry. Needs initial contact and qualification.",
            'contacted' => "Spoke with prospect about {$type} coverage. Gathering additional info.",
            'quoted' => "Sent {$type} quote. Awaiting decision from the client.",
            'applied' => "Application submitted for {$type} coverage. In underwriting.",
            'won' => "Policy bound for {$type}. Welcome packet sent.",
            'lost' => "Prospect chose another provider for {$type}. Follow up in 90 days.",
        ];

        return $notes[$status] ?? "Lead for {$type} insurance.";
    }
}
