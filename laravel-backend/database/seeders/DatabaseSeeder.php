<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SubscriptionPlanSeeder::class,
            CarrierSeeder::class,
            DemoUserSeeder::class,
            PlatformProductSeeder::class,
            AgencyAgentSeeder::class,
            PipelineSeeder::class,
            ForumSeeder::class,
            EventSeeder::class,
            PartnerSeeder::class,
            HelpCenterSeeder::class,
            TrainingSeeder::class,
            EmailTemplateSeeder::class,
            RecruitmentSeeder::class,
            ReportSeeder::class,
            ComplianceRequirementSeeder::class,
        ]);
    }
}
