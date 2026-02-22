<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HelpCenterSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $categories = [
            ['name' => 'Getting Started', 'slug' => 'getting-started', 'icon' => 'Rocket', 'description' => 'New to Insurons? Start here to set up your account and learn the basics.', 'sort_order' => 1],
            ['name' => 'Quoting & Proposals', 'slug' => 'quoting-proposals', 'icon' => 'Calculator', 'description' => 'Learn how to generate quotes, compare carriers, and send professional proposals.', 'sort_order' => 2],
            ['name' => 'Policies & Servicing', 'slug' => 'policies-servicing', 'icon' => 'FileText', 'description' => 'Managing active policies, endorsements, renewals, and cancellations.', 'sort_order' => 3],
            ['name' => 'Claims', 'slug' => 'claims', 'icon' => 'Shield', 'description' => 'Filing claims, tracking status, and helping your clients through the claims process.', 'sort_order' => 4],
            ['name' => 'Billing & Commissions', 'slug' => 'billing-commissions', 'icon' => 'DollarSign', 'description' => 'Platform billing, commission tracking, payouts, and financial reporting.', 'sort_order' => 5],
        ];

        foreach ($categories as $cat) {
            DB::table('help_categories')->updateOrInsert(
                ['slug' => $cat['slug']],
                array_merge($cat, ['created_at' => $now, 'updated_at' => $now])
            );
        }

        $categoryIds = DB::table('help_categories')->pluck('id', 'slug');

        $articles = [
            // Getting Started
            ['category' => 'getting-started', 'title' => 'Creating Your Insurons Account', 'slug' => 'creating-your-account', 'sort_order' => 1,
                'excerpt' => 'Step-by-step guide to setting up your agent account on Insurons.',
                'content_markdown' => "# Creating Your Insurons Account\n\n## Step 1: Register\n\nVisit [insurons.com/register](https://insurons.com/register) and fill out the registration form with your:\n\n- Full name\n- Email address\n- Phone number\n- Role (Agent, Agency Owner, Consumer, etc.)\n- Password (minimum 8 characters)\n\n## Step 2: Verify Your Email\n\nCheck your inbox for a verification email and click the confirmation link. The link expires in 24 hours.\n\n## Step 3: Complete Your Profile\n\nAfter verification, you'll be guided through onboarding:\n\n1. **License information** — Enter your license number and states\n2. **Specialties** — Select your insurance specialties\n3. **Carriers** — Add the carriers you're appointed with\n4. **Bio** — Write a short professional bio\n\n## Step 4: Choose a Plan\n\nSelect a subscription plan that fits your needs. All plans include a 14-day free trial.\n\n---\n\n*Need help? Contact support at support@insurons.com*",
                'tags' => json_encode(['account', 'setup', 'registration']), 'view_count' => 1234, 'helpful_count' => 89],

            ['category' => 'getting-started', 'title' => 'Navigating the Dashboard', 'slug' => 'navigating-the-dashboard', 'sort_order' => 2,
                'excerpt' => 'Learn your way around the Insurons dashboard and key features.',
                'content_markdown' => "# Navigating the Dashboard\n\nYour dashboard is the central hub for all your Insurons activities.\n\n## Dashboard Sections\n\n### Stats Cards\nAt the top, you'll see key metrics:\n- Active policies\n- Pending quotes\n- Monthly commissions\n- Client count\n\n### Recent Activity\nBelow the stats, recent leads, quotes, and policy changes appear in real-time.\n\n### Quick Actions\nUse the action buttons to:\n- Start a new quote\n- Add a lead\n- Send a proposal\n- View messages\n\n## Sidebar Navigation\n\nThe left sidebar contains all major sections:\n- **CRM** — Leads, clients, pipeline\n- **Quoting** — New quotes, saved quotes\n- **Policies** — Active, pending, expired\n- **Commissions** — Earnings, payouts\n- **Reports** — Analytics and exports\n\n## Top Bar\nAccess messages, notifications, help, and settings from the top-right icons.",
                'tags' => json_encode(['dashboard', 'navigation', 'overview']), 'view_count' => 987, 'helpful_count' => 67],

            ['category' => 'getting-started', 'title' => 'Setting Up Your Agent Profile', 'slug' => 'setting-up-agent-profile', 'sort_order' => 3,
                'excerpt' => 'Optimize your public agent profile to attract more clients.',
                'content_markdown' => "# Setting Up Your Agent Profile\n\nYour agent profile is visible to consumers searching for insurance agents on Insurons.\n\n## Profile Elements\n\n### Professional Photo\nUpload a professional headshot. Profiles with photos get 40% more inquiries.\n\n### Bio\nWrite 2-3 paragraphs about your experience, specialties, and what makes you different.\n\n### License & Credentials\n- License number (verified automatically)\n- States licensed\n- Professional designations (CPCU, CLU, etc.)\n\n### Specialties\nSelect all insurance types you handle:\n- Auto, Home, Life, Health, Commercial, etc.\n\n### Carrier Appointments\nList all carriers you're appointed with. This helps with matching.\n\n### Service Area\nSpecify the cities and states you serve.\n\n## Tips for a Great Profile\n1. Be specific about your experience\n2. Mention your response time\n3. Highlight client success stories\n4. Keep it updated quarterly",
                'tags' => json_encode(['profile', 'agent', 'setup']), 'view_count' => 756, 'helpful_count' => 52],

            ['category' => 'getting-started', 'title' => 'Connecting Your Carrier Appointments', 'slug' => 'connecting-carrier-appointments', 'sort_order' => 4,
                'excerpt' => 'Link your carrier appointments to unlock real-time quoting.',
                'content_markdown' => "# Connecting Your Carrier Appointments\n\nLink your carrier appointments to enable real-time comparative quoting through Insurons.\n\n## Supported Carriers\n\nWe currently support direct integrations with:\n- Progressive\n- Nationwide\n- Travelers\n- Hartford\n- Liberty Mutual\n- And 20+ more\n\n## How to Connect\n\n1. Go to **Settings > Carrier Connections**\n2. Click **Add Carrier**\n3. Select the carrier from the dropdown\n4. Enter your agent code and credentials\n5. Click **Verify & Connect**\n\nVerification typically takes 1-2 business days.\n\n## Troubleshooting\n\n- **Invalid credentials**: Double-check your agent code with the carrier\n- **Pending verification**: Allow 48 hours for carrier approval\n- **Connection lost**: Re-authenticate in Settings > Carrier Connections",
                'tags' => json_encode(['carriers', 'appointments', 'integration']), 'view_count' => 543, 'helpful_count' => 38],

            // Quoting & Proposals
            ['category' => 'quoting-proposals', 'title' => 'Creating Your First Quote', 'slug' => 'creating-first-quote', 'sort_order' => 1,
                'excerpt' => 'Walk through the quote creation process from start to finish.',
                'content_markdown' => "# Creating Your First Quote\n\n## Start a New Quote\n\n1. Click **New Quote** from the dashboard or sidebar\n2. Select the insurance type (Auto, Home, Life, etc.)\n3. Enter the client's basic information\n\n## Fill Out the Application\n\nThe smart form adapts based on insurance type:\n\n### Auto Insurance\n- Driver information\n- Vehicle details (VIN lookup available)\n- Coverage preferences\n- Current insurance info\n\n### Home Insurance\n- Property address (auto-fills details)\n- Construction type and year\n- Coverage amounts\n- Claims history\n\n## Compare Rates\n\nAfter submitting, you'll see quotes from all connected carriers ranked by:\n- Premium (lowest to highest)\n- Coverage (most comprehensive)\n- Carrier rating\n\n## Send to Client\n\nClick **Send Proposal** to email a branded comparison to your client with your recommendations highlighted.",
                'tags' => json_encode(['quote', 'rating', 'proposal']), 'view_count' => 1567, 'helpful_count' => 112],

            ['category' => 'quoting-proposals', 'title' => 'Using the Quote Comparison Tool', 'slug' => 'quote-comparison-tool', 'sort_order' => 2,
                'excerpt' => 'Compare quotes side-by-side and make recommendations to clients.',
                'content_markdown' => "# Using the Quote Comparison Tool\n\nThe comparison tool lets you present multiple quotes side-by-side to clients.\n\n## Features\n\n- **Side-by-side view**: Compare up to 4 quotes at once\n- **Coverage highlighting**: Differences in coverage are highlighted\n- **Agent recommendation**: Mark your recommended option with a star\n- **Notes**: Add personalized notes to each quote\n\n## Sharing Comparisons\n\nYou can share comparisons via:\n1. **Email** — Branded PDF sent directly to client\n2. **Link** — Shareable URL (expires in 30 days)\n3. **Download** — PDF for offline review\n\n## Client Actions\n\nWhen a client receives your comparison, they can:\n- View all options on their device\n- Ask questions via chat\n- Select a quote to bind\n- Request modifications",
                'tags' => json_encode(['comparison', 'quotes', 'proposals']), 'view_count' => 890, 'helpful_count' => 78],

            ['category' => 'quoting-proposals', 'title' => 'Customizing Proposal Templates', 'slug' => 'customizing-proposal-templates', 'sort_order' => 3,
                'excerpt' => 'Brand your proposals with your logo, colors, and messaging.',
                'content_markdown' => "# Customizing Proposal Templates\n\nMake your proposals stand out with custom branding.\n\n## Template Settings\n\nGo to **Settings > Proposals** to customize:\n\n- **Logo**: Upload your agency logo\n- **Colors**: Set primary and accent colors\n- **Header text**: Custom greeting message\n- **Footer**: Contact information and disclaimers\n- **Signature**: Digital signature or photo\n\n## Template Types\n\n1. **Standard** — Clean, professional layout\n2. **Detailed** — Includes coverage explanations\n3. **Executive** — Premium design for high-value clients\n\n## Best Practices\n\n- Keep it simple and easy to scan\n- Highlight your recommendation\n- Include your direct contact info\n- Add a clear call-to-action",
                'tags' => json_encode(['proposals', 'templates', 'branding']), 'view_count' => 456, 'helpful_count' => 34],

            // Policies & Servicing
            ['category' => 'policies-servicing', 'title' => 'Managing Active Policies', 'slug' => 'managing-active-policies', 'sort_order' => 1,
                'excerpt' => 'Track, service, and manage all your active policies in one place.',
                'content_markdown' => "# Managing Active Policies\n\n## Policy Dashboard\n\nThe Policies section shows all your active policies with:\n- Policy number and carrier\n- Insured name\n- Coverage type and limits\n- Premium and commission\n- Renewal date\n\n## Filtering & Search\n\nFilter policies by:\n- Carrier\n- Insurance type\n- Renewal month\n- Premium range\n- Status (active, pending, expired)\n\n## Policy Actions\n\nFor each policy, you can:\n- **View details** — Full policy information\n- **Request endorsement** — Coverage changes\n- **Process renewal** — Review and renew\n- **Cancel** — Initiate cancellation\n- **Add notes** — Track client communications\n\n## Renewal Management\n\nThe system automatically flags policies approaching renewal:\n- 90 days out: Yellow indicator\n- 60 days out: Orange indicator\n- 30 days out: Red indicator\n- Automated email reminders to clients (if enabled)",
                'tags' => json_encode(['policies', 'management', 'renewal']), 'view_count' => 1123, 'helpful_count' => 95],

            ['category' => 'policies-servicing', 'title' => 'Processing Policy Endorsements', 'slug' => 'processing-endorsements', 'sort_order' => 2,
                'excerpt' => 'How to request and process mid-term policy changes.',
                'content_markdown' => "# Processing Policy Endorsements\n\nEndorsements allow mid-term changes to active policies.\n\n## Common Endorsement Types\n\n- **Add/remove vehicle** (auto)\n- **Add/remove driver** (auto)\n- **Coverage limit changes**\n- **Add endorsement/rider** (umbrella, etc.)\n- **Address change** (home)\n- **Mortgage company change**\n\n## How to Process\n\n1. Open the policy from **Policies** dashboard\n2. Click **Request Endorsement**\n3. Select the type of change\n4. Enter the new information\n5. Review the premium impact\n6. Submit to carrier\n\n## Timeline\n\nMost endorsements are processed within:\n- Automated: Instant\n- Simple changes: 1-2 business days\n- Complex changes: 3-5 business days",
                'tags' => json_encode(['endorsement', 'changes', 'servicing']), 'view_count' => 678, 'helpful_count' => 56],

            ['category' => 'policies-servicing', 'title' => 'Handling Policy Renewals', 'slug' => 'handling-renewals', 'sort_order' => 3,
                'excerpt' => 'Best practices for reviewing and processing policy renewals.',
                'content_markdown' => "# Handling Policy Renewals\n\n## Renewal Workflow\n\n### 90 Days Before Renewal\n- Review current coverage and claims history\n- Check for rate increases or decreases\n- Identify cross-sell opportunities\n\n### 60 Days Before Renewal\n- Run comparative quotes if premium increased >10%\n- Contact client to review coverage needs\n- Discuss any life changes affecting coverage\n\n### 30 Days Before Renewal\n- Confirm renewal or replacement\n- Send renewal documents\n- Process any coverage changes\n\n## Automated Renewal Features\n\nInsurens can automatically:\n- Send renewal reminder emails\n- Flag policies with significant premium changes\n- Generate renewal comparison reports\n- Track renewal retention rates",
                'tags' => json_encode(['renewal', 'retention', 'workflow']), 'view_count' => 534, 'helpful_count' => 42],

            // Claims
            ['category' => 'claims', 'title' => 'Filing a Claim for Your Client', 'slug' => 'filing-a-claim', 'sort_order' => 1,
                'excerpt' => 'Step-by-step guide to filing insurance claims through Insurons.',
                'content_markdown' => "# Filing a Claim for Your Client\n\n## Before Filing\n\nGather the following information:\n- Policy number\n- Date and time of loss\n- Description of what happened\n- Photos/documentation\n- Police report number (if applicable)\n- Other party information (if applicable)\n\n## Filing Process\n\n1. Go to **Claims > New Claim**\n2. Select the policy\n3. Choose claim type (auto, property, liability, etc.)\n4. Enter loss details\n5. Upload supporting documents\n6. Submit to carrier\n\n## After Filing\n\n- You'll receive a claim number immediately\n- The carrier will assign an adjuster within 24-48 hours\n- Track progress in the **Claims** dashboard\n- Receive notifications on status changes\n\n## Tips\n\n- File as soon as possible after the loss\n- Be thorough in your description\n- Upload all available documentation\n- Keep your client informed of next steps",
                'tags' => json_encode(['claims', 'filing', 'loss']), 'view_count' => 1345, 'helpful_count' => 98],

            ['category' => 'claims', 'title' => 'Tracking Claim Status', 'slug' => 'tracking-claim-status', 'sort_order' => 2,
                'excerpt' => 'Monitor claim progress and communicate updates to clients.',
                'content_markdown' => "# Tracking Claim Status\n\n## Claim Statuses\n\n| Status | Meaning |\n|--------|--------|\n| Submitted | Claim received by carrier |\n| Under Review | Adjuster assigned and investigating |\n| Inspection Scheduled | Property/vehicle inspection planned |\n| Estimate Prepared | Repair/replacement estimate ready |\n| Approved | Claim approved for payment |\n| Payment Issued | Check or direct deposit sent |\n| Closed | Claim fully resolved |\n| Denied | Claim not covered (appeal available) |\n\n## Notifications\n\nYou'll receive notifications when:\n- Status changes occur\n- Documents are requested\n- Payments are issued\n- Action is needed from you or the client\n\n## Client Communication\n\nUse the built-in messaging to keep clients updated. You can also enable automatic status update emails for your clients.",
                'tags' => json_encode(['claims', 'tracking', 'status']), 'view_count' => 890, 'helpful_count' => 72],

            ['category' => 'claims', 'title' => 'Appealing a Denied Claim', 'slug' => 'appealing-denied-claim', 'sort_order' => 3,
                'excerpt' => 'How to appeal a claim denial and advocate for your client.',
                'content_markdown' => "# Appealing a Denied Claim\n\n## Understanding the Denial\n\nFirst, review the denial letter carefully:\n- What specific reason was given?\n- What policy language is cited?\n- Is there a deadline to appeal?\n\n## Appeal Process\n\n1. **Gather evidence** — Get documentation supporting your client's claim\n2. **Review the policy** — Find language that supports coverage\n3. **Write the appeal** — Clear, factual, citing policy provisions\n4. **Submit through Insurons** — Go to Claims > select claim > Appeal\n5. **Follow up** — Track the appeal status\n\n## Escalation Options\n\nIf the appeal is denied:\n- Request a supervisor review\n- File a complaint with the state DOI\n- Consult with an insurance attorney\n- Consider appraisal or arbitration (if available)\n\n## Tips for Success\n\n- Be factual, not emotional\n- Cite specific policy language\n- Include expert opinions when relevant\n- Document all communication",
                'tags' => json_encode(['claims', 'appeal', 'denial']), 'view_count' => 567, 'helpful_count' => 48],

            // Billing & Commissions
            ['category' => 'billing-commissions', 'title' => 'Understanding Your Commission Structure', 'slug' => 'understanding-commissions', 'sort_order' => 1,
                'excerpt' => 'How commissions are calculated, tracked, and paid on Insurons.',
                'content_markdown' => "# Understanding Your Commission Structure\n\n## How Commissions Work\n\nInsurens tracks commissions from all your connected carriers in one place.\n\n### Commission Types\n\n- **New business**: Earned when a new policy is bound (typically 10-20%)\n- **Renewal**: Earned on policy renewals (typically 5-15%)\n- **Bonus**: Carrier volume bonuses and incentives\n- **Override**: Agency owner override on team production\n\n## Commission Dashboard\n\nView your commissions in **Earnings**:\n- Monthly/quarterly/annual summaries\n- By carrier breakdown\n- By insurance type\n- Pending vs. paid\n\n## Payment Schedule\n\nCommissions are typically paid:\n- **Direct from carrier**: Per carrier schedule (usually monthly)\n- **Agency commissions**: Per your agency's pay schedule\n- **Platform bonuses**: Monthly, on the 15th\n\n## Tracking Tips\n\n- Reconcile monthly against carrier statements\n- Flag discrepancies within 30 days\n- Use the export feature for tax reporting",
                'tags' => json_encode(['commissions', 'earnings', 'payments']), 'view_count' => 1567, 'helpful_count' => 134],

            ['category' => 'billing-commissions', 'title' => 'Platform Subscription & Billing', 'slug' => 'platform-billing', 'sort_order' => 2,
                'excerpt' => 'Manage your Insurons subscription, invoices, and payment methods.',
                'content_markdown' => "# Platform Subscription & Billing\n\n## Subscription Plans\n\nInsurens offers tiered plans for every agent:\n\n- **Starter** — Basic CRM and quoting\n- **Professional** — Full platform access\n- **Enterprise** — Multi-user, API access, white-label\n\n## Managing Your Subscription\n\nGo to **Settings > Billing** to:\n- View your current plan\n- Upgrade or downgrade\n- Update payment method\n- Download invoices\n- Cancel subscription\n\n## Payment Methods\n\nWe accept:\n- Credit/debit cards (Visa, Mastercard, Amex)\n- ACH bank transfer\n- Annual prepayment (15% discount)\n\n## Billing Cycle\n\n- Monthly plans bill on the subscription start date\n- Annual plans bill once per year\n- Prorated charges for mid-cycle upgrades\n- No refunds for downgrades (credit applied to next billing)",
                'tags' => json_encode(['billing', 'subscription', 'payments']), 'view_count' => 890, 'helpful_count' => 67],

            ['category' => 'billing-commissions', 'title' => 'Exporting Financial Reports', 'slug' => 'exporting-financial-reports', 'sort_order' => 3,
                'excerpt' => 'Generate and export commission statements and financial reports.',
                'content_markdown' => "# Exporting Financial Reports\n\n## Available Reports\n\n1. **Commission Statement** — Detailed breakdown by policy\n2. **Revenue Summary** — Monthly/quarterly/annual totals\n3. **Tax Report (1099)** — Year-end tax documentation\n4. **Carrier Reconciliation** — Compare platform vs. carrier statements\n5. **Production Report** — New business and retention metrics\n\n## How to Export\n\n1. Go to **Reports** or **Earnings**\n2. Select the report type\n3. Choose date range\n4. Apply any filters\n5. Click **Export** and choose format:\n   - PDF (formatted report)\n   - CSV (spreadsheet)\n   - JSON (for integrations)\n\n## Scheduled Reports\n\nSet up automatic report delivery:\n- Choose frequency (daily, weekly, monthly)\n- Select recipients\n- Reports delivered via email as PDF attachments\n\n## Accounting Integration\n\nExport data compatible with:\n- QuickBooks\n- Xero\n- FreshBooks",
                'tags' => json_encode(['reports', 'export', 'financial']), 'view_count' => 445, 'helpful_count' => 38],
        ];

        foreach ($articles as $article) {
            $catId = $categoryIds[$article['category']] ?? null;
            if (!$catId) continue;

            DB::table('help_articles')->updateOrInsert(
                ['slug' => $article['slug']],
                [
                    'help_category_id' => $catId,
                    'title' => $article['title'],
                    'slug' => $article['slug'],
                    'content_markdown' => $article['content_markdown'],
                    'excerpt' => $article['excerpt'],
                    'view_count' => $article['view_count'] ?? 0,
                    'helpful_count' => $article['helpful_count'] ?? 0,
                    'not_helpful_count' => 0,
                    'tags' => $article['tags'] ?? null,
                    'is_published' => true,
                    'sort_order' => $article['sort_order'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }
}
