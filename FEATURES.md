# Insurons — Complete Feature Tracker

## Platform Summary (as of 2026-02-25)

**65+ frontend pages | 82+ models | 65+ controllers | 91 migrations | 42+ API services**

All 14 phases are **BUILT** — from MVP through enterprise platform with workflow automation, task management, and full UX polish.

### Status Legend
- [x] Built and committed
- [ ] Not yet started
- (P) Planned for future iteration

---

## Foundation (Pre-Expansion MVP)

### Authentication & Users
- [x] Email/password registration and login (Sanctum SPA)
- [x] Role-based access: Consumer, Agent, Agency Owner, Carrier, Admin, Superadmin
- [x] Agency profile setup (name, license, E&O)
- [x] Agent profile setup (license, NPN, specialties, carriers)
- [x] Staff invitation system (email-based invite tokens)
- [x] Email verification flow
- [x] Password reset flow
- [x] Stripe subscription management (6 tiers)
- [x] Referral system with $10 credit per signup

### Quote Calculator (Public)
- [x] Insurance type selection (auto, home, life, health, renters, commercial)
- [x] Multi-carrier quote generation from carrier products database
- [x] Quote results with side-by-side comparison
- [x] Save quotes to account
- [x] Quote-to-application conversion
- [x] Quote expiration tracking

### Agent Marketplace
- [x] Agent search by location, specialty, carrier, rating
- [x] Agent profile pages (bio, specialties, carriers, reviews)
- [x] Verified license badge
- [x] Rating and review system with agent replies
- [x] Smart agent matching algorithm

### CRM & Lead Pipeline
- [x] Lead pipeline (new → contacted → qualified → quoted → applied → won/lost)
- [x] Lead source tracking
- [x] Activity logging (calls, emails, notes)
- [x] Lead scoring (engagement-based)
- [x] Unified Insurance Profiles (UIP) with stage advancement
- [x] Lead routing rules engine

### Application Pipeline
- [x] Application creation from quotes
- [x] Status tracking (draft → submitted → underwriting → approved → bound)
- [x] Application notes and timeline

### Policy Management
- [x] Active policy tracking (consumer + agent views)
- [x] Policy status management
- [x] Policy document storage

### Carrier Portal
- [x] Carrier directory with products
- [x] Carrier product management (CRUD)
- [x] Production reports

### Dashboard & Analytics
- [x] Role-specific dashboards (Consumer, Agent, Agency Owner, Carrier, Admin)
- [x] Dashboard statistics API
- [x] Revenue/commission trend data

### Commission Tracking
- [x] Commission records per policy
- [x] Commission status flow (pending → earned → paid)
- [x] Monthly commission summaries

---

## Phase 1: Revenue Engine & Communication Layer

### 1.1 Real-Time Messaging
- [x] Conversations model (user-to-user, context-aware)
- [x] Messages with typing indicators
- [x] Adaptive polling (3s active / 15s idle)
- [x] User search for new conversations
- [x] Read receipts

### 1.2 Notification System
- [x] Polymorphic notifications (uuid PK)
- [x] Notification center (dropdown + full page)
- [x] Mark as read / mark all read
- [x] Unread count badge
- [x] Action URLs for click-through

### 1.3 Document Management & E-Signature
- [x] Polymorphic document uploads (documentable)
- [x] Document download and deletion
- [x] Canvas-based e-signatures (polymorphic signable)
- [x] Signature request → sign → reject flow
- [x] IP address and user agent tracking for legal compliance

### 1.4 Commission Payout System (Stripe Connect)
- [x] Stripe Connect Express account onboarding
- [x] Payout request and history
- [x] Platform fee calculation
- [x] Connect account status tracking

### 1.5 Immutable Audit Logging
- [x] SOC 2-grade audit log (uuid PK, no updates/deletes)
- [x] Polymorphic auditable tracking
- [x] Actor ID, role, IP address, user agent
- [x] Old/new value JSON diffs
- [x] Admin audit log viewer with filters

---

## Phase 2: AI Intelligence & Advanced Pipeline

### 2.1 AI Insurance Assistant
- [x] AI chat conversations with context awareness
- [x] Role-aware system prompts (consumer, agent, agency owner)
- [x] Token usage tracking per message
- [x] Chat history and conversation management
- [x] AI-powered suggestions endpoint

### 2.2 Predictive Lead Scoring
- [x] Lead score model (0-100 score with factors JSON)
- [x] Engagement event tracking
- [x] Top leads endpoint
- [x] Bulk rescore capability

### 2.3 Claims Filing & Tracking
- [x] Claims lifecycle (reported → under review → investigating → approved → denied → settled → closed)
- [x] Claim documents (photos, forms)
- [x] Claim activity timeline
- [x] Agent claims queue

### 2.4 Renewal Management & Retention
- [x] Renewal opportunities with retention scoring
- [x] Current vs. new premium comparison
- [x] Renewal dashboard with status filters
- [x] Re-quote capability

### 2.5 Advanced Analytics Dashboard
- [x] Conversion funnel analytics
- [x] Revenue trend analysis
- [x] Agent performance metrics
- [x] Claims analytics

---

## Phase 3: Enterprise Auth & Carrier Integration

### 3.1 SAML SSO for Enterprise Agencies
- [x] SAML 2.0 login and ACS callback
- [x] SSO metadata endpoint
- [x] Per-agency SSO configuration
- [x] SSO enable/disable admin controls

### 3.2 Carrier Rating API Marketplace
- [x] Carrier API configuration (base URL, auth, field mapping)
- [x] API connection testing
- [x] Request/response logging with timing
- [x] Live rate API integration (parallel multi-carrier calls)

### 3.3 Hierarchical Organizations (MGA → Agency → Sub-agency → Agent)
- [x] Self-referencing organization tree (parent_id)
- [x] Organization types: MGA, agency, sub_agency
- [x] Organization members with role-based permissions
- [x] Visual organization tree

### 3.4 Webhook System
- [x] Webhook registration (URL, events, secret)
- [x] Webhook delivery tracking with retry
- [x] Test webhook endpoint
- [x] Event type listing
- [x] Delivery log viewer

### 3.5 Calendar & Scheduling
- [x] Appointments (consultation, review, claim follow-up)
- [x] Agent availability (day of week, time slots)
- [x] Blocked dates management
- [x] Available slots calculation
- [x] Appointment status flow (scheduled → confirmed → completed → cancelled)

### 3.6 Lead Scenarios (Normalized Pipeline)
- [x] Multi-scenario per lead (quote different coverage combinations)
- [x] Insured objects CRUD (vehicles, properties, persons)
- [x] Coverages CRUD per scenario
- [x] Scenario-to-application conversion
- [x] Product type and suggested coverage reference data

---

## Phase 4: White-Label & Embedded Insurance

### 4.1 White-Label Agency Platform
- [x] White-label configuration (domain, brand, logo, colors, custom CSS)
- [x] Domain verification and SSL management
- [x] White-label preview
- [x] Multi-domain support per configuration

### 4.2 Embedded Insurance Widgets
- [x] Embed partner management (API key, allowed domains, commission share)
- [x] Embed session tracking (source domain, conversion)
- [x] Partner analytics dashboard
- [x] Widget code generator

### 4.3 PDF Document Generation
- [x] Template-based document generation
- [x] Multiple document types (quotes, binders, COIs)
- [x] Generated document storage and download
- [x] Polymorphic documentable association

### 4.4 Compliance Tracking
- [x] Agent license management (state, number, status, expiration)
- [x] Continuing education (CE) credit tracking
- [x] Errors & Omissions (E&O) policy tracking
- [x] Compliance dashboard with expiration alerts
- [x] Expiring items endpoint (licenses, CE, E&O)

### 4.5 PWA with Offline Capability
- [x] VitePWA plugin configuration
- [x] Service worker with Workbox caching
- [x] Manifest with Insurons branding
- [x] PWA install prompt component

---

## Phase 5: Premium Data Products & Growth

### 5.1 Data Products & Market Intelligence
- [x] Data subscriptions (product type, tier, pricing)
- [x] Market intelligence dashboard
- [x] Competitive analysis reports
- [x] Agent benchmarking
- [x] Scheduled report generation and download

### 5.2 Public API & Key Management
- [x] API key generation with permissions JSON
- [x] API usage logging (endpoint, response time)
- [x] Key regeneration and revocation
- [x] Usage statistics dashboard

### 5.3 Agent Recruitment & Training
- [x] Job posting management (requirements, compensation)
- [x] Agent applications with resume upload
- [x] Public job board
- [x] Training module management (content type, duration)
- [x] Training completions and scoring
- [x] Progress tracking per user
- [x] Training catalog with category filtering

### 5.4 Help Center & Knowledge Base
- [x] Help categories and articles
- [x] Full-text article search
- [x] Helpful/not helpful voting
- [x] Admin article and category management (CRUD)

---

## Phase 6: Ecosystem & Network Effects

### 6.1 Insurance Community Forum
- [x] Forum categories with ordering and icons
- [x] Topics with pinning, locking, view counts
- [x] Posts (replies) with upvoting
- [x] Solution marking for knowledge sharing
- [x] Vote tracking (upvote/downvote per user)

### 6.2 Event & Webinar Management
- [x] Events (webinar, in-person, hybrid)
- [x] Event registration with capacity limits
- [x] Attendance tracking
- [x] Event status flow (draft → published → cancelled → completed)
- [x] My events listing

### 6.3 Partnership Marketplace
- [x] Partner listings (category, service area, rating)
- [x] Partner verification (admin)
- [x] Referral tracking with commission
- [x] Partner search with category and verification filters

### 6.4 Email Marketing & Drip Campaigns
- [x] Email template library (system + custom)
- [x] Campaign builder (subject, HTML body, target segment)
- [x] Campaign scheduling and sending
- [x] Campaign analytics (opens, clicks, bounces, unsubscribes)
- [x] Per-recipient send tracking

### 6.5 Advanced Reporting & BI Export
- [x] Custom report definitions (query config, schedule, recipients)
- [x] Report run execution with row counts
- [x] Report download (CSV)
- [x] BI export endpoints (CSV + JSON)
- [x] Scheduled report support

---

## Phase 7: Marketplace Navigation & Lead Exchange

### 7.1 Lead Marketplace
- [x] Sell leads from CRM (own-sourced only, no resale of purchased leads)
- [x] Lead marketplace browse and purchase flow
- [x] Platform fee (15%) with seller earnings breakdown
- [x] Auto-route purchased leads through buyer's RoutingEngine
- [x] Lead marketplace sidebar nav item (agent, agency_owner)

---

## Phase 8: UX Quick Wins & Design Polish

### 8.1 Quote UX Enhancements
- [x] Save & resume abandoned quotes (localStorage, 24h expiry)
- [x] Coverage comparison matrix (toggle between card and table view)
- [x] Premium breakdown (base rate, policy fee, discount, monthly/annual)
- [x] Lemonade-style progressive disclosure (one question at a time, progress bar)

### 8.2 Design Refresh
- [x] Premium Navy + Teal + Amber palette (deep navy #102a43, teal #014d40, amber #f59e0b)
- [x] Updated gradients, glass morphism, shadows
- [x] PWA theme color updated

---

## Phase 9: Stability & Team Management

### 9.1 Error Recovery
- [x] ChunkErrorBoundary — catches stale chunk load errors after deploys
- [x] lazyRetry() wrapper — retries failed dynamic imports once after 1s
- [x] All 65+ lazy() calls updated to lazyRetry()

### 9.2 Agency Team Management (Real API)
- [x] AgencyTeam page wired to real API (previously mock data)
- [x] Invite agents, toggle active/inactive status, cancel pending invites
- [x] Team stats cards and agent performance summaries

### 9.3 CRM Carrier Quote Comparison
- [x] Full comparison table in scenario detail (carrier, AM Best, premiums, status)
- [x] Recommend, select, delete quote actions
- [x] Savings spread summary (cheapest vs most expensive)

### 9.4 Scenario Proposal PDF
- [x] DomPDF template with agency header, Insurons footer, executive summary
- [x] Coverage tables and carrier comparison in PDF
- [x] `POST /crm/leads/{lead}/scenarios/{scenario}/proposal`

---

## Phase 10: Infrastructure & Integrations

### 10.1 Embeddable Quote Widget
- [x] Standalone iframe-friendly calculator page (no nav/sidebar)
- [x] API key validation and embed session tracking
- [x] PostMessage communication for iframe resize and conversion events
- [x] Vanilla JS embed script (`insurons-widget.js`) with inline and button modes
- [x] Conversion tracking endpoint

### 10.2 Carrier API Adapter Pattern
- [x] CarrierApiAdapter interface with DTOs
- [x] GenericRestAdapter (configurable for any REST API)
- [x] ProgressiveAdapter and TravelersAdapter (carrier-specific stubs)
- [x] Multi-carrier quote fan-out via CarrierApiService orchestrator
- [x] test-connection, available-adapters, adapter-quotes endpoints

### 10.3 Consumer Multi-Quote Comparison
- [x] ScenarioPublicView shows all carrier quotes in comparison table
- [x] Savings callout between cheapest and most expensive

### 10.4 Server-Side Quote Drafts
- [x] quote_drafts table (one per user)
- [x] GET/PUT/DELETE /calculator/draft endpoints
- [x] Complements localStorage drafts for logged-in users

### 10.5 Compliance Overdue Notifications
- [x] `compliance:check-overdue` artisan command (daily)
- [x] Groups overdue items by user, sends email + in-app notification
- [x] Deduplication (once per week per user)

### 10.6 Stripe Integration
- [x] `stripe:sync-plans` command (creates Stripe products + prices from DB)
- [x] Stripe Customer Portal (`POST /subscriptions/portal`)
- [x] API-driven Pricing page (fetches plans from API, monthly/annual toggle)

### 10.7 Railway Scheduler
- [x] Procfile updated with `scheduler: php artisan schedule:work`

---

## Phase 11: Feature Completion & Product Gates

### 11.1 Calculator Server Draft Sync
- [x] Logged-in Calculator loads draft from server on mount
- [x] Debounce-saves (2s) to server
- [x] Clear and "Get Quotes" also sync to server

### 11.2 Consumer Portal Actions
- [x] MyPolicies: real "Call Agent" (tel: link), "Download" (print popup), "File Claim" (navigate)
- [x] Added phone field to AgentProfile type

### 11.3 Marketplace Auction/Bidding
- [x] lead_marketplace_bids table
- [x] Auction-type listings (min_bid, bid_increment, auction_ends_at)
- [x] placeBid() with $0.50 minimum increment in DB transaction
- [x] suggestPrice() uses historical averages × lead score multiplier
- [x] bulkList() for up to 50 leads at once

### 11.4 Real Premium Breakdown
- [x] QuoteController::estimate() returns breakdown (base_rate, coverage_factor, state_factor, policy_fee, discount)
- [x] Frontend uses server breakdown with syntheticBreakdown() fallback

### 11.5 Embed Widget Customization
- [x] widget_config: logo_url, company_name, hide_branding, theme (primary color), cta_text
- [x] Partner header with logo/name when configured
- [x] Conditional "Powered by Insurons" footer

### 11.6 ZIP Code Auto-Complete
- [x] zip_codes table with 160+ US ZIP codes (all 50 states + DC)
- [x] AddressAutocomplete reusable component (debounced 300ms, keyboard nav)
- [x] Wired into Calculator, EmbedQuoteWidget, InsuranceRequestForm, LeadIntake

### 11.7 Product Activation Gate
- [x] Scenario create/update validates product_type against PlatformProduct.is_active
- [x] Agency-level intersection with carrier appointments
- [x] Backwards compatible (if no PlatformProducts exist, all types allowed)

---

## Phase 12: Payments, Emails, E-Signature

### 12.1 Stripe Marketplace Payments
- [x] Full Stripe Checkout + PaymentIntent flow for lead purchases
- [x] Pending transaction records with stripe_payment_intent_id, stripe_checkout_session_id
- [x] Webhook handlers for marketplace payment events
- [x] Falls back to free transfer when Stripe not configured

### 12.2 Branded Email System
- [x] Master layout.blade.php (accent bar, branded header, icon section, content, footer)
- [x] Reusable partials: button.blade.php, stat-card.blade.php, status-badge.blade.php
- [x] Custom accent colors per email type (compliance=red, lead aging=amber)
- [x] 20+ email templates refactored to extend branded layout
- [x] MarketplacePurchaseMail + MarketplaceSaleMail

### 12.3 E-Signature Flow
- [x] Signature model (UUID, polymorphic signable, canvas-based)
- [x] SignatureController (request/sign/reject/myPending)
- [x] PublicSigningController (token-based create-from-scenario, public view/sign)
- [x] ApplicationSigningPage with canvas drawing, full sign/submit flow
- [x] Email notifications: SignatureRequestMail, ApplicationReadyToSignMail, ApplicationSignedMail

---

## Phase 13: Workflow Automation & Bulk Operations

### 13.1 Styled Confirmation Dialogs
- [x] ConfirmDialog component with ConfirmProvider context + useConfirm() hook
- [x] Replaced all 13 native confirm() calls across 8 pages
- [x] Danger/warning/info variants with matching icons

### 13.2 Workflow Automation Engine
- [x] WorkflowRule model with 22 trigger events and JSON conditions
- [x] Condition operators: equals, not_equals, contains, greater_than, less_than, in, not_in
- [x] 8 action types: send_notification, update_status, assign_agent, create_task, add_tag, fire_webhook, send_email
- [x] WorkflowExecution audit log with duration tracking
- [x] WorkflowEngine service with fire() method
- [x] Integrated into LeadIntakeController and PublicSigningController

### 13.3 Commission Splits
- [x] CommissionSplit model for multi-agent commission sharing
- [x] Percentage validation (total ≤ 100%)
- [x] CRUD endpoints on CommissionController

### 13.4 WorkflowBuilder Page
- [x] Rules tab with CRUD, toggle on/off, test execution, expand detail
- [x] Executions tab with audit log history
- [x] Create modal with trigger event, condition builder, action builder
- [x] Route at /workflows, nav in Integrations section

### 13.5 Bulk CRM Operations
- [x] Checkbox selection in lead table with select-all
- [x] Bulk action bar with status change dropdown
- [x] CSV export (selected or all leads)
- [x] Backend bulkUpdateStatus with agency scoping

---

## Phase 14: Task Management, Kanban, Dashboard & Password UX

### 14.1 Task Management System
- [x] Migration: priority, completed_at, assigned_by columns + task type on appointments
- [x] TaskController with CRUD, complete/reopen, priority/overdue/today filters
- [x] Tasks page with stats cards, priority badges, completion toggle, create modal
- [x] Route at /tasks, nav item in Pipeline section

### 14.2 Kanban Pipeline Board
- [x] Drag-and-drop board view for CRM leads with 6 status columns
- [x] View toggle (list/board) in Leads header
- [x] Drag lead between columns updates status via API

### 14.3 Enriched Agent Dashboard
- [x] Tasks Due Today widget with overdue indicators
- [x] Recent Leads widget with status badges, phone/email actions
- [x] Action items link to relevant pages
- [x] Quick links row (Commissions, Reviews, Calendar, Tasks)
- [x] 10s timeout safety valve for API calls

### 14.4 Password Strength on Invite
- [x] Password strength meter (5-segment bar) with real-time scoring
- [x] Checklist: 8+ chars, uppercase, lowercase, number, special char
- [x] "Generate Strong Password" button (16-char, auto-copies to clipboard)
- [x] Show/hide password toggle, copy button

---

## UI/UX & Branding

### Platform Branding
- [x] Custom Insurons logo (shield + connected nodes) integrated across all pages
- [x] Logo in sidebar (desktop) and mobile header
- [x] Logo on all auth pages (Login, Register, VerifyEmail, AcceptInvite, SsoLogin, SsoCallback)
- [x] Logo on all public page navbars (Landing, Pricing, Calculator, QuoteResults, AgentProfile)
- [x] Logo in footer (Landing page)

### Dashboard Layout
- [x] Responsive sidebar with role-filtered navigation
- [x] Desktop top-right header bar with Messages, Notifications, Help, Settings icons
- [x] User avatar + profile dropdown in top-right (desktop)
- [x] Mobile header with hamburger menu, logo, Messages + Notifications
- [x] Mobile sidebar with Settings, Help, Sign Out at bottom
- [x] AI Chat Widget (floating, all pages)

---

## Future Roadmap (Not Yet Built)

### Multi-Language Support (i18n)
- (P) react-intl or react-i18next framework
- (P) Spanish language translations (consumer-facing)
- (P) Language selector in Settings

### React Native Mobile App
- (P) Expo project with core screens
- (P) Push notifications (FCM/APNs)
- (P) Camera document capture
- (P) Biometric auth (FaceID/fingerprint)

### Training Content System
- (P) Course modules with video/text content
- (P) Quiz functionality with scoring
- (P) Certificate generation on completion
- (P) Learning paths/sequences

### Recruitment Pipeline
- (P) Applicant kanban board
- (P) Interview scheduling integration
- (P) Offer letter generation

### Ongoing Enhancements
- (P) Real carrier API credentials (Progressive, Travelers, etc.)
- (P) Push notifications (PWA web push)
- (P) Recurring appointments in calendar
- (P) File attachments in messages
- (P) Document upload/evidence in compliance
- (P) ML-powered lead scoring (upgrade from rule-based)
- (P) Bundle quoting (auto + home discount)
- (P) Async email campaign sending via Laravel queues

---

## Cumulative Build Summary

| Phase | Features | Models | Controllers | Pages | Migrations |
|-------|----------|--------|-------------|-------|------------|
| Foundation | Auth, quotes, marketplace, CRM, pipeline | 21 | 16 | 30 | 27 |
| Phase 1 | Messaging, notifications, docs, signatures, payouts, audit | +8 | +5 | +5 | +6 |
| Phase 2 | AI chat, lead scoring, claims, renewals, analytics | +8 | +5 | +4 | +5 |
| Phase 3 | SSO, carrier API, orgs, webhooks, calendar, scenarios | +14 | +6 | +6 | +8 |
| Phase 4 | White-label, embed, PDF gen, compliance, PWA | +10 | +5 | +4 | +6 |
| Phase 5 | Data products, API keys, recruitment, training, help center | +10 | +5 | +5 | +4 |
| Phase 6 | Forum, events, partners, campaigns, reports | +13 | +5 | +5 | +5 |
| Phase 7 | Lead marketplace (sell/buy/auction) | — | +1 | +2 | +1 |
| Phase 8 | Quote UX, comparison matrix, palette refresh | — | — | — | — |
| Phase 9 | ChunkErrorBoundary, team mgmt, CRM quotes, proposal PDF | — | — | — | — |
| Phase 10 | Embed widget, carrier adapters, Stripe sync, scheduler | +1 | +3 | +3 | +3 |
| Phase 11 | Auction bidding, ZIP auto-complete, product gate | +1 | +1 | — | +2 |
| Phase 12 | Stripe payments, branded emails, e-signature | — | +1 | +2 | +2 |
| Phase 13 | Workflow engine, commission splits, bulk CRM, ConfirmDialog | +3 | +1 | +1 | +1 |
| Phase 14 | Task management, kanban board, dashboard enrichment, password UX | — | +1 | +1 | +1 |
| **Total** | **All 14 phases complete** | **~82** | **~65** | **~68** | **~91** |
