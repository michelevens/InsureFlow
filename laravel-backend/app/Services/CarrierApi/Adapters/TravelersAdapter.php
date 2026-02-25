<?php

namespace App\Services\CarrierApi\Adapters;

use App\Services\CarrierApi\CarrierQuoteResponse;
use App\Services\CarrierApi\CarrierApplicationResponse;

/**
 * Travelers Insurance API adapter.
 *
 * Travelers' agent API (Travelers for Agents) uses:
 *   - Base URL: https://api.travelers.com/v2 (production)
 *   - Auth: OAuth2 client_credentials flow
 *   - Quote endpoint: POST /rating/quote
 *   - Submit endpoint: POST /policy/submission
 *   - Status endpoint: GET /policy/submission/{submissionId}
 *
 * Travelers-specific conventions:
 *   - OAuth2 token obtained from /oauth/token endpoint
 *   - "lineOfBusiness" instead of "insurance_type" (e.g., "BOP", "WC", "CGL")
 *   - "riskAddress" object with structured address fields
 *   - "namedInsured" object for applicant info
 *   - Amounts in cents, not dollars
 *
 * This is a stub adapter. To activate Travelers integration:
 *   1. Obtain OAuth2 credentials from Travelers' partner portal
 *   2. Create a carrier_api_configs record with adapter_type = 'travelers'
 *   3. Set auth_config with client_id, client_secret, and token_url
 *   4. Configure field_mappings if the defaults below don't match your agreement
 */
class TravelersAdapter extends GenericRestAdapter
{
    /**
     * Default InsureFlow → Travelers field mappings.
     */
    protected array $defaultFieldMappings = [
        'insurance_type' => 'lineOfBusiness',
        'coverage_amount' => 'coverageLimitCents',
        'deductible' => 'deductibleCents',
        'state' => 'riskAddress.state',
        'zip_code' => 'riskAddress.zipCode',
        'property_type' => 'riskAddress.propertyType',
        'applicant.first_name' => 'namedInsured.firstName',
        'applicant.last_name' => 'namedInsured.lastName',
        'applicant.date_of_birth' => 'namedInsured.dateOfBirth',
        'applicant.email' => 'namedInsured.email',
        'applicant.phone' => 'namedInsured.phone',
        'business_name' => 'namedInsured.businessName',
        'ein' => 'namedInsured.taxId',
    ];

    /**
     * Mapping of InsureFlow insurance types to Travelers line of business codes.
     */
    protected array $lobMapping = [
        'homeowners' => 'HO',
        'auto' => 'PA',
        'business_owners' => 'BOP',
        'general_liability' => 'CGL',
        'workers_comp' => 'WC',
        'commercial_property' => 'CP',
        'umbrella' => 'CU',
    ];

    public function __construct(array $config)
    {
        parent::__construct(
            slug: 'travelers',
            name: 'Travelers',
            config: array_merge([
                'auth_type' => 'oauth2',
                'endpoints' => [
                    'quote' => '/v2/rating/quote',
                    'submit' => '/v2/policy/submission',
                    'status' => '/v2/policy/submission',
                ],
                'supported_products' => ['homeowners', 'auto', 'business_owners', 'general_liability', 'workers_comp', 'umbrella'],
                'timeout_seconds' => 45,
            ], $config),
        );
    }

    /**
     * Travelers requires OAuth2 client_id and client_secret.
     */
    public function isConfigured(): bool
    {
        $authConfig = $this->config['auth_config'] ?? [];

        return !empty($this->getBaseUrl())
            && !empty($authConfig['client_id'] ?? null)
            && !empty($authConfig['client_secret'] ?? null)
            && !empty($authConfig['token_url'] ?? null);
    }

    /**
     * Map outbound fields using Travelers-specific defaults.
     * Also converts dollar amounts to cents (Travelers convention).
     */
    protected function mapOutboundFields(array $data): array
    {
        // Map insurance_type to Travelers LOB code
        if (isset($data['insurance_type'])) {
            $data['insurance_type'] = $this->lobMapping[$data['insurance_type']] ?? $data['insurance_type'];
        }

        // Convert dollar amounts to cents
        if (isset($data['coverage_amount'])) {
            $data['coverage_amount'] = (int) ($data['coverage_amount'] * 100);
        }
        if (isset($data['deductible'])) {
            $data['deductible'] = (int) ($data['deductible'] * 100);
        }

        // Use Travelers-specific mappings
        $configMappings = $this->config['field_mappings'] ?? $this->config['field_mapping'] ?? [];
        $mappings = array_merge($this->defaultFieldMappings, $configMappings);

        $mapped = [];

        foreach ($mappings as $insureFlowField => $carrierField) {
            $value = data_get($data, $insureFlowField);

            if ($value !== null) {
                data_set($mapped, $carrierField, $value);
            }
        }

        return $mapped;
    }

    /**
     * Override headers to handle OAuth2 token acquisition.
     *
     * In a production implementation this would:
     *   1. Check for a cached access_token
     *   2. If expired, call the token_url with client_credentials grant
     *   3. Cache the new token
     *   4. Include it in the Authorization header
     *
     * For now, it uses whatever access_token is in auth_config.
     */
    protected function buildHeaders(): array
    {
        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];

        $headers = array_merge($headers, $this->config['headers'] ?? []);

        $authConfig = $this->config['auth_config'] ?? [];
        $accessToken = $authConfig['access_token'] ?? null;

        // TODO: Implement OAuth2 token refresh flow:
        // if (empty($accessToken) || $this->isTokenExpired()) {
        //     $accessToken = $this->refreshOAuthToken();
        // }

        if (!empty($accessToken)) {
            $headers['Authorization'] = 'Bearer ' . $accessToken;
        }

        return $headers;
    }

    /**
     * Parse Travelers' quote response format.
     *
     * Travelers returns:
     * {
     *   "quoteNumber": "TRV-Q-12345",
     *   "totalPremium": { "annualCents": 120000, "monthlyCents": 10000 },
     *   "coverages": [ { "code": "HO-3", "limit": 30000000, "premium": 85000 } ],
     *   "surcharges": [],
     *   "discounts": [ { "code": "MULTI", "amountCents": -500 } ],
     *   "status": "QUOTED"
     * }
     */
    protected function parseQuoteResponse(array $body): CarrierQuoteResponse
    {
        $premium = $body['totalPremium'] ?? [];
        $annualCents = $premium['annualCents'] ?? null;
        $monthlyCents = $premium['monthlyCents'] ?? null;

        // Convert cents to dollars
        $monthly = $monthlyCents !== null ? $monthlyCents / 100 : null;
        $annual = $annualCents !== null ? $annualCents / 100 : null;

        // Fall back to standard fields
        if ($monthly === null) {
            $monthly = $body['monthly_premium'] ?? $body['monthlyPremium'] ?? null;
        }
        if ($annual === null) {
            $annual = $body['annual_premium'] ?? $body['annualPremium'] ?? null;
        }

        if ($monthly !== null && $annual === null) {
            $annual = $monthly * 12;
        } elseif ($annual !== null && $monthly === null) {
            $monthly = $annual / 12;
        }

        if ($monthly === null && $annual === null) {
            return CarrierQuoteResponse::failure(
                errorMessage: 'Could not extract premium from Travelers response',
                carrier: $this->name,
                rawResponse: $body,
            );
        }

        return CarrierQuoteResponse::success(
            monthlyPremium: (float) $monthly,
            annualPremium: (float) $annual,
            carrier: $this->name,
            quoteNumber: $body['quoteNumber'] ?? null,
            coverages: $body['coverages'] ?? [],
            endorsements: $body['endorsements'] ?? [],
            exclusions: $body['exclusions'] ?? [],
            discounts: $body['discounts'] ?? [],
            rawResponse: $body,
        );
    }

    /**
     * Parse Travelers' application response format.
     *
     * Travelers returns:
     * {
     *   "submissionId": "TRV-SUB-67890",
     *   "status": "RECEIVED",
     *   "uwRequired": true,
     *   "estimatedDecisionDate": "2026-03-01"
     * }
     */
    protected function parseApplicationResponse(array $body): CarrierApplicationResponse
    {
        $referenceNumber = $body['submissionId'] ?? $body['reference_number'] ?? null;

        if ($referenceNumber === null) {
            return CarrierApplicationResponse::failure(
                errorMessage: 'Could not extract submission ID from Travelers response',
                rawResponse: $body,
            );
        }

        return CarrierApplicationResponse::success(
            referenceNumber: (string) $referenceNumber,
            status: $body['status'] ?? 'RECEIVED',
            rawResponse: $body,
        );
    }
}
