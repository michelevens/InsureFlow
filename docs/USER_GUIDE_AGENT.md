# Insurons Agent User Guide

## Overview

Insurons gives insurance agents a complete digital workspace: CRM with kanban pipeline, multi-carrier quoting, lead marketplace, e-signatures, workflow automation, commission tracking, compliance management, and more.

---

## Getting Started

### Account Setup

1. Register at **insurons.com** and select role: **Agent**
2. Complete onboarding:
   - Enter your agency information (or join an existing agency via invite)
   - Add your license details (state, NPN, license number)
   - Select your specialties and carriers
3. Your agency owner may also invite you directly via email

### Subscription

Agents operate under their agency's subscription. Check with your agency owner about your plan tier and available features.

---

## Dashboard

Your dashboard provides an at-a-glance view of your business:

- **Key metrics:** Active leads, pending applications, bound policies, earned commissions
- **Tasks Due Today:** Overdue tasks highlighted in red, today's tasks in amber
- **Recent Leads:** Latest leads with status badges, click-to-call and click-to-email
- **Quick links:** Commissions, Reviews, Calendar, Tasks

---

## Leads (CRM)

### Views

Toggle between **List view** and **Kanban board** using the view switcher.

**List view:** Sortable table with name, phone, email, insurance type, source, status, lead score, date.

**Kanban board:** Drag-and-drop cards across pipeline stages:
- New → Contacted → Qualified → Quoted → Applied → Won / Lost

### Adding a Lead

Click **Add Lead** and fill in:
- First/last name, email, phone
- Insurance type
- Notes
- The lead is automatically assigned to you

### Lead Sources

Leads come from multiple channels:
- **Manual entry** — Added by you
- **Lead intake forms** — Public forms on your agency website
- **Marketplace purchases** — Bought from the lead marketplace
- **Referrals** — Consumer referral program
- **Embed widget** — Partner websites with embedded quote widget

### Lead Detail View

Click any lead to see the full detail page:

**Scenarios** — Each lead can have multiple insurance scenarios. For each scenario:
- Add **insured objects** (vehicles, properties, persons — full CRUD)
- Add **coverages** with limits, deductibles, premiums
- Add **carrier quotes** with AM Best ratings and premium comparison
- **Recommend** or **Select** the best quote
- View **savings spread** (cheapest vs. most expensive)
- **Convert to application** when ready
- **Generate proposal PDF** (branded with your agency header, coverage tables, carrier comparison)

**Activity log** — Call notes, emails, status changes with timestamps.

**Lead score** — 0-100 engagement-based score. Factors: quote requests, page views, email opens, form completions.

### Bulk Operations

Select multiple leads with checkboxes, then:
- Bulk status change
- CSV export

---

## Lead Marketplace

### Buying Leads

1. Go to **Lead Marketplace → Browse**
2. Filter by insurance type, state, or sort by price/score/recent
3. Each listing shows: grade (A-F), score, state, price, contact signals — identity is anonymized
4. Click **Purchase** to buy the lead (reveals full contact info)
5. Lead is added to your CRM automatically

### Selling Leads

1. Go to **Lead Marketplace → My Listings**
2. Only leads you originated can be sold (not marketplace purchases)
3. Set asking price, seller notes, duration (7-90 days)
4. Optional: Set up as an **auction** with min bid and increment
5. Track status: active, sold, expired

### Transactions

View all buy/sell history with financial breakdown:
- **Seller receives:** 85% of sale price
- **Platform fee:** 15%

---

## Applications

### Creating an Application

Convert a lead scenario to an application:
1. Open a lead → scenario detail
2. Click **Convert to Application**
3. Or create from the Applications page directly

### Application Pipeline

| Status | Description |
|--------|-------------|
| **Draft** | Initial creation, still editing |
| **Submitted** | Sent to carrier |
| **Underwriting** | Carrier reviewing |
| **Approved** | Ready to bind |
| **Bound** | Policy created, coverage active |

### E-Signature Flow

1. Create an application from a scenario
2. System generates a signing link and emails it to the consumer
3. Consumer reviews and signs (no login needed)
4. You receive an email notification when signed
5. Application status moves to **Submitted**

---

## Policies

Track all policies you've written:
- Policy details (carrier, coverage, premium, dates)
- Related claims
- Renewal opportunities
- Commission tracking per policy

---

## Claims

Monitor claims for your clients:
- Claims queue with status filters
- Claim detail: timeline, documents, notes
- Follow-up action tracking

---

## Renewals

- View upcoming renewals with current vs. new premium comparison
- Retention scoring (risk of losing the client)
- Re-quote capability for competitive rates
- Status tracking: pending, quoted, renewed, lost

---

## Tasks

Full task management system:
- **Create tasks:** Title, description, due date, priority (high/medium/low), type (call, email, follow-up, appointment)
- **Filter:** Overdue, due today, upcoming
- **Complete/Reopen:** Toggle task status
- **Search:** Find tasks by keyword

---

## Commissions

### Tracking

- View all commissions (pending → earned → paid)
- Monthly summaries and trends
- Per-policy commission detail

### Commission Splits

For shared deals, set up splits:
- Add multiple agents with percentage shares
- System validates total = 100%
- Each agent sees their portion

### Payouts (Stripe Connect)

1. Go to **Commissions → Payout Settings**
2. Set up your Stripe Connect Express account
3. Request payouts when ready
4. View payout history

---

## Compliance

### Compliance Pack

Your personalized compliance checklist based on your state and product lines:
- **Licenses:** State, number, status, expiration
- **Continuing Education (CE):** Track credits, hours, completion dates
- **Errors & Omissions (E&O):** Policy tracking with expiration alerts
- Progress bar shows completion percentage
- Filter by: pending, due soon, overdue, completed

### Automated Alerts

The system runs daily checks and notifies you:
- Email + in-app notification for overdue items
- Grouped by category
- Once per week per item (no spam)

---

## Workflow Automation

Create rules that automatically fire when events occur.

### Creating a Rule

1. Go to **Workflows → Rules**
2. Click **Create Rule**
3. Configure:
   - **Trigger:** Choose from 22 events (lead_created, application_signed, policy_bound, claim_filed, etc.)
   - **Conditions:** JSON conditions (field equals, contains, greater_than, etc.)
   - **Action:** Choose from 8 actions:
     - Send notification
     - Update status
     - Assign agent
     - Create task
     - Add tag
     - Fire webhook
     - Send email
4. Enable/disable rules with a toggle
5. Test rules before going live

### Execution Log

View all past rule executions in the **Executions** tab — see which rules fired, when, and what they did.

---

## Calendar & Meetings

### Appointments
- Schedule consultations, reviews, claim follow-ups
- Set your weekly availability (day + time slots)
- Block specific dates
- Consumers can see available slots and book

### Video Meetings
- Create and manage video meetings
- Generate join links for clients
- Track meeting status (scheduled → started → ended)

---

## Reviews

- View your consumer ratings and reviews
- Reply to reviews (publicly visible)
- Track your average rating over time
- Reviews impact your marketplace ranking

---

## Communication

### Messages
- Real-time messaging with consumers, other agents, and agencies
- Typing indicators and read receipts
- Full conversation history

### Notifications
- Bell icon shows unread count
- Filter by type (leads, applications, policies, tasks)
- Click to navigate directly to the relevant item

---

## Training & Community

### Training Catalog
- Browse modules by category
- Track completion and scores
- Earn certificates

### Forum
- Discussion categories
- Post topics, reply, upvote
- Mark solutions for knowledge sharing

### Events
- Browse webinars and in-person events
- Register with one click
- Track attendance

---

## Analytics

Advanced analytics dashboard:
- **Conversion funnel:** Leads → Applications → Policies
- **Revenue trends:** Monthly/yearly commission analysis
- **Agent performance:** Your metrics vs. benchmarks
- **Claims analytics:** Count, status distribution, costs
