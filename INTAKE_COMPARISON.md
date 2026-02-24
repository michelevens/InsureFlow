# Insurons Intake & Quote Form — Competitive Analysis

> **Date:** 2026-02-24
> **Purpose:** Compare Insurons' consumer-facing intake/quote forms against leading insurance platforms to identify gaps, strengths, and improvement opportunities.

---

## 1. Executive Summary

**Overall Assessment: Insurons is competitive on breadth but behind on UX polish.**

Insurons covers more product categories (40+ products across 6 categories) than most competitors, and our 2-step quote flow is reasonably lean. However, we lag behind best-in-class platforms like Lemonade (90-second conversational UI) and Ethos (5-minute end-to-end application) in several key UX areas:

| Dimension | Insurons | Best-in-Class |
|-----------|----------|---------------|
| **Quote speed** | 2 steps, ~2-3 min | Lemonade: 90 sec |
| **Product breadth** | 40+ products, 6 categories | Policygenius: ~10 types |
| **No-login quoting** | Yes | Lemonade: Yes, Ethos: Yes |
| **Progress indicator** | 2-step dots | Lemonade: none (so fast it's unnecessary) |
| **Conversational UI** | No | Lemonade: Maya chatbot |
| **Auto-prefill** | No | Root: VIN lookup, 30% conversion lift |
| **Save & resume** | Post-results only | Next Insurance: "Welcome back" banners |
| **Lead capture timing** | After results (good) | Lemonade: delayed email (great) |
| **Mobile optimization** | Responsive but not mobile-first | Lemonade: mobile-first design |
| **Instant results** | Yes (API-driven) | SelectQuote: agent callback (worse) |
| **Agency intake form** | Yes (white-label) | EZLynx: embeddable widget |

**Verdict:** We have strong fundamentals — instant quotes, no login required, dynamic category-specific fields, and agency-branded intake. But competitors are winning on **micro-UX**, **speed perception**, **trust signals**, and **progressive disclosure**.

---

## 2. Our Current Forms

### 2a. Calculator (Main Quote Flow)
**Path:** `/calculator` → `/calculator/results`
**Steps:** 2

| Step | Fields | Notes |
|------|--------|-------|
| **Step 1** | Insurance Type (grouped select from admin catalog), ZIP Code, Coverage Level (Basic/Standard/Premium) | Dynamic product list from API; grouped by category |
| **Step 2** | Varies by category — see below | Conditional fields based on product slug |

**Category-Specific Fields (Step 2):**

| Category | Fields |
|----------|--------|
| Vehicle | Year, Make, Model |
| Property | Home Value, Year Built, Square Footage |
| Life | DOB, Smoker Status, Coverage Amount, Health Rating |
| Health | DOB, Household Size, Current Coverage |
| Disability/LTC | DOB, Occupation, Annual Income, Employment Status |
| Commercial | Business Type, Annual Revenue, # Employees, Years in Business |
| Generic | No extra fields — just proceeds to quote |

**Trust Signals:** "No login required", "Results in seconds", "No obligation" badges at bottom.

**Strengths:**
- Dynamic product catalog (admin-managed, not hardcoded)
- Category-adaptive fields (vehicle fields for auto, life fields for life, etc.)
- Instant results (no callback model)
- No account required to see quotes
- Agency-specific quoting via `?agency_id=` param
- Clean 2-step progress indicator

**Weaknesses:**
- No address auto-complete or ZIP code lookup
- No VIN/vehicle lookup (user types make/model manually)
- No time estimate ("takes 60 seconds")
- No save/resume for abandoned forms
- No animation or micro-interactions
- Coverage level selector (Basic/Standard/Premium) is vague — competitors explain what each means
- Step 2 shows all fields at once (not one-at-a-time progressive disclosure)

### 2b. Quote Results Page
**Path:** `/calculator/results`

**Strengths:**
- Side-by-side carrier comparison (carrier name, AM Best rating, monthly/annual premium, deductible, coverage limit, features)
- "Best Value" badge on recommended quote
- Lowest premium highlighted in summary bar
- 3-step progressive lead capture: view results → save contact → create account (brilliant funnel)
- Account creation re-uses saved contact info (just add password)
- "No account needed" messaging throughout

**Weaknesses:**
- No premium breakdown (base rate vs. fees vs. discounts)
- No "why this price" explanation per quote
- No carrier logo (just initials)
- No filter/sort controls (sort by price, rating, deductible)
- No coverage comparison table (matrix view)
- No savings indicator vs. average market rate

### 2c. Lead Intake Form (Agency-Branded)
**Path:** `/intake/:agencyCode`

**Fields:** First Name, Last Name, Email, Phone (optional), Insurance Type (dropdown), Additional Notes (textarea)

**Strengths:**
- White-labeled per agency (shows agency name)
- Supports `?agent=` param for direct agent routing
- Clean, single-page form
- Powered by Insurons attribution

**Weaknesses:**
- Static insurance type list (hardcoded, not from admin catalog)
- No address/ZIP collection (can't auto-route by geography)
- No urgency indicators ("When do you need coverage?")
- No budget/coverage preferences
- No file upload for existing policy (declarations page)
- Minimal — too minimal for quality lead scoring

---

## 3. Competitor Analysis

### 3a. Lemonade — The Speed Champion
**Products:** Renters, Homeowners, Pet, Life, Car
**Quote Time:** 90 seconds (their key marketing claim)

**UX Approach:**
- **Conversational chatbot (Maya):** AI-powered virtual agent guides users through questions one at a time in a chat-like interface
- **Single question per screen:** Never shows a form — always one question, one answer
- **Delayed email collection:** Asks for email AFTER engagement (the "flipped funnel")
- **Bundling gamification:** Glowing "gem" animation when selecting multiple products
- **Mobile-first design:** Optimized for phone screens, average session 53 seconds
- **Instant bind:** Can purchase policy immediately after quote

**What We Can Learn:**
- One question at a time dramatically reduces perceived complexity
- Chatbot UI creates engagement and trust
- Delayed email collection increases top-of-funnel conversion
- Speed should be a core marketing message

### 3b. Ethos — The Simplifier
**Products:** Term Life, Whole Life
**Quote Time:** ~5 minutes for full application
**No Medical Exam:** Most applicants

**UX Approach:**
- **3-step process:** Get quote → Complete application → Get coverage (same day)
- **Minimal initial fields:** Age, health status, tobacco use, ZIP → instant preliminary quote
- **Full application online:** SSN, detailed health questions, beneficiary — all digital
- **Instant approval:** AI underwriting approves ~80% within 10 minutes
- **No phone call required:** Entire process self-service (agents available if wanted)

**What We Can Learn:**
- Show a preliminary quote with minimal info, then deepen
- "Same-day coverage" messaging creates urgency and value
- AI-powered instant decisions eliminate the "we'll get back to you" antipattern

### 3c. Policygenius — The Aggregator
**Products:** Auto, Home, Life, Health, Disability, Renters, Pet, etc.
**Quote Time:** 5-20 minutes depending on product

**UX Approach:**
- **Multi-carrier comparison:** Shops 30+ carriers
- **Detailed data collection:** More fields than competitors (international travel plans, detailed health history)
- **No progress bar:** Users rely on browser back button (a known weakness)
- **Agent handoff:** After quotes, matched with licensed agent for deeper guidance
- **Content-rich:** Educational articles integrated into the quote flow

**What We Can Learn:**
- They collect MORE data than us but lack a progress bar — this is a known pain point we should avoid
- Their content strategy (educational articles alongside quoting) builds trust
- Agent matching post-quote is similar to our model but better integrated

### 3d. SelectQuote — The Callback Model
**Products:** Life, Auto, Home, Medicare
**Approach:** NOT instant quotes — agent calls you back

**UX Approach:**
- **Lead generation form:** Collects basic info, then agent calls
- **Multi-step form:** At least 17+ steps (URL path shows `/quote-form/step-17`)
- **Phone-first:** Primary conversion is scheduling a phone call
- **Free, no obligation:** Heavy emphasis on "free quote" messaging

**What We Can Learn:**
- This is the OLD model — we're already better than this
- Their form is too long (17+ steps!)
- Callback model is inferior to instant results
- However, their "licensed agent reviews your request" messaging builds trust

### 3e. Bold Penguin — The Commercial Specialist
**Products:** Small commercial (BOP, GL, WC, etc.)
**Audience:** Agents (B2B), not consumers directly

**UX Approach:**
- **Universal application:** Single form for all commercial lines — eliminates duplicate data entry
- **Terminal platform:** Agent-facing dashboard, not consumer-facing
- **Sub-appointments:** Agents access carriers they're not directly appointed with
- **Quote-to-bind:** Full lifecycle in one platform
- **84% time reduction:** From manual quoting across carrier portals

**What We Can Learn:**
- Universal application concept is powerful — we partially have this
- Agent-facing tools matter as much as consumer-facing
- Sub-appointment access is a huge value prop for agents
- Dashboard analytics for tracking quote-to-bind metrics

### 3f. EZLynx — The Agency Workhorse
**Products:** Personal lines (Auto, Home) primarily
**Users:** 106,000+ across 37,000+ agencies

**UX Approach:**
- **Consumer quoting widget:** Embeddable on agency websites, available 24/7
- **Comparative rater:** Quote 10+ carriers simultaneously with single data entry
- **Visual comparison:** Color-coded graph showing auto vs. home results
- **Agency management:** Full AMS with quoting, servicing, and reporting
- **14M+ quotes/month:** Massive scale

**What We Can Learn:**
- Embeddable widget is something we claim but should polish
- Visual comparison (graph, not just cards) could improve our results page
- Color-coding by product type helps users quickly parse results
- Integration with agency management system is table stakes

### 3g. Quotit — The Health Specialist
**Products:** Health (ACA, Medicare, Dental, Vision, Life)
**Users:** Brokers and agents

**UX Approach:**
- **300+ carriers, 43,000 plans:** Massive catalog
- **Quote-to-enroll:** Full lifecycle from quoting through enrollment
- **Drug cost estimator (EARD):** Unique tool for Medicare comparisons
- **SMS SOA:** Scope of Appointment forms via text message
- **Compliance baked in:** Regulatory requirements automated

**What We Can Learn:**
- Drug cost estimator is a genius differentiator for Medicare
- Compliance automation in the quote flow is valuable
- SMS-based workflows for field agents
- Health insurance needs specialized quoting tools (not just a generic form)

---

## 4. Gap Analysis

### Critical Gaps (High Impact, Achievable)

| Gap | Impact | Effort | Competitors Who Do This |
|-----|--------|--------|------------------------|
| **No one-at-a-time question flow option** | High | Medium | Lemonade, Ethos |
| **No address auto-complete** | High | Low | Nearly all competitors |
| **No time estimate on form** | Medium | Trivial | Lemonade ("90 sec"), Ethos ("5 min") |
| **No save & resume** | Medium | Medium | Next Insurance |
| **No carrier logos on results** | Medium | Low | Policygenius, all aggregators |
| **No sort/filter on results** | Medium | Low | Policygenius |
| **Static insurance types on intake form** | Medium | Low | Should use admin catalog |
| **No coverage level explanation** | Medium | Low | Policygenius, Lemonade |
| **Intake form missing ZIP code** | Medium | Trivial | Standard across industry |

### Strategic Gaps (Higher Effort, Competitive Moat)

| Gap | Impact | Effort | Competitors Who Do This |
|-----|--------|--------|------------------------|
| **No VIN/property auto-lookup** | High | High | Root (30% conversion lift) |
| **No conversational/chatbot UI** | High | High | Lemonade (Maya) |
| **No premium breakdown** | Medium | Medium | Lemonade, progressive insurers |
| **No drug cost estimator** | Niche | High | Quotit (Medicare) |
| **No visual comparison chart** | Medium | Medium | EZLynx |
| **No quote-to-bind** | High | Very High | Lemonade, Ethos, Bold Penguin |

### Where We're Already Strong

| Strength | vs. Competitors |
|----------|----------------|
| **40+ product types** | Policygenius: ~10, Lemonade: 5, Ethos: 2 |
| **Dynamic admin-managed catalog** | Most competitors hardcode products |
| **No login for quotes** | Same as Lemonade, Ethos |
| **Agency-branded intake** | Similar to EZLynx widget |
| **Instant API-driven results** | Better than SelectQuote callback model |
| **Category-adaptive form fields** | Better than one-size-fits-all forms |
| **Progressive lead capture** | View → Save → Signup funnel is well-designed |
| **3-step account creation** | Better than forcing signup before results |

---

## 5. Prioritized Recommendations

### Tier 1: Quick Wins (1-2 days each)

1. **Add time estimate to Calculator**
   - "Takes about 60 seconds" under the heading
   - Huge trust builder, trivially easy

2. **Add ZIP code to Lead Intake form**
   - Enables geographic lead routing
   - Standard field across all competitors

3. **Use admin product catalog on Lead Intake**
   - Replace hardcoded `INSURANCE_TYPES` array with API call to `/products/visible`
   - Keeps intake form in sync with platform catalog

4. **Add coverage level tooltips**
   - Explain what Basic/Standard/Premium means for each product type
   - Reduces confusion and drop-off at Step 1

5. **Add carrier logos to quote results**
   - Use carrier `logo` field from database
   - Initials look unpolished vs. competitors showing real logos

6. **Add sort/filter to quote results**
   - Sort by: Price (low→high), Deductible, Carrier Rating
   - Filter by: Deductible range, Carrier rating

### Tier 2: Medium Effort (3-5 days each)

7. **One-at-a-time question mode for Step 2**
   - Instead of showing all fields at once, present one field per screen with smooth transitions
   - Reduces perceived complexity (Lemonade's core UX innovation)
   - Keep current form as "quick mode" for power users

8. **Address auto-complete on ZIP code field**
   - Use Google Places or Mapbox autocomplete
   - Auto-fill city/state from ZIP
   - For property: auto-fill address for home value lookup

9. **Save & resume for abandoned quotes**
   - Store partial form state in localStorage
   - Show "Welcome back" banner if user returns
   - Next Insurance documented measurable improvement from this

10. **Premium breakdown on results**
    - Show: Base rate, Fees, Discounts, Total
    - Transparency builds trust and reduces "why is this price?" anxiety

11. **Coverage comparison matrix on results**
    - Side-by-side table: Carrier × Coverage attributes
    - Replaces scanning individual cards

### Tier 3: Strategic Investments (1-2 weeks each)

12. **Conversational quote flow (Maya-style)**
    - Chat-like UI as alternative to form
    - AI-powered follow-up questions
    - Could leverage our existing InsuranceAiService

13. **VIN / Property data auto-lookup**
    - VIN decode API for auto quotes (auto-fill year/make/model)
    - Property data API for home quotes (auto-fill value, year built, sqft)
    - Root documented 30% conversion increase

14. **Embeddable quote widget**
    - Iframe/web component version of Calculator
    - Agency can embed on their own website
    - Leads auto-route to agency pipeline

15. **Quote-to-bind integration**
    - For supported carriers, allow purchasing directly from results
    - Starts with simple products (renters, term life)
    - Huge competitive moat

---

## 6. Quick Wins — Implementation Checklist

These can be done in the next 1-2 sessions:

- [ ] Add "Takes about 60 seconds" text below Calculator heading
- [ ] Add `zip_code` field to LeadIntake form
- [ ] Replace `INSURANCE_TYPES` constant in LeadIntake with API call to `/products/visible`
- [ ] Add tooltip/description to coverage level dropdown options
- [ ] Display carrier `logo` on QuoteResults cards (fallback to initials if null)
- [ ] Add sort dropdown to QuoteResults (Price, Deductible, Rating)
- [ ] Add "urgency" field to LeadIntake ("When do you need coverage?" — ASAP / This month / Exploring)

---

## Sources

- [Lemonade UX Onboarding Analysis](https://goodux.appcues.com/blog/lemonade-user-onboarding)
- [Insurance Form Best Practices & Templates (Feathery)](https://www.feathery.io/blog/insurance-form-templates-best-practices)
- [Creating High-Performing UX for Insurance Quote Journeys (LION+MASON)](https://www.lionandmason.com/ux-blog/creating-engaging-and-high-performing-ux-for-insurance-quote-and-buy-journeys/)
- [14 Leading Insurance Quote Processes (Experience UX)](https://www.experienceux.co.uk/ux-blog/14-leading-insurance-providers-quote-processes-and-what-you-can-learn-from-them/)
- [Quote Flow Optimization (Glassbox)](https://www.glassbox.com/blog/quote-flow-optimization/)
- [Insurance UX Design Trends 2025 (G & Co.)](https://www.g-co.agency/insights/insurance-ux-design-trends-industry-analysis)
- [Ethos Life Insurance — How It Works](https://www.ethos.com/how-it-works/)
- [Policygenius Review (FinanceBuzz)](https://financebuzz.com/policygenius-review)
- [SelectQuote — America's #1 Term Life Sales Agency](https://www.selectquote.com/)
- [Bold Penguin — Small Business Insurance Software](https://www.boldpenguin.com/products-insurance-sales-software)
- [EZLynx Rating Engine](https://www.ezlynx.com/products/rating-engine/)
- [Quotit Health Insurance Quoting Software](https://www.quotit.com/)
- [Increasing Insurance Conversion Rates (ConvertCart)](https://www.convertcart.com/blog/insurance-conversion-rate-optimization)
