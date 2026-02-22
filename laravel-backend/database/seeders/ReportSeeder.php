<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReportSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $agencyOwnerId = DB::table('users')->where('email', 'agency@insurons.com')->value('id');

        if (!$agencyOwnerId) {
            return;
        }

        $reports = [
            [
                'user_id' => $agencyOwnerId,
                'name' => 'Monthly Production Report',
                'description' => 'Tracks new business written, policies bound, and premium volume for the current month across all agents and lines of business.',
                'query_config' => json_encode([
                    'entity_type' => 'policies',
                    'metrics' => ['new_policies_count', 'total_premium', 'average_premium'],
                    'group_by' => ['agent', 'insurance_type'],
                    'date_range' => 'current_month',
                    'filters' => ['status' => 'active'],
                ]),
                'schedule' => 'monthly',
                'recipients' => json_encode(['agency@insurons.com', 'agent@insurons.com']),
                'last_run_at' => $now->copy()->subDays(5),
                'is_active' => true,
            ],
            [
                'user_id' => $agencyOwnerId,
                'name' => 'Commission Summary Report',
                'description' => 'Detailed commission breakdown by carrier, policy type, and agent. Includes new business vs. renewal commissions and year-over-year comparison.',
                'query_config' => json_encode([
                    'entity_type' => 'commissions',
                    'metrics' => ['total_commissions', 'new_business_commissions', 'renewal_commissions'],
                    'group_by' => ['carrier', 'agent', 'month'],
                    'date_range' => 'current_quarter',
                    'filters' => [],
                ]),
                'schedule' => 'weekly',
                'recipients' => json_encode(['agency@insurons.com']),
                'last_run_at' => $now->copy()->subDays(2),
                'is_active' => true,
            ],
            [
                'user_id' => $agencyOwnerId,
                'name' => 'Lead Funnel Analysis',
                'description' => 'Tracks lead progression through the sales pipeline — from initial contact to bound policy. Identifies bottlenecks and conversion rates at each stage.',
                'query_config' => json_encode([
                    'entity_type' => 'leads',
                    'metrics' => ['lead_count', 'conversion_rate', 'average_time_to_close'],
                    'group_by' => ['source', 'stage', 'agent'],
                    'date_range' => 'last_30_days',
                    'filters' => [],
                ]),
                'schedule' => 'weekly',
                'recipients' => json_encode(['agency@insurons.com', 'agent@insurons.com', 'agent2@insurons.com']),
                'last_run_at' => $now->copy()->subDays(3),
                'is_active' => true,
            ],
        ];

        foreach ($reports as $report) {
            $def = DB::table('report_definitions')->updateOrInsert(
                ['name' => $report['name'], 'user_id' => $report['user_id']],
                array_merge($report, ['organization_id' => null, 'created_at' => $now, 'updated_at' => $now])
            );
        }

        // Add some report runs for the monthly production report
        $productionReportId = DB::table('report_definitions')->where('name', 'Monthly Production Report')->value('id');
        $commissionReportId = DB::table('report_definitions')->where('name', 'Commission Summary Report')->value('id');

        if ($productionReportId) {
            $runs = [
                [
                    'definition_id' => $productionReportId,
                    'status' => 'completed',
                    'file_path' => "reports/{$productionReportId}/run_jan_2026.csv",
                    'file_format' => 'csv',
                    'row_count' => 156,
                    'started_at' => $now->copy()->subMonth()->setDay(1)->setTime(6, 0),
                    'completed_at' => $now->copy()->subMonth()->setDay(1)->setTime(6, 2),
                ],
                [
                    'definition_id' => $productionReportId,
                    'status' => 'completed',
                    'file_path' => "reports/{$productionReportId}/run_feb_2026.csv",
                    'file_format' => 'csv',
                    'row_count' => 189,
                    'started_at' => $now->copy()->subDays(5)->setTime(6, 0),
                    'completed_at' => $now->copy()->subDays(5)->setTime(6, 3),
                ],
            ];

            foreach ($runs as $run) {
                DB::table('report_runs')->insert(
                    array_merge($run, ['created_at' => $now, 'updated_at' => $now])
                );
            }
        }

        if ($commissionReportId) {
            DB::table('report_runs')->insert([
                'definition_id' => $commissionReportId,
                'status' => 'completed',
                'file_path' => "reports/{$commissionReportId}/run_week_8.csv",
                'file_format' => 'csv',
                'row_count' => 78,
                'started_at' => $now->copy()->subDays(2)->setTime(7, 0),
                'completed_at' => $now->copy()->subDays(2)->setTime(7, 1),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
