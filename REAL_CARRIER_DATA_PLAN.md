# Real Carrier Data & True Quoting — Implementation Plan

## Context
InsureFlow currently has 10 demo carriers with fake min/max premium calculations. To provide **true quotes**, we need: (1) enriched carrier profiles with real industry data, (2) 80+ real US carriers seeded across all insurance lines, (3) rate table CSV import so agencies can load actual carrier rates, and (4) QuoteController wired to the RatingEngine instead of min/max averaging.

---

## Phase 1: Database Migration (commit 1)

### New columns on `carriers` table
Create `laravel-backend/database/migrations/2026_02_27_000001_enrich_carriers_table.php`:
- `naic_code` (string 10, unique, nullable) — NAIC company identifier
- `naic_group_code` (string 10, nullable) — holding company group
- `domicile_state` (string 2, nullable)
- `sp_rating` (string 10, nullable) — S&P rating
- `am_best_financial_size` (string 10, nullable) — e.g. "XV" ($2B+)
- `year_founded` (integer, nullable)
- `naic_complaint_ratio` (decimal 5,2, nullable) — 1.00 = average
- `market_segment` (string 50, nullable) — personal/commercial/life_health/specialty/multi
- `lines_of_business` (JSON, nullable) — maps to PlatformProduct slugs
- `headquarters_city` (string 100, nullable)
- `headquarters_state` (string 2, nullable)
- `total_premium_written` (decimal 15,2, nullable) — in millions
- `is_admitted` (boolean, default true)
- `distribution_model` (string 50, nullable) — independent/captive/direct/hybrid
- `carrier_metadata` (JSON, nullable) — catch-all for future data

### New columns on `carrier_products` table
Create `laravel-backend/database/migrations/2026_02_27_000002_add_product_code_to_carrier_products.php`:
- `product_code` (string 30, nullable) — carrier's internal product code
- `rate_table_product_type` (string 60, nullable) — maps to rate_tables.product_type
- `underwriting_type` (string 30, nullable) — simplified/full/guaranteed
- `eligible_states` (JSON, nullable)

### Model updates
- **Modify** `laravel-backend/app/Models/Carrier.php` — add to $fillable, $casts, add `rateTables()` relationship
- **Modify** `laravel-backend/app/Models/CarrierProduct.php` — add new fields to $fillable, $casts

---

## Phase 2: Seed 80+ Real US Carriers (commit 2)

**Modify** `laravel-backend/database/seeders/CarrierSeeder.php` — full rewrite

### Carrier roster by segment (~80 unique carriers):

**P&C / Personal Lines (25):** State Farm (25178), GEICO (22063), Progressive (24260), Allstate (19232), USAA (25941), Liberty Mutual (23043), Nationwide (23787), Farmers (21652), Travelers (25658), Erie (26263), American Family (19275), Auto-Owners (18988), Cincinnati Financial (10677), Chubb (20443), Hartford (29459), Hanover (22292), CSAA (10194), Amica (19976), Safeco (24740), Mercury (11908), Kemper (17370), Plymouth Rock (24198), NJM (14788), Wawanesa (25666), Shelter (23388)

**Life & Annuity (20):** MetLife (65978), Prudential (68241), New York Life (66915), Northwestern Mutual (67814), MassMutual (65935), Lincoln Financial (65676), Pacific Life (67466), Transamerica (86231), Principal (61271), Protective Life (68136), Securian (67482), North American (61832), Mutual of Omaha (71412), Penn Mutual (67644), Guardian (64246), John Hancock (65838), Unum (62235), Global Atlantic (77828), Brighthouse (68500), TIAA (69345)

**Health / Medicare (10):** UnitedHealthcare (79413), Anthem/Elevance (60217), Aetna/CVS (60054), Cigna (67369), Humana (73288), Kaiser Permanente (91840), Centene/Ambetter (13174), Molina (48003), BCBS of TX (60000), Oscar Health (12190)

**Commercial Lines (15):** Zurich (16535), CNA (20443), Berkshire Hathaway (20044), Markel (22306), RLI (13056), Employers Holdings (10640), AmTrust (10227), GUARD (14991), Frankenmuth (10998), Donegal (10638), Philadelphia Insurance (18058), biBerk (online), Next Insurance (online), Hiscox (10200), Society Insurance (21580)

**Disability / LTC (10):** Genworth (70025), National Guardian Life (66583), OneAmerica/State Life (69108), Standard Insurance (69019), Aflac (60380), Colonial Life (62049), Assurity (71439), Illinois Mutual (64300), Berkshire Life (71005), Ohio National (67172)

Each carrier gets: real NAIC code, real AM Best rating, real domicile state, real headquarters, accurate lines_of_business, states_available, market_segment, distribution_model, year_founded, and CarrierProduct records for each line they write.

---

## Phase 3: Wire QuoteController to RatingEngine (commit 3)

**Modify** `laravel-backend/app/Http/Controllers/QuoteController.php`

### Two-tier quoting:
1. **Tier 1 — Rate Table Rating:** For each CarrierProduct, check if an active RateTable exists via `RateTable::activeFor($productType, $carrierId)`. If found, build a `RateInput` from the quote request data and run through the RatingEngine plugin.
2. **Tier 2 — Fallback:** If no rate table exists, use existing min/max premium calculation (backward compatible).

### Changes:
- Inject `RatingEngine` in constructor
- Add `tryRateTableRating(CarrierProduct, data, state)` private method
- Add `buildCoveragesFromDetails()` and `buildInsuredObjectsFromDetails()` helpers
- Add `rating_source` field to breakdown response (`'rate_table'` vs `'estimate'`)
- Include `factors_applied`, `riders_applied`, `rate_table_version` in breakdown when rated

---

## Phase 4: CSV Import Enhancements (commit 4)

**Modify** `laravel-backend/app/Http/Controllers/AdminRateTableController.php`
**Modify** `laravel-backend/routes/api.php`

- Add `modal_factors` as supported CSV import type
- Add `POST /admin/rate-tables/carrier-import` — bulk import that auto-creates carrier-specific rate table + entries/factors/riders/fees from multiple CSV files
- Add `POST /admin/rate-tables/{rateTable}/import-preview` — dry-run validation showing row counts without persisting

---

## Phase 5: Frontend Updates (commit 5)

### Types
**Modify** `frontend/src/types/index.ts` — add enriched Carrier fields (naic_code, market_segment, lines_of_business, etc.), update QuoteBreakdown with rating_source

### Admin Carriers
**Modify** `frontend/src/pages/admin/AdminCarriers.tsx`:
- Detail view: NAIC code, AM Best + S&P ratings, complaint ratio (color-coded), lines of business tags, distribution model, year founded, headquarters, total premium written
- Edit modal: new fields for all enriched columns, lines_of_business multi-select

### Quote Results
**Modify** `frontend/src/pages/calculator/QuoteResults.tsx`:
- Show "Rate Table" vs "Estimate" badge on each quote
- Expandable "Rating Details" accordion when factors_applied present
- Carrier financial strength displayed more prominently

### Services
**Modify** `frontend/src/services/api/quotes.ts` — update QuoteBreakdown interface

---

## Phase 6: Sample Rate Table Data (commit 6)

**Modify** `laravel-backend/database/seeders/RateTableSeeder.php`
- Add sample auto + homeowners rate tables for State Farm, Progressive, Allstate (3 carriers)
- Structured correctly with entries, factors, modal_factors so the RatingEngine produces realistic quotes out of the box
- These are demo rates (not real actuarial data) but demonstrate the full rating flow

---

## File Manifest

### Files to CREATE (2):
1. `laravel-backend/database/migrations/2026_02_27_000001_enrich_carriers_table.php`
2. `laravel-backend/database/migrations/2026_02_27_000002_add_product_code_to_carrier_products.php`

### Files to MODIFY — Backend (9):
3. `laravel-backend/app/Models/Carrier.php`
4. `laravel-backend/app/Models/CarrierProduct.php`
5. `laravel-backend/database/seeders/CarrierSeeder.php`
6. `laravel-backend/app/Http/Controllers/QuoteController.php`
7. `laravel-backend/app/Http/Controllers/AdminRateTableController.php`
8. `laravel-backend/app/Http/Controllers/AdminController.php`
9. `laravel-backend/app/Http/Controllers/CarrierController.php`
10. `laravel-backend/routes/api.php`
11. `laravel-backend/database/seeders/RateTableSeeder.php`

### Files to MODIFY — Frontend (4):
12. `frontend/src/types/index.ts`
13. `frontend/src/pages/admin/AdminCarriers.tsx`
14. `frontend/src/pages/calculator/QuoteResults.tsx`
15. `frontend/src/services/api/quotes.ts`

---

## Verification

1. `php artisan migrate` — both new migrations run without error
2. `php artisan db:seed --class=CarrierSeeder` — 80+ carriers with products seeded
3. `php artisan db:seed --class=RateTableSeeder` — sample rate tables created
4. `GET /api/carriers` — returns enriched carrier data with NAIC codes, ratings
5. `POST /api/calculator/estimate` with a State Farm zip code — returns quote with `rating_source: 'rate_table'` and factor breakdown
6. `POST /api/calculator/estimate` for a carrier without rate tables — returns quote with `rating_source: 'estimate'` (fallback works)
7. Admin carrier edit — can save all new fields
8. `npx tsc -b --noEmit` — frontend compiles clean
