<?php

namespace App\Services\CarrierApi\Adapters;

use App\Services\CarrierApi\CarrierQuoteResponse;
use App\Services\CarrierApi\CarrierApplicationResponse;

/**
 * Progressive Insurance API adapter.
 *
 * Progressive's commercial API (ForAgentsOnly / Progressive Agent) uses:
 *   - Base URL: https://api.progressive.com/v1 (production)
 *   - Auth: API key via X-Progressive-Api-Key header + agent credentials
 *   - Quote endpoint: POST /quotes
 *   - Submit endpoint: POST /applications
 *   - Status endpoint: GET /applications/{referenceId}/status
 *
 * Progressive-specific field naming conventions:
 *   - "coverageAmount" instead of "coverage_amount"
 *   - "deductibleAmount" instead of "deductible"
 *   - "vehicleInfo" object for auto insurance
 *   - "propertyInfo" object for homeowners
 *   - "applicantInfo.dateOfBirth" (camelCase, nested)
 *
 * This is a stub adapter. To activate Progressive integration:
 *   1. Obtain API credentials from Progressive's partner portal
 *   2. Create a carrier_api_configs record with adapter_type = 'progressive'
 *   3. Set the api_key and auth_config with your Progressive credentials
 *   4. Configure field_mappings if the defaults below don't match your agreement
 */
class ProgressiveAdapter extends GenericRestAdapter
{
    /**
     * Default InsureFlow → Progressive field mappings.
     */
    protected array $defaultFieldMappings = [
        'insurance_type' => 'productType',
        'coverage_amount' => 'coverageAmount',
        'deductible' => 'deductibleAmount',
        'state' => 'riskState',
        'zip_code' => 'riskZipCode',
        'property_type' => 'propertyInfo.type',
        'applicant.first_name' => 'applicantInfo.firstName',
        'applicant.last_name' => 'applicantInfo.lastName',
        'applicant.date_of_birth' => 'applicantInfo.dateOfBirth',
        'applicant.email' => 'applicantInfo.email',
        'applicant.phone' => 'applicantInfo.phone',
    ];

    public function __construct(array $config)
    {
        parent::__construct(
            slug: 'progressive',
            name: 'Progressive',
            config: array_merge([
                'auth_type' => 'api_key',
                'endpoints' => [
                    'quote' => '/v1/quotes',
                    'submit' => '/v1/applications',
                    'status' => '/v1/applications',
                ],
                'supported_products' => ['auto', 'homeowners', 'renters', 'umbrella'],
                'timeout_seconds' => 30,
            ], $config),
        );
    }

    /**
     * Progressive requires api_key and agent_id to be configured.
     */
    public function isConfigured(): bool
    {
        $creds = $this->getCredentials();

        return !empty($this->getBaseUrl())
            && !empty($creds['api_key'] ?? $this->config['api_key'] ?? null)
            && !empty($creds['agent_id'] ?? null);
    }

    /**
     * Override headers to include Progressive-specific authentication.
     */
    protected function buildHeaders(): array
    {
        $headers = parent::buildHeaders();
        $creds = $this->getCredentials();

        // Progressive uses a custom API key header
        if (!empty($creds['api_key'])) {
            $headers['X-Progressive-Api-Key'] = $creds['api_key'];
        }

        // Include agent ID in headers
        if (!empty($creds['agent_id'])) {
            $headers['X-Progressive-Agent-Id'] = $creds['agent_id'];
        }

        return $headers;
    }

    /**
     * Map outbound fields using Progressive-specific defaults, merged with
     * any custom mappings from the config.
     */
    protected function mapOutboundFields(array $data): array
    {
        // Merge default Progressive mappings with any config overrides
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
     * Parse Progressive's quote response format.
     *
     * Progressive returns:
     * {
     *   "quoteId": "PGR-12345",
     *   "premium": { "monthly": 89.50, "annual": 1074.00 },
     *   "coverages": [ { "type": "...", "limit": "...", "premium": ... } ],
     *   "discounts": [ { "type": "multi-policy", "amount": -12.00 } ],
     *   "status": "quoted"
     * }
     */
    protected function parseQuoteResponse(array $body): CarrierQuoteResponse
    {
        $premium = $body['premium'] ?? [];
        $monthly = $premium['monthly'] ?? $body['monthlyPremium'] ?? null;
        $annual = $premium['annual'] ?? $body['annualPremium'] ?? null;

        if ($monthly !== null && $annual === null) {
            $annual = $monthly * 12;
        } elseif ($annual !== null && $monthly === null) {
            $monthly = $annual / 12;
        }

        if ($monthly === null && $annual === null) {
            return CarrierQuoteResponse::failure(
                errorMessage: 'Could not extract premium from Progressive response',
                carrier: $this->name,
                rawResponse: $body,
            );
        }

        return CarrierQuoteResponse::success(
            monthlyPremium: (float) $monthly,
            annualPremium: (float) $annual,
            carrier: $this->name,
            quoteNumber: $body['quoteId'] ?? null,
            coverages: $body['coverages'] ?? [],
            endorsements: $body['endorsements'] ?? [],
            exclusions: $body['exclusions'] ?? [],
            discounts: $body['discounts'] ?? [],
            rawResponse: $body,
        );
    }

    /**
     * Parse Progressive's application response format.
     *
     * Progressive returns:
     * {
     *   "applicationId": "PGR-APP-67890",
     *   "status": "submitted",
     *   "underwritingRequired": true
     * }
     */
    protected function parseApplicationResponse(array $body): CarrierApplicationResponse
    {
        $referenceNumber = $body['applicationId'] ?? $body['reference_number'] ?? null;

        if ($referenceNumber === null) {
            return CarrierApplicationResponse::failure(
                errorMessage: 'Could not extract application ID from Progressive response',
                rawResponse: $body,
            );
        }

        return CarrierApplicationResponse::success(
            referenceNumber: (string) $referenceNumber,
            status: $body['status'] ?? 'submitted',
            rawResponse: $body,
        );
    }
}
