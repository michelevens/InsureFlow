# InsureFlow - Feature Tracker

## Status Legend
- [x] Planned and scoped
- [ ] Not yet started

---

## Phase 1: Quote Engine & Marketplace (MVP - Weeks 1-8)

### Authentication & Users
- [ ] Email/password registration and login
- [ ] Role-based access (Consumer, Agent, Agency Owner, Carrier, Admin)
- [ ] Agency profile setup (name, license, E&O insurance)
- [ ] Agent profile setup (license, NPN, specialties, carriers)
- [ ] Staff invitation for agencies

### Quote Calculator (Public — Core Feature)
- [ ] Insurance type selection (auto, home, renters, life, health, commercial)
- [ ] Auto quote form (drivers, vehicles, coverage preferences)
- [ ] Home quote form (address, year built, sq ft, coverage amount)
- [ ] Life quote form (age, gender, health class, term, coverage)
- [ ] Multi-carrier quote generation (calculate premiums from carrier products)
- [ ] Quote results display with side-by-side comparison cards
- [ ] Recommended/best value highlighting
- [ ] Coverage detail breakdown per quote
- [ ] Discount display (multi-policy, good driver, etc.)
- [ ] Save quotes (register/login to save)
- [ ] Quote expiration tracking

### Agent Marketplace
- [ ] Agent search by location, specialty, carrier, rating
- [ ] Agent profile pages (bio, specialties, carriers, reviews, response time)
- [ ] Verified license badge
- [ ] Rating and review display
- [ ] "Get Matched" smart matching (auto-select best agents)
- [ ] Agent contact form / request callback

### Carrier Directory
- [ ] Carrier listing with logos and AM Best ratings
- [ ] Carrier products and coverage types
- [ ] State availability filtering
- [ ] Carrier detail pages

### Dashboard
- [ ] Agent dashboard (new leads, active applications, commissions, rating)
- [ ] Consumer dashboard (saved quotes, applications, active policies)
- [ ] Quick actions (get quote, view leads, check applications)
- [ ] Revenue/commission trend chart

---

## Phase 2: Application Pipeline & CRM (Weeks 9-16)

### Application Pipeline
- [ ] Create application from selected quote (pre-fill data)
- [ ] Application form (personal info, coverage details)
- [ ] Document upload (ID, proof of residence, driving record, etc.)
- [ ] Application submission to carrier/agent
- [ ] Status tracking (draft → submitted → underwriting → approved/declined → bound)
- [ ] Application notes (internal agent notes + consumer-visible notes)
- [ ] Policy binding on approval (create policy record)
- [ ] Decline handling with alternative quote suggestions
- [ ] Application timeline/history

### Agent CRM (Lead Management)
- [ ] Lead pipeline (new → contacted → qualified → quoted → applied → won/lost)
- [ ] Lead source tracking (marketplace, calculator, referral, manual)
- [ ] Activity logging (calls, emails, SMS, notes, quotes sent)
- [ ] Follow-up reminders and scheduling
- [ ] Lead assignment (for agencies with multiple agents)
- [ ] Lead scoring based on engagement
- [ ] Lost lead reason tracking
- [ ] Bulk actions (assign, tag, follow-up)

### Agent Quote Tools
- [ ] Quick quote from CRM (pre-fill from lead)
- [ ] Send quote comparison via email (branded PDF)
- [ ] Quote tracking (viewed, expired, converted)
- [ ] Re-quote with adjusted coverage

### Consumer Portal
- [ ] My saved quotes with comparison
- [ ] My applications with status tracking
- [ ] My active policies
- [ ] Payment history
- [ ] Document access (policy documents, ID cards)
- [ ] Secure messaging with agent

---

## Phase 3: Policies, Claims & Commissions (Weeks 17-24)

### Policy Management
- [ ] Active policy tracking (consumer and agent views)
- [ ] Policy details (coverage summary, premium, documents)
- [ ] Renewal alerts (60, 30, 14 days before expiration)
- [ ] Auto-renewal flag
- [ ] Policy document storage (dec page, ID cards, endorsements)
- [ ] Coverage gap detection

### Claims
- [ ] File claim from portal (type, description, date of loss, photos)
- [ ] Claim status tracking (submitted → review → approved/denied → settled)
- [ ] Claim documents and communication log
- [ ] Agent notification on claim filing
- [ ] Claim history per policy

### Commission Tracking
- [ ] Commission record per policy (rate, amount, type: new/renewal)
- [ ] Commission status (pending → earned → paid)
- [ ] Monthly commission summary
- [ ] Agency commission aggregation
- [ ] Commission report (by carrier, by product, by period)
- [ ] Payout tracking

### Reviews & Ratings
- [ ] Consumer reviews for agents (after policy bound)
- [ ] Star rating (1-5) with title and comment
- [ ] Agent response to reviews
- [ ] Verified review badge (linked to actual policy)
- [ ] Average rating display on agent profile

### Analytics
- [ ] Agent: leads, conversion rate, policies bound, revenue, avg premium
- [ ] Agency: production by agent, carrier, product type
- [ ] Carrier: applications received, approval rate, premium volume
- [ ] Platform: total quotes, conversion funnel, popular products

---

## Phase 4: Growth & Scale (Weeks 25+)

### Advanced Features
- [ ] Multi-state agent licensing management
- [ ] Continuing education (CE) tracking
- [ ] Referral program (agent-to-agent, consumer referrals)
- [ ] API for carrier rate integration (real-time quoting)
- [ ] White-label agent websites
- [ ] Multi-language support (Spanish)
- [ ] Bundle quoting (auto + home discount)

### Carrier Integration
- [ ] Real-time rate API connections (per carrier)
- [ ] Automated application submission to carrier systems
- [ ] Policy issuance webhooks
- [ ] Commission feed integration
- [ ] E-signature for applications (HelloSign)

### Marketing & Lead Gen
- [ ] SEO landing pages by insurance type and state
- [ ] Google Ads integration (cost per lead tracking)
- [ ] Retargeting pixel support
- [ ] Email marketing campaigns (drip sequences)
- [ ] Referral tracking and attribution

### AI Features
- [ ] AI-powered coverage recommendations
- [ ] Chatbot for initial quote qualification
- [ ] Predictive lead scoring
- [ ] Automated follow-up sequences
- [ ] Smart renewal timing optimization
