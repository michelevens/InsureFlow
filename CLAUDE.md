# InsureFlow - Insurance Marketplace SaaS Platform

## Overview
InsureFlow is a comprehensive insurance marketplace that connects consumers with top carriers and licensed agents. Consumers get instant quotes from 50+ carriers, compare side-by-side, and connect with matched agents. Agents get qualified leads, CRM tools, and commission tracking.

## Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build:** Vite 7.x
- **Styling:** Tailwind CSS 4.x with custom design system
- **Routing:** React Router v7
- **State:** React Query + Context API
- **UI:** Custom premium components (Shield Blue design)
- **Icons:** Lucide React

### Backend
- **Framework:** Laravel 12 (PHP 8.4)
- **Auth:** Laravel Sanctum
- **Payments:** Stripe
- **Database:** PostgreSQL (Railway-ready)

## Project Structure

```
InsureFlow/
├── frontend/              # React frontend
│   └── src/
│       ├── components/
│       │   ├── ui/        # Button, Input, Card, Badge, Modal, Select, Textarea
│       │   ├── layout/    # DashboardLayout
│       │   └── dashboard/ # StatsCard, EmptyState
│       ├── contexts/      # AuthContext
│       ├── hooks/         # useAuth
│       ├── services/api/  # auth, quotes, agents, applications, policies, carriers, crm, analytics, admin, compliance
│       ├── types/         # TypeScript types
│       ├── lib/           # utils.ts
│       └── pages/
│           ├── auth/          # Login, Register, ForgotPassword, ResetPassword, VerifyEmail, AcceptInvite, SsoLogin, SsoCallback
│           ├── public/        # Landing, Pricing, Settings, Privacy, Terms
│           ├── calculator/    # Calculator, QuoteResults
│           ├── marketplace/   # Marketplace, AgentProfile
│           ├── dashboard/     # Dashboard
│           ├── portal/        # MyQuotes, MyApplications, MyPolicies
│           ├── crm/           # Leads (with Add Lead modal + RatingPanel)
│           ├── applications/  # Applications
│           ├── policies/      # Policies
│           ├── analytics/     # Commissions, Reviews, AdvancedAnalytics
│           ├── carriers/      # Products, Production, CarrierApiConfig
│           ├── claims/        # Claims
│           ├── renewals/      # Renewals
│           ├── messages/      # Messages
│           ├── notifications/ # Notifications
│           ├── documents/     # Documents (e-sign)
│           ├── compliance/    # ComplianceDashboard (with Compliance Pack tab)
│           ├── meetings/      # Meetings, MeetingRoom
│           ├── calendar/      # Calendar
│           ├── intake/        # LeadIntake (public lead form)
│           ├── admin/         # AdminUsers, AdminAgencies, AdminPlans, AdminProducts, AdminCarriers, AdminAnalytics, AdminAuditLog, AgencyTeam, SuperAdminDashboard, SuperAdminSettings (7 tabs incl. Compliance), SsoConfig
│           ├── agency/        # AgencyProducts, AgencyAppointments, AgencySettings (7 tabs)
│           ├── organizations/ # OrganizationTree
│           ├── webhooks/      # WebhookSettings
│           ├── whitelabel/    # WhiteLabelConfig
│           ├── embed/         # EmbedPartnerDashboard
│           ├── data/          # MarketIntelDashboard
│           ├── apikeys/       # ApiKeyManagement
│           ├── recruitment/   # RecruitmentDashboard
│           ├── training/      # TrainingCatalog
│           ├── help/          # HelpCenter
│           ├── forum/         # ForumHome
│           ├── events/        # EventCalendar
│           ├── partners/      # PartnerDirectory
│           ├── campaigns/     # CampaignBuilder
│           ├── reports/       # ReportBuilder, LtcComparisonReport
│           └── onboarding/    # Onboarding
└── laravel-backend/       # Laravel API
    ├── app/
    │   ├── Http/Controllers/
    │   ├── Models/
    │   └── Services/
    ├── database/
    │   ├── migrations/
    │   └── seeders/
    ├── routes/api.php
    └── config/
```

## Design System

### Color Palette (Shield-Inspired)
- **Shield Blue (Primary):** `#2563eb` - Trust, protection
- **Confidence Indigo (Secondary):** `#4f46e5` - Authority, expertise
- **Savings Green (Success):** `#16a34a` - Money saved, growth

### Component Variants
- **Button:** `primary | secondary | outline | ghost | shield | danger`
- **Badge:** `default | shield | success | warning | danger | info | outline`

## User Roles

1. **Consumer** - Get quotes, compare carriers, find agents, track policies
2. **Agent** - Lead pipeline, CRM, commission tracking, reviews, compliance pack
3. **Agency Owner** - Team management, agency analytics, lead distribution, compliance pack, agency codes
4. **Carrier** - Product management, production reports, agent network
5. **Admin** - User/agency/carrier management, plans, products, audit log
6. **Superadmin** - Platform oversight, settings, compliance requirements management, SSO config

## API Endpoints

### Public
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/calculator/estimate` - Get quotes
- `GET /api/marketplace/agents` - Search agents
- `GET /api/carriers` - List carriers
- `GET /api/intake/{agencyCode}` - Lead intake form data
- `POST /api/intake/{agencyCode}` - Submit lead intake form

### Protected (auth:sanctum)
- `GET /api/auth/me` - Current user
- `GET /api/applications` - Applications list
- `GET /api/policies` - Policies list
- `GET /api/crm/leads` - Lead pipeline
- `POST /api/crm/leads` - Create lead
- `GET /api/commissions` - Commission tracking
- `GET /api/stats/dashboard` - Dashboard stats
- `GET /api/compliance/pack` - User's compliance pack
- `POST /api/compliance/pack/generate` - Auto-generate compliance pack
- `PUT /api/compliance/pack/{item}` - Update compliance item
- `GET /api/agency/settings/lead-intake` - Lead intake URLs
- `POST /api/agency/settings/regenerate-code` - Regenerate agency code
- `POST /api/agency/settings/agents` - Create agent (agency owner)
- `POST /api/agency/settings/agents/{agent}/reset-password` - Reset agent password

### Admin
- `GET/POST /api/admin/users` - List/create users
- `PUT /api/admin/users/{user}` - Update user
- `POST /api/admin/users/{user}/reset-password` - Reset user password
- `GET /api/admin/agencies` - List agencies
- `GET /api/admin/agencies/{id}` - Agency detail
- `PUT /api/admin/agencies/{id}` - Update agency (verify/activate)
- `GET/POST /api/admin/plans` - List/create subscription plans
- `PUT /api/admin/plans/{id}` - Update plan
- `DELETE /api/admin/plans/{id}` - Delete plan
- `GET/POST /api/admin/carriers` - List/create carriers
- `GET /api/admin/carriers/{id}` - Carrier detail
- `PUT /api/admin/carriers/{id}` - Update carrier
- `GET/POST/PUT/DELETE /api/admin/compliance/requirements` - Compliance requirements CRUD
- `GET /api/admin/compliance/overview` - Platform compliance overview

## Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd laravel-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

## Deployment
- **Frontend:** GitHub Pages (ennhealth.github.io/InsureFlow)
- **Backend:** Railway (PostgreSQL included)
- **Railway Project:** ample-empathy / insurons-api
- **API Domain:** api.insurons.com
- **Deploy backend:** `cd laravel-backend && railway deployment up`
- **Run migrations:** `railway ssh php artisan migrate --force`
- **Run seeder:** `railway ssh "php artisan db:seed --class=SomeSeeder --force"`
- **Clear caches:** `railway ssh "php artisan config:clear && php artisan route:clear && php artisan view:clear"`

## Demo Accounts (all password: 'password')
- consumer@insureflow.com (Consumer)
- agent@insureflow.com (Agent)
- agency@insureflow.com (Agency Owner)
- carrier@insureflow.com (Carrier)
- admin@insureflow.com (Admin)
- superadmin@insureflow.com (Superadmin)

## Current Status (as of 2026-02-24)
- **Frontend:** 50+ pages built, TypeScript passes, Vite build succeeds, **GitHub Pages deployment working** (auto-deploys on push)
- **Backend:** Laravel 12 on Railway — needs redeploy for Phase 5+6 backend changes
- **API Domain:** api.insurons.com — WORKING, all endpoints tested
- **Database:** All migrations run (including compliance_pack_tables batch 16), 39 compliance requirements seeded
- **Seed Data:** 5 subscription plans, 10 carriers with products, 6 demo users, 35+ platform products, 10 agencies (50 agents), 70 leads, 3 rate tables (DI LTD, Term Life, LTC) — 180 rate entries + PipelineSeeder (25 applications, 15 policies, 15 commissions, 6 claims, 12 appointments, 20 routing rules) + 39 compliance requirements
- **Lead Pipeline:** Full InsuranceProfile → Lead → RoutingEngine → LeadScoring pipeline wired for intake submissions
- **Lead Aging Alerts:** Hourly `leads:check-aging` command — 24h → remind agent, 48h → escalate to agency owner (email + in-app notification)
- **UTM Attribution:** Frontend reads utm_source/utm_medium/utm_campaign from URL, backend stores in InsuranceProfile details
- **Rating Engine:** Full plugin architecture with DI/Life/P&C/LTC support, audit trail, versioned rate tables — **tested end-to-end on production**
- **Product Visibility System:** 3-layer platform→agency→carrier appointment model deployed
- **Demo Agencies:** 10 agencies (A-J) with 5 agents each, 70 leads, carrier appointments — all seeded on Railway
- **Admin Overhaul Complete:** SuperAdmin dashboard + 7-tab platform settings (incl. Compliance), Agency Owner 7-tab settings
- **Auto-Commission:** Creating/binding a policy automatically generates a commission record (10% default)

## Recent Work

### Phase 6 (2026-02-24) — Lead Pipeline Rewire + Aging Alerts + UTM Attribution
- **LeadIntakeController rewrite:** Complete pipeline integration — intake now flows through InsuranceProfile → Lead → RoutingEngine → LeadScoring → engagement tracking (was bypassing all of these)
- **Lead deduplication:** Same email + insurance_type + agency = update existing profile instead of creating duplicates
- **LeadScoringService fixes:** Corrected `$profile->stage` → `$profile->current_stage`, added `intake_link` source score (9 pts)
- **UTM attribution tracking:** Frontend reads `utm_source`, `utm_medium`, `utm_campaign` from URL params and sends to API; backend stores in InsuranceProfile details JSON
- **Lead aging alert system:**
  - `CheckLeadAging` Artisan command runs hourly via scheduler
  - 24h without `agent_contacted` event → `LeadAgingReminderMail` to assigned agent + in-app notification
  - 48h without contact → `LeadAgingEscalationMail` to agency owner + in-app notification
  - Both use `LeadEngagementEvent` markers (`aging_reminded`, `aging_escalated`) to prevent duplicate alerts
  - Email templates follow Insurons design system (amber for reminder, red for escalation)
- **InsuranceProfile model:** Added `engagementEvents()` HasMany relationship
- **Schedule registered:** `leads:check-aging` runs hourly in `bootstrap/app.php`

### Phase 5 (2026-02-24) — UX Competitive Analysis + Quick Wins + Email Notifications
- **InsuranceAiService fix:** Added `isConfigured()` guard + early return when ANTHROPIC_API_KEY missing (prevents failed HTTP calls)
- **Competitive Analysis:** Created `INTAKE_COMPARISON.md` — detailed comparison of Insurons intake/quote forms vs Lemonade, Ethos, Policygenius, SelectQuote, Bold Penguin, EZLynx, Quotit. Includes gap analysis, 15 prioritized recommendations, and quick-win checklist.
- **Calculator UX improvements:**
  - Added "Takes about 60 seconds" time estimate (trust signal)
  - Coverage level descriptions: "Basic — Minimum required coverage", "Standard — Balanced (most popular)", "Premium — Maximum protection"
- **Quote Results UX improvements:**
  - Sort dropdown: Best Match, Price (Low→High), Price (High→Low), Lowest Deductible, Carrier Rating
  - Carrier logo support (shows logo image when available, falls back to initials)
  - Quote count display
- **Lead Intake form enhancements:**
  - Dynamic product catalog from `/products/visible` API (replaces hardcoded list)
  - ZIP code field (enables geographic lead routing)
  - Urgency selector ("ASAP", "Within the next month", "Just exploring")
  - ZIP and urgency auto-appended to lead notes
- **Email notifications for lead intake:**
  - Agent notification: `LeadAssignedMail` sent to assigned agent on intake submission
  - Consumer confirmation: new `LeadIntakeConfirmationMail` with agency name, insurance type, CTA to compare quotes
  - Both wrapped in try-catch to prevent form submission failure on mail errors
- **Frontend deployed to GitHub Pages** (auto-deploy CI triggered)

### Phase 4 (2026-02-23) — Add Lead + Compliance Pack + Admin CRUD + Agency Codes + Lead Intake
- **Add New Lead modal:** CRM Leads page now has "Add Lead" button + full form modal (uses existing `POST /crm/leads` backend)
- **Compliance Pack System (full stack):**
  - Migration: `compliance_requirements` + `compliance_pack_items` tables
  - Models: `ComplianceRequirement`, `CompliancePackItem`
  - `CompliancePackController`: pack CRUD, auto-generation algorithm (state + product matching), admin requirement management
  - `ComplianceRequirementSeeder`: 39 state-specific requirements across 8 states (FL, TX, CA, NY, GA, IL, VA, AZ) covering licensing, CE credits, E&O, background checks
  - Frontend: Compliance Pack tab in ComplianceDashboard (progress bar, status filters, grouped by category)
  - SuperAdmin: 7th "Compliance" tab in Platform Settings for managing the master requirements list
  - Auto-generates compliance pack on onboarding completion
- **Admin Detail Pages (all wired to real APIs, no mock data):**
  - `AdminAgencies` — List + detail view, verify/unverify, activate/deactivate
  - `AdminPlans` — Full CRUD: create, edit, delete, activate/deactivate subscription plans
  - `AdminCarriers` — NEW page: list + detail + create/edit carriers
  - `AdminUsers` — Enhanced: create user, edit user, reset password (shows temp password), detail view
- **Agency Code System:**
  - Agency codes displayed in AgencySettings General tab with copy button
  - Regenerate code endpoint (`POST /agency/settings/regenerate-code`)
  - Agents can see their agency code during onboarding
- **Lead Intake Links:**
  - Public lead intake form at `/intake/:agencyCode` (no auth required)
  - Agency and agent-specific intake URLs displayed in AgencySettings
  - Supports `?agent=` query param for direct agent routing
  - `LeadIntakeController` validates agency code, creates lead with source='intake_link'
- **Agency Team Management Enhanced:**
  - "Add Agent" modal in AgencySettings Team tab (creates agent, shows temp password)
  - "Reset Password" per agent row
  - Backend: `AgencySettingController.createAgent()`, `resetAgentPassword()`
- **Navigation:** Added Carriers to admin sidebar
- **Competitive Analysis:** Created `COMPETITIVE_ANALYSIS.md` comparing InsureFlow vs Ethos, Policygenius, Applied Epic, EZLynx, Bold Penguin

### Phase 3 (2026-02-23) — Close the Loop + Admin Overhaul + LTC Comparison
- PipelineSeeder, wired 5 mock pages to real APIs, auto-commission, LTC rating params, carrier rate tables
- LTC Comparison Report (StrateCision-style), SuperAdmin Dashboard/Settings, Agency Settings (7 tabs)
- PlatformSettingController, AgencySettingController, navigation cleanup

### Earlier Phases
- Rating engine with plugin architecture (DI/Life/P&C/LTC)
- Video meetings, onboarding wizard, product visibility system
- Demo agencies/agents seeder, carrier appointments
- GitHub Pages + Railway deployment

## Architecture: Product Plugin Rating Engine

### Plugin Registry
- `DisabilityPlugin` → disability_std, disability_ltd, long_term_care
- `LifePlugin` → life_term, life_whole, life_universal, life_final_expense, annuity
- `PropertyCasualtyPlugin` → auto, homeowners, renters, commercial_gl, workers_comp, etc. (21 types)

### 6-Step Formula (canonical for all products)
1. **Eligibility & Caps** — product-specific (income replacement for DI, daily benefit for LTC)
2. **Exposure Normalization** — DI: benefit/100, LTC: dailyBenefit/10, Life: faceAmount/1000, P&C: varies
3. **Base Rate Lookup** — composite key with cascading fallbacks (exact → wildcard state → wildcard class)
4. **Factor Layer** — multiplicative/additive factors from rate table (elimination period, benefit period, inflation, etc.)
5. **Rider Layer** — optional endorsements (COLA, FIO, Residual, Restoration, Shared Care, etc.)
6. **Fees & Credits** — policy fees, admin fees, multi-policy discounts, partnership credits
7. **Modal Conversion** — annual × factor + flat fee → monthly/quarterly/semiannual/annual

### API Endpoints
- `POST /api/rate/scenario/{id}` — Rate a scenario (accepts factor/rider overrides, payment mode)
- `GET /api/rate/options/{productType}` — Get available factors, riders, fees for UI
- `GET /api/rate/audit/{runId}` — Full audit trail for a single run
- `GET /api/rate/history/{scenarioId}` — Rating history for a scenario
- `GET /api/rate/products` — List all registered rateable product types

## Demo Agency Accounts
See `demo_credentials.csv` in project root for full list (60 accounts: 10 agency owners + 50 agents).
All passwords: `password`

| Agency | Owner Email | City | Specialties |
|--------|------------|------|-------------|
| Apex Insurance Group | contact+agencyA@ennhealth.com | Dallas, TX | Auto, Home, Commercial GL, Umbrella |
| Beacon Risk Advisors | contact+agencyB@ennhealth.com | Austin, TX | Life, Health, Dental, Vision |
| Coastal Coverage Partners | contact+agencyC@ennhealth.com | Miami, FL | Home, Flood, Renters, Condo |
| Dominion Commercial Insurance | contact+agencyD@ennhealth.com | San Francisco, CA | BOP, Cyber, Professional, D&O |
| Eagle Shield Agency | contact+agencyE@ennhealth.com | Norfolk, VA | Auto, Home, Life, Renters |
| Frontier Benefits Group | contact+agencyF@ennhealth.com | Chicago, IL | Health Group, Dental, Vision, Disability |
| Guardian Insurance Associates | contact+agencyG@ennhealth.com | Atlanta, GA | Auto, Home, Life, Health, BOP, Workers Comp |
| Horizon Surety & Bonds | contact+agencyH@ennhealth.com | Phoenix, AZ | Surety, Commercial GL, Workers Comp |
| Integrity Senior Solutions | contact+agencyI@ennhealth.com | Tampa, FL | Medicare, LTC, Final Expense, Annuity |
| Jade Risk Management | contact+agencyJ@ennhealth.com | New York, NY | Home, Auto, Umbrella, Jewelry, Boat |

Agent emails follow pattern: `contact+AgencyX.agent1@ennhealth.com` through `contact+AgencyX.agent5@ennhealth.com`

## Known Issues
- **InsuranceAiService:** `$apiKey` gracefully handled (returns "not configured" message) but still needs `ANTHROPIC_API_KEY` env var on Railway for AI chat to work. `route:list`/`route:cache` issue may persist until key is set.
- **Cache table missing:** `cache:clear` fails because there's no `cache` table in DB. Non-critical (using file/array cache driver instead).
- **Stripe not configured:** Price IDs in seeded plans are null. Subscriptions return 422 until Stripe keys are added.
- **Backend redeploy needed:** Phase 5+6 backend changes (pipeline rewire, aging alerts, emails) need Railway deployment.
- **Scheduler not running:** `leads:check-aging` is registered but Railway needs `php artisan schedule:work` or a cron entry to actually run the scheduler.

## Session Management Rules

### On Session Start
1. Read this entire CLAUDE.md to understand project state
2. Check `git log --oneline -10` to see what was last done
3. Check `git status` for any uncommitted work
4. If the user says "continue", check the **Next Tasks** section below

### On Session End
1. Update **Recent Work** with what was completed
2. Update **Current Status** with latest state
3. Update **Known Issues** if any new ones found
4. Update **Next Tasks** with what should be done next
5. Commit and push the updated CLAUDE.md

### During Session
- Commit after EACH completed feature — do not batch
- Always run `npx tsc -b --noEmit` before committing frontend changes
- Working directory: `c:\Users\BellaCare_MICROPC\OneDrive - EnnHealth\Documents\GitHub\InsureFlow`

## Next Tasks
- **Deploy backend to Railway:** `cd laravel-backend && railway up` to deploy Phase 5+6 backend changes
- **Configure scheduler on Railway:** Add `php artisan schedule:work` as a worker process or cron job so `leads:check-aging` actually runs
- **Create cache table:** Run `php artisan cache:table && php artisan migrate` on Railway to fix cache:clear
- **Configure Stripe:** Add real Stripe API keys to Railway env vars, create products/prices, update seeded plans
- **Tier 3 — Lead Marketplace:** Build lead exchange where agencies can buy/sell leads across the platform (competitive moat feature)
- **Implement more INTAKE_COMPARISON.md quick wins:**
  - One-at-a-time question mode for Calculator Step 2 (Lemonade-style progressive disclosure)
  - Address auto-complete on ZIP code field (Google Places or Mapbox)
  - Save & resume for abandoned quotes (localStorage + "Welcome back" banner)
  - Premium breakdown on quote results (base rate, fees, discounts, total)
  - Coverage comparison matrix (side-by-side table view)
- **Test Phase 4+5+6 end-to-end:**
  - Test lead intake form at `/intake/{agencyCode}?utm_source=test` → verify profile created, lead routed, score calculated, emails sent
  - Test `php artisan leads:check-aging` with stale test leads
  - Login as agent → Leads → verify aging reminder appears
  - Login as agency_owner → verify escalation notification
- Add real carrier API integrations
- Agent notification when compliance pack items are overdue
- Embeddable quote widget (iframe/web component for agency websites)
