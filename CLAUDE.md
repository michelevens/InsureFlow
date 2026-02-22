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
│           └── admin/         # AdminUsers, AdminAgencies, AdminAnalytics, AdminPlans, AgencyTeam
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

## Current Status (as of 2026-02-22)
- **Frontend:** 30+ pages built, TypeScript passes, Vite build succeeds
- **Backend:** Laravel scaffold + rating engine (22 migrations, 21 models, 11+ controllers, routes, 5 seeders)
- **Seed Data:** 5 subscription plans, 10 carriers with products, 6 demo users, 3 rate tables (DI LTD, Term Life, LTC)
- **Rating Engine:** Full plugin architecture with DI/Life/P&C/LTC support, audit trail, versioned rate tables

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

## Next Tasks
- **Deploy to Railway:** Run `php artisan migrate` for 7 new rate tables, then `php artisan db:seed --class=RateTableSeeder`
- **Fix Railway deploy:** Previous deploy failed — investigate and fix
- **Scenario report export:** Build stunning comparison report (Excel/PDF) inspired by StrateCision LTC format — side-by-side carrier comparison, benefit details, premium breakdown
- **Test with Michel LTC quote data:** Validate LTC rating against real-world quote (Mutual of Omaha $3,086.78, NGL $3,632, NYL $9,135.72)
- Test all API endpoints end-to-end with seeded data
- Add real carrier integrations
