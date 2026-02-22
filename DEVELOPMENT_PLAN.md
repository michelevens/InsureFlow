# Insurons — Development Plan & Architecture

## Vision
The modern insurance marketplace and enterprise platform — instant quotes, smart agent matching, AI-powered pipeline, white-label infrastructure, and ecosystem network effects. Built to scale from MVP to $100M ARR.

**Current state (2026-02-23):** All 6 expansion phases COMPLETE. 59 pages, 79 models, 45 controllers, 60 migrations. Custom branding and optimized dashboard layout.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                    Frontend (React 18 + TypeScript)              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  59 Lazy-Loaded Pages | 39 API Service Modules           │  │
│  │  AuthContext | React Query | React Router v7              │  │
│  │  Tailwind CSS | Lucide Icons | Sonner Toasts             │  │
│  │  PWA (VitePWA + Workbox) | AI Chat Widget                │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬─────────────────────────────────┘
                               │ Fetch + Sanctum Token
┌──────────────────────────────▼─────────────────────────────────┐
│                   Backend (Laravel 12 + PHP 8.4)                │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐    │
│  │ Sanctum Auth │  │ Agency Scope │  │ Rate Limiting     │    │
│  │ + SAML SSO   │  │ Middleware   │  │ Middleware        │    │
│  └──────────────┘  └──────────────┘  └───────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  45 Controllers | 79 Eloquent Models | 60 Migrations     │  │
│  │  Rating Engine | AI Service | Stripe Connect              │  │
│  │  Webhook Dispatch | Document Generation (DomPDF)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    PostgreSQL        │
                    │    (Railway)         │
                    └─────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite 7 + Tailwind CSS |
| Backend | Laravel 12 + PHP 8.4 |
| Database | PostgreSQL (Railway) |
| Auth | Sanctum SPA + SAML 2.0 SSO |
| Payments | Stripe (subscriptions + Connect Express payouts) |
| AI | Claude API (Anthropic SDK) |
| Email | Resend |
| PDFs | DomPDF with Blade templates |
| PWA | VitePWA + Workbox |
| Hosting | GitHub Pages (frontend) + Railway (backend + DB) |
| API Domain | api.insurons.com |

---

## User Roles

| Role | Access |
|------|--------|
| Consumer | Quotes, applications, policies, claims, marketplace, messaging |
| Agent | CRM leads, applications, commissions, calendar, compliance, training |
| Agency Owner | All agent features + team management, analytics, white-label, recruitment |
| Carrier | Products, production reports, API config, carrier API marketplace |
| Admin | Platform management, audit logs, user management, SSO config |
| Superadmin | Full access including subscription plan management |

---

## Phase Summary (All Complete)

### Foundation — MVP
Auth, quote engine, agent marketplace, CRM leads, application pipeline, policy management, Stripe subscriptions, referral system, UIP, tenant isolation, routing engine, invite system.

### Phase 1 — Revenue Engine & Communication (Months 1-3)
Real-time messaging, notification system, document management with e-signatures, Stripe Connect payouts, immutable audit logging.

### Phase 2 — AI Intelligence & Advanced Pipeline (Months 4-6)
AI insurance assistant (Claude), predictive lead scoring, claims filing & tracking, renewal management, advanced analytics dashboard.

### Phase 3 — Enterprise Auth & Carrier Integration (Months 7-9)
SAML SSO, carrier rating API marketplace, hierarchical organizations (MGA → Agency → Agent), webhook system, calendar & scheduling, normalized lead scenarios.

### Phase 4 — White-Label & Embedded Insurance (Months 10-12)
White-label agency platform, embedded insurance widgets (JS), PDF document generation, compliance tracking (licenses, CE, E&O), PWA with offline capability.

### Phase 5 — Premium Data Products & Growth (Months 13-15)
Market intelligence dashboard, API key management, agent recruitment & job board, training catalog with progress tracking, help center & knowledge base.

### Phase 6 — Ecosystem & Network Effects (Months 16-18)
Community forum with voting & solutions, event/webinar management, partnership marketplace with referrals, email marketing campaigns with analytics, advanced reporting & BI export.

---

## Revenue Model to $100M ARR

| Revenue Stream | Annual |
|---------------|--------|
| 5,000 agencies x $500/mo avg | $30M |
| 25,000 agents x $60/mo avg | $18M |
| 100 carriers x $3K/mo avg | $3.6M |
| Commission revenue share (5% of $500M GWP) | $25M |
| Embedded insurance API fees | $10M |
| Data/analytics products | $8M |
| White-label licensing (50 MGAs x $10K/mo) | $6M |
| **Total** | **$100.6M** |

### Subscription Tiers

| Tier | Price | Key Features |
|------|-------|-------------|
| Consumer Free | $0 | Quotes, marketplace, basic claims |
| Consumer Plus | $9.99/mo | Unlimited AI, renewal alerts, document vault |
| Agent Basic | $49/mo | Messaging, calendar, 100 AI msgs/day |
| Agent Pro | $149/mo | Unlimited AI, lead scoring, compliance |
| Agency Standard | $349/mo | 25 agents, SSO, analytics, recruitment |
| Agency Enterprise | $999/mo | Unlimited agents, white-label, API, BI |
| MGA Platform | $4,999/mo | Hierarchical orgs, bulk API, data products |
| Carrier Partner | $999/mo | Rating API, production analytics |
| Carrier Enterprise | $4,999/mo | Full API, webhooks, embedded widget |

---

## Database Schema (79 Models)

### Core
User, Agency, AgentProfile, Carrier, CarrierProduct

### Quote & Pipeline
QuoteRequest, Quote, Application, Policy, InsuranceProfile, Lead, LeadActivity, LeadScenario, InsuredObject, Coverage

### Financial
Commission, CommissionPayout, Subscription, SubscriptionPlan, Referral, ReferralCode, ReferralCredit

### Communication
Conversation, Message, Notification, Invite

### Documents
Document, Signature, GeneratedDocument

### AI & Intelligence
AiChatConversation, AiChatMessage, LeadScore, LeadEngagementEvent

### Claims & Renewals
Claim, ClaimActivity, ClaimDocument, RenewalOpportunity

### Enterprise
Organization, OrganizationMember, CarrierApiConfig, CarrierApiLog, RoutingRule

### Auth & Security
AuditLog, Webhook, WebhookDelivery, ApiKey, ApiUsageLog

### Calendar
Appointment, AgentAvailability, AgentBlockedDate

### White-Label & Embed
WhiteLabelConfig, WhiteLabelDomain, EmbedPartner, EmbedSession

### Compliance
AgentLicense, CeCredit, EoPolicy

### Data Products
DataSubscription, DataReport

### Recruitment & Training
JobPosting, JobApplication, TrainingModule, TrainingCompletion

### Help Center
HelpCategory, HelpArticle

### Forum & Community
ForumCategory, ForumTopic, ForumPost, ForumVote

### Events
Event, EventRegistration

### Partners
PartnerListing, PartnerReferral

### Email Campaigns
EmailTemplate, EmailCampaign, EmailSend

### Reporting
ReportDefinition, ReportRun

---

## UI/UX Architecture

### Branding
Custom Insurons logo (shield with connected nodes, green/blue gradient + navy text) replaces placeholder Shield icons across all 12+ pages: auth flows, public navbars, sidebar, mobile header, and footer.

### Dashboard Layout Pattern
```
┌──────────────────────────────────────────────────────────┐
│  [☰]        [Logo]        [💬] [🔔]  (mobile header)    │
├────────┬─────────────────────────────────────────────────┤
│ Logo   │              [💬] [🔔] [?] [⚙] | [Avatar ▾]   │
│────────│  ← Desktop top bar (Messages, Notifications,    │
│ Dashboard │   Help, Settings, User profile dropdown)     │
│ Leads    │─────────────────────────────────────────────  │
│ Apps     │                                               │
│ Policies │         Main Content (<Outlet />)             │
│ Claims   │                                               │
│ ...      │                                               │
│ (role-   │                                               │
│ filtered)│                                               │
│          │                                        [AI 💬]│
├──────────┤                                               │
│ Settings │ ← mobile only                                 │
│ Help     │                                               │
│ Sign Out │                                               │
└──────────┴───────────────────────────────────────────────┘
```

- **Sidebar:** Role-filtered navigation (consumer, agent, agency_owner, carrier, admin, superadmin)
- **Top bar (desktop):** Messages, Notifications, Help Center, Settings icons + user avatar dropdown
- **Mobile header:** Hamburger menu, centered logo, Messages + Notifications icons
- **Mobile sidebar footer:** Settings, Help, Sign Out links

---

## Frontend Pages (59)

### Auth (6)
Login, Register, VerifyEmail, AcceptInvite, SsoLogin, SsoCallback

### Public (5)
Landing, Pricing, Calculator, QuoteResults, Settings

### Marketplace (2)
Marketplace, AgentProfile

### Dashboards (6)
Dashboard + 5 role-specific variants

### Consumer Portal (3)
MyQuotes, MyApplications, MyPolicies

### Agent/Agency (8)
Leads, Applications, Policies, Commissions, Reviews, AgencyTeam, Claims, Renewals

### Carrier (3)
Products, Production, CarrierApiConfig

### Admin (6)
AdminUsers, AdminAgencies, AdminAnalytics, AdminPlans, AdminAuditLog, SsoConfig

### Communication (3)
Messages, Notifications, Documents

### Enterprise (3)
OrganizationTree, WebhookSettings, Calendar

### Phase 4 (4)
WhiteLabelConfig, EmbedPartnerDashboard, ComplianceDashboard, AdvancedAnalytics

### Phase 5 (5)
MarketIntelDashboard, ApiKeyManagement, RecruitmentDashboard, TrainingCatalog, HelpCenter

### Phase 6 (5)
ForumHome, EventCalendar, PartnerDirectory, CampaignBuilder, ReportBuilder

---

## API Routes (~300+)

All routes in `laravel-backend/routes/api.php`:
- **Public:** Auth, calculator, marketplace, carriers, referrals, subscription plans, SAML SSO
- **Protected (auth:sanctum + agency.scope):** All feature routes grouped by domain
- **Admin prefix:** User management, agencies, plans, audit logs, help center admin

---

## Deployment

### Frontend
- **Build:** `npm run build` (Vite)
- **Deploy:** GitHub Pages
- **CI:** TypeScript check (`npx tsc -b --noEmit`) before every commit

### Backend
- **Platform:** Railway (PostgreSQL included)
- **Service:** `insurons-api`
- **Custom domain:** api.insurons.com
- **Migrations:** `php artisan migrate`
- **Seeders:** 5 seeders (plans, specialties, manufacturers, providers, demo data)

---

## Competitive Landscape

| Competitor | Model | Our Advantage |
|-----------|-------|---------------|
| Policygenius | Consumer comparison | No agent tools — we have full CRM + marketplace |
| QuoteWizard | Lead gen → sell leads | Expensive ($15-50/lead) — we own both sides |
| EverQuote | Lead gen → sell leads | Cold leads, no loyalty — our agents build relationships |
| The Zebra | Consumer comparison | Auto only — we cover all insurance lines |
| Bolt (Insurance) | Agent quoting tool | Agent-only — we have consumer + agent + carrier ecosystem |
| AgencyZoom | Agent CRM | CRM only — we add marketplace + carrier integration |
| Applied Epic | Agency management | Legacy, expensive — we're modern, affordable, with marketplace |

**Our edge:** Full ecosystem (consumer quotes + agent CRM + carrier integration + white-label + embedded + data products), affordable pricing, modern UX, AI-powered intelligence, network effects through forum/events/partnerships.
