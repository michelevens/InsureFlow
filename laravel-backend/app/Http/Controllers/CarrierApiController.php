<?php

namespace App\Http\Controllers;

use App\Models\CarrierApiConfig;
use App\Services\CarrierApi\CarrierApiService;
use App\Services\CarrierRatingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CarrierApiController extends Controller
{
    public function __construct(
        private readonly CarrierRatingService $ratingService,
        private readonly CarrierApiService $carrierApiService,
    ) {}

    /**
     * List all carrier API configurations with their carrier relation.
     */
    public function index(Request $request): JsonResponse
    {
        $configs = CarrierApiConfig::with('carrier')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($configs);
    }

    /**
     * Get a single carrier API configuration.
     */
    public function show(CarrierApiConfig $config): JsonResponse
    {
        $config->load('carrier');

        return response()->json($config);
    }

    /**
     * Create a new carrier API configuration.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'carrier_id' => 'required|exists:carriers,id',
            'api_type' => 'sometimes|in:rest,soap,xml',
            'base_url' => 'required|url|max:2048',
            'auth_type' => 'required|in:api_key,oauth2,basic,certificate',
            'adapter_type' => 'sometimes|string|max:50',
            'api_key' => 'nullable|string',
            'api_secret' => 'nullable|string',
            'auth_config' => 'nullable|array',
            'credentials_encrypted' => 'nullable|string',
            'field_mapping' => 'nullable|array',
            'field_mappings' => 'nullable|array',
            'endpoints' => 'nullable|array',
            'headers' => 'nullable|array',
            'supported_products' => 'nullable|array',
            'rate_limit_per_minute' => 'sometimes|integer|min:1|max:10000',
            'timeout_seconds' => 'sometimes|integer|min:1|max:300',
            'is_active' => 'sometimes|boolean',
            'sandbox_mode' => 'sometimes|boolean',
            'sandbox_url' => 'nullable|url|max:2048',
        ]);

        $config = CarrierApiConfig::create($data);
        $config->load('carrier');

        return response()->json($config, 201);
    }

    /**
     * Update an existing carrier API configuration.
     */
    public function update(Request $request, CarrierApiConfig $config): JsonResponse
    {
        $data = $request->validate([
            'carrier_id' => 'sometimes|exists:carriers,id',
            'api_type' => 'sometimes|in:rest,soap,xml',
            'base_url' => 'sometimes|url|max:2048',
            'auth_type' => 'sometimes|in:api_key,oauth2,basic,certificate',
            'adapter_type' => 'sometimes|string|max:50',
            'api_key' => 'nullable|string',
            'api_secret' => 'nullable|string',
            'auth_config' => 'nullable|array',
            'credentials_encrypted' => 'nullable|string',
            'field_mapping' => 'nullable|array',
            'field_mappings' => 'nullable|array',
            'endpoints' => 'nullable|array',
            'headers' => 'nullable|array',
            'supported_products' => 'nullable|array',
            'rate_limit_per_minute' => 'sometimes|integer|min:1|max:10000',
            'timeout_seconds' => 'sometimes|integer|min:1|max:300',
            'is_active' => 'sometimes|boolean',
            'sandbox_mode' => 'sometimes|boolean',
            'sandbox_url' => 'nullable|url|max:2048',
        ]);

        $config->update($data);
        $config->load('carrier');

        return response()->json($config);
    }

    /**
     * Delete a carrier API configuration.
     */
    public function destroy(CarrierApiConfig $config): JsonResponse
    {
        $config->delete();

        return response()->json(['message' => 'Carrier API configuration deleted successfully.']);
    }

    /**
     * Test connectivity to a carrier API (legacy — uses CarrierRatingService).
     */
    public function test(CarrierApiConfig $config): JsonResponse
    {
        $result = $this->ratingService->testConnection($config);

        return response()->json($result);
    }

    /**
     * Test connectivity to a carrier API via the adapter layer.
     *
     * Sends a test quote request to verify the carrier API is reachable
     * and credentials are valid. Updates last_tested_at and last_test_status.
     */
    public function testConnection(CarrierApiConfig $config): JsonResponse
    {
        $config->load('carrier');
        $carrierSlug = $config->carrier?->slug;

        if (empty($carrierSlug)) {
            return response()->json([
                'success' => false,
                'message' => 'Carrier not found for this configuration.',
            ], 404);
        }

        // Try a basic connectivity test via the rating service first
        $result = $this->ratingService->testConnection($config);

        // Update the config with test results
        $config->update([
            'last_tested_at' => now(),
            'last_test_status' => $result['success'] ? 'success' : 'failed',
        ]);

        return response()->json(array_merge($result, [
            'tested_at' => now()->toIso8601String(),
            'carrier_slug' => $carrierSlug,
            'adapter_type' => $config->adapter_type ?? 'generic_rest',
        ]));
    }

    /**
     * Get the list of available adapter types for the admin UI.
     */
    public function availableAdapters(): JsonResponse
    {
        $adapterTypes = $this->carrierApiService->getAvailableAdapterTypes();
        $configuredCarriers = $this->carrierApiService->getConfiguredCarriers();

        return response()->json([
            'adapter_types' => $adapterTypes,
            'configured_carriers' => $configuredCarriers,
        ]);
    }

    /**
     * Get paginated logs for a carrier API configuration.
     */
    public function logs(CarrierApiConfig $config): JsonResponse
    {
        $logs = $config->logs()
            ->orderBy('created_at', 'desc')
            ->paginate(25);

        return response()->json($logs);
    }

    /**
     * Get live rates from carrier APIs for the given quote data.
     */
    public function getLiveRates(Request $request): JsonResponse
    {
        $data = $request->validate([
            'insurance_type' => 'required|string',
            'coverage_amount' => 'required|numeric|min:0',
            'deductible' => 'nullable|numeric|min:0',
            'state' => 'required|string|size:2',
            'zip_code' => 'required|string|max:10',
            'property_type' => 'nullable|string',
            'applicant' => 'nullable|array',
            'applicant.first_name' => 'nullable|string',
            'applicant.last_name' => 'nullable|string',
            'applicant.date_of_birth' => 'nullable|date',
            'carrier_id' => 'nullable|exists:carriers,id',
        ]);

        $carrierId = $data['carrier_id'] ?? null;
        unset($data['carrier_id']);

        $rates = $this->ratingService->getRates($data, $carrierId);

        return response()->json([
            'rates' => $rates,
            'count' => count($rates),
        ]);
    }

    /**
     * Get quotes from the adapter layer for multiple carriers.
     *
     * Uses the CarrierApiService adapter system for enhanced field mapping
     * and carrier-specific request formatting.
     */
    public function getAdapterQuotes(Request $request): JsonResponse
    {
        $data = $request->validate([
            'insurance_type' => 'required|string',
            'coverage_amount' => 'required|numeric|min:0',
            'deductible' => 'nullable|numeric|min:0',
            'state' => 'required|string|size:2',
            'zip_code' => 'required|string|max:10',
            'property_type' => 'nullable|string',
            'applicant' => 'nullable|array',
            'applicant.first_name' => 'nullable|string',
            'applicant.last_name' => 'nullable|string',
            'applicant.date_of_birth' => 'nullable|date',
            'carrier_slugs' => 'nullable|array',
            'carrier_slugs.*' => 'string',
        ]);

        $carrierSlugs = $data['carrier_slugs'] ?? [];
        unset($data['carrier_slugs']);

        $quotes = $this->carrierApiService->getMultiCarrierQuotes($carrierSlugs, $data);

        $results = [];
        foreach ($quotes as $slug => $quote) {
            $results[$slug] = $quote->toArray();
        }

        return response()->json([
            'quotes' => $results,
            'count' => count($results),
        ]);
    }
}
