# Insurons Embeddable Quote Widget

## Overview

The Insurons Embed Widget allows partner websites to offer insurance quotes directly on their pages. Partners add a single `<script>` tag to their HTML — the widget loads inside a sandboxed iframe, communicates via PostMessage, and tracks sessions and conversions back to the Insurons platform.

**Live URL:** `https://insurons.com/embed/insurons-widget.js`

---

## Quick Start

### 1. Get an API Key

An admin creates a partner in the Insurons dashboard (`/embed`) which auto-generates an API key (`emb_` prefix + 48 random characters). The key is shown once at creation and hidden in subsequent responses.

### 2. Add the Script Tag

Paste one of these snippets into any HTML page:

**Inline mode** — embeds the quote form directly on the page:

```html
<script src="https://insurons.com/embed/insurons-widget.js"
  data-key="YOUR_API_KEY"
  data-mode="inline">
</script>
```

**Button mode** — adds a floating "Get Insurance Quote" button (bottom-right) that opens a modal:

```html
<script src="https://insurons.com/embed/insurons-widget.js"
  data-key="YOUR_API_KEY"
  data-mode="button">
</script>
```

That's it. No npm install, no build step, no dependencies.

---

## Script Attributes

| Attribute     | Required | Default    | Description |
|---------------|----------|------------|-------------|
| `data-key`    | Yes      | —          | Partner API key (starts with `emb_`) |
| `data-mode`   | No       | `inline`   | `inline` = embedded on page, `button` = floating FAB + modal |
| `data-type`   | No       | —          | Pre-select an insurance type slug (e.g., `auto`, `homeowners`, `life_term`, `bop`). Skips the type selection step. |

### Supported Insurance Type Slugs

| Category       | Slugs |
|----------------|-------|
| **Personal Auto** | `auto`, `motorcycle`, `boat_watercraft`, `rv_motorhome`, `commercial_auto`, `classic_car` |
| **Property**   | `homeowners`, `renters`, `condo`, `flood`, `landlord`, `mobile_home` |
| **Life**       | `life_term`, `life_whole`, `life_universal`, `life_variable`, `life_final_expense` |
| **Health**     | `health_individual`, `health_family`, `health_short_term`, `dental`, `vision`, `medicare_supplement`, `medicare_advantage` |
| **Disability** | `disability_ltd`, `disability_std`, `long_term_care`, `critical_illness` |
| **Commercial** | `bop`, `general_liability`, `workers_comp`, `commercial_property`, `professional_liability`, `cyber_liability`, `directors_officers`, `epli`, `commercial_umbrella` |

---

## How It Works

### Architecture

```
Partner Website                      Insurons Platform
┌─────────────────────┐              ┌──────────────────────────┐
│                     │              │                          │
│  <script> tag       │──loads──────>│  /embed/insurons-widget.js│
│                     │              │  (vanilla JS, ~4 KB)     │
│  ┌───────────────┐  │              │                          │
│  │ <iframe>      │──loads────────>│  /embed/quote?key=xxx    │
│  │               │  │              │  (React SPA route)       │
│  │  Quote Form   │  │              │                          │
│  │               │──API calls────>│  api.insurons.com/api/   │
│  │               │  │              │  embed/config, /quote,   │
│  └───────────────┘  │              │  /convert                │
│         ↕           │              │                          │
│  PostMessage        │              │                          │
│  (resize, events)   │              │                          │
└─────────────────────┘              └──────────────────────────┘
```

### Step-by-Step Flow

1. **Script loads** — `insurons-widget.js` reads `data-key`, `data-mode`, `data-type` from its own `<script>` tag
2. **Iframe created** — Points to `https://insurons.com/embed/quote?key=KEY&type=TYPE`
3. **API key validated** — React component calls `GET /api/embed/config/{apiKey}` to verify the key is active and fetch partner config (name, branding, colors)
4. **Session created** — `POST /api/embed/quote` creates an `EmbedSession` record for tracking
5. **User fills form** — 5-step progressive flow:
   - Step 1: Insurance type + ZIP code
   - Step 2: Category-specific fields (vehicle details, home value, DOB, etc.)
   - Step 3: Quote results with carrier comparison
   - Step 4: Contact information (name, email, phone)
   - Step 5: Success confirmation
6. **Conversion tracked** — When user completes the flow, `POST /api/embed/convert` marks the session as converted
7. **PostMessage events** — Iframe sends resize events to parent for auto-height adjustment

### PostMessage Events

The widget iframe sends messages to the parent window:

```javascript
// Message format
{
  source: 'insurons-widget',
  event: 'insurons:resize',  // Event name
  height: 850                 // Content height in pixels
}
```

| Event              | Data            | Description |
|--------------------|-----------------|-------------|
| `insurons:resize`  | `{ height }`    | Content height changed — parent adjusts iframe height |

---

## Widget Customization

Partners can be configured with a `widget_config` JSON object via the admin API:

```json
{
  "logo_url": "https://partner.com/logo.png",
  "company_name": "Acme Insurance",
  "primary_color": "#1d4ed8",
  "theme": "light",
  "hide_branding": false,
  "cta_text": "Get Your Free Quote"
}
```

| Config Key       | Type    | Description |
|------------------|---------|-------------|
| `logo_url`       | string  | Partner logo displayed in widget header |
| `company_name`   | string  | Partner name shown in header (falls back to partner_name from DB) |
| `primary_color`  | string  | CSS color applied to buttons and accents via `--embed-primary` CSS variable |
| `theme`          | string  | `light` (default) or `dark` — adds `dark-embed` class to body |
| `hide_branding`  | boolean | If `true`, hides the "Powered by Insurons" footer |
| `cta_text`       | string  | Custom call-to-action text for the primary button |

---

## Display Modes

### Inline Mode

- Creates a `<div>` container (max-width 560px, centered) immediately after the script tag
- Iframe fills the container with auto-resizing height
- Minimum height: 400px
- Smooth height transitions (300ms ease)

### Button Mode

- Creates a fixed-position floating button (bottom-right, z-index 99999)
- Blue gradient background with hover lift effect
- Shield icon + "Get Insurance Quote" text
- Clicking opens a modal overlay (z-index 100000):
  - Semi-transparent backdrop (click outside to close)
  - Slide-up animation on mobile, centered on desktop (640px+ breakpoint)
  - Close button (×) in modal header
  - Max height: 90vh mobile, 85vh desktop
  - Rounded corners: 16px top on mobile, full 16px on desktop

---

## Admin API (Authenticated)

All partner management endpoints require authentication (Sanctum).

### Partner CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/embed/partners` | List all partners with session/conversion counts |
| `POST` | `/api/embed/partners` | Create partner (returns API key once) |
| `GET`  | `/api/embed/partners/{id}` | Get partner details |
| `PUT`  | `/api/embed/partners/{id}` | Update partner settings |
| `DELETE` | `/api/embed/partners/{id}` | Delete partner |

### Create Partner Request

```json
POST /api/embed/partners
{
  "name": "Acme Insurance Brokerage",
  "allowed_domains": ["acme.com", "www.acme.com"],
  "commission_share_percent": 15.00,
  "contact_email": "admin@acme.com",
  "contact_name": "John Smith",
  "widget_config": {
    "company_name": "Acme Insurance",
    "primary_color": "#1d4ed8"
  }
}
```

### Create Partner Response (201)

```json
{
  "id": 1,
  "name": "Acme Insurance Brokerage",
  "api_key": "emb_Xb7qgay0k7QCAWIbfaPXhiUfYNe4guMOUc9vr3HGx27ggrH1",
  "allowed_domains": ["acme.com", "www.acme.com"],
  "commission_share_percent": "15.00",
  "is_active": true,
  "widget_config": { "company_name": "Acme Insurance", "primary_color": "#1d4ed8" },
  "created_at": "2026-02-25T12:00:00.000000Z"
}
```

> The `api_key` is only visible in the creation response. It is hidden (`$hidden`) in all other responses.

### Additional Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/embed/partners/{id}/regenerate-key` | Regenerate API key (invalidates old key) |
| `GET`  | `/api/embed/partners/{id}/sessions` | List recent sessions (last 100) |
| `GET`  | `/api/embed/partners/{id}/analytics` | Aggregated analytics (total, conversions, rate, by domain) |
| `GET`  | `/api/embed/partners/{id}/widget-code` | Generate ready-to-paste embed code |

### Analytics Response

```json
{
  "total_sessions": 1250,
  "conversions": 87,
  "conversion_rate": 7.0,
  "by_domain": [
    { "source_domain": "https://acme.com", "total": 800, "conversions": 62 },
    { "source_domain": "https://partner2.com", "total": 450, "conversions": 25 }
  ]
}
```

---

## Public API (No Auth — API Key Only)

These endpoints are called by the widget iframe and do not require authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/embed/config/{apiKey}` | Validate key, get partner config |
| `POST` | `/api/embed/quote` | Create embed session |
| `POST` | `/api/embed/convert` | Mark session as converted |

### Domain Validation

If a partner has `allowed_domains` configured, the `POST /api/embed/quote` endpoint checks the `Origin` header against the allowed list. If the origin domain is not in the list, the request is rejected with `403 Domain not allowed`.

If `allowed_domains` is null or empty, all domains are allowed.

---

## Data Model

### `embed_partners` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `name` | string | Partner company name |
| `api_key` | string | Unique API key (`emb_` + 48 random chars) |
| `allowed_domains` | json | Array of allowed origin domains (null = all allowed) |
| `commission_share_percent` | decimal(5,2) | Revenue share percentage |
| `contact_email` | string | Partner contact email |
| `contact_name` | string | Partner contact name |
| `is_active` | boolean | Whether the widget is active (default: true) |
| `widget_config` | json | Customization options (logo, colors, branding) |
| `created_at` | timestamp | — |
| `updated_at` | timestamp | — |

### `embed_sessions` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `embed_partner_id` | bigint | FK to embed_partners |
| `session_token` | string | Unique session identifier |
| `source_domain` | string | Origin domain of the request |
| `insurance_type` | string | Selected insurance type |
| `quote_data` | json | Quote parameters submitted |
| `ip_address` | string | Client IP |
| `user_agent` | string | Client user agent |
| `converted_at` | timestamp | When the user completed the flow (null = not converted) |
| `created_at` | timestamp | — |
| `updated_at` | timestamp | — |

---

## Frontend Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/embed/quote` | `EmbedQuoteWidget` | Public widget page (loaded in iframe, no nav/sidebar) |
| `/embed` | `EmbedPartnerDashboard` | Admin partner management (auth required) |

---

## File Structure

```
frontend/
├── public/embed/
│   └── insurons-widget.js          # Vanilla JS embed script (no dependencies)
└── src/pages/embed/
    ├── EmbedQuoteWidget.tsx         # React widget (5-step quote flow)
    └── EmbedPartnerDashboard.tsx    # Admin partner management

laravel-backend/
├── app/Http/Controllers/
│   └── EmbedController.php          # All embed endpoints (admin + public)
├── app/Models/
│   ├── EmbedPartner.php             # Partner model (auto-generates API key)
│   └── EmbedSession.php             # Session tracking model
└── routes/
    └── api.php                      # Routes (lines 137-139, 478-486)
```

---

## Security

- **API keys** are auto-generated with `Str::random(48)` (cryptographically secure)
- **Keys are hidden** in JSON responses after creation (`$hidden = ['api_key']`)
- **Domain validation** limits which origins can create sessions (optional per partner)
- **Iframe sandboxing** isolates the widget from the host page
- **CORS** is configured to allow the frontend domain to call the API
- **Rate limiting** applies via Laravel's default throttle middleware
- Partners can be **deactivated** (`is_active = false`) to immediately revoke access

---

## Testing the Widget

### Local Testing

1. Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head><title>Widget Test</title></head>
<body>
  <h1>My Partner Website</h1>

  <script src="https://insurons.com/embed/insurons-widget.js"
    data-key="YOUR_API_KEY"
    data-mode="inline">
  </script>
</body>
</html>
```

2. Serve it locally (don't open as `file://` — use a server):

```bash
python -m http.server 8888
# Open http://localhost:8888/test.html
```

3. The widget iframe loads from `insurons.com`, calls `api.insurons.com` for validation.

### Production Testing

Add the script tag to any live website. The widget is self-contained and requires no server-side changes on the partner's end.

**Tested and verified working on:**
- Local HTML pages (via HTTP server)
- GitHub Pages sites (cross-origin, different domain)
- Any website that allows custom `<script>` tags

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid Widget Key" | API key not found or partner deactivated | Verify key is correct, check partner `is_active` status |
| Widget not loading | Script URL wrong | Use `https://insurons.com/embed/insurons-widget.js` (not `michelevens.github.io`) |
| "Domain not allowed" | Origin not in `allowed_domains` | Add the domain to partner's `allowed_domains` list, or set to `null` to allow all |
| Iframe shows 404 | GitHub Pages SPA fallback missing | Ensure `404.html` exists in the deployed `dist/` folder (handled by CI) |
| CORS errors | API not allowing the frontend origin | Check `config/cors.php` includes the frontend domain |
| Height not adjusting | PostMessage not received | Ensure no Content Security Policy blocks cross-origin messages |
