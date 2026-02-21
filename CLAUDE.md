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

## Current Status (as of 2026-02-20)
- **Frontend:** 30 pages built, TypeScript passes, Vite build succeeds
- **Backend:** Laravel scaffold created (15 migrations, 14 models, 10 controllers, routes, 4 seeders)
- **Seed Data:** 5 subscription plans, 10 carriers with products, 6 demo users

## Recent Work
- Initial project scaffold created
- Complete frontend with all 30 pages
- Complete backend scaffold with models, migrations, controllers, routes, seeders

## Next Tasks
- Deploy backend to Railway
- Deploy frontend to GitHub Pages
- Test all API endpoints end-to-end
- Add real carrier integrations
