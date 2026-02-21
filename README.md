# InsureFlow - Insurance Quote & Lead Generation Platform

## Overview
InsureFlow is the modern insurance marketplace that connects consumers with licensed agents and carriers — similar to how Solarera connects homeowners with solar installers. Instant multi-carrier quotes, smart agent matching, application tracking, and a commission-based revenue model. Built for independent insurance agents, agencies, and carriers who need a digital storefront and lead pipeline.

## The Problem
- Getting insurance quotes is painful: call 5 agents, repeat your info, wait days for callbacks
- Independent agents ($250B market) have no affordable digital lead generation tools
- Carriers want digital distribution but building direct-to-consumer is expensive
- Consumers can't easily compare quotes across carriers side-by-side
- Lead gen companies (QuoteWizard, EverQuote) charge $15-50 per lead with no agent loyalty

## The Solution
- **Instant Quote Calculator** — Enter info once, get multi-carrier quotes in seconds (like Solarera's solar calculator)
- **Agent Marketplace** — Verified licensed agents with ratings, specialties, response times
- **Smart Matching** — Match consumers to agents by coverage type, location, carrier access
- **Application Tracking** — Full pipeline: Quote → Application → Underwriting → Bound → Active
- **Agent Dashboard** — Lead management, quote tracking, commission tracking, CRM
- **Consumer Portal** — Compare quotes, track applications, manage active policies, file claims
- **Carrier Portal** — Publish rates, manage agent network, track production

## Target Market
- 1.2M+ licensed insurance agents in the US
- 40,000+ independent agencies
- $1.3T US insurance premium market
- 85% of consumers research insurance online before buying
- Average agent spends $500-2,000/mo on lead generation

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Laravel 12 + PHP 8.4
- **Database:** PostgreSQL
- **Payments:** Stripe (subscription + commission tracking)
- **Rating Engine:** Custom multi-carrier quote API integration
- **Notifications:** Twilio (SMS) + SendGrid (Email)
- **Hosting:** Vercel + Railway

## User Roles
1. **Consumer** — Get quotes, compare plans, apply, manage policies
2. **Agent** — Receive leads, manage quotes, track applications, CRM
3. **Agency Owner** — All agent features + team management, commissions, analytics
4. **Carrier** — Rate management, agent network, production reports
5. **Admin** — Platform management, analytics

## Revenue Model
- **Agent Free Tier:** Profile listing, up to 10 leads/month
- **Agent Pro ($49/mo):** Unlimited leads, CRM, quote tools, priority matching
- **Agency ($149/mo):** Team management, commission tracking, branded portal
- **Per-Lead Fee:** $5-25 per qualified lead (varies by insurance type)
- **Carrier API Access:** Custom pricing for rate integration
- **Referral Commission:** 10-15% of agent's first-year commission on platform-matched policies

## Quick Start
```bash
cd frontend && npm install && npm run dev
cd laravel-backend && composer install && php artisan serve
```
