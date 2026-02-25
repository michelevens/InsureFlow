# Insurons Developer & Integration Guide

## Overview

This guide covers everything a developer needs to integrate with Insurons: API architecture, authentication, endpoint reference, embed widget, webhooks, carrier API adapters, and deployment.

---

## Architecture

```
┌──────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│  Frontend (SPA)  │────>│  Laravel API          │────>│  PostgreSQL      │
│  React + TS      │     │  api.insurons.com     │     │  (Railway)       │
│  insurons.com    │     │  Laravel 12 + PHP 8.4 │     │                  │
│  (GitHub Pages)  │     │  Sanctum SPA auth     │     │  91 migrations   │
│                  │     │  495+ endpoints       │     │  82+ models      │
└──────────────────┘     └──────────────────────┘     └──────────────────┘
                                   │
                         ┌─────────┴─────────┐
                         │  External Services │
                         │  - Stripe          │
                         │  - Carrier APIs    │
                         │  - SMTP (email)    │
                         │  - Anthropic (AI)  │
                         └───────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router v7, React Query |
| Backend | Laravel 12, PHP 8.4, Sanctum (SPA auth) |
| Database | PostgreSQL (Railway) |
| Hosting | GitHub Pages (frontend), Railway (backend) |
| Payments | Stripe (subscriptions, marketplace, payouts) |
| Email | Laravel Mail (queued) |
| AI | Anthropic Claude (chat assistant) |

---

## Authentication

### Sanctum SPA Authentication

Insurons uses Laravel Sanctum's SPA authentication (cookie-based).

**Login:**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "agent@example.com",
  "password": "password123"
}

Response 200:
{
  "user": { "id": 1, "name": "John", "email": "agent@example.com", "role": "agent" },
  "token": "1|abc123..."
}
```

**Bearer token:** Include in all authenticated requests:
```
Authorization: Bearer 1|abc123...
```

**Logout:**
```
POST /api/auth/logout
Authorization: Bearer {token}
```

### User Roles

| Role | Slug | Description |
|------|------|-------------|
| Consumer | `consumer` | Policyholders seeking insurance |
| Agent | `agent` | Licensed insurance agents |
| Agency Owner | `agency_owner` | Agency principals with team management |
| Carrier | `carrier` | Insurance carriers managing products |
| Admin | `admin` | Platform administrators |
| Superadmin | `superadmin` | Full platform access + settings |

---

## API Endpoint Reference

### Base URL
```
https://api.insurons.com/api
```

### Public Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/calculator/estimate` | Get instant quotes |
| GET | `/marketplace/agents` | Browse agent directory |
| GET | `/marketplace/agents/{id}` | Agent profile |
| GET | `/carriers` | List carriers |
| GET | `/subscription-plans` | List available plans |
| GET | `/products/visible` | Active product catalog |
| GET | `/intake/{agencyCode}` | Lead intake form data |
| POST | `/intake/{agencyCode}` | Submit lead intake |
| GET | `/zip-codes/search?q=902` | ZIP code autocomplete |
| GET | `/embed/config/{apiKey}` | Validate embed API key |
| POST | `/embed/quote` | Create embed session |
| POST | `/embed/convert` | Mark conversion |
| GET | `/applications/{token}/view` | Public application view |
| POST | `/applications/{token}/sign` | Public e-signature |

### CRM Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/crm/leads` | List leads |
| POST | `/crm/leads` | Create lead |
| GET | `/crm/leads/{id}` | Lead detail |
| PUT | `/crm/leads/{id}` | Update lead |
| POST | `/crm/leads/{id}/activity` | Add activity |
| PUT | `/crm/leads/bulk-status` | Bulk status update |
| GET | `/crm/leads/{id}/scenarios` | List scenarios |
| POST | `/crm/leads/{id}/scenarios` | Create scenario |
| POST | `/crm/leads/{id}/scenarios/{id}/objects` | Add insured object |
| POST | `/crm/leads/{id}/scenarios/{id}/coverages` | Add coverage |
| POST | `/crm/leads/{id}/scenarios/{id}/quotes` | Add carrier quote |
| POST | `/crm/leads/{id}/scenarios/{id}/convert` | Convert to application |
| POST | `/crm/leads/{id}/scenarios/{id}/proposal` | Generate proposal PDF |

### Application & Policy Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/applications` | List applications |
| POST | `/applications` | Create application |
| POST | `/applications/{id}/submit` | Submit to carrier |
| PUT | `/applications/{id}/status` | Update status |
| GET | `/policies` | List policies |
| POST | `/policies` | Create policy |
| PUT | `/policies/{id}/status` | Update policy status |

### Workflow Automation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workflows` | List rules |
| POST | `/workflows` | Create rule |
| PUT | `/workflows/{id}` | Update rule |
| DELETE | `/workflows/{id}` | Delete rule |
| POST | `/workflows/{id}/toggle` | Enable/disable |
| POST | `/workflows/{id}/test` | Test execution |
| GET | `/workflows/options` | Available triggers/actions |
| GET | `/workflows/executions` | Execution audit log |

### Task Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | List tasks |
| POST | `/tasks` | Create task |
| PUT | `/tasks/{id}` | Update task |
| POST | `/tasks/{id}/complete` | Mark complete |
| POST | `/tasks/{id}/reopen` | Reopen task |
| DELETE | `/tasks/{id}` | Delete task |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users |
| POST | `/admin/users` | Create user |
| PUT | `/admin/users/{id}` | Update user |
| POST | `/admin/users/{id}/reset-password` | Reset password |
| GET | `/admin/agencies` | List agencies |
| PUT | `/admin/agencies/{id}` | Update agency |
| GET | `/admin/carriers` | List carriers |
| POST | `/admin/carriers` | Create carrier |
| GET | `/admin/plans` | List subscription plans |
| POST | `/admin/plans` | Create plan |
| GET | `/admin/audit-logs` | Audit log |
| GET | `/admin/analytics` | Platform analytics |

*See the full API routes file (`laravel-backend/routes/api.php`) for all 495+ endpoints.*

---

## Embed Widget Integration

Add the Insurons quote widget to any website with a single script tag.

### Quick Start

```html
<!-- Inline mode: embeds directly on page -->
<script src="https://insurons.com/embed/insurons-widget.js"
  data-key="YOUR_API_KEY"
  data-mode="inline">
</script>

<!-- Button mode: floating button with modal -->
<script src="https://insurons.com/embed/insurons-widget.js"
  data-key="YOUR_API_KEY"
  data-mode="button">
</script>

<!-- Pre-selected insurance type -->
<script src="https://insurons.com/embed/insurons-widget.js"
  data-key="YOUR_API_KEY"
  data-type="auto"
  data-mode="inline">
</script>
```

### Partner Management API

```
POST /api/embed/partners          → Create partner (returns API key once)
GET  /api/embed/partners          → List partners
PUT  /api/embed/partners/{id}     → Update partner
POST /api/embed/partners/{id}/regenerate-key → New API key
GET  /api/embed/partners/{id}/analytics      → Session/conversion stats
GET  /api/embed/partners/{id}/widget-code    → Ready-to-paste embed code
```

See [EMBED_WIDGET.md](EMBED_WIDGET.md) for full technical documentation.

---

## Webhooks

### Configuration

```
POST /api/webhooks
{
  "url": "https://your-app.com/hooks/insurons",
  "events": ["lead_created", "application_signed", "policy_bound"],
  "secret": "your-webhook-secret"
}
```

### Event Types

| Event | Fires When |
|-------|-----------|
| `lead_created` | New lead added to CRM |
| `lead_status_changed` | Lead pipeline stage changes |
| `application_submitted` | Application sent to carrier |
| `application_signed` | Consumer signs application |
| `policy_bound` | Policy becomes active |
| `claim_filed` | New claim submitted |
| `payment_received` | Payment processed |

### Payload Format

```json
{
  "event": "application_signed",
  "timestamp": "2026-02-25T12:00:00Z",
  "data": {
    "application_id": 42,
    "reference": "APP-X8K2M9PL",
    "signer_name": "Jane Smith",
    "carrier_name": "Progressive",
    "premium": 1250.00
  }
}
```

### Verification

Verify webhook authenticity using the `X-Insurons-Signature` header:
```
HMAC-SHA256(payload_body, webhook_secret)
```

### Delivery & Retry

- Deliveries are logged with status, response code, and response body
- Failed deliveries can be manually retried
- Test endpoint available for development

---

## Carrier API Adapters

Integrate carrier rating APIs with the adapter pattern.

### Adapter Types

| Adapter | Description |
|---------|-------------|
| `GenericRestAdapter` | Configurable for any REST API (most flexible) |
| `ProgressiveAdapter` | Progressive-specific integration |
| `TravelersAdapter` | Travelers-specific integration |

### Configuration

```
POST /api/carrier-api/configs
{
  "carrier_id": 5,
  "adapter_type": "generic_rest",
  "base_url": "https://api.carrier.com/v1",
  "auth_type": "api_key",
  "auth_config": { "key": "X-API-Key", "value": "your-key" },
  "field_mapping": {
    "premium": "response.quote.totalPremium",
    "deductible": "response.quote.deductible"
  }
}
```

### Endpoints

```
GET  /api/carrier-api/adapters                  → Available adapter types
POST /api/carrier-api/configs/{id}/test-connection → Test connectivity
POST /api/carrier-api/live-rates                → Get live rates (fan-out)
POST /api/carrier-api/adapter-quotes            → Get quotes via adapter
GET  /api/carrier-api/configs/{id}/logs         → Request/response logs
```

---

## Database Schema

### Key Tables (91 migrations)

| Table | Records | Description |
|-------|---------|-------------|
| `users` | Auth + roles | email, password, role, agency_id |
| `agencies` | Agency profiles | name, license, code, settings |
| `leads` | CRM leads | contact, insurance_type, status, score |
| `lead_scenarios` | Quote scenarios | product_type, coverages, status |
| `applications` | Insurance apps | carrier, premium, status, signing_token |
| `policies` | Bound policies | policy_number, dates, status |
| `claims` | Insurance claims | status, amount, timeline |
| `embed_partners` | Widget partners | api_key, allowed_domains, config |
| `embed_sessions` | Widget sessions | source_domain, converted_at |
| `workflow_rules` | Automation rules | trigger, conditions, action_type |
| `tasks` | Task management | title, due_date, priority, status |
| `commissions` | Agent commissions | amount, status, policy_id |
| `notifications` | In-app notifications | title, body, read_at |
| `audit_logs` | Immutable audit | actor, model, old/new values |
| `rate_tables` | Premium rating | base_rates, factors, riders, fees |

---

## Development Setup

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # Set VITE_API_URL=http://localhost:8000/api
npm run dev             # http://localhost:5173
```

### Backend

```bash
cd laravel-backend
composer install
cp .env.example .env
php artisan key:generate

# Configure PostgreSQL in .env
php artisan migrate
php artisan db:seed
php artisan serve        # http://localhost:8000
```

### Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Consumer | `homeowner@demo.com` | `password` |
| Agent | `agent@demo.com` | `password` |
| Agency Owner | `agency@demo.com` | `password` |
| Admin | `admin@demo.com` | `password` |
| Superadmin | `superadmin@demo.com` | `password` |

---

## Deployment

### Frontend (GitHub Pages)
- Push to `master` → GitHub Actions builds and deploys
- Build sets `VITE_API_URL=https://api.insurons.com/api`
- SPA routing via `404.html` fallback
- Custom domain: `insurons.com` (via CNAME)

### Backend (Railway)
- Push to `master` → Railway auto-deploys
- `nixpacks.toml` handles build + start:
  - Config/route clear
  - Config cache
  - Migrate (--force)
  - Storage link
  - `php artisan serve --host=0.0.0.0 --port=${PORT}`
- Custom domain: `api.insurons.com`
- PostgreSQL provisioned within Railway

### Environment Variables (Railway)

| Variable | Description |
|----------|-------------|
| `APP_KEY` | Laravel app key |
| `DB_*` | PostgreSQL connection |
| `SANCTUM_STATEFUL_DOMAINS` | `insurons.com,localhost:5173` |
| `SESSION_DOMAIN` | `.insurons.com` |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `MAIL_*` | SMTP configuration |
| `FRONTEND_URL` | `https://insurons.com` |

---

## File Structure

```
InsureFlow/
├── frontend/
│   └── src/
│       ├── components/          # Reusable UI components
│       │   ├── ui/              # Button, Input, Card, Select, Badge, etc.
│       │   ├── layout/          # MainLayout, Sidebar, Header
│       │   └── dashboard/       # Role-specific dashboard components
│       ├── contexts/            # AuthContext
│       ├── hooks/               # useAuth, useTeamPermissions
│       ├── services/api/        # API client, service modules
│       ├── types/               # TypeScript interfaces
│       ├── pages/               # All route pages (65+)
│       │   ├── admin/           # Admin pages
│       │   ├── agent/           # Agent pages
│       │   ├── consumer/        # Consumer pages
│       │   ├── embed/           # Embed widget pages
│       │   └── ...
│       └── App.tsx              # Route definitions
│
├── laravel-backend/
│   ├── app/
│   │   ├── Http/Controllers/   # 65+ controllers
│   │   ├── Models/             # 82+ models
│   │   ├── Services/           # WorkflowEngine, RatingEngine, etc.
│   │   └── Mail/               # Email templates
│   ├── database/
│   │   ├── migrations/         # 91 migrations
│   │   └── seeders/            # Demo data seeders
│   └── routes/api.php          # All API routes
│
├── docs/                        # Documentation (you are here)
└── CLAUDE.md                    # Project state for AI assistants
```

---

## Error Handling

### API Error Format

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong role or permission) |
| 404 | Not found |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Server error |

---

## Rate Limiting

Default Laravel throttle middleware applies:
- 60 requests per minute for authenticated users
- 30 requests per minute for unauthenticated users
- Webhook endpoints are not rate-limited
