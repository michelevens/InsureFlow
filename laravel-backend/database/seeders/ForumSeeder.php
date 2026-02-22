<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ForumSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $categories = [
            ['name' => 'Market Trends', 'slug' => 'market-trends', 'description' => 'Discuss insurance market trends, industry news, and economic factors affecting premiums.', 'icon' => 'TrendingUp', 'order' => 1],
            ['name' => 'Carrier Updates', 'slug' => 'carrier-updates', 'description' => 'Latest news from insurance carriers — new products, rate changes, and underwriting updates.', 'icon' => 'Building2', 'order' => 2],
            ['name' => 'Sales Tips', 'slug' => 'sales-tips', 'description' => 'Share and learn sales strategies, closing techniques, and client acquisition methods.', 'icon' => 'Target', 'order' => 3],
            ['name' => 'Claims Help', 'slug' => 'claims-help', 'description' => 'Get help navigating claims processes, dispute resolution, and carrier communication.', 'icon' => 'FileCheck', 'order' => 4],
            ['name' => 'Technology', 'slug' => 'technology', 'description' => 'InsurTech tools, CRM tips, agency management software, and digital marketing.', 'icon' => 'Laptop', 'order' => 5],
            ['name' => 'General Discussion', 'slug' => 'general-discussion', 'description' => 'Off-topic chat, introductions, career advice, and community announcements.', 'icon' => 'MessageCircle', 'order' => 6],
        ];

        foreach ($categories as $cat) {
            DB::table('forum_categories')->updateOrInsert(
                ['slug' => $cat['slug']],
                array_merge($cat, ['created_at' => $now, 'updated_at' => $now])
            );
        }

        $categoryIds = DB::table('forum_categories')->pluck('id', 'slug');
        $agentId = DB::table('users')->where('email', 'agent@insurons.com')->value('id');
        $agent2Id = DB::table('users')->where('email', 'agent2@insurons.com')->value('id');
        $agencyId = DB::table('users')->where('email', 'agency@insurons.com')->value('id');
        $adminId = DB::table('users')->where('email', 'admin@insurons.com')->value('id');

        if (!$agentId) {
            return;
        }

        $topics = [
            // Market Trends
            ['category' => 'market-trends', 'author' => $agentId, 'title' => 'Q1 2026 Auto Insurance Rate Forecast', 'body' => "I've been tracking rate filings across major carriers and it looks like we're finally seeing some stabilization after 3 years of increases. Progressive filed for a 2% decrease in TX, and Allstate is holding flat in most states.\n\nWhat are you all seeing in your markets? Any carriers making aggressive moves?", 'views' => 234, 'replies' => 8, 'pinned' => true],
            ['category' => 'market-trends', 'author' => $agent2Id, 'title' => 'Impact of AI on Underwriting — Good or Bad for Agents?', 'body' => "More carriers are rolling out AI-powered underwriting that gives instant decisions. On one hand, faster quotes mean happier clients. On the other hand, less room for us to advocate for borderline risks.\n\nHow is this affecting your business?", 'views' => 189, 'replies' => 12],
            ['category' => 'market-trends', 'author' => $agencyId, 'title' => 'Hard Market Strategies That Actually Work', 'body' => "After 18 months in a hard market, here are the strategies that have kept our agency growing:\n\n1. Bundle everything — home + auto + umbrella\n2. Focus on retention over acquisition\n3. Educate clients on why rates are increasing\n4. Diversify your carrier portfolio\n\nWhat would you add to this list?", 'views' => 312, 'replies' => 15],

            // Carrier Updates
            ['category' => 'carrier-updates', 'author' => $agentId, 'title' => 'Progressive Launches New Small Business Product', 'body' => "Just got word that Progressive is rolling out a new BOP product for small businesses. Competitive rates and a much simpler application — only 12 questions for most classes.\n\nAnyone have access yet? Would love to hear early impressions.", 'views' => 156, 'replies' => 5],
            ['category' => 'carrier-updates', 'author' => $adminId, 'title' => 'Nationwide Exits Personal Auto in 3 States', 'body' => "Heads up — Nationwide is non-renewing personal auto in NM, WV, and NH effective April 1. If you have clients in those states, start shopping alternatives now.\n\nWe'll be adding recommended carrier alternatives to the platform resources page.", 'views' => 278, 'replies' => 9, 'pinned' => true],
            ['category' => 'carrier-updates', 'author' => $agent2Id, 'title' => 'New Cyber Insurance Options for Small Agencies', 'body' => "Coalition and At-Bay both launched new cyber products aimed at businesses under 50 employees. Great for our small business clients who think they're too small to be targeted.\n\nRates start around $500/year for $1M coverage.", 'views' => 98, 'replies' => 3],

            // Sales Tips
            ['category' => 'sales-tips', 'author' => $agencyId, 'title' => 'How I Close 40% of My Internet Leads', 'body' => "Speed to lead is everything. Here's my process:\n\n1. Call within 5 minutes of receiving the lead\n2. If no answer, text immediately with a personalized message\n3. Send a video intro via email within the hour\n4. Follow up at days 1, 3, 7, and 14\n5. After that, move to monthly nurture\n\nThe video intro is a game-changer. My close rate doubled when I started doing those.", 'views' => 445, 'replies' => 22],
            ['category' => 'sales-tips', 'author' => $agentId, 'title' => 'Referral Program That Generates 30% of My Business', 'body' => "I built a simple referral program that now accounts for almost a third of my new business:\n\n- $25 gift card for every referral that quotes\n- $50 gift card if they bind\n- Annual \"referral appreciation\" dinner for top referrers\n- Handwritten thank-you notes (people love these)\n\nTotal cost is maybe $200/month but the ROI is incredible.", 'views' => 367, 'replies' => 18],
            ['category' => 'sales-tips', 'author' => $agent2Id, 'title' => 'Cross-selling Life Insurance to P&C Clients', 'body' => "I've been struggling to cross-sell life insurance to my existing P&C book. Anyone have a script or approach that works well?\n\nI've tried the 'coverage gap analysis' approach but clients seem to tune out when I bring it up during renewals.", 'views' => 123, 'replies' => 7],

            // Claims Help
            ['category' => 'claims-help', 'author' => $agent2Id, 'title' => 'Tips for Expediting Homeowner Claims After Storms', 'body' => "After the recent storms in the Southeast, I have multiple clients with pending claims. Some tips I've found helpful:\n\n1. Document everything with photos and video ASAP\n2. Get a public adjuster involved early for claims over $50K\n3. Keep a log of every call with the carrier\n4. File a complaint with the DOI if the carrier drags past 30 days\n\nAnyone else dealing with storm claims right now?", 'views' => 201, 'replies' => 11],
            ['category' => 'claims-help', 'author' => $agentId, 'title' => 'Client Denied for Pre-existing Damage — How to Appeal?', 'body' => "One of my homeowner clients had a roof claim denied because the adjuster said there was pre-existing wear. The roof is only 8 years old and was inspected at policy inception.\n\nHas anyone successfully appealed this type of denial? What documentation made the difference?", 'views' => 167, 'replies' => 9],

            // Technology
            ['category' => 'technology', 'author' => $adminId, 'title' => 'Best CRM for Independent Agents in 2026', 'body' => "We're evaluating CRMs for our agency and narrowed it down to:\n\n1. HawkSoft — great for P&C, good carrier downloads\n2. AgencyZoom — best automation and pipeline management\n3. Insurons CRM — built specifically for our workflows\n\nAnyone using these? What's your experience?", 'views' => 289, 'replies' => 14],
            ['category' => 'technology', 'author' => $agentId, 'title' => 'Automating Policy Renewal Reminders', 'body' => "I finally set up automated renewal reminders and it's been a game-changer for retention. Using email sequences that start 60 days before renewal with a personalized video.\n\nRetention rate went from 82% to 91% in 6 months. Happy to share my template if anyone's interested.", 'views' => 198, 'replies' => 10],

            // General Discussion
            ['category' => 'general-discussion', 'author' => $agencyId, 'title' => 'Welcome! Introduce Yourself Here', 'body' => "Welcome to the Insurons community! Drop a comment introducing yourself — what type of insurance you focus on, where you're based, and what you're hoping to get out of this forum.\n\nI'll start: I'm Robert Martinez, running Martinez Insurance Group out of Austin, TX. We focus on personal lines and small commercial. Been in the business 15 years.", 'views' => 567, 'replies' => 34, 'pinned' => true],
            ['category' => 'general-discussion', 'author' => $agent2Id, 'title' => 'Work-Life Balance as an Independent Agent', 'body' => "How do you all manage work-life balance? I find myself answering client calls at 9pm and working weekends regularly. Love the flexibility of being independent but the boundaries are hard to set.\n\nAny tips from agents who've figured this out?", 'views' => 234, 'replies' => 16],
            ['category' => 'general-discussion', 'author' => $agentId, 'title' => 'CE Credits — Best Online Courses?', 'body' => "Need to knock out my CE credits before end of quarter. What are the best online CE providers? Looking for something that's actually educational and not just click-through slides.\n\nBonus points if they cover E&O topics.", 'views' => 145, 'replies' => 8],
        ];

        foreach ($topics as $topic) {
            $slug = Str::slug($topic['title']);
            $catId = $categoryIds[$topic['category']] ?? null;
            if (!$catId) continue;

            DB::table('forum_topics')->updateOrInsert(
                ['slug' => $slug],
                [
                    'category_id' => $catId,
                    'author_id' => $topic['author'] ?? $agentId,
                    'title' => $topic['title'],
                    'slug' => $slug,
                    'body' => $topic['body'],
                    'view_count' => $topic['views'] ?? 0,
                    'reply_count' => $topic['replies'] ?? 0,
                    'is_pinned' => $topic['pinned'] ?? false,
                    'is_locked' => false,
                    'last_reply_at' => $now->copy()->subHours(rand(1, 72)),
                    'created_at' => $now->copy()->subDays(rand(1, 30)),
                    'updated_at' => $now,
                ]
            );

            // Update topic count on category
            DB::table('forum_categories')->where('id', $catId)->increment('topic_count');
        }

        // Add a few posts/replies to the most popular topics
        $welcomeTopic = DB::table('forum_topics')->where('slug', 'welcome-introduce-yourself-here')->value('id');
        if ($welcomeTopic) {
            $replies = [
                ['author' => $agentId, 'content' => "Hey everyone! Sarah Johnson here, based in Dallas, TX. I focus on auto, home, and life insurance. 12 years in the business and loving the Insurons platform so far. Looking forward to learning from all of you!"],
                ['author' => $agent2Id, 'content' => "Michael Chen checking in from San Francisco. Specializing in health and life insurance. Excited to connect with other agents and share strategies. This community is exactly what our industry needs!"],
                ['author' => $adminId, 'content' => "Welcome to everyone joining! As a reminder, please keep discussions professional and respectful. We're here to help each other succeed. Don't hesitate to reach out if you need anything from the admin team."],
            ];

            foreach ($replies as $reply) {
                DB::table('forum_posts')->updateOrInsert(
                    ['topic_id' => $welcomeTopic, 'author_id' => $reply['author']],
                    [
                        'content' => $reply['content'],
                        'is_solution' => false,
                        'upvote_count' => rand(2, 15),
                        'created_at' => $now->copy()->subDays(rand(1, 14)),
                        'updated_at' => $now,
                    ]
                );
            }
        }
    }
}
