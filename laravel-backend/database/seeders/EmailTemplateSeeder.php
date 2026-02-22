<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $templates = [
            [
                'name' => 'Welcome Email',
                'subject' => 'Welcome to Insurons — Let\'s Get You Started!',
                'body_html' => '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="background: linear-gradient(135deg, #1e40af, #7c3aed); padding: 30px; text-align: center;">
<h1 style="color: white; margin: 0;">Welcome to Insurons!</h1>
</div>
<div style="padding: 30px; background: white;">
<p>Hi {{first_name}},</p>
<p>Welcome to Insurons! We\'re excited to have you on the platform. Here\'s what you can do to get started:</p>
<ol>
<li><strong>Complete your profile</strong> — Add your license info and specialties</li>
<li><strong>Connect carriers</strong> — Link your carrier appointments</li>
<li><strong>Explore the dashboard</strong> — Familiarize yourself with the tools</li>
<li><strong>Start quoting</strong> — Generate your first comparative quote</li>
</ol>
<p>If you need any help, our support team is here for you.</p>
<a href="{{dashboard_url}}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Go to Dashboard</a>
</div>
<div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
<p>Insurons — The Insurance Marketplace</p>
</div>
</div>',
                'category' => 'system',
                'is_system' => true,
            ],
            [
                'name' => 'Renewal Reminder',
                'subject' => 'Policy Renewal Coming Up — {{policy_type}} Policy #{{policy_number}}',
                'body_html' => '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="background: #f59e0b; padding: 20px; text-align: center;">
<h1 style="color: white; margin: 0;">Renewal Reminder</h1>
</div>
<div style="padding: 30px; background: white;">
<p>Hi {{client_name}},</p>
<p>Your <strong>{{policy_type}}</strong> policy ({{policy_number}}) with {{carrier_name}} is up for renewal on <strong>{{renewal_date}}</strong>.</p>
<p>Here\'s a summary of your current coverage:</p>
<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
<tr style="background: #f3f4f6;"><td style="padding: 10px; border: 1px solid #e5e7eb;">Current Premium</td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{current_premium}}</td></tr>
<tr><td style="padding: 10px; border: 1px solid #e5e7eb;">Renewal Premium</td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{renewal_premium}}</td></tr>
<tr style="background: #f3f4f6;"><td style="padding: 10px; border: 1px solid #e5e7eb;">Coverage Limits</td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{coverage_limits}}</td></tr>
</table>
<p>I\'d love to review your coverage and make sure you\'re getting the best value. Would you like to schedule a quick call?</p>
<a href="{{schedule_url}}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Schedule a Review</a>
</div>
<div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
<p>{{agent_name}} | {{agent_phone}} | {{agent_email}}</p>
</div>
</div>',
                'category' => 'renewal',
                'is_system' => true,
            ],
            [
                'name' => 'Quote Follow-Up',
                'subject' => 'Your Insurance Quote is Ready — Save Up to {{savings_amount}}',
                'body_html' => '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="background: #059669; padding: 20px; text-align: center;">
<h1 style="color: white; margin: 0;">Your Quote is Ready!</h1>
</div>
<div style="padding: 30px; background: white;">
<p>Hi {{client_name}},</p>
<p>Thank you for requesting an insurance quote. I\'ve put together some great options for you:</p>
<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 15px 0; text-align: center;">
<p style="color: #059669; font-size: 14px; margin: 0;">Potential Savings</p>
<p style="color: #059669; font-size: 32px; font-weight: bold; margin: 5px 0;">{{savings_amount}}/year</p>
</div>
<p>I compared rates from {{carrier_count}} carriers to find you the best coverage at the best price. Here\'s my recommendation:</p>
<p><strong>Recommended: {{recommended_carrier}}</strong></p>
<ul>
<li>Annual Premium: {{recommended_premium}}</li>
<li>Coverage: {{recommended_coverage}}</li>
<li>Deductible: {{recommended_deductible}}</li>
</ul>
<a href="{{quote_url}}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Full Comparison</a>
<p style="margin-top: 20px;">Have questions? Just reply to this email or call me directly.</p>
</div>
<div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
<p>{{agent_name}} | {{agent_phone}}</p>
</div>
</div>',
                'category' => 'sales',
                'is_system' => true,
            ],
            [
                'name' => 'Claim Status Update',
                'subject' => 'Claim Update — {{claim_number}} Status: {{claim_status}}',
                'body_html' => '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="background: #1e40af; padding: 20px; text-align: center;">
<h1 style="color: white; margin: 0;">Claim Status Update</h1>
</div>
<div style="padding: 30px; background: white;">
<p>Hi {{client_name}},</p>
<p>I wanted to update you on your claim:</p>
<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
<tr style="background: #f3f4f6;"><td style="padding: 10px; border: 1px solid #e5e7eb;">Claim Number</td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{claim_number}}</td></tr>
<tr><td style="padding: 10px; border: 1px solid #e5e7eb;">Policy</td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{policy_number}}</td></tr>
<tr style="background: #f3f4f6;"><td style="padding: 10px; border: 1px solid #e5e7eb;">Status</td><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>{{claim_status}}</strong></td></tr>
<tr><td style="padding: 10px; border: 1px solid #e5e7eb;">Adjuster</td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{adjuster_name}}</td></tr>
</table>
<p><strong>Update:</strong></p>
<p>{{update_message}}</p>
<p><strong>Next Steps:</strong></p>
<p>{{next_steps}}</p>
<p>If you have any questions or concerns, please don\'t hesitate to reach out. I\'m here to advocate for you.</p>
</div>
<div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
<p>{{agent_name}} | {{agent_phone}} | {{agent_email}}</p>
</div>
</div>',
                'category' => 'claims',
                'is_system' => true,
            ],
            [
                'name' => 'Referral Invitation',
                'subject' => '{{referrer_name}} Thinks You\'d Love Insurons — Get $10 Credit',
                'body_html' => '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="background: linear-gradient(135deg, #7c3aed, #ec4899); padding: 30px; text-align: center;">
<h1 style="color: white; margin: 0;">You\'ve Been Referred!</h1>
</div>
<div style="padding: 30px; background: white;">
<p>Hi there,</p>
<p><strong>{{referrer_name}}</strong> thinks you\'d be a great fit for Insurons — the insurance marketplace that helps agents grow their business with smart tools and technology.</p>
<div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 20px; margin: 15px 0; text-align: center;">
<p style="color: #7c3aed; font-size: 14px; margin: 0;">Special Offer</p>
<p style="color: #7c3aed; font-size: 24px; font-weight: bold; margin: 5px 0;">$10 Account Credit</p>
<p style="color: #6b7280; font-size: 14px; margin: 0;">When you create your free account</p>
</div>
<p>With Insurons, you get:</p>
<ul>
<li>Comparative quoting across 30+ carriers</li>
<li>Built-in CRM and lead management</li>
<li>Commission tracking and analytics</li>
<li>Professional proposals and client portal</li>
</ul>
<a href="{{referral_url}}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Claim Your $10 Credit</a>
</div>
<div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
<p>Insurons — The Insurance Marketplace</p>
</div>
</div>',
                'category' => 'referral',
                'is_system' => true,
            ],
            [
                'name' => 'Monthly Newsletter',
                'subject' => 'Insurons Monthly: {{month}} {{year}} Industry Update',
                'body_html' => '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<div style="background: #1e40af; padding: 20px; text-align: center;">
<h1 style="color: white; margin: 0;">Insurons Monthly</h1>
<p style="color: #93c5fd; margin: 5px 0;">{{month}} {{year}} Edition</p>
</div>
<div style="padding: 30px; background: white;">
<h2 style="color: #1e40af;">This Month\'s Highlights</h2>

<h3>Market Update</h3>
<p>{{market_update}}</p>

<h3>New Platform Features</h3>
<p>{{feature_updates}}</p>

<h3>Top Performer Spotlight</h3>
<p>Congratulations to this month\'s top performers on the Insurons platform!</p>

<h3>Upcoming Events</h3>
<p>{{upcoming_events}}</p>

<h3>Training Corner</h3>
<p>{{training_highlight}}</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

<h3>Quick Links</h3>
<ul>
<li><a href="{{dashboard_url}}">Your Dashboard</a></li>
<li><a href="{{events_url}}">Upcoming Events</a></li>
<li><a href="{{training_url}}">Training Center</a></li>
<li><a href="{{forum_url}}">Community Forum</a></li>
</ul>
</div>
<div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
<p>Insurons — The Insurance Marketplace</p>
<p><a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a></p>
</div>
</div>',
                'category' => 'newsletter',
                'is_system' => true,
            ],
        ];

        foreach ($templates as $template) {
            DB::table('email_templates')->updateOrInsert(
                ['name' => $template['name']],
                array_merge($template, [
                    'organization_id' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
            );
        }
    }
}
