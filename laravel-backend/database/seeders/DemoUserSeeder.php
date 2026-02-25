<?php

namespace Database\Seeders;

use App\Models\Agency;
use App\Models\AgentProfile;
use App\Models\AgentReview;
use App\Models\User;
use Illuminate\Database\Seeder;


class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $password = 'password'; // 'hashed' cast on User model auto-hashes
        $verified = now();

        // Consumer
        $consumer = User::updateOrCreate(
            ['email' => 'consumer@insurons.com'],
            ['name' => 'John Consumer', 'password' => $password, 'role' => 'consumer', 'phone' => '(555) 100-0001', 'is_active' => true, 'email_verified_at' => $verified]
        );

        // Agent
        $agent = User::updateOrCreate(
            ['email' => 'agent@insurons.com'],
            ['name' => 'Sarah Johnson', 'password' => $password, 'role' => 'agent', 'phone' => '(555) 200-0001', 'is_active' => true, 'email_verified_at' => $verified, 'onboarding_completed' => true, 'onboarding_completed_at' => now()]
        );

        AgentProfile::updateOrCreate(
            ['user_id' => $agent->id],
            [
                'bio' => 'Licensed insurance professional with 12 years of experience helping families and businesses find the right coverage.',
                'license_number' => 'TX-INS-12345',
                'license_states' => ['TX', 'CA', 'FL', 'NY'],
                'specialties' => ['Auto', 'Home', 'Life'],
                'carriers' => ['State Farm', 'Geico', 'Progressive', 'Allstate', 'Liberty Mutual'],
                'years_experience' => 12,
                'avg_rating' => 4.9,
                'review_count' => 127,
                'clients_served' => 850,
                'response_time' => 'Under 1 hour',
                'city' => 'Dallas',
                'state' => 'TX',
            ]
        );

        // Agency Owner
        $agencyOwner = User::updateOrCreate(
            ['email' => 'agency@insurons.com'],
            ['name' => 'Robert Martinez', 'password' => $password, 'role' => 'agency_owner', 'phone' => '(555) 300-0001', 'is_active' => true, 'email_verified_at' => $verified, 'onboarding_completed' => true, 'onboarding_completed_at' => now()]
        );

        $agency = Agency::updateOrCreate(
            ['slug' => 'martinez-insurance-group'],
            [
                'name' => 'Martinez Insurance Group',
                'agency_code' => 'MARTINEZ',
                'owner_id' => $agencyOwner->id,
                'description' => 'Full-service insurance agency serving Texas since 2010.',
                'phone' => '(555) 300-0000',
                'email' => 'info@martinezinsurance.com',
                'website' => 'https://martinezinsurance.com',
                'city' => 'Austin',
                'state' => 'TX',
                'zip_code' => '78701',
                'is_verified' => true,
                'is_active' => true,
            ]
        );

        // Assign agent & agency owner to agency
        $agent->update(['agency_id' => $agency->id]);
        $agencyOwner->update(['agency_id' => $agency->id]);

        // Additional agent for agency
        $agent2 = User::updateOrCreate(
            ['email' => 'agent2@insurons.com'],
            ['name' => 'Michael Chen', 'password' => $password, 'role' => 'agent', 'phone' => '(555) 200-0002', 'agency_id' => $agency->id, 'is_active' => true, 'email_verified_at' => $verified, 'onboarding_completed' => true, 'onboarding_completed_at' => now()]
        );

        AgentProfile::updateOrCreate(
            ['user_id' => $agent2->id],
            [
                'bio' => 'Specializing in health and life insurance with a focus on families.',
                'license_number' => 'CA-INS-67890',
                'license_states' => ['CA', 'NY', 'FL'],
                'specialties' => ['Health', 'Life', 'Business'],
                'carriers' => ['MetLife', 'Allstate', 'Nationwide', 'USAA'],
                'years_experience' => 8,
                'avg_rating' => 4.8,
                'review_count' => 89,
                'clients_served' => 420,
                'response_time' => 'Under 2 hours',
                'city' => 'San Francisco',
                'state' => 'CA',
            ]
        );

        // Carrier user
        User::updateOrCreate(
            ['email' => 'carrier@insurons.com'],
            ['name' => 'Carrier Admin', 'password' => $password, 'role' => 'carrier', 'phone' => '(555) 400-0001', 'is_active' => true, 'email_verified_at' => $verified]
        );

        // Admin
        User::updateOrCreate(
            ['email' => 'admin@insurons.com'],
            ['name' => 'Admin User', 'password' => $password, 'role' => 'admin', 'phone' => '(555) 500-0001', 'is_active' => true, 'email_verified_at' => $verified]
        );

        // Superadmin
        User::updateOrCreate(
            ['email' => 'superadmin@insurons.com'],
            ['name' => 'Super Admin', 'password' => $password, 'role' => 'superadmin', 'phone' => '(555) 600-0001', 'is_active' => true, 'email_verified_at' => $verified]
        );

        // Create some reviews for the agents
        $reviewers = [
            ['name' => 'Emily Davis', 'email' => 'emily@example.com'],
            ['name' => 'James Wilson', 'email' => 'james@example.com'],
            ['name' => 'Lisa Brown', 'email' => 'lisa@example.com'],
        ];

        foreach ($reviewers as $i => $reviewerData) {
            $reviewer = User::updateOrCreate(
                ['email' => $reviewerData['email']],
                ['name' => $reviewerData['name'], 'password' => $password, 'role' => 'consumer', 'is_active' => true, 'email_verified_at' => $verified]
            );

            AgentReview::updateOrCreate(
                ['agent_id' => $agent->id, 'user_id' => $reviewer->id],
                [
                    'rating' => [5, 5, 4][$i],
                    'comment' => [
                        'Sarah was incredibly helpful finding the right auto and home insurance bundle. Saved us over $200/month!',
                        'Professional and thorough. She explained every coverage option clearly and helped us make an informed decision.',
                        'Great experience overall. Quick response times and very knowledgeable about life insurance options.',
                    ][$i],
                ]
            );
        }
    }
}
