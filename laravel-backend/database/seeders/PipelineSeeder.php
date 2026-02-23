<?php

namespace Database\Seeders;

use App\Models\Agency;
use App\Models\Application;
use App\Models\Appointment;
use App\Models\CarrierProduct;
use App\Models\Claim;
use App\Models\Commission;
use App\Models\Lead;
use App\Models\Policy;
use App\Models\RoutingRule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PipelineSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding pipeline data (applications, policies, commissions, claims, appointments, routing rules)...');

        $agencies = Agency::with('owner')->where('is_active', true)->get();
        if ($agencies->isEmpty()) {
            $this->command->warn('No agencies found. Run AgencyAgentSeeder first.');
            return;
        }

        $carrierProducts = CarrierProduct::where('is_active', true)->get();
        if ($carrierProducts->isEmpty()) {
            $this->command->warn('No carrier products found. Run CarrierSeeder first.');
            return;
        }

        $this->seedApplicationsAndPolicies($agencies, $carrierProducts);
        $this->seedClaims();
        $this->seedAppointments($agencies);
        $this->seedRoutingRules($agencies);

        $this->command->info('Pipeline seeding complete!');
    }

    private function seedApplicationsAndPolicies($agencies, $carrierProducts): void
    {
        $this->command->info('Creating applications, policies, and commissions...');

        $statusDistribution = [
            'draft' => 4,
            'submitted' => 4,
            'under_review' => 4,
            'approved' => 3,
            'declined' => 2,
            'bound' => 8,
        ];

        $appIndex = 0;
        $policyIndex = 0;
        $commissionIndex = 0;

        foreach ($agencies as $agency) {
            $agents = User::where('agency_id', $agency->id)->where('role', 'agent')->get();
            $leads = Lead::where('agency_id', $agency->id)->get();

            if ($agents->isEmpty() || $leads->isEmpty()) continue;

            // Pick leads for applications (not all leads become applications)
            $appLeads = $leads->shuffle()->take(rand(2, 4));

            foreach ($appLeads as $lead) {
                // Pick a status from distribution
                $status = $this->pickWeightedStatus($statusDistribution);

                $agent = $agents->random();
                $carrierProduct = $carrierProducts->random();
                $monthlyPremium = round(rand(8000, 50000) / 100, 2);
                $submittedAt = ($status !== 'draft') ? now()->subDays(rand(5, 90)) : null;

                $app = Application::updateOrCreate(
                    [
                        'lead_id' => $lead->id,
                        'agency_id' => $agency->id,
                    ],
                    [
                        'reference' => 'APP-' . strtoupper(Str::random(8)),
                        'user_id' => $lead->user_id ?? $agent->id,
                        'agent_id' => $agent->id,
                        'carrier_product_id' => $carrierProduct->id,
                        'insurance_type' => $lead->insurance_type ?? $carrierProduct->insurance_type,
                        'carrier_name' => $carrierProduct->carrier?->name ?? 'Demo Carrier',
                        'monthly_premium' => $monthlyPremium,
                        'status' => $status,
                        'submitted_at' => $submittedAt,
                        'applicant_data' => [
                            'first_name' => $lead->first_name,
                            'last_name' => $lead->last_name,
                            'email' => $lead->email,
                            'phone' => $lead->phone,
                        ],
                    ]
                );
                $appIndex++;

                // Create policy for bound applications
                if ($status === 'bound') {
                    $effectiveDate = now()->subDays(rand(1, 180));
                    $expirationDate = $effectiveDate->copy()->addYear();
                    $policyStatus = 'active';
                    if ($expirationDate->isBefore(now())) {
                        $policyStatus = 'expired';
                    } elseif ($expirationDate->isBefore(now()->addDays(30))) {
                        $policyStatus = 'expiring_soon';
                    }

                    $annualPremium = round($monthlyPremium * 12, 2);

                    $policy = Policy::updateOrCreate(
                        [
                            'application_id' => $app->id,
                        ],
                        [
                            'policy_number' => 'POL-' . strtoupper(Str::random(8)),
                            'user_id' => $app->user_id,
                            'agent_id' => $agent->id,
                            'agency_id' => $agency->id,
                            'carrier_product_id' => $carrierProduct->id,
                            'type' => $lead->insurance_type ?? $carrierProduct->insurance_type,
                            'carrier_name' => $carrierProduct->carrier?->name ?? 'Demo Carrier',
                            'monthly_premium' => $monthlyPremium,
                            'annual_premium' => $annualPremium,
                            'deductible' => round(rand(50000, 250000) / 100, 2),
                            'coverage_limit' => '$' . number_format(rand(100, 1000) * 1000, 0),
                            'status' => $policyStatus,
                            'effective_date' => $effectiveDate->format('Y-m-d'),
                            'expiration_date' => $expirationDate->format('Y-m-d'),
                        ]
                    );
                    $policyIndex++;

                    // Create commission for each policy
                    $commissionRate = round(rand(800, 1500) / 10000, 4); // 8% to 15%
                    $commissionAmount = round($annualPremium * $commissionRate, 2);
                    $commissionStatus = $commissionIndex < 10 ? 'pending' : 'paid';

                    Commission::updateOrCreate(
                        [
                            'policy_id' => $policy->id,
                            'agent_id' => $agent->id,
                        ],
                        [
                            'carrier_name' => $policy->carrier_name,
                            'premium_amount' => $annualPremium,
                            'commission_rate' => $commissionRate,
                            'commission_amount' => $commissionAmount,
                            'status' => $commissionStatus,
                            'paid_at' => $commissionStatus === 'paid' ? now()->subDays(rand(1, 30)) : null,
                        ]
                    );
                    $commissionIndex++;
                }
            }
        }

        $this->command->info("  Created {$appIndex} applications, {$policyIndex} policies, {$commissionIndex} commissions.");
    }

    private function seedClaims(): void
    {
        $this->command->info('Creating claims...');

        $activePolicies = Policy::where('status', 'active')->take(6)->get();
        $claimTypes = ['auto_collision', 'property_damage', 'liability', 'theft', 'auto_comprehensive', 'health'];
        $claimStatuses = ['reported', 'under_review', 'investigating', 'approved', 'denied', 'settled'];
        $descriptions = [
            'auto_collision' => 'Rear-end collision at intersection. Minor vehicle damage, no injuries reported.',
            'property_damage' => 'Storm damage to roof and siding. Multiple shingles missing after hailstorm.',
            'liability' => 'Slip and fall incident on commercial property. Third party filing bodily injury claim.',
            'theft' => 'Vehicle broken into in parking lot. Laptop and personal items stolen from vehicle.',
            'auto_comprehensive' => 'Windshield cracked by road debris on highway. Full replacement needed.',
            'health' => 'Emergency room visit for acute abdominal pain. CT scan and overnight observation.',
        ];

        $claimIndex = 0;
        foreach ($activePolicies as $policy) {
            $type = $claimTypes[$claimIndex % count($claimTypes)];
            $status = $claimStatuses[$claimIndex % count($claimStatuses)];
            $estimatedAmount = round(rand(100000, 5000000) / 100, 2);

            Claim::updateOrCreate(
                [
                    'policy_id' => $policy->id,
                    'type' => $type,
                ],
                [
                    'consumer_id' => $policy->user_id,
                    'agent_id' => $policy->agent_id,
                    'claim_number' => 'CLM-' . strtoupper(Str::random(8)),
                    'status' => $status,
                    'date_of_loss' => now()->subDays(rand(10, 120))->format('Y-m-d'),
                    'description' => $descriptions[$type] ?? "Claim for {$type} coverage.",
                    'estimated_amount' => $estimatedAmount,
                    'approved_amount' => in_array($status, ['approved', 'settled']) ? round($estimatedAmount * 0.85, 2) : null,
                    'deductible_amount' => round(rand(25000, 100000) / 100, 2),
                    'settlement_amount' => $status === 'settled' ? round($estimatedAmount * 0.80, 2) : null,
                    'settled_at' => $status === 'settled' ? now()->subDays(rand(1, 30)) : null,
                    'closed_at' => in_array($status, ['settled', 'denied']) ? now()->subDays(rand(1, 15)) : null,
                ]
            );
            $claimIndex++;
        }

        $this->command->info("  Created {$claimIndex} claims.");
    }

    private function seedAppointments($agencies): void
    {
        $this->command->info('Creating appointments...');

        $appointmentTypes = ['consultation', 'review', 'follow_up', 'renewal'];
        $titles = [
            'consultation' => ['Initial Policy Consultation', 'Coverage Review Meeting', 'New Client Discovery Call'],
            'review' => ['Annual Policy Review', 'Mid-Term Coverage Check', 'Claim Status Review'],
            'follow_up' => ['Quote Follow-Up', 'Application Status Update', 'Payment Arrangement Discussion'],
            'renewal' => ['Renewal Discussion', 'Rate Comparison Review', 'Policy Renewal Options'],
        ];

        $appointmentIndex = 0;
        foreach ($agencies->take(6) as $agency) {
            $agents = User::where('agency_id', $agency->id)->where('role', 'agent')->take(2)->get();
            $leads = Lead::where('agency_id', $agency->id)->take(2)->get();

            foreach ($agents as $agent) {
                $type = $appointmentTypes[$appointmentIndex % count($appointmentTypes)];
                $titleOptions = $titles[$type];
                $title = $titleOptions[array_rand($titleOptions)];
                $isFuture = $appointmentIndex < 8;
                $date = $isFuture
                    ? now()->addDays(rand(1, 30))->format('Y-m-d')
                    : now()->subDays(rand(1, 30))->format('Y-m-d');

                $hour = rand(9, 16);
                $lead = $leads->isNotEmpty() ? $leads->random() : null;

                Appointment::updateOrCreate(
                    [
                        'agent_id' => $agent->id,
                        'title' => $title,
                        'date' => $date,
                    ],
                    [
                        'consumer_id' => $lead?->user_id,
                        'lead_id' => $lead?->id,
                        'type' => $type,
                        'start_time' => sprintf('%02d:00:00', $hour),
                        'end_time' => sprintf('%02d:00:00', $hour + 1),
                        'status' => $isFuture ? (rand(0, 1) ? 'scheduled' : 'confirmed') : 'completed',
                        'location' => rand(0, 1) ? 'Virtual' : $agency->address . ', ' . $agency->city . ', ' . $agency->state,
                        'notes' => $isFuture ? 'Upcoming meeting' : 'Meeting completed successfully.',
                    ]
                );
                $appointmentIndex++;
            }
        }

        $this->command->info("  Created {$appointmentIndex} appointments.");
    }

    private function seedRoutingRules($agencies): void
    {
        $this->command->info('Creating routing rules...');

        $ruleIndex = 0;
        $productRules = [
            'auto' => 'Auto Leads',
            'homeowners' => 'Home Leads',
            'life_term' => 'Life Leads',
            'health_individual' => 'Health Leads',
            'commercial_gl' => 'Commercial Leads',
        ];

        foreach ($agencies as $agency) {
            $agents = User::where('agency_id', $agency->id)->where('role', 'agent')->pluck('id')->toArray();
            if (empty($agents)) continue;

            // Rule 1: Product-based direct assignment to first agent
            $productType = array_keys($productRules)[$ruleIndex % count($productRules)];
            $productLabel = $productRules[$productType];

            RoutingRule::updateOrCreate(
                [
                    'agency_id' => $agency->id,
                    'name' => "{$productLabel} → {$agency->name} Specialist",
                ],
                [
                    'priority' => 100,
                    'is_active' => true,
                    'insurance_type' => $productType,
                    'assignment_type' => 'agent',
                    'target_agent_id' => $agents[0],
                    'daily_cap' => 10,
                ]
            );
            $ruleIndex++;

            // Rule 2: Round-robin catch-all for all other lead types
            RoutingRule::updateOrCreate(
                [
                    'agency_id' => $agency->id,
                    'name' => "General Round-Robin — {$agency->name}",
                ],
                [
                    'priority' => 10,
                    'is_active' => true,
                    'insurance_type' => null,
                    'assignment_type' => 'round_robin',
                    'agent_pool' => $agents,
                    'last_assigned_index' => 0,
                    'daily_cap' => 20,
                ]
            );
            $ruleIndex++;
        }

        $this->command->info("  Created {$ruleIndex} routing rules.");
    }

    private function pickWeightedStatus(array $distribution): string
    {
        $pool = [];
        foreach ($distribution as $status => $weight) {
            for ($i = 0; $i < $weight; $i++) {
                $pool[] = $status;
            }
        }
        return $pool[array_rand($pool)];
    }
}
