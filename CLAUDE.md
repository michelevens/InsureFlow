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
- **UI:** Custom premium components (Navy + Teal + Amber palette)
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

### Color Palette (Premium Navy + Teal)
- **Shield Navy (Primary):** `#102a43`→`#f0f4f8` - Deep trust, authority
- **Confidence Teal (Secondary):** `#014d40`→`#effcf6` - Modern, professional
- **Amber Accent:** `#f59e0b` - CTAs, warmth, attention
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
- **Backend:** Laravel 12 on Railway — **Phase 5+6+7+8 deployed**, marketplace tables migrated, all endpoints live
- **API Domain:** api.insurons.com — WORKING, CORS fixed for ennhealth.github.io
- **Database:** All migrations run (including compliance_pack_tables batch 16), 39 compliance requirements seeded
- **Seed Data:** 5 subscription plans, 10 carriers with products, 6 demo users, 35+ platform products, 10 agencies (50 agents), 70 leads, 3 rate tables (DI LTD, Term Life, LTC) — 180 rate entries + PipelineSeeder (25 applications, 15 policies, 15 commissions, 6 claims, 12 appointments, 20 routing rules) + 39 compliance requirements
- **Lead Pipeline:** Full InsuranceProfile → Lead → RoutingEngine → LeadScoring pipeline wired for intake submissions
- **Lead Aging Alerts:** Hourly `leads:check-aging` command — 24h → remind agent, 48h → escalate to agency owner (email + in-app notification)
- **UTM Attribution:** Frontend reads utm_source/utm_medium/utm_campaign from URL, backend stores in InsuranceProfile details
- **Lead Marketplace:** Full lead exchange — agencies can only sell own-sourced leads (not marketplace purchases), platform takes 15% fee, auto-routes purchased leads through buyer's RoutingEngine
- **Rating Engine:** Full plugin architecture with DI/Life/P&C/LTC support, audit trail, versioned rate tables — **tested end-to-end on production**
- **Product Visibility System:** 3-layer platform→agency→carrier appointment model deployed
- **Demo Agencies:** 10 agencies (A-J) with 5 agents each, 70 leads, carrier appointments — all seeded on Railway
- **Admin Overhaul Complete:** SuperAdmin dashboard + 7-tab platform settings (incl. Compliance), Agency Owner 7-tab settings
- **Auto-Commission:** Creating/binding a policy automatically generates a commission record (10% default)
- **Design System:** Premium Navy + Teal + Amber palette (refreshed from original bright blue)
- **Quote UX:** Save & resume (localStorage), comparison matrix, premium breakdown, Lemonade-style progressive disclosure

## Recent Work

### Phase 8 (2026-02-24) — UX Quick Wins + CORS Fix + Palette Refresh
- **CORS fix:** Added `ennhealth.github.io` to allowed_origins in `cors.php` — was missing, causing all API requests from the deployed frontend to be blocked by the browser (only `michelevens.github.io` was listed)
- **Save & resume abandoned quotes:** Calculator auto-saves form draft to localStorage, shows "Welcome back" banner when returning. QuoteResults falls back to localStorage on page refresh (24h expiry)
- **Coverage comparison matrix:** Toggle between card view and side-by-side comparison table on quote results — carriers as columns, rows for premium, deductible, coverage, AM Best rating, features
- **Premium breakdown:** Expandable "Premium Breakdown" section on each quote card showing base rate, policy fee, multi-policy discount, monthly total, and annual savings callout
- **Lemonade-style progressive disclosure:** Calculator Step 2 now shows one question at a time with progress bar, Enter-to-advance, skip links, and smooth fade-in animations (replaces all-fields-at-once layout)
- **Lead marketplace restriction:** Agencies can only sell leads they acquired through their own intake link or effort — marketplace-purchased leads (`source='marketplace'`) cannot be re-listed. Backend returns 422, frontend hides "Sell" button
- **Palette refresh:** Deep navy primary (`#102a43`), teal secondary (`#014d40`), amber accent (`#f59e0b`), richer emerald success. Updated gradients, glass morphism, shadows, PWA theme color
- **Files changed:** `cors.php`, `Calculator.tsx`, `QuoteResults.tsx`, `Leads.tsx`, `LeadMarketplaceController.php`, `index.css`, `vite.config.ts`

### Phase 7 (2026-02-24) — Marketplace Navigation + Sell Lead from CRM
- **Lead Marketplace in sidebar:** Added "Lead Marketplace" nav item with ShoppingCart icon to Pipeline section (visible to agent + agency_owner roles) in `DashboardLayout.tsx`
- **"Sell on Marketplace" button:** Added to lead detail view header in `Leads.tsx` — opens `SellLeadModal` with asking price, seller notes, and listing duration (7/14/30/60/90 days)
- **Backend `createListing` flexibility:** Now accepts `lead_id` as alternative to `insurance_profile_id`. If no InsuranceProfile exists for the lead, auto-creates one from the lead's data (first_name, last_name, email, phone, insurance_type, etc.)
- **Type fix:** Fixed pre-existing TypeScript error in `LeadMarketplace.tsx` TransactionsTab — replaced inline type with proper `LeadMarketplaceTransaction` import
- **Files changed:** `DashboardLayout.tsx`, `Leads.tsx`, `LeadMarketplace.tsx`, `marketplace.ts`, `LeadMarketplaceController.php`

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
- **InsuranceProfile model:** Added `engagementEvents()` and `leadScore()` relationships
- **Schedule registered:** `leads:check-aging` runs hourly in `bootstrap/app.php`
- **Lead Marketplace (Tier 3 — competitive moat):**
  - Migration: `lead_marketplace_listings` + `lead_marketplace_transactions` tables
  - Models: `LeadMarketplaceListing` (scopes, grade calc, ZIP→state mapping), `LeadMarketplaceTransaction`
  - `LeadMarketplaceController`: browse (with filters/sort), show (anonymized), purchase (DB transaction + row lock), create listing, withdraw, stats, transaction history
  - Purchase flow: copies InsuranceProfile + Lead to buyer agency, routes via RoutingEngine, scores via LeadScoringService, notifies seller (in-app), tracks engagement
  - 15% platform fee on transactions, ZIP prefix geo filtering, lead grade (A-F) from score
  - 8 API routes under `/lead-marketplace/*`
  - Frontend `LeadMarketplace` page at `/lead-marketplace` with 3 tabs:
    - Browse: grid of anonymized cards (grade, score, state, price, contact signals), filters (type, state, sort)
    - My Listings: status tracking + withdraw action
    - Transactions: bought/sold history with financial details
  - Stats dashboard: active listings, purchased, sold, revenue
  - Full TypeScript types + API service methods

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
- **InsuranceAiService:** `$apiKey` gracefully handled (returns "not configured" message) but still needs `ANTHROPIC_API_KEY` env var on Railway for AI chat to work.
- **Cache table missing:** `cache:clear` fails because there's no `cache` table in DB. Non-critical (using file/array cache driver instead).
- **Stripe not configured:** Price IDs in seeded plans are null. Subscriptions return 422 until Stripe keys are added.
- **Backend redeploy needed:** Phase 8 backend changes (CORS fix, marketplace restriction) need Railway deployment. Run `railway up` or wait for auto-deploy.
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

## E2E Test Results (2026-02-24)
All 4 core flows tested against production and **PASSING**:
1. **Consumer quote flow:** Calculator estimate → 3+ carrier quotes → save contact → lead 115 created, routed to agent
2. **Agency intake link:** `/intake/AGYA347` → lead 116 (Jane Smith, homeowners, FL) → profile created, routed to agent 53
3. **Agent CRM view:** Agency A owner sees lead 116 with notes (ZIP, timeline, consumer message)
4. **Marketplace sell→buy:** Agency A lists lead for $25 → Agency B browses, purchases → lead 117 in buyer CRM with full contact. Seller gets $21.25 (85%), platform fee $3.75 (15%)

## Next Tasks

### Infrastructure & Config
- **Configure scheduler on Railway:** Add `php artisan schedule:work` as a worker process or cron job so `leads:check-aging` actually runs
- **Create cache table:** Run `php artisan cache:table && php artisan migrate` on Railway to fix cache:clear
- **Configure Stripe:** Add real Stripe API keys to Railway env vars, create products/prices, update seeded plans with real price IDs

### UX Quick Wins (Remaining)
- Address auto-complete on ZIP code field (Google Places or Mapbox)

### New Features
- **Embeddable quote widget:** iframe/web component agencies can put on their own websites
- **Real carrier API integrations:** Connect to actual carrier rating APIs (Progressive, Travelers, etc.)
- **Agent notification when compliance pack items are overdue**
- **Marketplace enhancements:** Lead auction/bidding mode, bulk listing, suggested pricing based on lead score
- **Consumer portal improvements:** Let consumers track their quote requests, view scenarios, sign applications
- **Real premium breakdown from backend:** Currently the breakdown is computed client-side with synthetic values — wire to actual rate engine output

### Testing (Remaining)
- **Deploy Phase 8 to Railway** and verify CORS fix works in browser (quotes should load now)
- Test `php artisan leads:check-aging` with stale test leads (needs scheduler running)
- Test aging reminder email to agent (24h) and escalation to agency owner (48h)
- Test full UI flow in browser: login → Leads → click lead → Sell on Marketplace → switch agency → browse → buy
- Verify marketplace restriction: try selling a purchased lead (should be blocked)
- Load test marketplace with 50+ listings to verify pagination and filters
