# Insurons Agency Owner User Guide

## Overview

As an agency owner, you have full visibility into your team's performance, lead pipeline, commissions, compliance, and growth tools. You see everything your agents see — plus team management, agency settings, recruitment, campaigns, reporting, and white-label capabilities.

---

## Getting Started

### Setting Up Your Agency

1. Register at **insurons.com** and select role: **Agency Owner**
2. Complete onboarding:
   - Agency name, logo, address, phone, email
   - License information (state, number)
   - Select your product lines and carriers
3. Your unique **agency code** is generated (e.g., `AGYA347`) — used for lead intake forms

### Subscription Plans

Choose a plan that fits your agency:
- Plans are role-specific (agency plans include team features)
- Monthly or annual billing
- Manage via **Billing** in Settings
- Stripe Customer Portal for invoices and payment method updates

---

## Dashboard

Agency-wide overview:
- **Total leads, applications, policies, commissions** across all agents
- **Team performance:** Top agents by leads, applications, revenue
- **Lead pipeline status:** Visual funnel
- **Revenue trends:** Monthly trajectory
- **Tasks Due Today:** Your tasks + team overview
- **Recent applications:** Latest activity

---

## Team Management

### Agency Settings → Team Tab

- **Agent list:** Each agent shows name, email, status, leads, applications, policies, commissions
- **Add Agent:** Create new agent accounts (name, email, license, specialties)
- **Invite Agent:** Send email invitations — agent clicks link to accept and join
- **Toggle Status:** Activate/deactivate agents
- **Reset Password:** Generate temp password for agents who are locked out
- **Pending Invites:** View and cancel outstanding invitations

### How Agent Invitations Work

1. Go to **Agency Settings → Team**
2. Click **Invite Agent**
3. Enter their email — system sends an invite with a token link
4. Agent clicks the link, creates their account, and is automatically added to your agency
5. They inherit your agency's subscription

---

## CRM (All Team Leads)

As agency owner, you see **all leads across your team** — not just your own.

- All agent CRM features (kanban, list view, scenarios, proposals, bulk ops)
- **Lead assignment:** Reassign leads between agents
- **Lead routing:** Configure auto-routing rules based on agent specialties, availability, and workload
- **Deduplication:** System flags duplicate leads (same email + insurance type + agency)
- **Team-level pipeline analytics**

---

## Lead Marketplace

Same features as agents, plus:
- Visibility over all team listings
- Team-wide transaction history
- Aggregate earnings reporting

---

## Applications, Policies, Claims, Renewals

Full visibility across all agents:
- Filter by agent, status, date range
- Assignment tracking
- Aggregate analytics

---

## Tasks

- Create and assign tasks to any team member
- View all team tasks
- Override priority
- Track completion rates

---

## Commissions

### Team View
- **Per-agent breakdown:** Each agent's commissions
- **Agency-level totals:** Aggregate revenue
- **Commission splits:** Multi-agent deal sharing
- **Payout management:** Track what's been paid

### Stripe Connect
Set up your agency's Stripe Connect account for:
- Receiving platform payouts
- Processing agent payouts
- Payment history

---

## Compliance (Agency-Wide)

- View compliance status for **all agents**
- See who has expiring licenses, CE credits, or E&O policies
- Auto-generate compliance packs for new agents
- Receive alerts when any team member has overdue items

---

## Agency Settings (7 Tabs)

### 1. General
Agency name, logo, address, phone, email, website, license info, description, branding.

### 2. Team
Agent management, invitations, status toggles. (Covered above.)

### 3. Products
- Manage which insurance products your agency offers
- Activate/deactivate products
- View carrier appointments per product
- 3-layer visibility: Platform → Agency → Carrier

### 4. Appointments
- Manage carrier appointments (which carriers can your agents quote)
- Per-product carrier access
- Appointment status tracking

### 5. Lead Intake
- View your public lead intake form URLs:
  - Agency-level: `insurons.com/intake/AGYA347`
  - Agent-specific: includes agent routing
- Copy your agency code (share with partners)
- Regenerate code if needed
- Configure intake form options

### 6. White-Label
- Set up a custom domain (e.g., `quotes.youragency.com`)
- Custom brand name, logo, and colors
- Custom CSS injection for full control
- Multi-domain support
- Preview your white-label site

### 7. Integration
- **Webhooks:** Configure URL, select events, set secret
- **Webhook delivery log:** See every delivery attempt with retry logic
- **Test webhook:** Send a test payload
- **Event types:** lead_created, application_submitted, policy_bound, claim_filed, etc.

---

## Organizations (MGA Hierarchy)

For Managing General Agencies with sub-agencies:
- Self-referencing hierarchy: MGA → Agency → Sub-Agency
- Visual organization tree
- Add/remove members with role-based permissions
- Invite members to sub-organizations

---

## Recruitment

### Job Postings
1. Go to **Recruitment → Postings**
2. Create a job posting (title, description, requirements, compensation)
3. Publish — it appears on the public job board
4. Review incoming applications

### Applicant Tracking
- View all candidates
- Review resumes and application details
- Update application status (reviewed, interviewing, offered, hired, rejected)

---

## Email Campaigns

### Templates
- Create reusable email templates (subject, HTML body)
- System templates available as starting points

### Campaigns
1. Create a campaign (name, template, target segment)
2. Schedule or send immediately
3. Track analytics:
   - Opens, clicks, bounces, unsubscribes
   - Per-recipient tracking
   - Delivery status

### Drip Campaigns
Set up automated email sequences triggered by events (e.g., lead created → welcome email → follow-up 3 days later → second follow-up 7 days later).

---

## Reports & BI

### Custom Reports
1. Go to **Reports**
2. Create a report definition (name, query config, schedule)
3. Run the report — see row counts and preview
4. Download as CSV
5. Schedule auto-generation and email delivery

### BI Export
- Export any dataset as CSV or JSON
- Integrate with external BI tools

### LTC Comparison Report
Specialized report for long-term care insurance comparison (StrateCision-style).

---

## Market Intelligence

- **Data subscriptions:** Subscribe to market data products
- **Competitive analysis:** Benchmark your agency against peers
- **Agent benchmarking:** Compare individual agent performance to industry standards
- **Market trends:** ZIP-code level insurance market insights
- **Scheduled reports:** Auto-generate market reports periodically

---

## Workflows, Calendar, Reviews, Training, Forum, Events

Same features as agents — see the Agent User Guide.

---

## Analytics

Agency-level analytics dashboards:
- **Conversion funnel:** By agent, source, insurance type
- **Revenue trends:** By agent, product, carrier, time period
- **Agent performance:** Ranking and benchmarks
- **Claims analytics:** Distribution, costs, trends
- **Product performance:** By insurance type

---

## Embed Widget (for Partners)

As an agency owner, you can create embed partners:
1. Go to **Embed Widgets**
2. Create a new partner (name, allowed domains, commission share)
3. Copy the generated API key and embed code
4. Share with the partner — they paste a `<script>` tag on their site
5. Monitor analytics: sessions, conversions, by domain

See [EMBED_WIDGET.md](EMBED_WIDGET.md) for full technical documentation.

---

## Quick Reference: Agency Codes & URLs

| Item | Format | Example |
|------|--------|---------|
| Agency code | Alphanumeric | `AGYA347` |
| Lead intake URL | `/intake/{code}` | `insurons.com/intake/AGYA347` |
| White-label domain | Custom | `quotes.youragency.com` |
| Embed widget | `<script>` tag | See Embed Widget docs |
