# InsureFlow - Development Plan

## Vision
The modern insurance marketplace — instant quotes, smart agent matching, and a seamless application pipeline for consumers, agents, and carriers. The "Solarera for insurance."

---

## Phase 1: MVP (Weeks 1-8)
**Goal:** Consumers get instant quotes and connect with agents; agents get a digital storefront

### Week 1-2: Project Setup & Auth
- Scaffold React 18 + TypeScript + Vite + Tailwind frontend
- Scaffold Laravel 12 backend with PostgreSQL
- Auth system (register, login, roles: consumer, agent, agency_owner, carrier, admin)
- Agency profile setup (license, E&O)
- Agent profile setup (license, NPN, specialties, carriers)
- Dashboard layout with role-based sidebar

### Week 3-4: Quote Calculator (Core Feature)
- Insurance type selection (auto, home, life, renters, health)
- Dynamic quote forms per type (auto: drivers + vehicles, home: address + details, etc.)
- Multi-carrier quote engine (calculate premiums from carrier products database)
- Quote results with side-by-side comparison cards
- Best value / recommended highlighting
- Save quotes to account
- Coverage detail breakdown

### Week 5-6: Agent Marketplace & Matching
- Agent search (location, specialty, carrier access, rating)
- Agent profile pages (bio, reviews, response time)
- Smart agent matching algorithm (specialty + location + rating + load balancing)
- Consumer → Agent connection flow
- Basic lead management for agents

### Week 7-8: MVP Polish & Launch
- Agent dashboard (leads, quotes, conversion rate)
- Consumer dashboard (saved quotes, connected agents)
- Carrier directory with products
- Deploy: Vercel + Railway

**MVP Deliverable:** Consumers get instant multi-carrier quotes and find matching agents. Agents receive leads and manage their pipeline.

---

## Phase 2: Pipeline & CRM (Weeks 9-16)
- Application pipeline (quote → apply → underwriting → bound)
- Document upload and management
- Agent CRM (lead pipeline, activities, follow-ups, reminders)
- Quote PDF generation and email sending
- Consumer portal (applications, policies, messages)
- Agent quote tools (quick quote from CRM, re-quote)

---

## Phase 3: Policies & Commissions (Weeks 17-24)
- Policy management (active tracking, documents, renewals)
- Claims filing and tracking
- Commission tracking (per policy, monthly summary, payout)
- Agent reviews and ratings
- Analytics dashboards (agent, agency, carrier, platform)
- Renewal reminders and coverage gap detection

---

## Phase 4: Scale (Weeks 25+)
- Real-time carrier rate API integrations
- Automated application submission
- E-signature for applications
- Bundle quoting (auto + home)
- White-label agent websites
- AI coverage recommendations
- SEO landing pages by state/type

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind |
| Backend | Laravel 12 + PHP 8.4 |
| Database | PostgreSQL |
| Payments | Stripe (subscriptions + lead fees) |
| PDFs | DomPDF (quote summaries, policy docs) |
| Notifications | Twilio (SMS) + SendGrid (Email) |
| Hosting | Vercel + Railway |

---

## Revenue Projections (Year 1)
| Month | Agents | MRR |
|-------|--------|-----|
| 3 | 50 free, 15 paid | $1K |
| 6 | 200 free, 60 paid | $5K |
| 9 | 600 free, 200 paid | $15K |
| 12 | 1500 free, 500 paid | $35K |

Plus per-lead fees ($5-25 each) and referral commissions (10-15% of first-year commission on platform-matched policies).

---

## Competitive Landscape
| Competitor | Model | Gap We Fill |
|-----------|-------|-------------|
| Policygenius | Consumer comparison | No agent tools, limited carriers |
| QuoteWizard | Lead gen → sell leads | Expensive leads ($15-50), no loyalty |
| EverQuote | Lead gen → sell leads | Same — agents get cold leads, no CRM |
| The Zebra | Consumer comparison | Auto only, no agent marketplace |
| Bolt (Insurance) | Agent quoting tool | Agent-only, no consumer marketplace |
| AgencyZoom | Agent CRM | CRM only, no consumer-facing quote engine |

**Our edge:** Two-sided marketplace (consumer quotes + agent storefront + CRM), affordable lead gen, full pipeline tracking, commission transparency.

---

## Funding Path
1. **Bootstrap** (Months 1-6): Build MVP, get 50 agents + 1,000 quote requests
2. **InsurTech Accelerators** (Month 4+): Techstars (Hartford), Y Combinator
3. **Seed Round** ($500K-1M, Month 9+): Scale marketplace both sides
4. **Target Investors:** Ribbit Capital, QED Investors, MassMutual Ventures, Plug and Play InsurTech

---

## Engineering Patterns & Standards (Learned from Solarera & ClinicLink)

### Architecture Overview
```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Auth     │  │ Quote    │  │ Pipeline          │  │
│  │ Context  │  │ Context  │  │ Context           │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
│  ┌──────────────────────────────────────────────┐    │
│  │         API Service Layer (Typed)             │    │
│  │  auth.ts | quotes.ts | agents.ts              │    │
│  │  applications.ts | policies.ts | carriers.ts  │    │
│  │  crm.ts | analytics.ts | portal.ts           │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │ Axios + Sanctum Token
┌──────────────────────▼──────────────────────────────┐
│                  Backend (Laravel 12)                 │
│  ┌─────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │ Sanctum │  │ Agency       │  │ Rate Limiting │   │
│  │ Auth    │  │ Scoping MW   │  │ Middleware    │   │
│  └─────────┘  └──────────────┘  └───────────────┘   │
│  ┌──────────────────────────────────────────────┐    │
│  │         Controller Layer                      │    │
│  │  Quote | Agent | Application | Policy         │    │
│  │  Carrier | CRM | Analytics | Portal           │    │
│  └──────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────┐    │
│  │  Rating Engine (Multi-Carrier Quote Calc)     │    │
│  │  DomPDF (Quote PDFs) | Stripe (Subscriptions) │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────▼────────┐
              │   PostgreSQL    │
              └─────────────────┘
```

### Quote Engine Architecture (Core — Like Solarera's Solar Calculator)

**Rating Engine Pattern:**
```php
class RatingEngine {
    public function calculateQuotes(QuoteRequest $request): Collection
    {
        $products = CarrierProduct::where('type', $request->insurance_type)
            ->whereJsonContains('states_available', $request->state)
            ->where('is_active', true)
            ->with('carrier')
            ->get();

        return $products->map(function ($product) use ($request) {
            $premium = $this->calculatePremium($product, $request->details);
            $discounts = $this->applyDiscounts($product, $request->details);

            return Quote::create([
                'quote_request_id' => $request->id,
                'carrier_product_id' => $product->id,
                'carrier_id' => $product->carrier_id,
                'monthly_premium' => $premium / 12,
                'annual_premium' => $premium,
                'coverage_details' => $this->buildCoverageDetails($product, $request),
                'discounts_applied' => $discounts,
                'expires_at' => now()->addDays(30),
            ]);
        })->sortBy('annual_premium');
    }
}
```

**Consumer Quote Flow (mirrors Solarera calculator flow):**
```
1. Landing page → "Get Your Free Quote" CTA
2. Select insurance type (auto/home/life/etc.)
3. Step-by-step form (2-4 steps depending on type)
4. Calculating animation (like Solarera's "analyzing your home")
5. Results page: side-by-side carrier comparison cards
6. Select quote → Register/Login → Pre-fill application
7. Match with agent → Application submitted
```

### Smart Agent Matching Algorithm
```php
// Score agents for a consumer based on multiple factors
$agents = AgentProfile::query()
    ->where('license_state', $state)
    ->where('is_active', true)
    ->whereJsonContains('specialties', $insuranceType)
    ->get()
    ->map(function ($agent) use ($carrierIds) {
        $score = 0;
        $score += $agent->rating * 20;                // Max 100 (rating × 20)
        $score += min($agent->years_experience, 10) * 5; // Max 50
        $score += (24 - $agent->response_time_hours) * 2; // Max 48 (faster = higher)
        // Bonus if agent is appointed with consumer's preferred carrier
        $appointed = collect($agent->carriers_appointed);
        $overlap = $appointed->intersect($carrierIds)->count();
        $score += $overlap * 15;
        return ['agent' => $agent, 'score' => $score];
    })
    ->sortByDesc('score')
    ->take(3);
```

### API Design Standards

**Agency-Scoped Queries (Agent Side):**
```php
// Agent sees own leads; agency owner sees all agency leads
if (auth()->user()->role === 'agency_owner') {
    $query->where('agency_id', auth()->user()->agency_id);
} else {
    $query->where('agent_id', auth()->user()->agent_profile_id);
}
// Consumer sees only own quotes/applications/policies
$query->where('consumer_id', auth()->id());
```

**Response Format (same as Solarera):**
```json
{ "items": [...], "counts": { "total": 100, "new": 25, "quoted": 30, "applied": 20, "won": 15, "lost": 10 } }
{ "item": { ... } }
{ "message": "...", "item": { ... } }
```

### Frontend Architecture

**Split Context Pattern:**
- `AuthContext` — user, agency, role
- `QuoteContext` — current quote request, results, comparison
- `PipelineContext` — lead/application counts, active pipeline

**Quote Comparison Page:**
```
┌──────────────────────────────────────────────────┐
│ Your Auto Insurance Quotes (3 carriers matched)  │
│ Based on: 2 drivers, 1 vehicle, 100/300/100     │
├──────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│ │ Allstate │  │ StateFarm│  │ Geico    │       │
│ │ $142/mo  │  │ $128/mo ★│  │ $155/mo  │       │
│ │ [Compare]│  │ [Compare]│  │ [Compare]│       │
│ └──────────┘  └──────────┘  └──────────┘       │
├──────────────────────────────────────────────────┤
│ [Select & Apply with a Licensed Agent]           │
│ We'll match you with a top-rated local agent     │
└──────────────────────────────────────────────────┘
```

### UI/UX Design Standards

**Colors:** Shield Blue (blue-600), Confidence Indigo (indigo-600), Savings Green (green-600), Amber warnings, Slate neutrals

**Insurance-Specific Components:**
- Quote card: Carrier logo, premium (monthly/annual toggle), coverage summary, select button
- Comparison grid: Feature rows across carrier columns (✅/❌)
- Agent card: Photo, name, rating stars, specialties, response time badge, carrier logos
- Application timeline: Horizontal step indicator (draft → submitted → underwriting → bound)
- Policy card: Carrier logo, policy number, coverage type badge, expiration countdown
- Lead card: Name, insurance type, source badge, status, follow-up date, score
- Commission row: Policy #, carrier, premium, rate, amount, status badge

**Responsive:**
- Desktop for agents (CRM, pipeline, commission reports)
- Mobile for consumers (get quote, compare, track application)
- Both for marketplace browsing

### Security Patterns

**Authentication:**
- Sanctum SPA tokens
- Quote calculator: no auth required (session-based tracking)
- Agent marketplace: public browsing, auth for connecting
- Agency-scoped queries for agent data

**Authorization:**
- `role:consumer` → own quotes, applications, policies only
- `role:agent` → own leads, applications (agency_owner sees all agency data)
- `role:carrier` → own products, applications received
- `role:admin` → full platform access

### Database Patterns

**Quote Request → Quote → Application → Policy Chain:**
```php
// Full traceability from initial quote to bound policy
$policy->application->quote->quoteRequest; // Navigate back to original request
// Track conversion funnel
$conversionRate = Application::where('status', 'bound')->count() / QuoteRequest::count();
```

**Seeders:**
1. SubscriptionPlanSeeder (Agent Free / Pro / Agency / Carrier)
2. CarrierSeeder (20 carriers with products and sample rates per state)
3. InsuranceTypeSeeder (auto, home, life, health, commercial categories)
4. DemoDataSeeder ("Shield Insurance Group", 3 agents, 100 quotes, 50 leads, 30 applications, 20 policies)

### Deployment Strategy

**Railway:**
- PostgreSQL
- Custom domain: `api.insureflow.com`

**Solarera Pattern Reuse:**
- Quote calculator UX mirrors solar calculator flow
- Agent marketplace mirrors installer marketplace
- Application pipeline mirrors project pipeline
- Review system mirrors installer reviews
- Dashboard pattern identical (stats cards + charts + tables)

**Production Checklist:**
- [ ] Quote calculator returning multi-carrier results
- [ ] Comparison grid rendering correctly for all insurance types
- [ ] Agent matching algorithm distributing leads fairly
- [ ] Application pipeline status flow working
- [ ] Commission calculation on policy binding
- [ ] Consumer portal: quotes, applications, policies all accessible
- [ ] Agent CRM: leads, activities, follow-ups functional
- [ ] Demo data with realistic premiums and carriers
- [ ] SSL on all domains
