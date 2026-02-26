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
- **Frontend:** insurons.com
- **Backend:** Railway (PostgreSQL included)
- **Railway Project:** ample-empathy / insurons-api
- **API Domain:** api.insurons.com
- **Deploy backend:** `cd laravel-backend && railway deployment up`
- **Run migrations:** `railway ssh php artisan migrate --force`
- **Run seeder:** `railway ssh "php artisan db:seed --class=SomeSeeder --force"`
- **Clear caches:** `railway ssh "php artisan config:clear && php artisan route:clear && php artisan view:clear"`

## Demo Accounts (all password: 'password')
- consumer@insurons.com (Consumer)
- agent@insurons.com (Agent)
- agency@insurons.com (Agency Owner)
- carrier@insurons.com (Carrier)
- admin@insurons.com (Admin)
- superadmin@insurons.com (Superadmin)

## Current Status (as of 2026-02-26)
- **Frontend:** 65+ pages built, TypeScript passes, Vite build succeeds, deployed to **insurons.com**
- **Backend:** Laravel 12 on Railway — **All 14 phases deployed**, all endpoints live
- **API Domain:** api.insurons.com — WORKING, CORS configured for insurons.com
- **Database:** All migrations run (100+ total including Phase 10-14), 39 compliance requirements seeded, 160+ ZIP codes seeded
- **Seed Data:** 7 subscription plans (competitive tiers), 10 carriers with products, 6 demo users, 35+ platform products, 10 agencies (50 agents), 70 leads, 3 rate tables (DI LTD, Term Life, LTC) — 180 rate entries + PipelineSeeder (25 applications, 15 policies, 15 commissions, 6 claims, 12 appointments, 20 routing rules) + 39 compliance requirements
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
- **Testing:** Frontend — Vitest + testing-library (15 tests passing), Backend — PHPUnit with SQLite :memory: (10 tests)
- **Embed Webhooks:** Partner webhook notifications with HMAC-SHA256 signing on conversion + test ping endpoint
- **Compliance Alert Banner:** Real-time overdue/expiring alerts on agent dashboard, dismissible per session
- **Chunk Error Recovery:** ChunkErrorBoundary + lazyRetry prevent blank pages after deploys
- **Agency Team Page:** Wired to real API — invite agents, toggle active status, cancel invites
- **CRM Carrier Quotes:** Full comparison table in scenario detail with recommend/select/delete actions
- **Embeddable Quote Widget:** Iframe + vanilla JS embed script for agencies to put on their websites
- **Carrier API Integration Layer:** Adapter pattern with GenericRest, Progressive, Travelers adapters
- **Consumer Multi-Quote Comparison:** ScenarioPublicView shows all carrier quotes in comparison table
- **Server-Side Quote Drafts:** Authenticated users can save/resume calculator progress server-side
- **Compliance Overdue Notifications:** Daily check command with email + in-app notifications
- **Push Notifications LIVE:** VAPID keys generated and set on Railway, `/push/vapid-key` returns public key, subscribe/unsubscribe tested
- **Stripe Integration:** stripe:sync-plans command, customer portal, API-driven Pricing page
- **Competitive Pricing:** 7-tier structure ($0-$499), marketplace credit system, billing management page, admin marketplace fields
- **Railway Scheduler:** Procfile updated with scheduler process for cron commands
- **Workflow Automation:** Tested end-to-end — rule creation, condition matching, notification sending, execution audit log
- **Task Management:** CRUD, complete/reopen, priority filters — all tested on production
- **E-Signature:** Full flow tested — agent creates from scenario → public view → public sign → status updated to submitted
- **ZIP Code Autocomplete:** 160+ ZIP codes seeded and lookup working on production

## Recent Work

### Pricing Deployment + Production Verification (2026-02-26)
- **Deployed to Railway:** All 3 commits (backend pricing, frontend pricing+billing+gate, CLAUDE.md) pushed and deployed
- **Seeder run on production:** `php artisan db:seed --class=SubscriptionPlanSeeder` — all 7 plans live with correct pricing, credits, and marketplace flags
- **Production verification (all passing):**
  - `GET /billing/overview` → returns null subscription/plan/credits for free users (correct behavior)
  - `GET /lead-marketplace/browse` → 403 with `requires_upgrade: true` for users without marketplace access
  - Push notifications: vapid-key, subscribe, unsubscribe — all 3 endpoints verified
  - CRM Kanban: 12 leads loaded, status update working
  - Embed widget: 4 partners active, webhook ping functional
- **Competitive pricing strategy delivered:** Razor-and-blades model (subscriptions = razors, credits = blades), credit top-up packs proposed (10/$29, 25/$59, 100/$179), CAC math validated (Agent Pro 2.9x, Agency 4.4x)

### Competitive Pricing + Billing + Marketplace Gate (2026-02-26)
- **Pricing Strategy:** Researched 11 competitors (HawkSoft, AgencyZoom, EZLynx, Applied Epic, etc.), restructured from 5 → 7 tiers:
  - Consumer Free ($0), Agent Starter ($29), Agent Pro ($79), Agent Pro Plus ($129), Agency Standard ($149), Agency Enterprise ($299), Carrier Partner ($499)
  - Annual pricing: true 20% discount (Monthly × 12 × 0.80)
  - Marketplace credits per tier: 0/0/10/25/50/200/unlimited
- **Backend:**
  - SubscriptionPlan model: added `lead_credits_per_month`, `can_access_marketplace` to fillable + casts
  - SubscriptionPlanSeeder: full rewrite with 7 competitive tiers (uses `updateOrCreate` on slug)
  - AdminController: added validation for marketplace fields in storePlan/updatePlan
  - SubscriptionController: new `billingOverview()` endpoint (plan + subscription + credit balance)
  - LeadMarketplaceController: 403 access gate in browse(), 402 credit check in purchase(), credit deduction in completePurchase()
  - New route: `GET /billing/overview`
- **Frontend:**
  - Pricing.tsx: full rewrite — 7 tiers, role filter tabs (All/Agents/Agencies/Carriers), feature comparison table, add-ons section, 6-item FAQ
  - Billing.tsx (NEW): current plan card, marketplace credit meter with progress bar, Stripe portal links, success/past-due banners
  - LeadMarketplace.tsx: upgrade gate UI (catches 403), credit balance card in stats, blocks purchase when credits depleted
  - AdminPlans.tsx: credits/month input + marketplace access checkbox in plan modal, marketplace badge on cards
  - DashboardLayout: Billing nav item for agent/agency_owner/carrier roles
  - App.tsx: added `/billing` route
  - Types + subscription service updated with marketplace fields and `billingOverview()` method

### PWA + Embed + Carrier Session (2026-02-26) — Push Notifications, Widget Branding, Offline Caching
- **Push Notifications (Web Push API):** Full stack — `push_subscriptions` table + PushSubscriptionController (subscribe/unsubscribe/vapid-key) + `minishlink/web-push` package. NotificationService auto-sends push with every in-app notification. Frontend: `usePushNotifications` hook, `sw-push.js` service worker, "Enable push notifications" prompt in NotificationBell dropdown. **VAPID keys generated and configured on Railway — all 3 endpoints verified working in production.**
- **Embed Widget Branding:** Button gradient updated from blue to navy+gold (#102a43/#011434). Shield icon stroke: gold (#BC9C22). Modal header: navy text on light background.
- **Offline Quote Caching:** Added StaleWhileRevalidate caching for quote drafts (7 days) and platform products (1 day) in Workbox config. Enables offline quote form resume.
- **Carrier API Integration Guide:** Created `CARRIER_API_GUIDE.md` with instructions for adding carrier APIs, cost breakdown, custom adapter pattern, VAPID key generation.
- **Deployed + verified:** push_subscriptions table exists, vapid-key/subscribe/unsubscribe endpoints tested, embed widget serving with navy gradient.

### Branding + Cleanup Session (2026-02-26) — New Logo, Favicon, PWA Icons
- **New SVG logo:** Replaced old 2MB `logo.png` (green/blue gradient) with `logo.svg` (9KB, navy shield + gold molecular nodes + "Insurons" wordmark)
- **Shield icon:** Created `shield.svg` (icon-only) for favicon and PWA use
- **Generated PWA icons:** `shield-192.png`, `shield-512.png`, `apple-touch-icon.png` (180x180), `favicon-32.png` — using sharp from source SVG
- **Updated 17 components:** All `src="/logo.png"` → `src="/logo.svg"` across sidebar, login, register, landing, calculator, quote results, onboarding, SSO, password reset, terms, privacy, pricing, agent profile
- **Updated index.html:** Favicon from `vite.svg` → `shield.svg` + PNG fallback
- **Removed old assets:** Deleted `logo.png` (2MB) and `vite.svg` from public/
- **Fixed demo account emails in CLAUDE.md:** Were showing `@insureflow.com`, corrected to `@insurons.com`
- **Verified marketplace routes:** `suggest-price` 405 was token expiration during smoke test (route is correctly defined as GET inside auth group). Stats field names are aligned between backend and frontend.

### Testing + Features Session (2026-02-25) — Test Infrastructure + Webhooks + Compliance Alerts
- **Frontend test infrastructure:** Installed vitest + @testing-library/react + jest-dom + user-event + jsdom. Created vitest.config.ts, setup.ts (ResizeObserver/matchMedia mocks), test-utils.tsx (MemoryRouter render, makeQuote factory). 15 tests passing.
- **QuoteComparisonMatrix tests (7):** Empty renders null, sorting (recommended first), savings callout, onSelect callback, lowest label, recommended badge
- **PremiumBreakdownChart tests (8):** Empty/zero renders null, chart container, agent recommended legend, calculator total, discount label
- **Backend test infrastructure:** PHPUnit with SQLite :memory:, TestCase base class (LazilyRefreshDatabase, createUser/Agent/Admin helpers), UserFactory + EmbedPartnerFactory
- **EmbedControllerTest (6):** Config valid/invalid/inactive key, quote creates session, markConverted, domain rejection
- **ConsumerMarketplaceTest (4):** Submit creates quote_request, matches agencies by state, view scenario by token, respond accept
- **Feature A — Embed Webhooks:** Migration adds webhook_url + webhook_secret to embed_partners. HMAC-SHA256 signed POST on conversion. Test webhook ping endpoint. Frontend: webhook URL field + test button in partner dashboard.
- **Feature B — Compliance Alert Banner:** Backend GET /compliance/alerts (overdue pack items + expiring licenses/E&O within 14 days). ComplianceAlertBanner component shows red (overdue) or amber (expiring) dismissible banner above dashboard content. SessionStorage dismissal.
- **Files:** 20+ new/modified across frontend + backend

### Deploy + Test Session (2026-02-25) — Production Deployment & Bug Fixes
- **Deployed Phase 10-14 to Railway:** 9 pending migrations ran successfully (carrier API adapters, quote drafts, marketplace auction, ZIP codes, Stripe payment columns, workflow rules, task support)
- **ZipCodeSeeder:** Ran on Railway — 160+ US ZIP codes now available for auto-complete
- **Fixed stale route cache:** Removed `route:cache` from nixpacks.toml start command — was causing new routes (workflows, tasks) to not appear on Railway
- **Fixed WorkflowEngine notification bug:** Was using `message` column instead of `body` on notifications table — caused NOT NULL violation
- **Fixed Application model/controller column mismatches:** `monthly_premium` → `premium`, `applicant_data` → `coverage_details`, removed `agency_id` direct column (scope via agent relationship instead)
- **Fixed PublicSigningController:** Same column mismatches + removed unused `$agencyId` variable and `DB` import
- **E2E tested on production:** Workflow automation (rule create → trigger → execution log), Task management (CRUD + complete/reopen), E-signature (create-from-scenario → public view → public sign)
- **FEATURES.md:** Updated with complete Phase 7-14 documentation

### Phase 14 (2026-02-25) — Task Management, Kanban Board, Dashboard Enrichment, Password UX
- **Task Management System:** Migration adds `priority`, `completed_at`, `assigned_by` columns + `task` type to appointments enum. `TaskController` with CRUD, complete/reopen, priority/overdue/today filters. Tasks page with stats cards, priority badges, completion toggle, search/filter, create modal. Route at `/tasks`, nav item in Pipeline section.
- **Kanban Pipeline Board:** Drag-and-drop board view for CRM leads with 6 status columns (New→Contacted→Quoted→Applied→Won→Lost). View toggle (list/board) in Leads header. Dragging a lead between columns updates its status via API.
- **Enriched Agent Dashboard:** Added "Tasks Due Today" widget, "Recent Leads" widget with status badges + phone/email actions, action items now link to relevant pages, quick links row (Commissions, Reviews, Calendar, Tasks). 10s timeout safety valve prevents infinite spinner.
- **Password Strength on AcceptInvite:** Password strength meter (5-segment bar) with real-time scoring (8+ chars, uppercase, lowercase, number, special char). "Generate Strong Password" button creates 16-char password, auto-copies to clipboard. Show/hide toggle, copy button. Confirm password also respects visibility toggle.
- **Files changed:** 15+ files (5 new, 10+ modified) across frontend + backend

### Phase 13 (2026-02-25) — Workflow Automation, Commission Splits, Bulk CRM, UX Polish
- **Styled ConfirmDialog component:** Replaced all 13 native `confirm()` dialogs across 8 pages with a React Context-based ConfirmDialog. Supports danger/warning/info variants with matching icons (Trash2/AlertTriangle/HelpCircle). Promise-based `useConfirm()` hook. Files: `ConfirmDialog.tsx` (new), `App.tsx`, `LeadMarketplace.tsx`, `AgencySettings.tsx`, `Commissions.tsx`, `SuperAdminSettings.tsx`, `Documents.tsx`, `AdminPlans.tsx`, `AdminRateTables.tsx`, `AdminRateTableDetail.tsx`.
- **Workflow Automation Engine (backend):** Event-driven rule engine with 22 trigger events (lead_created, application_signed, policy_bound, etc.), JSON conditions with operators (equals, contains, greater_than, etc.), 8 action types (send_notification, update_status, assign_agent, create_task, add_tag, fire_webhook, send_email). `WorkflowRule` model with `conditionsMatch()`, `WorkflowExecution` audit log, `WorkflowEngine` service with `fire()` method. `WorkflowRuleController` with CRUD, toggle, test, execution history. Integrated into `LeadIntakeController` and `PublicSigningController`.
- **Commission Splits:** `CommissionSplit` model for multi-agent commission sharing with percentage validation (<=100%). CRUD endpoints on `CommissionController`. Migration adds `commission_splits` table + `agency_id` on `commissions`.
- **WorkflowBuilder frontend page:** Full page with rules tab and executions tab. Stats cards, rule cards with toggle/expand/test/delete, condition/action builder in create modal. New `workflows.ts` API service. Route at `/workflows`, nav item in Integration section.
- **Bulk CRM Operations:** Checkbox selection in lead table with select-all, bulk action bar with status change dropdown and CSV export. Backend `bulkUpdateStatus` endpoint with agency scoping. Frontend exports selected or all leads as CSV.
- **Files changed:** 15+ files (8 new, 10+ modified) across frontend + backend

### Phase 12 (2026-02-25) — Payments, Emails, E-Signature (complete)
- **Stripe marketplace payments:** Full Stripe Checkout + PaymentIntent flow for lead purchases. `createCheckoutForLead()` creates Stripe Checkout in payment mode, `createPaymentIntent()` for in-app payment. Pending transaction records with `stripe_payment_intent_id`, `stripe_checkout_session_id`, `payment_status`. Webhook handlers in SubscriptionController route marketplace events. Falls back to free transfer when Stripe not configured. Frontend: "Buy Now" redirects to Stripe, handles `?purchased=true`/`?canceled=true` return params.
- **Branded email system (complete):** All 20+ email templates refactored to extend master `layout.blade.php` (accent bar, branded header, icon section, content, footer). Reusable partials: `button.blade.php`, `stat-card.blade.php`, `status-badge.blade.php`. Custom accent colors for compliance (red), lead aging (amber/red). Created `MarketplacePurchaseMail` (buyer confirmation with lead details + price) and `MarketplaceSaleMail` (seller notification with earnings breakdown). Both wired into `LeadMarketplaceController::completePurchase()`.
- **E-signature flow (complete):** Full e-sign system already built in prior sessions: `Signature` model (UUID, polymorphic signable, canvas-based), `SignatureController` (request/sign/reject/myPending), `PublicSigningController` (token-based create-from-scenario, public view/sign). Frontend `ApplicationSigningPage` with canvas drawing, full sign/submit flow. Email notifications: `SignatureRequestMail`, `ApplicationReadyToSignMail`, `ApplicationSignedMail`. Migration: `signatures` table + `signing_token`/`signature_data` columns on `applications`.

### Phase 11 (2026-02-25) — Feature Completion + Product Activation Gate
- **Calculator server draft sync:** When logged in, Calculator loads draft from server on mount and debounce-saves (2s) to `GET/PUT /calculator/draft`. Clear and "Get Quotes" also sync to server.
- **Consumer portal action buttons:** MyPolicies now has real "Call Agent" (tel: link with phone), "Download" (print-friendly popup with window.print()), and "File Claim" (navigates to `/claims?policy_id=`). Added `phone` field to `AgentProfile` type.
- **Marketplace auction/bidding:** New `lead_marketplace_bids` table. Listings can be auction-type with `min_bid`, `bid_increment`, `auction_ends_at`. `placeBid()` enforces $0.50 minimum increment in DB transaction. `suggestPrice()` uses historical averages × lead score multiplier (clamped $5-$500). `bulkList()` lists up to 50 leads at once (validates ownership, prevents re-listing marketplace purchases).
- **Real premium breakdown from rate engine:** `QuoteController::estimate()` now returns `breakdown` object per quote (base_rate, coverage_factor, state_factor, policy_fee, discount, discount_label). `QuoteResults.tsx` uses server breakdown with `syntheticBreakdown()` fallback for cached quotes.
- **Embed widget customization:** `EmbedQuoteWidget` supports `widget_config` with `logo_url`, `company_name`, `hide_branding`, `theme` (primary color), `cta_text`. Partner header shows logo/name when configured. Conditional "Powered by Insurons" footer. `EmbedPartnerDashboard` has Widget Customization form section (color picker, logo URL, CTA text, hide branding checkbox).
- **ZIP code address auto-complete:** Backend: `zip_codes` table with 160+ US ZIP codes (all 50 states + DC), `ZipCode` model, `ZipCodeController` (lookup by ZIP, search by city/ZIP prefix). Frontend: `AddressAutocomplete` reusable component (debounced 300ms, keyboard nav, loading spinner, graceful fallback). Wired into Calculator, EmbedQuoteWidget, InsuranceRequestForm, LeadIntake.
- **Product activation gate:** `LeadScenarioController::store()` and `update()` now validate product_type against `PlatformProduct.is_active` (platform level) and `agency_products` (agency level). `productTypes()` endpoint filters to only admin-activated products, with agency-level intersection. Backwards compatible (if no PlatformProducts exist, all types allowed).
- **Files changed:** 20+ files (6 new, 14+ modified) across frontend + backend

### Phase 10 (2026-02-25) — High Impact + Infrastructure + Polish
- **Embeddable Quote Widget:** `EmbedQuoteWidget.tsx` — standalone iframe-friendly calculator page with no nav/sidebar. Validates API key, creates embed session, shows inline quote results + contact capture form. PostMessage communication for iframe resize and conversion events. `insurons-widget.js` — vanilla JS embed script supporting `data-mode="inline"` (embed in page) and `data-mode="button"` (floating CTA pill). Public route at `/embed/quote`. Backend: `markConverted()` endpoint for conversion tracking.
- **Carrier API Integration Layer:** Full adapter pattern architecture. `CarrierApiAdapter` interface, DTOs (CarrierQuoteResponse, CarrierApplicationResponse, CarrierStatusResponse), `GenericRestAdapter` (configurable for any REST API with field mapping, auth types, audit logging), `ProgressiveAdapter` and `TravelersAdapter` (carrier-specific stubs). `CarrierApiService` orchestrator with multi-carrier quote fan-out. Migration adds adapter columns to `carrier_api_configs`. New endpoints: `test-connection`, `available-adapters`, `adapter-quotes`.
- **Consumer Multi-Quote Comparison:** ScenarioPublicView now shows all carrier quotes in a comparison table (carrier, AM Best, monthly/annual premium, recommended badge). Backend loads quotes relationship in `viewScenario()`. Savings callout between cheapest and most expensive.
- **Server-Side Quote Drafts:** `quote_drafts` table (one per user). `QuoteController::saveDraft/getDraft/deleteDraft`. Three new protected routes. Complements existing localStorage drafts for logged-in users.
- **Compliance Overdue Notifications:** `compliance:check-overdue` artisan command runs daily. Finds overdue items, groups by user, sends `ComplianceOverdueMail` + in-app notification. Deduplicates (once per week per user). Registered in scheduler alongside `leads:check-aging`.
- **Stripe Sync Command:** `stripe:sync-plans` creates Stripe products + monthly/annual prices from DB plans, updates `stripe_price_id_monthly/annual` columns. Supports `--force` flag.
- **Stripe Customer Portal:** `SubscriptionController::portal()` creates Stripe Billing Portal session. Route: `POST /subscriptions/portal`.
- **API-Driven Pricing Page:** Rewrote `Pricing.tsx` to fetch plans from API instead of hardcoded data. Monthly/annual toggle, Stripe checkout redirect, "Current Plan" badge, "Manage Billing" portal link. Created `subscriptions.ts` API service.
- **Railway Scheduler:** Procfile updated with `scheduler: php artisan schedule:work` process.
- **Files changed:** 25+ files (11 new, 14+ modified) across frontend + backend

### Phase 9 (2026-02-25) — Stability Fixes + Team Management + CRM Quotes
- **ChunkErrorBoundary + lazyRetry:** Created `ChunkErrorBoundary.tsx` error boundary that catches stale chunk load errors after deploys. Auto-reloads once per path, then shows "Refresh Page" fallback. `lazyRetry()` wrapper retries failed dynamic imports once after 1s. All 65+ `lazy()` calls in `App.tsx` updated to `lazyRetry()`.
- **Agent dashboard flash fix:** Demo agent accounts (`agent@insureflow.com`, `agent2@insureflow.com`, `agency@insureflow.com`) were missing `onboarding_completed = true` in `DemoUserSeeder`, causing `ProtectedRoute` to redirect to `/onboarding` after every login. Fixed seeder + `demoLogin` endpoint now auto-sets `onboarding_completed = true`.
- **AgencyTeam wired to real API:** Rewrote `AgencyTeam.tsx` from mock data to real API calls. Added `GET /agency/settings/team` (agents with stats + invites + summary), `POST /agency/settings/agents/{id}/toggle-status`, `DELETE /agency/settings/invites/{id}`. Frontend shows stats cards, pending invites with cancel, team member cards with toggle active/inactive, invite modal.
- **Carrier quotes comparison table in CRM:** Added full comparison table to `Leads.tsx` scenario detail view showing carrier name, AM Best rating, monthly/annual premiums, status, recommended star, and select/delete actions. Includes savings spread summary (cheapest vs most expensive). Uses existing `scenarioService` methods (`removeQuote`, `selectQuote`).
- **Sticky nav + role-based quick links (from previous sub-session):** Desktop/mobile headers made sticky (`sticky top-0 z-30`). Role-based quick nav links added to top bar (consumer: Dashboard/Quotes/Policies; agent: Dashboard/Leads/Apps/Policies; etc.).
- **Scenario Proposal PDF (from previous sub-session):** `proposal.blade.php` DomPDF template with agency header, Insurons footer, executive summary, coverage tables, carrier comparison. `generateProposal()` endpoint at `POST /crm/leads/{lead}/scenarios/{scenario}/proposal`.
- **Files changed:** `ChunkErrorBoundary.tsx` (new), `App.tsx`, `DemoUserSeeder.php`, `AuthController.php`, `AgencyTeam.tsx`, `AgencySettingController.php`, `routes/api.php`, `Leads.tsx`, `DashboardLayout.tsx`, `proposal.blade.php` (new), `LeadScenarioController.php`, `DocumentGenerationService.php`, `leadScenarios.ts`

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
- **Stripe keys needed:** `stripe:sync-plans` command is ready but requires `STRIPE_SECRET_KEY` env var on Railway. Run command after adding keys to create products/prices.
- **Railway scheduler:** Procfile has `scheduler` process but Railway may need a separate service or cron job configuration. Check if the scheduler process starts after deploy.
- **Route caching disabled:** `route:cache` removed from nixpacks.toml start command because it was causing new routes to not appear. Slightly slower but always current. Can re-enable once deploy pipeline is stable.
- **Application `agency_id` column missing:** The `applications` table has no `agency_id` column. Agency scoping is done via the agent's `agency_id`. The PipelineSeeder may need updating if it sets `agency_id` directly on applications.

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

### Immediate — Monetization P0
- **Add Stripe keys to Railway:** Set `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` env vars — nothing is paid until this is done
- **Run `stripe:sync-plans`:** After Stripe keys are added, create Stripe products/prices for all 7 plans
- **Test Stripe checkout end-to-end:** Subscribe → verify webhook → check subscription status → verify billing page shows plan

### Revenue Features (P1)
- **Credit top-up packs:** Sell additional marketplace credits outside subscription — Starter Pack (10/$29), Pro Pack (25/$59), Bulk Pack (100/$179). Backend: top-up endpoint + Stripe one-time checkout. Frontend: "Buy More Credits" button on billing page + marketplace.
- **Lead seller payouts:** Let agencies withdraw earnings from lead sales — track balance, request payout, admin approval
- **Annual plan discount enforcement:** Stripe billing interval switch (monthly ↔ annual) with prorated credit

### Testing
- **Test push notifications end-to-end:** Log in on insurons.com → enable push in NotificationBell → trigger a notification → verify browser push appears
- **Test Kanban board** drag-and-drop on the live frontend (https://insurons.com)
- **Test embed widget + webhook:** Create partner with webhook URL (use webhook.site) → complete embed flow → verify webhook fires with signed payload
- Test marketplace auction: create auction listing → place bids → verify min increment enforcement
- Test `compliance:check-overdue` with overdue test items
- Test `leads:check-aging` with stale test leads (needs scheduler running)

### Infrastructure & Config
- **Verify Railway scheduler:** Check if the `scheduler` Procfile process starts. If not, create a separate Railway service with start command `php artisan schedule:work`

### New Features
- **Real carrier API credentials:** Add actual Progressive/Travelers API keys to `carrier_api_configs` table when available (see `CARRIER_API_GUIDE.md`)
- **Usage analytics for agents:** "You've closed $X from our leads" dashboard — retention tool that proves ROI
- **Dynamic credit pricing:** Price marketplace credits differently by lead type (auto vs home vs life) based on conversion data
