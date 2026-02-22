<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $adminId = DB::table('users')->where('email', 'admin@insurons.com')->value('id');
        $agencyId = DB::table('users')->where('email', 'agency@insurons.com')->value('id');
        $agentId = DB::table('users')->where('email', 'agent@insurons.com')->value('id');
        $agent2Id = DB::table('users')->where('email', 'agent2@insurons.com')->value('id');

        if (!$adminId) {
            return;
        }

        $events = [
            [
                'host_id' => $adminId,
                'title' => '2026 Insurance Market Outlook Webinar',
                'description' => "Join industry experts as we break down the 2026 insurance market forecast. Topics include:\n\n- Auto and home rate trends\n- Emerging risks: cyber, climate, AI liability\n- Carrier appetite changes\n- Strategies for agents in a transitioning market\n\nQ&A session included. Recording will be available for registered attendees.",
                'type' => 'webinar',
                'meeting_url' => 'https://zoom.us/j/example1',
                'start_at' => $now->copy()->addDays(7)->setTime(14, 0),
                'end_at' => $now->copy()->addDays(7)->setTime(15, 30),
                'max_attendees' => 500,
                'registration_count' => 127,
                'status' => 'published',
            ],
            [
                'host_id' => $agencyId,
                'title' => 'Texas Independent Agents Meetup',
                'description' => "Quarterly in-person meetup for independent agents in the greater Austin area. Network with fellow agents, share war stories, and learn from each other.\n\nAgenda:\n- 6:00 PM: Social hour & appetizers\n- 7:00 PM: Panel discussion: Building a $1M book\n- 8:00 PM: Open networking\n\nFood and drinks provided. Bring your business cards!",
                'type' => 'in_person',
                'location' => 'The Capital Grille, 98 San Jacinto Blvd, Austin, TX 78701',
                'start_at' => $now->copy()->addDays(14)->setTime(18, 0),
                'end_at' => $now->copy()->addDays(14)->setTime(21, 0),
                'max_attendees' => 50,
                'registration_count' => 34,
                'status' => 'published',
            ],
            [
                'host_id' => $adminId,
                'title' => 'Insurons Platform Training: Advanced CRM Features',
                'description' => "Deep dive into the Insurons CRM and lead management tools. This hybrid session covers:\n\n- Pipeline customization and automation\n- Lead scoring and prioritization\n- Email campaign integration\n- Reporting and analytics dashboards\n- Mobile app tips and tricks\n\nPerfect for agents who want to get more out of the platform.",
                'type' => 'hybrid',
                'location' => 'Insurons HQ, 1200 Congress Ave, Austin, TX 78701',
                'meeting_url' => 'https://zoom.us/j/example2',
                'start_at' => $now->copy()->addDays(21)->setTime(10, 0),
                'end_at' => $now->copy()->addDays(21)->setTime(12, 0),
                'max_attendees' => 200,
                'registration_count' => 89,
                'status' => 'published',
            ],
            [
                'host_id' => $agentId,
                'title' => 'Compliance & E&O Risk Management Workshop',
                'description' => "Protect yourself and your agency with this comprehensive compliance workshop. Topics include:\n\n- Common E&O claims and how to avoid them\n- Documentation best practices\n- State regulatory updates for 2026\n- Social media compliance dos and don'ts\n\n1.5 CE credits available for attendees.",
                'type' => 'webinar',
                'meeting_url' => 'https://zoom.us/j/example3',
                'start_at' => $now->copy()->addDays(28)->setTime(13, 0),
                'end_at' => $now->copy()->addDays(28)->setTime(14, 30),
                'max_attendees' => 300,
                'registration_count' => 56,
                'status' => 'published',
            ],
            [
                'host_id' => $adminId,
                'title' => 'InsurTech Innovation Summit 2026',
                'description' => "The premier insurance technology conference returns! Join 500+ insurance professionals for two days of innovation, networking, and learning.\n\nDay 1: Keynotes, vendor expo, startup showcase\nDay 2: Breakout sessions, workshops, awards ceremony\n\nEarly bird pricing ends March 15. Group discounts available for agencies of 5+.",
                'type' => 'in_person',
                'location' => 'Austin Convention Center, 500 E Cesar Chavez St, Austin, TX 78701',
                'start_at' => $now->copy()->addDays(60)->setTime(8, 0),
                'end_at' => $now->copy()->addDays(61)->setTime(17, 0),
                'max_attendees' => 500,
                'registration_count' => 203,
                'status' => 'published',
            ],
        ];

        foreach ($events as $event) {
            DB::table('events')->updateOrInsert(
                ['title' => $event['title']],
                array_merge($event, ['created_at' => $now, 'updated_at' => $now])
            );
        }

        // Add some registrations
        $eventIds = DB::table('events')->pluck('id');
        $userIds = [$agentId, $agent2Id, $agencyId];

        foreach ($eventIds->take(3) as $eventId) {
            foreach ($userIds as $userId) {
                if (!$userId) continue;
                DB::table('event_registrations')->updateOrInsert(
                    ['event_id' => $eventId, 'user_id' => $userId],
                    [
                        'status' => 'registered',
                        'registered_at' => $now->copy()->subDays(rand(1, 10)),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }
    }
}
