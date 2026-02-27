# InsureFlow Lead Assignment & Monetization Guide

## How Leads Are Created

Leads enter InsureFlow through four channels:

1. **Quote Calculator** — Consumer visits insurons.com, fills out the quote form (ZIP, insurance type, age, coverage). An `InsuranceProfile` is created, quotes are generated, and if the consumer saves their contact info, a `Lead` is created.

2. **Agency Intake Link** — Each agency gets a branded intake URL (`/intake/AGENCYCODE`). Consumers fill out: name, email, phone, ZIP, insurance type, urgency, and optional message. A Lead is created and immediately routed.

3. **CRM Manual Entry** — Agents manually add leads from their CRM dashboard (phone calls, walk-ins, referrals).

4. **Lead Marketplace** — Agents purchase leads listed by other agencies (see Marketplace section below).

---

## How Leads Are Assigned to Agents

### Routing Engine

When a lead is created, the **Routing Engine** assigns it to an agent automatically:

1. **Check Agency Routing Rules** — Agency owners configure rules (priority-ordered) that match leads by:
   - Insurance type (auto, home, life, etc.)
   - ZIP code or state
   - Coverage level
   - Lead source

2. **Assignment Types:**
   - **Single Agent** — Routes directly to a specific agent
   - **Round Robin** — Cycles through a pool of agents sequentially
   - **Capacity-Based** — Assigns to the agent with the fewest active leads this month

3. **Daily Caps** — Each rule can have a daily limit (e.g., max 10 leads/day per rule)

4. **Fallback** — If no rule matches, the lead goes to the agency owner

5. **Notification** — The assigned agent receives an email and in-app notification

### Lead Scoring

Every lead gets a quality score (0-100) based on:

| Factor | Points | How It's Calculated |
|--------|--------|---------------------|
| Profile Completeness | 0-20 | Insurance type, coverage amount, property type, state filled |
| Coverage Amount | 0-15 | $1M+ = 15 pts, $500K-1M = 12, $250K-500K = 10, $100K-250K = 7, <$100K = 4 |
| Engagement Recency | 0-20 | How recently the lead was active |
| Engagement Frequency | 0-15 | Activity count in last 30 days |
| Pipeline Stage | 0-15 | Bound/Policy = 15, Application = 14, Quoted = 12, Lead = 10, Intake = 5 |
| Source Quality | 0-15 | Referral = 15, Marketplace = 12, Calculator = 10, Intake = 9, Direct = 8, Import = 5 |

**Lead Grades:**
- **A** (80-100): Hot lead, high intent
- **B** (60-79): Warm lead, good potential
- **C** (40-59): Average lead
- **D** (20-39): Cold lead
- **F** (0-19): Low quality

---

## How Money Is Made from Leads

InsureFlow has three revenue streams:

### 1. Subscription Plans (Monthly Recurring)

| Plan | Price/mo | Annual | Who It's For | Marketplace Credits |
|------|----------|--------|--------------|---------------------|
| Consumer Free | $0 | $0 | Consumers | 0 |
| Agent Starter | $29 | $278/yr | New agents | 0 (no marketplace) |
| Agent Pro | $79 | $758/yr | Active agents | 10/month |
| Agent Pro Plus | $129 | $1,238/yr | Power agents | 25/month |
| Agency Standard | $149 | $1,430/yr | Small agencies (5 seats) | 50/month |
| Agency Enterprise | $299 | $2,870/yr | Large agencies (unlimited seats) | 200/month |
| Carrier Partner | $499 | $4,790/yr | Insurance carriers | Unlimited |

**Marketplace access requires Agent Pro ($79/mo) or higher.** Lower plans cannot browse or purchase leads.

---

### 2. Lead Marketplace (Transaction Fees)

The marketplace lets agencies buy and sell leads. **InsureFlow takes a 10% platform fee on every sale.**

#### Selling Leads
- Any agency can list leads they acquired through intake links, calculator, CRM, or referrals
- **Cannot resell marketplace-purchased leads** (prevents lead recycling)
- Seller sets the asking price ($5 - $500 range)
- Two listing types: **Fixed Price** or **Auction**

#### Buying Leads
- Requires an active subscription with marketplace access
- Each purchase costs 1 marketplace credit (from plan allowance or top-up packs)
- Purchased leads are automatically routed through the buyer's routing rules

#### Money Flow Example

A $50 lead sale:

```
Buyer pays:           $50.00
Platform fee (10%):   -$5.00
Seller receives:      $45.00
```

#### Pricing Suggestions

The system suggests prices based on:
- Historical average sale price for the insurance type
- Lead score multiplier: `0.5 + (score / 100)`
  - Score 100 lead = 1.5x average price
  - Score 50 lead = 1.0x average price
  - Score 0 lead = 0.5x average price

#### Auction Bidding
- Sellers can list leads as auctions
- Minimum bid increment: $0.50
- Auction has an expiration timestamp
- Highest bidder wins

---

### 3. Credit Top-Up Packs (One-Time Purchases)

When agents run out of their monthly marketplace credits, they can buy more:

| Pack | Credits | Price | Per Credit |
|------|---------|-------|------------|
| Starter Pack | 10 | $29 | $2.90 |
| Pro Pack | 25 | $59 | $2.36 |
| Bulk Pack | 100 | $179 | $1.79 |

Credits accumulate — plan allowance + purchased packs stack together.

---

## Seller Payouts

Agencies that sell leads accumulate earnings in their **Seller Balance**:

- **Available Balance** — Funds ready to withdraw
- **Pending Balance** — Funds reserved for in-progress payout requests
- **Lifetime Earned** — Total earned from all lead sales
- **Lifetime Paid** — Total withdrawn

### Payout Process
1. Agency owner requests a payout (minimum $5.00)
2. Funds move from available to pending
3. Admin reviews and approves or rejects
4. If approved: transferred via Stripe Connect to the seller's bank account
5. If rejected: funds return to available balance

---

## Revenue Summary

### Per-Customer Monthly Revenue Potential

| Source | Agent Pro ($79) | Agency Standard ($149) |
|--------|-----------------|------------------------|
| Subscription | $79 | $149 |
| Marketplace purchases (10 leads x $50 avg) | $500 spend → **$50 platform fee** | $2,500 spend → **$250 platform fee** |
| Credit top-ups (if needed) | Variable | Variable |
| **Total platform revenue** | **~$129/month** | **~$399/month** |

### Platform Take Rate
- **Subscriptions**: 100% revenue (SaaS)
- **Marketplace**: 10% of every lead transaction
- **Credit packs**: 100% revenue (one-time purchase)
