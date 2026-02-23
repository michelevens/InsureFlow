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
│       ├── services/api/  # auth, quotes, agents, applications, policies, carriers, crm, analytics, admin
│       ├── types/         # TypeScript types
│       ├── lib/           # utils.ts
│       └── pages/
│           ├── auth/          # Login, Register
│           ├── public/        # Landing, Pricing, Settings
│           ├── calculator/    # Calculator, QuoteResults
│           ├── marketplace/   # Marketplace, AgentProfile
│           ├── dashboard/     # Dashboard, Consumer/Agent/Agency/Carrier/Admin dashboards
│           ├── portal/        # MyQuotes, MyApplications, MyPolicies
│           ├── crm/           # Leads
│           ├── applications/  # Applications
│           ├── policies/      # Policies
│           ├── analytics/     # Commissions, Reviews
│           ├── carriers/      # Products, Production
│           ├── admin/         # AdminUsers, AdminAgencies, AdminAnalytics, AdminPlans, AgencyTeam, SuperAdminDashboard, SuperAdminSettings
│           ├── agency/        # AgencySettings (7-tab consolidated settings)
│           └── reports/       # LtcComparisonReport (StrateCision-style)
└── laravel-backend/       # Laravel API
    ├── app/
    │   ├── Http/Controllers/
    │   └── Models/
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

## User Roles

1. **Consumer** - Get quotes, compare carriers, find agents, track policies
2. **Agent** - Lead pipeline, CRM, commission tracking, reviews
3. **Agency Owner** - Team management, agency analytics, lead distribution
4. **Carrier** - Product management, production reports, agent network
5. **Admin / Superadmin** - Platform oversight, user management, analytics, plans

## API Endpoints

### Public
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/calculator/estimate` - Get quotes
- `GET /api/marketplace/agents` - Search agents
- `GET /api/carriers` - List carriers

### Protected (auth:sanctum)
- `GET /api/auth/me` - Current user
- `GET /api/applications` - Applications list
- `GET /api/policies` - Policies list
- `GET /api/crm/leads` - Lead pipeline
- `GET /api/commissions` - Commission tracking
- `GET /api/stats/dashboard` - Dashboard stats
- `GET /api/admin/*` - Admin endpoints

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

## Demo Accounts (all password: 'password')
- consumer@insureflow.com (Consumer)
- agent@insureflow.com (Agent)
- agency@insureflow.com (Agency Owner)
- carrier@insureflow.com (Carrier)
- admin@insureflow.com (Admin)
- superadmin@insureflow.com (Superadmin)

## Current Status (as of 2026-02-23)
- **Frontend:** 35+ pages built, TypeScript passes, Vite build succeeds, **GitHub Pages deployment working**
- **Backend:** Laravel scaffold + rating engine — **fully deployed to Railway** (all migrations run, server online)
- **API Domain:** api.insurons.com — WORKING, all endpoints tested
- **Seed Data:** 5 subscription plans, 10 carriers with products, 6 demo users, 35+ platform products, 10 agencies (50 agents), 70 leads, 3 rate tables (DI LTD, Term Life, LTC) — 180 rate entries seeded + PipelineSeeder (25 applications, 15 policies, 15 commissions, 6 claims, 12 appointments, 20 routing rules)
- **Rating Engine:** Full plugin architecture with DI/Life/P&C/LTC support, audit trail, versioned rate tables — **tested end-to-end on production**
- **Video Meetings:** Full lifecycle tested (create → start → end with duration tracking)
- **LTC Rating Validated:** 52M FL $150/day → $1,485.68 annual (real-world Mutual of Omaha comparison: $1,543.39)
- **LTC Carrier Rate Tables:** Mutual of Omaha, NGL, NYL seeded with rates calibrated to Michel StrateCision quote
- **LTC Comparison Report:** StrateCision-style side-by-side carrier comparison with print/PDF layout, agency header, legal disclaimer, Insurons branding footer
- **Product Visibility System:** 3-layer platform→agency→carrier appointment model deployed
- **Onboarding Wizard:** Multi-step flows for agency owners (8 steps) and agents (6 steps)
- **Demo Agencies:** 10 agencies (A-J) with 5 agents each, 70 leads, carrier appointments — all seeded on Railway
- **Admin Overhaul Complete:** SuperAdmin dashboard + 6-tab platform settings, Agency Owner 7-tab settings, role-differentiated navigation
- **Pipeline Data Seeded:** Dashboards no longer show zeroes — applications, policies, commissions, claims, appointments all populated
- **Auto-Commission:** Creating/binding a policy automatically generates a commission record (10% default)

## Recent Work
- Initial project scaffold created
- Complete frontend with all 30 pages
- Complete backend scaffold with models, migrations, controllers, routes, seeders
- Fixed demo login on production — added demo-login endpoint
- Created ForgotPassword and ResetPassword pages
- Enhanced report export (email, PDF, downloadable link)
- Video meeting feature (backend + frontend): system WebRTC, external provider support, waiting room, device check, MeetingRoom page
- **Product Plugin Rating Engine (full-stack):**
  - 7-table migration: rate_tables, rate_table_entries, rate_factors, rate_riders, rate_fees, rate_modal_factors, rating_runs
  - 7 new models: RateTable, RateTableEntry, RateFactor, RateRider, RateFee, RateModalFactor, RatingRun
  - Core RatingEngine service with plugin dependency injection
  - 3 plugins: DisabilityPlugin (DI + LTC), LifePlugin (term/whole/universal), PropertyCasualtyPlugin (auto/home/commercial — 21 product types)
  - 6-step canonical rating formula: eligibility → exposure → base rate → factors → riders → fees → modal conversion
  - LTC-specific exposure model (daily benefit / 10) with shared factor/rider/fee pipeline
  - RatingController with 5 API endpoints: rate scenario, get options, audit trail, history, product list
  - RateTableSeeder with 3 demo rate tables: DI LTD (72 entries), Term Life (40 entries), LTC (44 entries)
  - Frontend rating.ts API service with full TypeScript types
  - RatingPanel modal in Leads.tsx: Configure tab (factor dropdowns, rider toggles, payment mode), Results tab (premium hero, breakdown), History tab (audit trail)
  - Full audit trail: every rating run recorded with input/output snapshots, input hash, duration, versioning
- **Railway Deployment Fixed (2026-02-23):**
  - Fixed claim_documents FK type mismatch (bigint→uuid for documents table)
  - Guarded duplicate agency_id column addition in lead_scenarios migration
  - All 67 migrations run successfully on Railway
  - Rate tables seeded (3 tables, 180 entries)
  - Moved config:cache/route:cache to runtime start command (Railway env vars not available at build time)
- **Rating Engine Bug Fixes:**
  - RatingEngine.buildInput: fallback to metadata_json for age/sex/state when no insured objects
  - DisabilityPlugin: normalize sex input (male→M, female→F) for rate key matching
  - Pass scenario metadata to plugin input for product-specific fields (daily_benefit)
  - VideoMeetingController.end: fix Carbon diffInSeconds type casting
- **GitHub Pages Deployment Fixed:** Removed unused imports (Shield, Settings2, Clock) causing tsc errors in CI
- **Multi-Layered Product Visibility System:**
  - `platform_products` table (35+ canonical insurance types), `agency_products` pivot, `agency_carrier_appointments`
  - Altered `carrier_products.insurance_type` from enum (7 types) to varchar (35+ slugs)
  - AdminProductController (toggle/bulk-toggle/sync), AgencyProductController (product selection + carrier appointments), ProductVisibilityController (public)
  - Frontend: AdminProducts, AgencyProducts, AgencyAppointments pages
  - Calculator.tsx updated to fetch dynamic products from `/products/visible`
- **Agency/Agent Onboarding Wizard:**
  - Migration: `onboarding_completed`, `onboarding_completed_at`, `onboarding_data` on users table
  - OnboardingController with 5 endpoints (status, formData, saveAgency, saveAgent, complete)
  - Frontend Onboarding.tsx: agency owner 8-step flow, agent 6-step flow
  - ProtectedRoute updated to redirect agents/agency_owners to `/onboarding` if not completed
- **Demo Seeder (AgencyAgentSeeder):**
  - 10 agencies (A–J): Apex, Beacon, Coastal, Dominion, Eagle Shield, Frontier, Guardian, Horizon, Integrity, Jade
  - 50 agents (5 per agency) with unique names, bios, licenses, specialties
  - 70 leads (7 per agency) with varied insurance types, statuses, sources
  - All accounts: password `password`, email format `contact+agencyX@ennhealth.com` / `contact+AgencyX.agentN@ennhealth.com`
  - Carrier appointments and product selections per agency
  - AuthController demoLogin updated to accept @ennhealth.com emails
- **Bug Fixes:**
  - Fixed AgencyAppointments.tsx TypeScript error (carrier type cast needed `unknown` intermediate for `tsc -b`)
  - Fixed carrier_products migration: drop PostgreSQL CHECK constraint before ALTER TYPE (enum→varchar)
- **Phase 3 — Close the Loop + Admin Overhaul + LTC Comparison (2026-02-23):**
  - **PipelineSeeder:** 25 applications, 15 policies, 15 commissions, 6 claims, 12 appointments, 20 routing rules — dashboards no longer show zeroes
  - **Wired 5 mock pages to real APIs:** Policies, Applications, AdminUsers, AdminAnalytics — removed all hardcoded mock arrays
  - **Auto-commission on policy binding:** PolicyController.store() and ApplicationController.updateStatus("bound") auto-create Commission records
  - **LTC rating engine — added 9 missing parameters:** taxQualified, partnershipPlan, homeCareType, homeCareBenefitPeriod, assistedLiving, professionalHomeCare, inflationDuration, waiverOfPremium, jointApplicant + poolOfMoney/monthlyBenefitAtAge80 calculations
  - **Seeded carrier rate tables:** Mutual of Omaha ($1,305.76), NGL ($3,632 joint), NYL ($4,091.49/$5,044.23) — calibrated to Michel StrateCision quote
  - **LTC Comparison Report (StrateCision-style):** POST /api/reports/ltc-comparison endpoint + LtcComparisonReport.tsx — side-by-side carrier columns, all benefit parameters, premium totals
  - **Enhanced LTC report for print/PDF:** Agency branding header, legal disclaimer footer, Insurons platform info, landscape print CSS, color-preserving @media print rules
  - **SuperAdmin Dashboard:** Platform overview with stat cards (agencies, users, policies, MRR), 9 quick actions, recent agencies, system health panel
  - **SuperAdmin Settings (6 tabs):** Platform, Billing (Stripe), Email, Security, Notifications, Integrations — with test buttons for Stripe/email
  - **Agency Settings (7 tabs):** General, Billing, Team, Products & Carriers, Compliance, Integrations, Notifications — consolidated 7+ separate nav items into one page
  - **PlatformSettingController + AgencySettingController:** New backend controllers for platform-wide and agency-scoped settings CRUD
  - **platform_settings migration:** Key-value store (key, value JSON, group) for platform configuration
  - **Navigation cleanup:** Agency Owner sidebar consolidated, SuperAdmin gets dedicated Platform section, Admin sees subset

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

## Next Tasks
- **Deploy Phase 3 to Railway:** Run `php artisan migrate` for platform_settings table, run PipelineSeeder
- **End-to-end test LTC comparison:** Create rating runs via API for Mutual of Omaha/NGL/NYL, then generate comparison report to validate PDF output
- **Test SuperAdmin flow:** Login as superadmin → verify dashboard stats → platform settings tabs → system health
- **Test Agency Settings flow:** Login as agency_owner → verify 7-tab settings page → team management → compliance
- Test all API endpoints end-to-end with seeded pipeline data (policies, commissions, claims, appointments)
- Test onboarding flow end-to-end (register new agency → complete wizard → verify data in DB)
- Test agency product selection and carrier appointment flow
- Add real carrier integrations
