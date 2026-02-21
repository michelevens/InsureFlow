# InsureFlow — Complete Implementation Prompt

> Give this entire file to Claude Code to implement the project from scratch.

## Project Overview
- **Name:** InsureFlow
- **Tagline:** The modern insurance marketplace — instant quotes, smart agent matching, and a seamless application pipeline for consumers, agents, and carriers
- **Domain:** Insurance / InsurTech / Lead Generation / Marketplace
- **Vision:** Build the "Solarera for insurance" — a platform where consumers get instant multi-carrier quotes, get matched with licensed agents, and track applications from quote to bound policy. Agents get a digital storefront, lead pipeline, and CRM. Carriers get digital distribution. Replace the painful "call 5 agents and wait" process with a modern, transparent experience.

---

## Tech Stack (Standard — Do NOT Deviate)

### Frontend
- **Framework:** React 18 + TypeScript (strict mode)
- **Build:** Vite 6.x
- **Styling:** Tailwind CSS 4.x
- **Routing:** React Router v7
- **State:** React Query + Context API (Split Context pattern)
- **UI:** Custom premium components, Lucide React icons
- **Forms:** React Hook Form + Zod
- **Notifications:** Sonner
- **Charts:** Recharts
- **Comparison:** Custom quote comparison UI (side-by-side cards)

### Backend
- **Framework:** Laravel 12 (PHP 8.4)
- **Auth:** Laravel Sanctum
- **Database:** PostgreSQL
- **Payments:** Stripe (subscriptions + lead fees)
- **PDFs:** DomPDF (quote summaries, policy documents)
- **SMS:** Twilio
- **Email:** SendGrid

### Infrastructure
- **Backend:** Railway (PostgreSQL)
- **Frontend:** Vercel or GitHub Pages

---

## Design System

### Color Palette (Trust & Protection Inspired)
- **Primary (Shield Blue):** `#2563eb` (blue-600) — Trust, protection, security
- **Secondary (Confidence Indigo):** `#4f46e5` (indigo-600) — Authority, reliability
- **Accent (Savings Green):** `#16a34a` (green-600) — Savings, good value, approved
- **Warning:** `#f59e0b` (amber-500) — Pending review, expiring policies
- **Danger:** `#dc2626` (red-600) — Declined, lapsed policies, coverage gaps
- **Neutrals:** Slate-50 through Slate-900

### Design Principles
- Quote-first UI — instant calculator is the entry point (like Solarera's solar calculator)
- Side-by-side comparison of plans/carriers
- Trust signals everywhere (licensed badges, ratings, carrier logos)
- Pipeline tracking (quote → apply → underwriting → bound)
- Glass morphism, premium shadows, hover lift (same as Solarera)
- Mobile-first for consumers, desktop for agents

---

## User Roles

| Role | Access Level | Description |
|------|-------------|-------------|
| consumer | Quote + portal | Get quotes, compare, apply, manage policies |
| agent | Lead pipeline | Receive leads, manage quotes, CRM, commissions |
| agency_owner | Full agency | Agent features + team, commissions, analytics |
| carrier | Rate management | Publish rates, manage agents, track production |
| admin | Platform-wide | All users, analytics, marketplace settings |
| superadmin | Unrestricted | System configuration |

---

## Project Structure
```
insureflow/
├── frontend/src/
│   ├── components/
│   │   ├── ui/, layout/, dashboard/
│   │   ├── calculator/      # QuoteForm, QuoteResults, ComparisonGrid
│   │   ├── marketplace/     # AgentCard, AgentProfile, CarrierLogo
│   │   ├── pipeline/        # ApplicationCard, PipelineBoard, StatusTimeline
│   │   ├── policies/        # PolicyCard, CoverageDetail, RenewalAlert
│   │   ├── crm/             # LeadCard, ContactLog, FollowUpReminder
│   │   └── portal/          # ConsumerDashboard, PolicyList, ClaimForm
│   ├── contexts/ (AuthContext)
│   ├── hooks/ (useAuth, useQuote, usePipeline)
│   ├── services/api/ (client, auth, quotes, agents, applications, policies, carriers, crm, analytics, portal, admin, index)
│   ├── pages/ (auth, dashboard, calculator, marketplace, applications, policies, crm, carriers, analytics, portal, admin, public)
│   └── App.tsx
└── laravel-backend/
    ├── app/Http/Controllers/ (Auth, Admin, Quote, Agent, Application, Policy, Carrier, CRM, Analytics, Portal)
    ├── app/Models/
    ├── app/Services/RatingEngine.php
    ├── database/migrations/, seeders/
    └── routes/api.php
```

---

## Database Schema

### Core
```sql
users: id, name, email, password, role, phone, avatar, email_verified_at, timestamps
agencies: id, owner_id(FK→users), name, slug, address, city, state, zip, phone, email, website, logo, license_number, license_state, e_and_o_carrier, e_and_o_expiration, description, is_verified, timestamps
agency_members: id, agency_id, user_id, role, is_active, timestamps
```

### Agents & Carriers
```sql
agent_profiles: id, user_id, agency_id(nullable), first_name, last_name, license_number, license_state, license_type(life_health/property_casualty/both), license_expiration, npn_number, photo, bio, specialties(json), carriers_appointed(json), years_experience, languages(json), service_areas(json), response_time_hours, rating, review_count, total_policies_bound, is_verified, is_active, timestamps
carriers: id, name, slug, logo, type(auto/home/life/health/commercial/specialty), am_best_rating, description, website, is_active, timestamps
carrier_products: id, carrier_id, name, type(auto/home/renters/life_term/life_whole/health_individual/health_group/commercial_gl/commercial_property/umbrella/other), description, min_premium, max_premium, states_available(json), features(json), is_active, timestamps
agent_carrier_appointments: id, agent_profile_id, carrier_id, appointed_date, status(active/pending/terminated), timestamps
```

### Quotes
```sql
quote_requests: id, consumer_id(FK→users, nullable), session_id(varchar), insurance_type(auto/home/renters/life/health/commercial/bundle), status(calculating/quoted/agent_matched/applied/expired), zip_code, state, timestamps
quote_request_details: id, quote_request_id, data(json), timestamps
-- auto: drivers(json), vehicles(json), current_carrier, years_insured
-- home: address, year_built, sq_ft, roof_type, coverage_amount, deductible
-- life: age, gender, health_class, coverage_amount, term_years
-- health: age, household_size, income, current_coverage
quotes: id, quote_request_id, carrier_product_id, carrier_id, monthly_premium, annual_premium, coverage_details(json), deductible, coverage_limits(json), discounts_applied(json), is_recommended, sort_order, expires_at, timestamps
quote_comparisons: id, consumer_id, quote_ids(json), created_at, timestamps
```

### Applications & Pipeline
```sql
applications: id, quote_id, consumer_id, agent_id(nullable), carrier_id, carrier_product_id, application_number, status(draft/submitted/underwriting/approved/declined/bound/withdrawn), personal_info(json), coverage_details(json), submitted_at, decision_at, decision_notes, bound_at, effective_date, timestamps
application_documents: id, application_id, type(id/proof_of_residence/driving_record/medical_exam/inspection/other), name, file_path, uploaded_by, timestamps
application_notes: id, application_id, user_id, note, is_internal, timestamps
```

### Policies
```sql
policies: id, application_id, consumer_id, agent_id, carrier_id, carrier_product_id, policy_number, type, status(active/cancelled/expired/lapsed/pending_renewal), effective_date, expiration_date, premium_monthly, premium_annual, coverage_summary(json), auto_renew, timestamps
policy_documents: id, policy_id, type(declaration/id_card/endorsement/certificate), name, file_path, timestamps
claims: id, policy_id, consumer_id, claim_number, type, description, date_of_loss, status(submitted/under_review/approved/denied/settled), amount_claimed, amount_settled, adjuster_notes, timestamps
```

### Leads & CRM
```sql
leads: id, agency_id(nullable), agent_id(nullable), quote_request_id(nullable), consumer_id(nullable), source(marketplace/calculator/referral/website/manual), name, email, phone, insurance_type, status(new/contacted/qualified/quoted/applied/won/lost), lost_reason, follow_up_date, assigned_at, timestamps
lead_activities: id, lead_id, user_id, type(call/email/sms/note/quote_sent/application_submitted), description, timestamps
```

### Reviews & Commissions
```sql
agent_reviews: id, agent_profile_id, consumer_id, policy_id(nullable), rating, title, comment, response, response_at, is_verified, timestamps
commissions: id, agent_id, agency_id(nullable), policy_id, carrier_id, type(new_business/renewal), premium_amount, commission_rate, commission_amount, status(pending/earned/paid), earned_at, paid_at, timestamps
```

---

## API Endpoints

### Auth
```
POST   /api/auth/register, login, logout
GET    /api/auth/me
```

### Quote Calculator (Public — Core Feature)
```
POST   /api/quotes/calculate                   — Get instant quotes (no auth required)
GET    /api/quotes/{requestId}/results         — View quote results
POST   /api/quotes/{requestId}/compare         — Save comparison
POST   /api/quotes/{quoteId}/select            — Select quote → start application
```

### Agent Marketplace (Public)
```
GET    /api/marketplace/agents                 — Search agents (location, specialty, carrier)
GET    /api/marketplace/agents/{id}            — Agent profile
GET    /api/marketplace/carriers               — Carrier directory
POST   /api/marketplace/match                  — Smart agent matching
```

### Applications (Pipeline)
```
POST   /api/applications                       — Create from quote
GET    /api/applications                       — List (consumer or agent view)
GET    /api/applications/{id}                  — Detail
PUT    /api/applications/{id}                  — Update info
POST   /api/applications/{id}/submit           — Submit to carrier
PUT    /api/applications/{id}/status           — Update status (agent/carrier)
POST   /api/applications/{id}/documents        — Upload document
POST   /api/applications/{id}/notes            — Add note
```

### Policies
```
GET    /api/policies                           — My policies (consumer) or book (agent)
GET    /api/policies/{id}                      — Policy detail
GET    /api/policies/expiring                  — Expiring soon
POST   /api/policies/{id}/renew               — Initiate renewal
```

### Claims
```
POST   /api/claims                             — File claim
GET    /api/claims                             — My claims
GET    /api/claims/{id}                        — Claim detail
PUT    /api/claims/{id}/status                 — Update status
```

### Agent Dashboard & CRM
```
GET    /api/agent/dashboard                    — Agent stats
GET    /api/agent/leads                        — Lead pipeline
PUT    /api/agent/leads/{id}                   — Update lead
POST   /api/agent/leads/{id}/activity          — Log activity
GET    /api/agent/commissions                  — Commission tracking
GET    /api/agent/reviews                      — My reviews
POST   /api/agent/reviews/{id}/respond         — Respond to review
```

### Agency Management
```
GET/PUT  /api/agency                           — Agency settings
POST   /api/agency/invite                      — Invite agent
GET    /api/agency/members                     — Team list
GET    /api/agency/production                  — Agency production report
GET    /api/agency/commissions                 — Agency commission summary
```

### Carrier Portal
```
GET/PUT  /api/carrier/profile                  — Carrier settings
GET/POST /api/carrier/products                 — Product management
PUT    /api/carrier/products/{id}              — Update product/rates
GET    /api/carrier/applications               — Incoming applications
GET    /api/carrier/production                 — Production by agent/agency
```

### Consumer Portal
```
GET    /api/portal/dashboard                   — My insurance overview
GET    /api/portal/quotes                      — My saved quotes
GET    /api/portal/applications                — My applications
GET    /api/portal/policies                    — My active policies
GET    /api/portal/claims                      — My claims
POST   /api/portal/claims                      — File new claim
```

### Admin + Stats
```
GET    /api/admin/users, agencies, carriers, analytics
GET    /api/stats/agent, agency_owner, carrier
-- Standard subscription plan CRUD --
```

---

## Quote Engine Architecture (Core Value Prop — Like Solarera's Calculator)

**Quote Flow:**
```
Consumer enters info (zip, coverage type, basic details)
  ↓ POST /api/quotes/calculate
Rating Engine runs against available carrier products
  ↓ Filters by state availability
  ↓ Calculates premium for each eligible product
  ↓ Applies available discounts
  ↓ Sorts by price/value/recommended
Quote results displayed (side-by-side comparison cards)
  ↓ Consumer selects quote
Application pre-filled from quote data
  ↓ Consumer completes application
  ↓ Agent matched (or consumer chose agent)
Application submitted → Underwriting → Decision
  ↓ Approved → Policy bound
  ↓ Consumer and agent notified
```

**Comparison UI:**
```
┌──────────────┬──────────────┬──────────────┐
│  🏢 Allstate  │  🏢 State Farm │  🏢 Geico     │
│  Auto Premium │  Auto Premium │  Auto Premium │
│  $142/mo     │  $128/mo  ★  │  $155/mo     │
├──────────────┼──────────────┼──────────────┤
│ Liability     │ Liability     │ Liability     │
│ 100/300/100  │ 100/300/100  │ 100/300/100  │
│ Collision    │ Collision    │ Collision    │
│ $500 deduct  │ $500 deduct  │ $500 deduct  │
│ Comprehensive│ Comprehensive│ Comprehensive│
│ $250 deduct  │ $250 deduct  │ $250 deduct  │
├──────────────┼──────────────┼──────────────┤
│ Roadside ✅  │ Roadside ✅  │ Roadside ❌  │
│ Rental ✅    │ Rental ✅    │ Rental ✅    │
│ Glass ❌     │ Glass ✅     │ Glass ❌     │
├──────────────┼──────────────┼──────────────┤
│ [Select]     │ [Select] ⭐  │ [Select]     │
└──────────────┴──────────────┴──────────────┘
 ⭐ = Best Value recommendation
```

**Smart Agent Matching:**
```php
// Match consumer to best agent based on:
// 1. Insurance type specialty
// 2. Carrier appointments (can sell the carriers the consumer is interested in)
// 3. Location (same state, licensed)
// 4. Response time (faster = higher rank)
// 5. Rating and review score
// 6. Current lead load (distribute evenly)
$agents = AgentProfile::where('license_state', $state)
    ->where('is_active', true)
    ->whereJsonContains('specialties', $insuranceType)
    ->orderByDesc('rating')
    ->orderBy('response_time_hours')
    ->limit(3)
    ->get();
```

---

## Seeders
1. **SubscriptionPlanSeeder** — Agent Free (10 leads/mo), Agent Pro ($49/mo), Agency ($149/mo, team), Carrier (custom)
2. **CarrierSeeder** — 20 major carriers (Allstate, State Farm, Geico, Progressive, Liberty Mutual, etc.) with products and sample rates
3. **InsuranceTypeSeeder** — Auto, Home, Renters, Life (Term/Whole), Health (Individual/Group/Medicare), Commercial (GL/Property/WC), Umbrella, Specialty
4. **DemoDataSeeder** — "Shield Insurance Group" agency, 3 agents, 5 carriers with products, 100 quote requests, 50 leads, 30 applications, 20 bound policies, reviews, commissions ($85K premium volume)

---

## Phase 1 Implementation Order
1. Scaffold frontend + backend
2. Build UI component library
3. Auth + agency/agent profile setup
4. DashboardLayout with role-based sidebar
5. **Quote calculator (public, instant multi-carrier quotes) — CORE FEATURE**
6. Quote results with side-by-side comparison
7. Agent marketplace (search, profiles, ratings)
8. Smart agent matching
9. Application pipeline (quote → apply → underwriting → bound)
10. Agent CRM (leads, activities, follow-ups)
11. Consumer portal (quotes, applications, policies)
12. Agent + agency owner dashboards
13. Commission tracking
14. Admin panel
15. Subscription plans
16. Demo data seeders
17. Deploy

---

## Quick Start
> Read this PROMPT.md. The instant quote calculator is the centerpiece — like Solarera's solar calculator, it's the entry point that drives everything. Make it work beautifully and fast. Follow the tech stack and patterns exactly. Start with Phase 1 Step 1. Commit after each step.
