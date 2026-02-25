# Insurons Admin & Superadmin User Guide

## Overview

Admins manage the Insurons platform: users, agencies, carriers, products, subscription plans, compliance, rate tables, audit logs, and platform settings. Superadmins have additional access to platform-wide configuration and system health.

---

## Admin Dashboard

Platform-wide metrics at a glance:
- **Total users** by role (consumer, agent, agency owner, carrier, admin)
- **Total agencies** and active agents
- **Application pipeline** (draft → submitted → underwriting → approved → bound)
- **Revenue trends** (subscriptions, marketplace fees, commissions)
- **Subscription status** (active, trialing, expired)

---

## User Management

**Path:** Admin → Users

### User List
- Search and filter by email, name, role, agency, status
- View user details: role, agency assignment, created date, verification status

### Actions
- **Create user:** Set name, email, role, agency — password auto-generated
- **Edit user:** Update any field including role and agency assignment
- **Reset password:** Generate a temporary password (displayed once)
- **Approve/Deactivate:** Toggle user access
- **Bulk actions:** Activate/deactivate multiple users at once

---

## Agency Management

**Path:** Admin → Agencies

### Agency List
- Name, license state, owner, agent count, status, verification badge

### Actions
- **View detail:** Full agency info, team size, revenue, compliance status
- **Edit:** Update any agency field
- **Verify/Unverify:** Toggle verification badge (appears on marketplace)
- **Activate/Deactivate:** Enable/disable agency access
- **NPN verification:** Verify agency's National Producer Number

---

## Carrier Management

**Path:** Admin → Carriers

### Carrier List
- Name, type, AM Best rating, status, products count

### Actions
- **Create carrier:** Name, type, AM Best rating, logo, website, description
- **Edit:** Update carrier details
- **View products:** List carrier's products
- **API configuration:** Set up rate API (base URL, auth, adapter type, field mapping)
- **Test connection:** Verify carrier API connectivity

---

## Product Management

**Path:** Admin → Products

Manage the master list of platform insurance products.

### Actions
- **View all products:** Name, slug, category, status
- **Toggle active:** Enable/disable products platform-wide
- **Bulk toggle:** Activate/deactivate multiple products at once
- **Sync products:** Resync from master product list

### Product Visibility System (3 layers)
1. **Platform level:** Admin enables/disables products here
2. **Agency level:** Agency owners activate products for their agency
3. **Carrier level:** Carrier appointments determine which carriers offer each product

A product must be active at all 3 levels for an agent to quote it.

---

## Subscription Plans

**Path:** Admin → Plans

### Plan Management
- **List plans:** Name, price (monthly/annual), tier, role, status, features
- **Create plan:** Name, description, price, role targeting, feature limits
- **Edit plan:** Update pricing, features, or status
- **Activate/Deactivate:** Toggle plan availability
- **Delete plan:** Remove unused plans

### Stripe Sync
Run `stripe:sync-plans` to create corresponding Stripe products and prices. Plans include:
- Leads per month limit
- Team size limit
- Feature flags (marketplace access, reports, white-label, etc.)

---

## Rate Tables

**Path:** Admin → Rate Tables

Manage carrier rating tables for premium calculation.

### Structure
Each rate table contains:
- **Entries:** Base rates by age, gender, class
- **Factors:** Multipliers (elimination period, benefit period, inflation, etc.)
- **Riders:** Optional add-on coverages
- **Fees:** Policy fees and surcharges

### Actions
- **Create/Edit:** Full CRUD for tables and all sub-resources
- **Import CSV:** Bulk import base rates
- **Clone:** Duplicate an existing table for a new version
- **Toggle status:** Activate/deactivate tables
- **Audit:** View rating history per scenario

---

## Compliance Management

**Path:** Admin → Compliance

### Requirements (Superadmin)
- **Master list:** 39+ state-specific compliance requirements
- **CRUD:** Create, edit, delete requirements
- **Categories:** License, CE, E&O
- **States:** Per-state requirement configuration
- **Auto-generation:** System builds compliance packs for agents based on state + product type

### Overview Dashboard
- Total agents by compliance status
- Overdue items across the platform
- Expiration alerts by category

---

## Audit Log

**Path:** Admin → Audit Log

Immutable, SOC 2-grade audit trail:
- **UUID primary keys** (no sequential guessing)
- **No updates or deletes** (append-only)
- **Every record shows:**
  - Actor (user ID, role, IP address, user agent)
  - Action (created, updated, deleted)
  - Model type and ID
  - Old vs. new values (JSON diff)
  - Timestamp
- **Filters:** By actor, model, date range, action type

---

## SSO Configuration

**Path:** Admin → SSO Config

Set up SAML 2.0 single sign-on for agencies:
- **Configure:** Entity ID, SSO URL, certificate, per agency
- **Metadata endpoint:** Download SAML metadata for identity provider setup
- **ACS callback URL:** Configure in your IdP
- **Enable/Disable:** Toggle SSO per agency
- **Test:** Verify the login flow end-to-end

---

## Insurance Profiles

**Path:** Admin → Profiles

View unified insurance profiles (consumers with activity history):
- Consumer name, insurance type, email, phone, pipeline stage
- Related leads, scenarios, and engagement events
- Profile statistics and source breakdown

---

## Analytics

**Path:** Admin → Analytics

Platform-wide analytics:
- **Conversion funnel:** By source, insurance type, agency
- **Revenue:** By agency, carrier, time period
- **Agent performance:** Top agents by revenue, applications, policies
- **Claims:** Count, status distribution, average cost
- **Subscription metrics:** Active subscribers, churn, MRR

---

## Help Center Management

Create and manage knowledge base content:
- **Categories:** Create, edit, delete help categories
- **Articles:** Create, edit, delete articles within categories
- **Slug-based URLs:** SEO-friendly article URLs
- **Voting data:** See which articles are helpful

---

## Embed Widget Partners

Manage third-party partners who embed the Insurons quote widget:
- **Create partner:** Name, allowed domains, commission share, contact info
- **API key management:** Generate and regenerate keys
- **Widget code:** Auto-generated `<script>` tag for partners
- **Analytics:** Sessions, conversions, conversion rate, by domain
- **Activate/Deactivate:** Instantly revoke a partner's widget

See [EMBED_WIDGET.md](EMBED_WIDGET.md) for full documentation.

---

## Superadmin: Platform Settings

**Path:** Platform Settings (7 tabs)

### 1. General
Platform name, logo, brand colors, timezone, language defaults, domain configuration.

### 2. Billing
Stripe account configuration, platform fee percentage, payment settings.

### 3. Email
SMTP settings (SendGrid, AWS SES), email template defaults, domain verification (SPF, DKIM).

### 4. Security
Password policy (min length, complexity), 2FA requirements, session timeout, IP whitelist.

### 5. Integrations
API keys for third-party services: Stripe, Anthropic (AI chat), Twilio, SendGrid.

### 6. Compliance
Master compliance requirements CRUD, auto-generation algorithm config, expiration thresholds.

### 7. Advanced
Feature flags, rate limiting, background job config, cache settings, API version management.

### System Health
- Test email delivery
- Test Stripe connectivity
- View system health metrics (uptime, request latency)

---

## Superadmin: Platform Overview

High-level platform metrics:
- Users by role
- Agencies and agents
- Applications and policies
- Revenue summary
- System health
- Recent signups and activity

---

## Admin API Keys & Webhooks

### API Keys
- Generate API keys for programmatic access
- Set permissions per key (read/write scopes)
- Track usage and access logs
- Regenerate keys if compromised

### Webhooks
- Configure webhook URLs for real-time event notifications
- Select event types to subscribe to
- View delivery logs with retry capability
- Test webhooks with sample payloads

---

## Quick Reference

| Task | Path |
|------|------|
| Create a user | Admin → Users → Create |
| Verify an agency | Admin → Agencies → {agency} → Verify |
| Add a carrier | Admin → Carriers → Create |
| Toggle a product | Admin → Products → Toggle |
| Manage plans | Admin → Plans |
| View audit log | Admin → Audit Log |
| Configure SSO | Admin → SSO Config |
| Manage rate tables | Admin → Rate Tables |
| Platform settings | Platform Settings (Superadmin) |
| System health | Platform Settings → Test/Health |
