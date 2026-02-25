<?php

namespace App\Services\CarrierApi\Adapters;

use App\Models\CarrierApiLog;
use App\Services\CarrierApi\CarrierApiAdapter;
use App\Services\CarrierApi\CarrierApplicationResponse;
use App\Services\CarrierApi\CarrierQuoteResponse;
use App\Services\CarrierApi\CarrierStatusResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * A configurable REST adapter that works with any carrier's REST API.
 *
 * This adapter uses configuration from the carrier_api_configs table to
 * dynamically build requests, map fields, and handle authentication for
 * any carrier that exposes a REST API. It serves as both a standalone
 * adapter for simple integrations and a base class for carrier-specific
 * adapters that need custom behavior.
 */
class GenericRestAdapter implements CarrierApiAdapter
{
    public function __construct(
        protected string $slug,
        protected string $name,
        protected array $config,
    ) {}

    public function getSlug(): string
    {
        return $this->slug;
    }

    public function getName(): string
    {
        return $this->name;
    }

    /**
     * Check if the adapter has the minimum required configuration.
     */
    public function isConfigured(): bool
    {
        $baseUrl = $this->getBaseUrl();

        if (empty($baseUrl)) {
            return false;
        }

        // Check auth configuration based on auth type
        $authType = $this->config['auth_type'] ?? 'api_key';

        return match ($authType) {
            'api_key' => !empty($this->config['api_key'] ?? $this->config['credentials_encrypted'] ?? null),
            'oauth2' => !empty($this->config['auth_config']['client_id'] ?? null),
            'basic' => !empty($this->config['credentials_encrypted'] ?? null),
            'certificate' => !empty($this->config['auth_config']['cert_path'] ?? null),
            default => true,
        };
    }

    /**
     * Get a quote from the carrier API.
     *
     * Maps InsureFlow application data to the carrier's format using field mappings,
     * sends the request to the carrier's quote endpoint, and normalizes the response.
     */
    public function getQuote(array $applicationData): CarrierQuoteResponse
    {
        $endpoint = $this->getEndpoint('quote', '/api/quote');
        $mappedData = $this->mapOutboundFields($applicationData);
        $url = $this->buildUrl($endpoint);

        $startTime = microtime(true);

        try {
            $response = $this->makeRequest('POST', $url, $mappedData);
            $responseTimeMs = $this->getElapsedMs($startTime);

            $this->logRequest('POST', $url, $mappedData, $response->status(), $response->body(), $responseTimeMs);

            if (!$response->successful()) {
                Log::warning('Carrier quote request failed', [
                    'carrier' => $this->slug,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return CarrierQuoteResponse::failure(
                    errorMessage: "Carrier returned HTTP {$response->status()}: {$response->body()}",
                    carrier: $this->name,
                    rawResponse: $response->json() ?? [],
                );
            }

            $body = $response->json();

            return $this->parseQuoteResponse($body);

        } catch (\Throwable $e) {
            $responseTimeMs = $this->getElapsedMs($startTime);
            $this->logRequest('POST', $url, $mappedData, null, null, $responseTimeMs, $e->getMessage());

            Log::error('Carrier quote request exception', [
                'carrier' => $this->slug,
                'error' => $e->getMessage(),
            ]);

            return CarrierQuoteResponse::failure(
                errorMessage: "Request failed: {$e->getMessage()}",
                carrier: $this->name,
            );
        }
    }

    /**
     * Submit a full application to the carrier.
     */
    public function submitApplication(array $applicationData): CarrierApplicationResponse
    {
        $endpoint = $this->getEndpoint('submit', '/api/submit');
        $mappedData = $this->mapOutboundFields($applicationData);
        $url = $this->buildUrl($endpoint);

        $startTime = microtime(true);

        try {
            $response = $this->makeRequest('POST', $url, $mappedData);
            $responseTimeMs = $this->getElapsedMs($startTime);

            $this->logRequest('POST', $url, $mappedData, $response->status(), $response->body(), $responseTimeMs);

            if (!$response->successful()) {
                return CarrierApplicationResponse::failure(
                    errorMessage: "Carrier returned HTTP {$response->status()}: {$response->body()}",
                    rawResponse: $response->json() ?? [],
                );
            }

            $body = $response->json();

            return $this->parseApplicationResponse($body);

        } catch (\Throwable $e) {
            $responseTimeMs = $this->getElapsedMs($startTime);
            $this->logRequest('POST', $url, $mappedData, null, null, $responseTimeMs, $e->getMessage());

            Log::error('Carrier application submission exception', [
                'carrier' => $this->slug,
                'error' => $e->getMessage(),
            ]);

            return CarrierApplicationResponse::failure(
                errorMessage: "Request failed: {$e->getMessage()}",
            );
        }
    }

    /**
     * Check the status of a previously submitted application.
     */
    public function checkStatus(string $referenceNumber): CarrierStatusResponse
    {
        $endpoint = $this->getEndpoint('status', '/api/status');
        $url = $this->buildUrl($endpoint) . '/' . urlencode($referenceNumber);

        $startTime = microtime(true);

        try {
            $response = $this->makeRequest('GET', $url);
            $responseTimeMs = $this->getElapsedMs($startTime);

            $this->logRequest('GET', $url, [], $response->status(), $response->body(), $responseTimeMs);

            if (!$response->successful()) {
                return CarrierStatusResponse::failure(
                    errorMessage: "Carrier returned HTTP {$response->status()}: {$response->body()}",
                    rawResponse: $response->json() ?? [],
                );
            }

            $body = $response->json();

            return $this->parseStatusResponse($body);

        } catch (\Throwable $e) {
            $responseTimeMs = $this->getElapsedMs($startTime);
            $this->logRequest('GET', $url, [], null, null, $responseTimeMs, $e->getMessage());

            Log::error('Carrier status check exception', [
                'carrier' => $this->slug,
                'reference' => $referenceNumber,
                'error' => $e->getMessage(),
            ]);

            return CarrierStatusResponse::failure(
                errorMessage: "Request failed: {$e->getMessage()}",
            );
        }
    }

    /**
     * Get the list of supported product types from configuration.
     */
    public function getSupportedProducts(): array
    {
        return $this->config['supported_products'] ?? [];
    }

    // ──────────────────────────────────────────────────────────────
    // Protected methods (override in carrier-specific adapters)
    // ──────────────────────────────────────────────────────────────

    /**
     * Parse the carrier's raw quote response into our DTO.
     * Override this in carrier-specific adapters for custom parsing.
     */
    protected function parseQuoteResponse(array $body): CarrierQuoteResponse
    {
        $monthly = $body['monthly_premium'] ?? $body['monthlyPremium'] ?? $body['premium']['monthly'] ?? null;
        $annual = $body['annual_premium'] ?? $body['annualPremium'] ?? $body['premium']['annual'] ?? null;

        // If we only have one, calculate the other
        if ($monthly !== null && $annual === null) {
            $annual = $monthly * 12;
        } elseif ($annual !== null && $monthly === null) {
            $monthly = $annual / 12;
        }

        if ($monthly === null && $annual === null) {
            return CarrierQuoteResponse::failure(
                errorMessage: 'Could not extract premium from carrier response',
                carrier: $this->name,
                rawResponse: $body,
            );
        }

        return CarrierQuoteResponse::success(
            monthlyPremium: (float) $monthly,
            annualPremium: (float) $annual,
            carrier: $this->name,
            quoteNumber: $body['quote_number'] ?? $body['quoteNumber'] ?? $body['quote_id'] ?? null,
            coverages: $body['coverages'] ?? $body['coverage_details'] ?? [],
            endorsements: $body['endorsements'] ?? [],
            exclusions: $body['exclusions'] ?? [],
            discounts: $body['discounts'] ?? [],
            rawResponse: $body,
        );
    }

    /**
     * Parse the carrier's raw application response into our DTO.
     * Override this in carrier-specific adapters for custom parsing.
     */
    protected function parseApplicationResponse(array $body): CarrierApplicationResponse
    {
        $referenceNumber = $body['reference_number']
            ?? $body['referenceNumber']
            ?? $body['application_id']
            ?? $body['applicationId']
            ?? null;

        if ($referenceNumber === null) {
            return CarrierApplicationResponse::failure(
                errorMessage: 'Could not extract reference number from carrier response',
                rawResponse: $body,
            );
        }

        return CarrierApplicationResponse::success(
            referenceNumber: (string) $referenceNumber,
            status: $body['status'] ?? 'submitted',
            rawResponse: $body,
        );
    }

    /**
     * Parse the carrier's raw status response into our DTO.
     * Override this in carrier-specific adapters for custom parsing.
     */
    protected function parseStatusResponse(array $body): CarrierStatusResponse
    {
        $status = $body['status'] ?? $body['application_status'] ?? $body['applicationStatus'] ?? null;

        if ($status === null) {
            return CarrierStatusResponse::failure(
                errorMessage: 'Could not extract status from carrier response',
                rawResponse: $body,
            );
        }

        return CarrierStatusResponse::success(
            status: (string) $status,
            policyNumber: $body['policy_number'] ?? $body['policyNumber'] ?? null,
            rawResponse: $body,
        );
    }

    // ──────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────

    /**
     * Get the effective base URL (sandbox if sandbox_mode is enabled).
     */
    protected function getBaseUrl(): string
    {
        $sandboxMode = $this->config['sandbox_mode'] ?? true;

        if ($sandboxMode && !empty($this->config['sandbox_url'])) {
            return rtrim($this->config['sandbox_url'], '/');
        }

        return rtrim($this->config['base_url'] ?? '', '/');
    }

    /**
     * Build the full URL from base URL and endpoint path.
     */
    protected function buildUrl(string $endpoint): string
    {
        return $this->getBaseUrl() . '/' . ltrim($endpoint, '/');
    }

    /**
     * Get a configured endpoint path, or fall back to a default.
     */
    protected function getEndpoint(string $key, string $default): string
    {
        $endpoints = $this->config['endpoints'] ?? [];

        return $endpoints[$key] ?? $default;
    }

    /**
     * Map InsureFlow fields to the carrier's expected field names using field_mappings config.
     */
    protected function mapOutboundFields(array $data): array
    {
        $mappings = $this->config['field_mappings'] ?? $this->config['field_mapping'] ?? null;

        if (empty($mappings)) {
            return $data;
        }

        $mapped = [];

        foreach ($mappings as $insureFlowField => $carrierField) {
            if (array_key_exists($insureFlowField, $data)) {
                $mapped[$carrierField] = $data[$insureFlowField];
            }
        }

        // Include any fields that weren't in the mapping (pass-through)
        foreach ($data as $key => $value) {
            if (!array_key_exists($key, $mappings)) {
                $mapped[$key] = $value;
            }
        }

        return $mapped;
    }

    /**
     * Make an HTTP request with authentication headers.
     */
    protected function makeRequest(string $method, string $url, array $data = []): \Illuminate\Http\Client\Response
    {
        $timeout = $this->config['timeout_seconds'] ?? 30;
        $headers = $this->buildHeaders();

        $request = Http::timeout($timeout)->withHeaders($headers);

        return match (strtoupper($method)) {
            'GET' => $request->get($url, $data),
            'POST' => $request->post($url, $data),
            'PUT' => $request->put($url, $data),
            'PATCH' => $request->patch($url, $data),
            'DELETE' => $request->delete($url, $data),
            default => $request->post($url, $data),
        };
    }

    /**
     * Build authentication and custom headers for the request.
     */
    protected function buildHeaders(): array
    {
        $headers = array_merge(
            ['Accept' => 'application/json', 'Content-Type' => 'application/json'],
            $this->config['headers'] ?? [],
        );

        $authType = $this->config['auth_type'] ?? 'api_key';
        $credentials = $this->getCredentials();

        return match ($authType) {
            'api_key' => array_merge($headers, [
                ($credentials['header_name'] ?? 'X-API-Key') => $credentials['api_key'] ?? ($this->config['api_key'] ?? ''),
            ]),
            'oauth2' => array_merge($headers, [
                'Authorization' => 'Bearer ' . ($credentials['access_token'] ?? ''),
            ]),
            'basic' => array_merge($headers, [
                'Authorization' => 'Basic ' . base64_encode(
                    ($credentials['username'] ?? '') . ':' . ($credentials['password'] ?? '')
                ),
            ]),
            'certificate' => $headers, // Certificate auth handled at HTTP client level
            default => $headers,
        };
    }

    /**
     * Parse credentials from the config. Handles both the new api_key/api_secret
     * fields and the legacy credentials_encrypted JSON field.
     */
    protected function getCredentials(): array
    {
        // Try auth_config first (structured auth data)
        if (!empty($this->config['auth_config']) && is_array($this->config['auth_config'])) {
            return $this->config['auth_config'];
        }

        // Try legacy credentials_encrypted field
        $creds = $this->config['credentials_encrypted'] ?? null;

        if (empty($creds)) {
            return [];
        }

        if (is_string($creds)) {
            $decoded = json_decode($creds, true);
            return is_array($decoded) ? $decoded : [];
        }

        return is_array($creds) ? $creds : [];
    }

    /**
     * Log the API request and response for audit trail.
     */
    protected function logRequest(
        string $method,
        string $url,
        array $payload,
        ?int $status,
        ?string $body,
        int $responseTimeMs,
        ?string $errorMessage = null,
    ): void {
        $configId = $this->config['config_id'] ?? null;

        if ($configId === null) {
            // No DB config ID — just log to application log
            Log::info('Carrier API request (no config_id)', [
                'carrier' => $this->slug,
                'method' => $method,
                'url' => $url,
                'status' => $status,
                'response_time_ms' => $responseTimeMs,
                'error' => $errorMessage,
            ]);
            return;
        }

        try {
            CarrierApiLog::create([
                'carrier_api_config_id' => $configId,
                'request_hash' => md5(json_encode([$configId, $payload])),
                'request_method' => $method,
                'request_url' => $url,
                'request_payload' => $payload,
                'response_status' => $status,
                'response_body' => $body,
                'response_time_ms' => $responseTimeMs,
                'error_message' => $errorMessage,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to write carrier API log', [
                'carrier' => $this->slug,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get milliseconds elapsed since a start time.
     */
    protected function getElapsedMs(float $startTime): int
    {
        return (int) round((microtime(true) - $startTime) * 1000);
    }
}
