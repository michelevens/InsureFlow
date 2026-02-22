<?php

namespace App\Services;

use App\Models\CarrierApiConfig;
use App\Models\CarrierApiLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CarrierRatingService
{
    /**
     * Get rates from active carrier API configurations.
     *
     * @param  array     $quoteData  The quote/risk data to send to carriers.
     * @param  int|null  $carrierId  Optional carrier ID to filter by a single carrier.
     * @return array  Array of normalized rate responses (nulls filtered out).
     */
    public function getRates(array $quoteData, ?int $carrierId = null): array
    {
        $query = CarrierApiConfig::where('is_active', true)->with('carrier');

        if ($carrierId !== null) {
            $query->where('carrier_id', $carrierId);
        }

        $configs = $query->get();

        $rates = [];

        // Sequential execution (can be replaced with parallel/async later)
        foreach ($configs as $config) {
            $rate = $this->fetchRate($config, $quoteData);

            if ($rate !== null) {
                $rates[] = $rate;
            }
        }

        return $rates;
    }

    /**
     * Fetch a rate from a single carrier API.
     *
     * @param  CarrierApiConfig  $config     The carrier API configuration.
     * @param  array             $quoteData  The quote/risk data to send.
     * @return array|null  Normalized rate response, or null on failure.
     */
    public function fetchRate(CarrierApiConfig $config, array $quoteData): ?array
    {
        $config->loadMissing('carrier');

        // Map fields using the config's field mapping
        $mappedData = $this->mapFields($quoteData, $config->field_mapping);

        $requestUrl = rtrim($config->base_url, '/') . '/rate';
        $requestMethod = 'POST';
        $requestHash = md5(json_encode([$config->id, $mappedData]));

        $startTime = microtime(true);

        try {
            $response = Http::timeout($config->timeout_seconds)
                ->withHeaders($this->buildAuthHeaders($config))
                ->post($requestUrl, $mappedData);

            $responseTimeMs = (int) round((microtime(true) - $startTime) * 1000);

            // Log the request/response
            CarrierApiLog::create([
                'carrier_api_config_id' => $config->id,
                'request_hash' => $requestHash,
                'request_method' => $requestMethod,
                'request_url' => $requestUrl,
                'request_payload' => $mappedData,
                'response_status' => $response->status(),
                'response_body' => $response->body(),
                'response_time_ms' => $responseTimeMs,
                'error_message' => $response->successful() ? null : $response->body(),
            ]);

            if (!$response->successful()) {
                Log::warning('Carrier API returned non-success status', [
                    'carrier_id' => $config->carrier_id,
                    'status' => $response->status(),
                ]);
                return null;
            }

            $body = $response->json();

            return [
                'carrier_id' => $config->carrier_id,
                'carrier_name' => $config->carrier->name ?? 'Unknown',
                'monthly_premium' => $body['monthly_premium'] ?? null,
                'annual_premium' => $body['annual_premium'] ?? null,
                'coverage_details' => $body['coverage_details'] ?? [],
                'quote_id' => $body['quote_id'] ?? null,
                'response_time_ms' => $responseTimeMs,
            ];
        } catch (\Throwable $e) {
            $responseTimeMs = (int) round((microtime(true) - $startTime) * 1000);

            // Log the error
            CarrierApiLog::create([
                'carrier_api_config_id' => $config->id,
                'request_hash' => $requestHash,
                'request_method' => $requestMethod,
                'request_url' => $requestUrl,
                'request_payload' => $mappedData,
                'response_status' => null,
                'response_body' => null,
                'response_time_ms' => $responseTimeMs,
                'error_message' => $e->getMessage(),
            ]);

            Log::error('Carrier API request failed', [
                'carrier_id' => $config->carrier_id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Test connectivity to a carrier API endpoint.
     *
     * @param  CarrierApiConfig  $config  The carrier API configuration to test.
     * @return array  Result with 'success', 'response_time_ms', and 'message' keys.
     */
    public function testConnection(CarrierApiConfig $config): array
    {
        $startTime = microtime(true);

        try {
            $response = Http::timeout($config->timeout_seconds)
                ->withHeaders($this->buildAuthHeaders($config))
                ->get($config->base_url);

            $responseTimeMs = (int) round((microtime(true) - $startTime) * 1000);

            if ($response->successful()) {
                $config->update(['last_tested_at' => now()]);

                return [
                    'success' => true,
                    'response_time_ms' => $responseTimeMs,
                    'message' => 'Connection successful (HTTP ' . $response->status() . ')',
                ];
            }

            return [
                'success' => false,
                'response_time_ms' => $responseTimeMs,
                'message' => 'Connection returned HTTP ' . $response->status(),
            ];
        } catch (\Throwable $e) {
            $responseTimeMs = (int) round((microtime(true) - $startTime) * 1000);

            return [
                'success' => false,
                'response_time_ms' => $responseTimeMs,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Map quote data fields using the carrier's field mapping configuration.
     */
    private function mapFields(array $quoteData, ?array $fieldMapping): array
    {
        if (empty($fieldMapping)) {
            return $quoteData;
        }

        $mapped = [];

        foreach ($fieldMapping as $ourField => $theirField) {
            if (array_key_exists($ourField, $quoteData)) {
                $mapped[$theirField] = $quoteData[$ourField];
            }
        }

        return $mapped;
    }

    /**
     * Build authentication headers based on the carrier API config's auth type.
     */
    private function buildAuthHeaders(CarrierApiConfig $config): array
    {
        $credentials = $config->credentials_encrypted;
        $headers = ['Accept' => 'application/json'];

        if (empty($credentials)) {
            return $headers;
        }

        $creds = is_string($credentials) ? json_decode($credentials, true) : $credentials;

        if (!is_array($creds)) {
            return $headers;
        }

        return match ($config->auth_type) {
            'api_key' => array_merge($headers, [
                ($creds['header_name'] ?? 'X-API-Key') => $creds['api_key'] ?? '',
            ]),
            'oauth2' => array_merge($headers, [
                'Authorization' => 'Bearer ' . ($creds['access_token'] ?? ''),
            ]),
            'basic' => array_merge($headers, [
                'Authorization' => 'Basic ' . base64_encode(
                    ($creds['username'] ?? '') . ':' . ($creds['password'] ?? '')
                ),
            ]),
            'certificate' => $headers, // Certificate auth is handled at the HTTP client level
            default => $headers,
        };
    }
}
