# InsureFlow / Insurons — End-to-End & Security Validation Plan

> **Version:** 1.0
> **Date:** 2026-02-21
> **Platform:** React 19 + TypeScript 5.9 / Laravel 12 + Sanctum / PostgreSQL
> **Environments:** Local (`localhost:5173` / `localhost:8000`), Staging (Railway + GitHub Pages), Production (`insurons.com`)

---

## Table of Contents

1. [Prerequisites & Environment Setup](#1-prerequisites--environment-setup)
2. [Phase 1 — Authentication & Authorization](#2-phase-1--authentication--authorization)
3. [Phase 2 — Public User Flows (E2E)](#3-phase-2--public-user-flows-e2e)
4. [Phase 3 — Role-Based Dashboard Flows (E2E)](#4-phase-3--role-based-dashboard-flows-e2e)
5. [Phase 4 — API Contract Validation](#5-phase-4--api-contract-validation)
6. [Phase 5 — Security Testing](#6-phase-5--security-testing)
7. [Phase 6 — Data Integrity & Edge Cases](#7-phase-6--data-integrity--edge-cases)
8. [Phase 7 — Performance & Reliability](#8-phase-7--performance--reliability)
9. [Phase 8 — Accessibility (WCAG 2.1 AA)](#9-phase-8--accessibility-wcag-21-aa)
10. [Tooling & Infrastructure](#10-tooling--infrastructure)
11. [Known Issues & Gaps](#11-known-issues--gaps)
12. [Sign-Off Checklist](#12-sign-off-checklist)

---

## 1. Prerequisites & Environment Setup

### 1.1 Required Services

| Service | Purpose | Config Key |
|---------|---------|------------|
| PostgreSQL | Primary database | `DB_*` in `.env` |
| Laravel backend | API server on `:8000` | `php artisan serve` |
| Vite dev server | Frontend on `:5173` | `npm run dev` |
| Stripe (test mode) | Subscription checkout | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Resend (or mailtrap) | Transactional email | `RESEND_API_KEY`, `MAIL_MAILER` |

### 1.2 Seed Data (Required)

Run `php artisan migrate:fresh --seed` to load:

- **6 demo users** (one per role, all password: `password`)
  - `consumer@insureflow.com` — Consumer
  - `agent@insureflow.com` — Agent
  - `agency@insureflow.com` — Agency Owner
  - `carrier@insureflow.com` — Carrier
  - `admin@insureflow.com` — Admin
  - `superadmin@insureflow.com` — Superadmin
- **10 carriers** with products
- **5 subscription plans**

### 1.3 Environment Checklist

- [ ] PostgreSQL running, database `insureflow` created
- [ ] `.env` populated from `.env.example` with valid `APP_KEY`
- [ ] Migrations and seeders executed successfully
- [ ] Backend serves at `http://localhost:8000`
- [ ] Frontend serves at `http://localhost:5173`
- [ ] `VITE_API_URL=http://localhost:8000/api` set in `frontend/.env`
- [ ] Stripe test keys configured (or skipped — subscription tests marked conditional)
- [ ] Mail driver set to `log` for local testing (check `storage/logs/laravel.log`)

---

## 2. Phase 1 — Authentication & Authorization

### 2.1 Registration

| # | Test Case | Method | Expected Result | Priority |
|---|-----------|--------|-----------------|----------|
| 1.1 | Register as consumer | `POST /api/auth/register` | 201, token returned, role=consumer, email_verification_token set | Critical |
| 1.2 | Register as agent | `POST /api/auth/register` | 201, token returned, `approved_at` is NULL (requires admin approval) | Critical |
| 1.3 | Register as agency_owner | `POST /api/auth/register` | 201, `approved_at` NULL, `RegistrationReceivedMail` logged | Critical |
| 1.4 | Register as carrier | `POST /api/auth/register` | 201, `approved_at` NULL | Critical |
| 1.5 | Register with duplicate email | `POST /api/auth/register` | 422, validation error on `email` | High |
| 1.6 | Register with password < 8 chars | `POST /api/auth/register` | 422, validation error on `password` | High |
| 1.7 | Register with missing required fields | `POST /api/auth/register` | 422, validation errors for each field | High |
| 1.8 | Register from quote flow | `POST /api/auth/register-from-quote` | 201, user linked to `quote_request_id` | High |
| 1.9 | Register with referral code | `POST /api/auth/register` + referral | 201, referral credit created for referrer | Medium |

### 2.2 Login

| # | Test Case | Method | Expected Result | Priority |
|---|-----------|--------|-----------------|----------|
| 2.1 | Login with valid credentials | `POST /api/auth/login` | 200, token + user object | Critical |
| 2.2 | Login with wrong password | `POST /api/auth/login` | 401, "Invalid credentials" | Critical |
| 2.3 | Login with non-existent email | `POST /api/auth/login` | 401, "Invalid credentials" (no email enumeration) | Critical |
| 2.4 | Login with deactivated account | `POST /api/auth/login` | 403, "Account deactivated" | High |
| 2.5 | Get current user | `GET /api/auth/me` | 200, full user object with relations | Critical |
| 2.6 | Access protected route without token | `GET /api/auth/me` | 401, Unauthenticated | Critical |
| 2.7 | Access protected route with invalid token | `GET /api/auth/me` | 401, Unauthenticated | Critical |

### 2.3 Email Verification

| # | Test Case | Method | Expected Result | Priority |
|---|-----------|--------|-----------------|----------|
| 3.1 | Verify email with valid token | `GET /api/auth/verify-email/{token}` | 200, `email_verified_at` set | High |
| 3.2 | Verify with invalid/expired token | `GET /api/auth/verify-email/bad` | 400, "Invalid token" | High |
| 3.3 | Resend verification email | `POST /api/auth/resend-verification` | 200, new token generated, email logged | Medium |

### 2.4 Password Reset

| # | Test Case | Method | Expected Result | Priority |
|---|-----------|--------|-----------------|----------|
| 4.1 | Request password reset | `POST /api/auth/forgot-password` | 200, `PasswordResetMail` logged, token created | High |
| 4.2 | Reset with valid token (within 60 min) | `POST /api/auth/reset-password` | 200, password changed | High |
| 4.3 | Reset with expired token (> 60 min) | `POST /api/auth/reset-password` | 400, "Token expired" | High |
| 4.4 | Reset with invalid token | `POST /api/auth/reset-password` | 400, "Invalid token" | High |

### 2.5 Role-Based Access Control (RBAC)

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 5.1 | Consumer accesses `/api/crm/leads` | 200 but empty (scoped — no agency) | High |
| 5.2 | Agent accesses `/api/admin/users` | 403 or empty (admin-only logic) | Critical |
| 5.3 | Agency owner accesses `/api/agency/invites` | 200, shows own agency invites | High |
| 5.4 | Carrier accesses `/api/carrier/products` | 200, shows own products | High |
| 5.5 | Admin accesses `/api/admin/users` | 200, full user list | Critical |
| 5.6 | Superadmin overrides agency scope with `?agency_id=X` | 200, scoped to target agency | High |
| 5.7 | Agent cannot override agency scope with `?agency_id=X` | Query param ignored, scoped to own agency | Critical |

### 2.6 Logout & Session Management

| # | Test Case | Expected Result | Priority |
|---|-----------|-----------------|----------|
| 6.1 | Logout revokes token | `POST /api/auth/logout` → 200, token no longer valid | Critical |
| 6.2 | Using revoked token | 401 on any protected endpoint | Critical |
| 6.3 | Frontend clears localStorage on logout | `auth_token` removed, redirect to `/login` | Critical |
| 6.4 | Frontend clears token on 401 response | Token removed, user state reset | High |

---

## 3. Phase 2 — Public User Flows (E2E)

### 3.1 Landing → Quote Calculator → Results

| # | Step | Action | Expected Result |
|---|------|--------|-----------------|
| 1 | Visit `/` | Load landing page | Page renders, CTAs visible |
| 2 | Click "Get Quotes" CTA | Navigate to `/calculator` | Calculator step 1 loads |
| 3 | Select insurance type (e.g., Auto) | Dropdown selection | Type stored in form state |
| 4 | Enter ZIP code (e.g., 90210) | Text input, max 5 chars | ZIP stored |
| 5 | Select coverage level (Standard) | Dropdown | Level stored |
| 6 | Click "Continue" | Move to step 2 | Type-specific fields appear (vehicle_year, make, model for Auto) |
| 7 | Fill optional details | Text inputs | Values stored |
| 8 | Click "Get My Quotes" | `POST /api/calculator/estimate` | Loading spinner → navigate to `/calculator/results` |
| 9 | View results | Quote cards displayed | Sorted: recommended first, then by premium ascending |
| 10 | Click "Email My Quotes" | Contact form appears | Fields: first_name, last_name, email, phone |
| 11 | Fill & submit contact form | `PUT /api/calculator/{id}/contact` | Contact saved, account creation prompt appears |
| 12 | Create account (password) | `POST /api/auth/register-from-quote` | Account created, user logged in |
| 13 | Click "Go to Dashboard" | Navigate to `/dashboard` | Consumer dashboard loads |

### 3.2 Agent Marketplace

| # | Step | Action | Expected Result |
|---|------|--------|-----------------|
| 1 | Visit `/marketplace` | Load marketplace | Agent cards displayed |
| 2 | Search by name | Type in search input | Results filter client-side |
| 3 | Filter by insurance type | Select dropdown | Agents filtered by specialty match |
| 4 | Click "View Profile" | Navigate to `/marketplace/:id` | Agent detail page loads (bio, reviews, specialties) |

### 3.3 Invite Acceptance Flow

| # | Step | Action | Expected Result |
|---|------|--------|-----------------|
| 1 | Visit `/invite/:token` | `GET /api/invites/{token}` | Invite details shown (inviter, role, agency) |
| 2 | Fill registration form | Name, password | Fields pre-populated with invite email |
| 3 | Submit | `POST /api/invites/{token}/accept` | Account created, email auto-verified, redirected to dashboard |
| 4 | Visit expired invite | Token > 7 days old | Error: "Invite expired" |
| 5 | Visit already-accepted invite | Status = accepted | Error: "Invite already used" |

---

## 4. Phase 3 — Role-Based Dashboard Flows (E2E)

### 4.1 Consumer Dashboard

| # | Flow | Endpoints Hit | Validation |
|---|------|---------------|------------|
| 1 | View dashboard stats | `GET /api/stats/dashboard` | Stats cards render with correct counts |
| 2 | View saved quotes | `GET /api/quotes` | Quote list with carrier, premium, status |
| 3 | View applications | `GET /api/applications` | Application list with status badges |
| 4 | View policies | `GET /api/policies` | Policy list with effective/expiration dates |
| 5 | Update profile | `PUT /api/auth/profile` | Name, phone, email update persists |
| 6 | Change password | `PUT /api/auth/password` | Requires current password, new password saved |

### 4.2 Agent Dashboard

| # | Flow | Endpoints Hit | Validation |
|---|------|---------------|------------|
| 1 | View dashboard stats | `GET /api/stats/dashboard` | Lead count, conversion rate, active policies, commissions |
| 2 | Lead pipeline | `GET /api/crm/leads` | Leads grouped by status, counts match |
| 3 | Filter leads by status | `GET /api/crm/leads?status=new` | Only matching leads returned |
| 4 | Update lead status | `PUT /api/crm/leads/{id}` | Status changes, activity logged |
| 5 | Log lead activity | `POST /api/crm/leads/{id}/activity` | Activity types: call, email, note, quote_sent, application_submitted |
| 6 | View applications | `GET /api/applications` | Scoped to agent's applications |
| 7 | Submit application | `POST /api/applications/{id}/submit` | Status → submitted |
| 8 | View commissions | `GET /api/commissions` | Commission list with totals |
| 9 | View reviews | `GET /api/agents/{id}/reviews` | Reviews with rating, text, date |
| 10 | Reply to review | `PUT /api/reviews/{id}/reply` | Reply text saved, visible on profile |
| 11 | Update agent profile | `PUT /api/agent/profile` | Bio, specialties, states_licensed updated |

### 4.3 Agency Owner Dashboard

| # | Flow | Endpoints Hit | Validation |
|---|------|---------------|------------|
| 1 | View team | `GET /api/agency/invites` + user list | Team members with roles and status |
| 2 | Invite agent to agency | `POST /api/agency/invites` | Invite created, `InvitationMail` logged, 7-day expiry |
| 3 | View agency leads | `GET /api/crm/leads` | Scoped to agency (via `agency.scope` middleware) |
| 4 | Manage routing rules | `GET/POST/PUT/DELETE /api/routing-rules` | Rules for auto-assigning leads to agents |
| 5 | View UIP pipeline | `GET /api/profiles/pipeline` | Insurance profiles by stage |
| 6 | Reassign profile to agent | `POST /api/profiles/{id}/reassign` | Agent assignment updated |

### 4.4 Carrier Dashboard

| # | Flow | Endpoints Hit | Validation |
|---|------|---------------|------------|
| 1 | View products | `GET /api/carrier/products` | Product list with types, premiums |
| 2 | Add product | `POST /api/carrier/products` | New product created |
| 3 | Update product | `PUT /api/carrier/products/{id}` | Fields updated |
| 4 | View production | `GET /api/carrier/production` | Production metrics and reports |

### 4.5 Admin / Superadmin Dashboard

| # | Flow | Endpoints Hit | Validation |
|---|------|---------------|------------|
| 1 | List users (filter by role) | `GET /api/admin/users?role=agent` | Users filtered correctly |
| 2 | Search users | `GET /api/admin/users?search=john` | Name/email search works |
| 3 | Approve pending user | `PUT /api/admin/users/{id}/approve` | `approved_at` set, `AccountApprovedMail` logged |
| 4 | Deactivate user | `PUT /api/admin/users/{id}/deactivate` | `is_active` = false, user cannot login |
| 5 | List agencies | `GET /api/admin/agencies` | Agency list with owner info |
| 6 | Verify agency | `PUT /api/admin/agencies/{id}` | `is_verified` toggled |
| 7 | View analytics | `GET /api/admin/analytics` | Monthly user growth, totals |
| 8 | Manage subscription plans | CRUD on `/api/admin/plans` | Create, update, delete plans |
| 9 | Admin invite user | `POST /api/admin/invites` | Invite created for agent/agency_owner/carrier |
| 10 | List all invites | `GET /api/admin/invites?status=pending` | Filtered by status |

### 4.6 Subscription Flow

| # | Flow | Endpoints Hit | Validation |
|---|------|---------------|------------|
| 1 | View plans | `GET /api/subscription-plans` | Plans with monthly/annual pricing |
| 2 | View current subscription | `GET /api/subscriptions/current` | Current plan details or null |
| 3 | Checkout (Stripe) | `POST /api/subscriptions/checkout` | Stripe session URL returned |
| 4 | Webhook: checkout complete | `POST /api/webhooks/stripe` | Subscription created in DB |
| 5 | Cancel subscription | `POST /api/subscriptions/cancel` | `cancel_at_period_end` = true |
| 6 | Resume subscription | `POST /api/subscriptions/resume` | `cancel_at_period_end` = false |

> **Note:** Stripe tests require test-mode keys. Mark as conditional if keys unavailable.

---

## 5. Phase 4 — API Contract Validation

Validate that every backend endpoint returns the correct response shape expected by the frontend TypeScript types.

### 5.1 Response Schema Checks

| Endpoint | Frontend Type | Key Fields to Validate |
|----------|---------------|----------------------|
| `POST /api/auth/login` | `{ user: User, token: string }` | `user.id`, `user.role`, `user.email`, `token` is non-empty string |
| `GET /api/auth/me` | `User` | All User fields present including `email_verified_at` |
| `POST /api/calculator/estimate` | `{ quote_request_id, quotes: Quote[] }` | Each quote has `carrier_id`, `monthly_premium`, `annual_premium`, `coverage_details` |
| `GET /api/marketplace/agents` | `Agent[]` | Each agent has `id`, `name`, `agency`, `rating`, `specialties`, `states_licensed` |
| `GET /api/applications` | `{ data: Application[], counts }` | `status` is one of: draft, submitted, underwriting, approved, declined, bound, withdrawn |
| `GET /api/policies` | `{ data: Policy[], counts }` | `status` is one of: active, cancelled, expired, lapsed, pending_renewal |
| `GET /api/crm/leads` | `{ data: Lead[], counts }` | `status` matches `LeadStatus` enum, `source` matches source enum |
| `GET /api/commissions` | `{ data: Commission[], total }` | `amount`, `status`, `policy_id` present |
| `GET /api/stats/dashboard` | Role-specific stats object | Varies by role — test each demo account |
| `GET /api/admin/analytics` | `{ monthly_users, totals }` | Arrays with `month`, `count` fields |

### 5.2 Error Response Format

All error responses should follow a consistent shape:

```json
{
  "message": "Human-readable error message",
  "errors": {
    "field_name": ["Validation message"]
  }
}
```

Validate on:
- [ ] 422 Validation errors include `errors` object with field-level messages
- [ ] 401 Unauthenticated returns `{ message: "Unauthenticated." }`
- [ ] 404 Not Found returns `{ message: "..." }`
- [ ] 500 Server Error returns generic message (no stack traces in production)

### 5.3 Pagination & Filtering

| Endpoint | Params to Test | Expected Behavior |
|----------|---------------|-------------------|
| `GET /api/admin/users` | `?role=agent&search=john` | Filtered results, correct counts |
| `GET /api/crm/leads` | `?status=new` | Only leads with status=new |
| `GET /api/admin/invites` | `?status=pending` | Only pending invites |
| `GET /api/applications` | Default | Includes status counts in response |

---

## 6. Phase 5 — Security Testing

### 6.1 Authentication Security

| # | Test | Method | Expected Result | Severity |
|---|------|--------|-----------------|----------|
| S1 | Brute force login | 10+ rapid `POST /api/auth/login` with wrong password | Rate limiting kicks in (429) or account lockout | Critical |
| S2 | Token in URL (query string) | Manually pass token in URL | Token should ONLY be in Authorization header, never query string | Critical |
| S3 | Token leakage in logs | Check `storage/logs/laravel.log` | No auth tokens logged | Critical |
| S4 | Password hashing | Check DB `users.password` column | bcrypt hash, never plaintext | Critical |
| S5 | Password reset token reuse | Use same reset token twice | Second use rejected | High |
| S6 | Email enumeration via login | Login with valid vs invalid email | Same error message for both ("Invalid credentials") | High |
| S7 | Email enumeration via forgot-password | Forgot password with valid vs invalid email | Same success message for both | High |
| S8 | Token expiration | Sanctum tokens have no TTL (by config) | Document risk — recommend adding expiration | Medium |
| S9 | Concurrent sessions | Login from two clients | Both tokens valid (expected for API tokens) | Low |

### 6.2 Authorization & Tenant Isolation

| # | Test | Method | Expected Result | Severity |
|---|------|--------|-----------------|----------|
| S10 | Agent accesses another agency's leads | `GET /api/crm/leads` with Agent A's token (agency 1) | Only agency 1 leads returned, no cross-tenant data | Critical |
| S11 | Consumer accesses admin endpoints | `GET /api/admin/users` with consumer token | 403 or empty result | Critical |
| S12 | Agent impersonates agency scope | `GET /api/crm/leads?agency_id=999` | `agency_id` override ignored for non-admin | Critical |
| S13 | IDOR on user profile | `GET /api/admin/users/999` with agent token | Rejected or 403 | Critical |
| S14 | IDOR on application | `GET /api/applications/999` (another user's) | 403 or 404 (not the other user's data) | Critical |
| S15 | IDOR on policy | `GET /api/policies/999` (another user's) | 403 or 404 | Critical |
| S16 | IDOR on lead | `GET /api/crm/leads/999` (another agency's) | 403 or 404 | Critical |
| S17 | Admin approve self | `PUT /api/admin/users/{own_id}/approve` | Should be no-op or rejected | Medium |
| S18 | Delete last admin | Delete/deactivate the only superadmin | Should be prevented | High |

### 6.3 Injection Attacks

| # | Test | Vector | Payload Example | Expected Result | Severity |
|---|------|--------|-----------------|-----------------|----------|
| S19 | SQL injection — login email | `POST /api/auth/login` | `email: "' OR 1=1 --"` | Rejected by validation, no SQL error | Critical |
| S20 | SQL injection — search | `GET /api/admin/users?search=` | `search: "'; DROP TABLE users; --"` | Parameterized query, no effect | Critical |
| S21 | SQL injection — agent search | `GET /api/marketplace/agents?search=` | `search: "1' UNION SELECT * FROM users --"` | No data leak | Critical |
| S22 | XSS — user name | `POST /api/auth/register` | `name: "<script>alert(1)</script>"` | Stored safely, rendered escaped in frontend | Critical |
| S23 | XSS — lead notes | `POST /api/crm/leads/{id}/activity` | `notes: "<img onerror=alert(1) src=x>"` | Escaped on render | High |
| S24 | XSS — review text | `POST /api/agents/{id}/reviews` | `text: "<svg onload=alert(1)>"` | Escaped on render | High |
| S25 | XSS — plan features | `POST /api/admin/plans` | `features: ["<script>..."]` | Escaped on render | High |
| S26 | Command injection | Any file upload endpoint | Filename: `; rm -rf /` | Filename sanitized | Critical |
| S27 | Path traversal | File upload | Filename: `../../etc/passwd` | Rejected or sanitized | Critical |
| S28 | Mass assignment | `PUT /api/auth/profile` | Include `role: "superadmin"` in body | `role` not in `$fillable` for profile update, ignored | Critical |
| S29 | Mass assignment — user update | `PUT /api/admin/users/{id}` | Include `password: "hacked"` | Only allowed fields updated | Critical |

### 6.4 CORS & Headers

| # | Test | Expected Result | Severity |
|---|------|-----------------|----------|
| S30 | Preflight from allowed origin (`localhost:5173`) | `Access-Control-Allow-Origin: http://localhost:5173`, credentials allowed | Critical |
| S31 | Preflight from disallowed origin (`evil.com`) | No CORS headers or `null` origin | Critical |
| S32 | Wildcard origin with credentials | Must NOT have `*` with `supports_credentials: true` | Critical |
| S33 | Security headers present | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` | High |
| S34 | No server version leak | `Server` header doesn't reveal Laravel/PHP version | Medium |
| S35 | HTTPS enforcement (production) | HTTP redirects to HTTPS | High |

### 6.5 Stripe Webhook Security

| # | Test | Expected Result | Severity |
|---|------|-----------------|----------|
| S36 | Webhook without Stripe signature | `POST /api/webhooks/stripe` with no `Stripe-Signature` header | 400 or signature verification failure | Critical |
| S37 | Webhook with forged signature | Invalid `Stripe-Signature` value | Rejected | Critical |
| S38 | Webhook replay attack | Replay a valid webhook payload | Rejected (timestamp too old) | High |

### 6.6 Rate Limiting

| # | Test | Expected Result | Severity |
|---|------|-----------------|----------|
| S39 | Login endpoint rate limit | 10+ requests in 1 second | 429 Too Many Requests | High |
| S40 | Registration rate limit | 5+ registrations from same IP | 429 or CAPTCHA required | High |
| S41 | Password reset rate limit | Multiple reset requests | Throttled (60s between requests per `auth.php` config) | High |
| S42 | API general rate limit | 100+ requests/minute | 429 with `Retry-After` header | Medium |

### 6.7 Data Exposure

| # | Test | Expected Result | Severity |
|---|------|-----------------|----------|
| S43 | User password in API response | `GET /api/auth/me`, `GET /api/admin/users` | `password` field hidden (`$hidden` in User model) | Critical |
| S44 | MFA secret in API response | Any user-returning endpoint | `mfa_secret` and `mfa_backup_codes` hidden | Critical |
| S45 | Other users' tokens exposed | Admin user list | No `api_tokens` in response | Critical |
| S46 | Stack traces in production | Trigger a 500 error with `APP_DEBUG=false` | Generic error message, no stack trace | High |
| S47 | `.env` file accessible via web | `GET /.env` | 404 or 403, never served | Critical |
| S48 | Debug routes (`_debugbar`, `telescope`) | Visit debug URLs | 404 in production | High |

---

## 7. Phase 6 — Data Integrity & Edge Cases

### 7.1 Concurrency & Race Conditions

| # | Test | Expected Result |
|---|------|-----------------|
| D1 | Double-submit application | Only one submission processed, second returns error or idempotent |
| D2 | Concurrent lead status updates | Last write wins, no data corruption |
| D3 | Two agents accept same lead simultaneously | One succeeds, one gets conflict error |
| D4 | Duplicate invite to same email | 422, "Invite already pending" |

### 7.2 Boundary & Edge Cases

| # | Test | Expected Result |
|---|------|-----------------|
| D5 | ZIP code with letters | Validation rejects ("12abc") |
| D6 | ZIP code empty string | Validation requires non-empty |
| D7 | Premium with negative value | Rejected at API level |
| D8 | Date in the past for policy effective_date | Validation rejects or flags warning |
| D9 | Extremely long name (1000+ chars) | Truncated or rejected by DB constraint |
| D10 | Unicode characters in all text fields | Accepted and stored correctly (UTF-8) |
| D11 | Empty JSON body on POST endpoints | 422 with validation errors |
| D12 | Content-Type: text/plain on JSON endpoint | 415 or parse error |

### 7.3 State Machine Integrity

| # | Flow | Invalid Transitions to Test |
|---|------|---------------------------|
| D13 | Application status | `draft` → `approved` (must go through `submitted` first) |
| D14 | Application status | `declined` → `submitted` (terminal state) |
| D15 | Policy status | `cancelled` → `active` (should require renewal) |
| D16 | Lead status | `won` → `new` (backward transition) |
| D17 | Insurance profile | Skip pipeline stages (must advance sequentially) |

### 7.4 Referral System Integrity

| # | Test | Expected Result |
|---|------|-----------------|
| D18 | Self-referral | Rejected — cannot use own referral code |
| D19 | Invalid referral code | `POST /api/referrals/validate` → 404 or error |
| D20 | Referral code reuse by same user | Only first use counts |
| D21 | Leaderboard accuracy | `GET /api/referrals/leaderboard` → counts match actual referrals |

---

## 8. Phase 7 — Performance & Reliability

### 8.1 Response Time Targets

| Endpoint Category | Target (p95) | Method |
|-------------------|-------------|--------|
| Auth (login/register) | < 500ms | Load test with k6 or Artillery |
| Quote estimation | < 2s | `POST /api/calculator/estimate` |
| Dashboard stats | < 1s | `GET /api/stats/dashboard` |
| List endpoints (paginated) | < 500ms | `GET /api/applications`, etc. |
| Admin user list (1000+ users) | < 1s | Seed with bulk data, test response time |

### 8.2 Frontend Performance

| # | Test | Target | Tool |
|---|------|--------|------|
| P1 | Initial page load (Landing) | < 3s on 3G | Lighthouse |
| P2 | Lazy-loaded page load | < 1s on broadband | React DevTools Profiler |
| P3 | Bundle size (main chunk) | < 200KB gzipped | `npm run build` → inspect dist |
| P4 | Vendor chunk size | < 150KB gzipped | Vite output |
| P5 | No layout shifts (CLS) | < 0.1 | Lighthouse |
| P6 | React Query cache hit | Cached data shown immediately, refetch in background | React Query DevTools |

### 8.3 Reliability

| # | Test | Expected Result |
|---|------|-----------------|
| P7 | API timeout (backend down) | Frontend shows error state within 30s (client timeout) |
| P8 | Partial API failure (one endpoint down) | Other dashboard sections still render |
| P9 | Database connection lost | Laravel returns 500 with message, no hang |
| P10 | Stripe API down | Checkout returns error, no crash |

---

## 9. Phase 8 — Accessibility (WCAG 2.1 AA)

### 9.1 Keyboard Navigation

- [ ] All interactive elements reachable via Tab
- [ ] Logical tab order (left-to-right, top-to-bottom)
- [ ] Enter submits forms
- [ ] Escape closes modals
- [ ] Focus indicator visible on all elements (no `outline: none` without replacement)
- [ ] Skip-to-content link on dashboard

### 9.2 Screen Reader

- [ ] All form inputs have associated `<label>` or `aria-label`
- [ ] Error messages linked via `aria-describedby`
- [ ] Status badges have `aria-label` (not color-only)
- [ ] Icon-only buttons have `aria-label` (e.g., call, email icons in Leads)
- [ ] Page titles set via `document.title` on route change
- [ ] Loading states announced via `aria-live="polite"`

### 9.3 Color Contrast

- [ ] Body text (#1f2937 on white) — passes AA (ratio > 4.5:1)
- [ ] Shield Blue (#2563eb on white) — verify ratio for small text
- [ ] Success green (#16a34a on white) — verify ratio
- [ ] Error red on red-50 background — verify ratio
- [ ] Badge text on colored backgrounds — verify all variants

### 9.4 Responsive Design

- [ ] Dashboard sidebar collapses on mobile (< 768px)
- [ ] Forms usable on 320px viewport
- [ ] Tables horizontally scrollable on mobile
- [ ] Touch targets ≥ 44x44px
- [ ] No horizontal overflow on any viewport

---

## 10. Tooling & Infrastructure

### 10.1 Recommended Test Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| **Backend unit/feature** | PHPUnit (built into Laravel) | Controller, model, middleware tests |
| **Backend API tests** | Laravel HTTP tests | Full request/response cycle |
| **Frontend unit** | Vitest + React Testing Library | Component and hook tests |
| **Frontend integration** | Vitest + MSW (Mock Service Worker) | Service layer + auth flow tests |
| **E2E** | Playwright or Cypress | Full browser flows across frontend + backend |
| **Security scanning** | OWASP ZAP (automated) | XSS, injection, header checks |
| **Load testing** | k6 or Artillery | Response time and concurrency |
| **Accessibility** | axe-core + Lighthouse | WCAG compliance |
| **Dependency audit** | `npm audit` / `composer audit` | Known vulnerability detection |

### 10.2 CI/CD Integration (GitHub Actions)

```
on: [push, pull_request]

jobs:
  backend-tests:
    - composer install
    - php artisan migrate --seed
    - php artisan test

  frontend-tests:
    - npm ci
    - npm run type-check (tsc --noEmit)
    - npm run test (vitest)
    - npm run build

  security-scan:
    - npm audit --audit-level=high
    - composer audit
    - OWASP ZAP baseline scan (on staging)

  e2e-tests:
    - Start backend + frontend
    - Run Playwright suite
```

### 10.3 Test Data Strategy

| Environment | Strategy |
|-------------|----------|
| Local development | Seeders with 6 demo users, 10 carriers, 5 plans |
| CI pipeline | `migrate:fresh --seed` per run (clean slate) |
| Staging | Seeders + manually created test accounts |
| Load testing | Factory-generated bulk data (1000+ users, 10000+ leads) |

---

## 11. Known Issues & Gaps

### 11.1 Current Gaps Found During Review

| # | Issue | Severity | Location | Recommendation |
|---|-------|----------|----------|----------------|
| 1 | **No route guards on frontend** — DashboardLayout doesn't redirect unauthenticated users | High | `DashboardLayout.tsx` | Add `useEffect` redirect to `/login` when `!isAuthenticated && !isLoading` |
| 2 | **No admin role check on admin API routes** — relies on frontend nav hiding only | Critical | `routes/api.php` | Add `role:admin,superadmin` middleware to admin route group |
| 3 | **Sanctum tokens never expire** — `expiration: null` in config | Medium | `config/sanctum.php` | Set `expiration` to 1440 (24 hours) or appropriate TTL |
| 4 | **No rate limiting configured** — default Laravel throttle not applied to auth routes | High | `routes/api.php` | Add `throttle:5,1` to login/register routes |
| 5 | **No Form Request validation classes** — all validation inline in controllers | Medium | `app/Http/Requests/` | Extract to FormRequest classes for consistency |
| 6 | **Mock data in frontend pages** — MyQuotes and Leads use hardcoded arrays | Medium | `MyQuotes.tsx`, `Leads.tsx` | Replace with `useQuery` + service calls |
| 7 | **No Error Boundary** — React app crashes on unhandled exceptions | Medium | `App.tsx` | Wrap routes in `<ErrorBoundary>` component |
| 8 | **10 high-severity npm audit vulnerabilities** | High | `frontend/package.json` | Run `npm audit fix` and review |
| 9 | **No root `.gitignore`** — OS/editor files may be committed | Low | `/` | Add standard `.gitignore` |
| 10 | **Stripe webhook signature not verified** — controller may not check signature | High | `SubscriptionController.php` | Verify `Stripe-Signature` header against webhook secret |

### 11.2 Missing Backend Tests

No test files exist. Priority test areas:

1. `AuthController` — registration, login, verification, password reset
2. `EnsureAgencyScope` middleware — tenant isolation
3. `AdminController` — RBAC enforcement
4. `QuoteController` — estimate calculation
5. `ApplicationController` — status transitions
6. `InviteController` — token lifecycle

---

## 12. Sign-Off Checklist

### Pre-Launch Gate (All must pass)

- [ ] **Auth:** All 6 demo accounts can login and see role-appropriate dashboard
- [ ] **Quotes:** Calculator → Results → Account Creation flow completes end-to-end
- [ ] **RBAC:** No role can access another role's data (tested per §6.2)
- [ ] **Tenant Isolation:** Agency A cannot see Agency B's leads, applications, or profiles
- [ ] **Injection:** SQL injection and XSS tests pass on all text input endpoints (§6.3)
- [ ] **CORS:** Only whitelisted origins accepted (§6.4)
- [ ] **No Data Leaks:** Passwords, MFA secrets, tokens never in API responses (§6.7)
- [ ] **Error Handling:** No stack traces with `APP_DEBUG=false`
- [ ] **HTTPS:** All production traffic over TLS
- [ ] **Dependency Audit:** Zero critical/high vulnerabilities in `npm audit` and `composer audit`
- [ ] **Build:** `tsc --noEmit` and `vite build` pass with zero errors
- [ ] **Smoke Test:** All 60+ API endpoints return expected status codes

### Post-Launch Monitoring

- [ ] Error tracking service configured (Sentry or similar)
- [ ] Uptime monitoring on API health endpoint
- [ ] Log aggregation for auth failures and 500 errors
- [ ] Stripe webhook delivery monitoring
- [ ] Database backup schedule confirmed

---

*This plan covers 100+ individual test cases across 8 phases. Prioritize Phases 1 (Auth), 2 (Public Flows), and 5 (Security) before any production deployment.*
