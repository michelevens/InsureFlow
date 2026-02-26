# Carrier API Integration Guide

## Overview

InsureFlow supports real-time carrier API integrations through a plugin adapter architecture. Each carrier gets a configuration record in `carrier_api_configs` and a corresponding adapter class.

## Architecture

```
CarrierApiService          # Orchestrator — resolves adapter, calls carrier
├── GenericRestAdapter     # Default REST adapter (any REST API)
├── ProgressiveAdapter     # Progressive-specific (API Partner portal)
└── TravelersAdapter       # Travelers-specific (ForAgents portal)
```

## How to Add a New Carrier

### 1. Get API Access

| Carrier | Portal | Cost | Requirements |
|---------|--------|------|-------------|
| Progressive | partners.progressive.com | Free (with appointment) | Agency appointment + license |
| Travelers | foragents.travelers.com | Free (with appointment) | Agency appointment + license |
| Bold Penguin | boldpenguin.com/partners | $200-2K/mo | InsurTech partnership |
| EZLynx | ezlynx.com/rating-engine | $300-1K/mo | Agency license |
| Ivans | ivans.com | Varies | Agency license |

**Steps:**
1. Apply at carrier's partner/developer portal
2. Get sandbox API credentials (key, secret, base URL)
3. Test in sandbox environment
4. Request production credentials

### 2. Create API Config (Admin Dashboard)

POST `/api/carrier-api-configs`:
```json
{
  "carrier_id": 1,
  "base_url": "https://api.carrier.com/v1",
  "auth_type": "api_key",
  "credentials": {
    "api_key": "your-key",
    "api_secret": "your-secret"
  },
  "adapter_type": "generic_rest",
  "is_active": true
}
```

**Auth types:** `api_key`, `oauth2`, `basic`, `certificate`
**Adapter types:** `generic_rest`, `progressive`, `travelers` (or create custom)

### 3. Create a Custom Adapter (optional)

If the carrier has a non-standard API:

```php
// app/Services/CarrierApi/Adapters/NewCarrierAdapter.php
namespace App\Services\CarrierApi\Adapters;

use App\Services\CarrierApi\CarrierApiAdapter;

class NewCarrierAdapter extends CarrierApiAdapter
{
    public function getQuote(array $params): array
    {
        // Transform InsureFlow params → carrier format
        $carrierRequest = [
            'policy_type' => $params['insurance_type'],
            'applicant' => $this->mapApplicant($params),
        ];

        // Call carrier API
        $response = $this->httpClient()->post(
            $this->config->base_url . '/quotes',
            $carrierRequest
        );

        // Transform carrier response → InsureFlow format
        return [
            'carrier_quote_id' => $response['id'],
            'premium' => $response['total_premium'],
            'deductible' => $response['deductible_amount'],
            'coverage_details' => $response['coverages'],
        ];
    }

    public function testConnection(): bool
    {
        return $this->httpClient()
            ->get($this->config->base_url . '/health')
            ->successful();
    }
}
```

Register in `CarrierApiService::resolveAdapter()`.

### 4. Test Connection

POST `/api/carrier-api-configs/{id}/test-connection`

Returns `{ success: true/false, message: "..." }`

### 5. Get Quotes

The rating engine automatically calls configured carrier APIs:

POST `/api/quotes/estimate`:
```json
{
  "insurance_type": "auto",
  "zip_code": "10001",
  "details": { "vehicles": [...], "drivers": [...] }
}
```

Returns quotes from all active carriers with API configs.

## Environment Variables

```env
# No global carrier keys — each carrier has its own config in DB
# VAPID keys (for push notifications to agents when quotes arrive)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

## Generating VAPID Keys

```bash
# Using web-push library (Node.js)
npx web-push generate-vapid-keys

# Or using PHP (on Railway)
php -r "echo json_encode(\Minishlink\WebPush\VAPID::createVapidKeys());"
```

Add the keys to Railway env vars as `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.
