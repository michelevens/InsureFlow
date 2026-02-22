# Insurons — The Modern Insurance Platform

## Overview

Insurons is a full-stack InsurTech platform that connects consumers with licensed agents and carriers. Instant multi-carrier quotes, smart agent matching, AI-powered pipeline, white-label infrastructure, and an ecosystem of community tools. Built for independent insurance agents, agencies, MGAs, and carriers who need a complete digital platform.

**59 pages | 79 models | 45 controllers | 60 migrations | 39 API services**

## The Problem

- Getting insurance quotes is painful: call 5 agents, repeat your info, wait days
- Independent agents ($250B market) have no affordable digital tools
- Carriers want digital distribution but direct-to-consumer is expensive
- Consumers can't easily compare quotes across carriers
- Lead gen companies charge $15-50 per lead with no agent loyalty
- No single platform combines marketplace + CRM + carrier API + white-label + community

## The Solution

| Feature | Description |
|---------|-------------|
| **Quote Calculator** | Enter info once, get multi-carrier quotes in seconds |
| **Agent Marketplace** | Verified licensed agents with ratings and smart matching |
| **Full Pipeline** | Quote → Application → Underwriting → Bound → Active → Renewal |
| **AI Assistant** | Claude-powered coverage explainer, proposal drafter, performance analyzer |
| **White-Label** | Agencies run their own branded consumer experience |
| **Embedded Widgets** | Partners offer quotes on their own websites |
| **Community Forum** | Agent-to-agent knowledge sharing and market discussions |
| **Email Campaigns** | Built-in marketing with templates, scheduling, analytics |
| **Data Products** | Market intelligence and competitive analysis for carriers/MGAs |
| **Compliance** | License, CE credit, and E&O tracking with expiration alerts |

## Platform Features (6 Phases Complete)

### Foundation
Auth (Sanctum + SSO), quote engine, agent marketplace, CRM leads, application pipeline, policy management, Stripe subscriptions, referral system, Unified Insurance Profiles, tenant isolation, routing engine, invite system.

### Phase 1 — Revenue Engine
Real-time messaging, notifications, document management, e-signatures, Stripe Connect payouts, immutable audit logging.

### Phase 2 — AI & Intelligence
AI insurance assistant, predictive lead scoring, claims filing & tracking, renewal management, advanced analytics.

### Phase 3 — Enterprise
SAML SSO, carrier rating API, hierarchical organizations (MGA → Agency → Agent), webhooks, calendar & scheduling.

### Phase 4 — White-Label
White-label agency platform, embedded insurance widgets, PDF generation, compliance tracking, PWA with offline.

### Phase 5 — Data Products
Market intelligence, API key management, agent recruitment & training, help center & knowledge base.

### Phase 6 — Ecosystem
Community forum, event/webinar management, partnership marketplace, email campaigns, advanced reporting & BI export.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite 7 + Tailwind CSS |
| Backend | Laravel 12 + PHP 8.4 |
| Database | PostgreSQL |
| Auth | Sanctum SPA + SAML 2.0 SSO |
| Payments | Stripe (subscriptions + Connect Express) |
| AI | Claude API (Anthropic) |
| Email | Resend |
| PWA | VitePWA + Workbox |
| Hosting | GitHub Pages + Railway |

## User Roles

1. **Consumer** — Get quotes, compare, apply, manage policies, file claims
2. **Agent** — CRM leads, applications, commissions, calendar, compliance, training
3. **Agency Owner** — Team management, analytics, white-label, recruitment, campaigns
4. **Carrier** — Products, production reports, API config, carrier API marketplace
5. **Admin** — Platform management, audit logs, user management
6. **Superadmin** — Full access + subscription plan management

## Revenue Model

- **Agent subscriptions** ($49-149/mo) — CRM, AI, lead scoring, compliance
- **Agency subscriptions** ($349-999/mo) — Team, white-label, API, BI
- **MGA Platform** ($4,999/mo) — Hierarchical orgs, bulk API, data products
- **Carrier subscriptions** ($999-4,999/mo) — Rating API, webhooks, embedded
- **Commission revenue share** — 5% of gross written premium
- **Embedded API fees** — Per-transaction for partner integrations
- **Data products** — Market intelligence for carriers and MGAs

## Quick Start

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
php artisan migrate
php artisan db:seed
php artisan serve
```

## Documentation

- [FEATURES.md](FEATURES.md) — Complete feature tracker with all checkboxes
- [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) — Architecture, schema, deployment details
- [PROMPT.md](PROMPT.md) — Original project prompt and vision

## License

Proprietary. All rights reserved.
