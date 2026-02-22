<?php

namespace App\Http\Controllers;

use App\Models\CarrierApiConfig;
use App\Services\CarrierRatingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CarrierApiController extends Controller
{
    public function __construct(
        private readonly CarrierRatingService $ratingService,
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
     * Create a new carrier API configuration.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'carrier_id' => 'required|exists:carriers,id',
            'api_type' => 'required|in:rest,soap,xml',
            'base_url' => 'required|url|max:2048',
            'auth_type' => 'required|in:api_key,oauth2,basic,certificate',
            'credentials_encrypted' => 'nullable|string',
            'field_mapping' => 'nullable|array',
            'rate_limit_per_minute' => 'sometimes|integer|min:1|max:10000',
            'timeout_seconds' => 'sometimes|integer|min:1|max:300',
            'is_active' => 'sometimes|boolean',
        ]);

        $config = CarrierApiConfig::create($data);
        $config->load('carrier');

        return response()->json($config, 201);
    }

    /**
     * Update an existing carrier API configuration.
     */
    public function update(Request $request, CarrierApiConfig $carrierApiConfig): JsonResponse
    {
        $data = $request->validate([
            'carrier_id' => 'sometimes|exists:carriers,id',
            'api_type' => 'sometimes|in:rest,soap,xml',
            'base_url' => 'sometimes|url|max:2048',
            'auth_type' => 'sometimes|in:api_key,oauth2,basic,certificate',
            'credentials_encrypted' => 'nullable|string',
            'field_mapping' => 'nullable|array',
            'rate_limit_per_minute' => 'sometimes|integer|min:1|max:10000',
            'timeout_seconds' => 'sometimes|integer|min:1|max:300',
            'is_active' => 'sometimes|boolean',
        ]);

        $carrierApiConfig->update($data);
        $carrierApiConfig->load('carrier');

        return response()->json($carrierApiConfig);
    }

    /**
     * Delete a carrier API configuration.
     */
    public function destroy(CarrierApiConfig $carrierApiConfig): JsonResponse
    {
        $carrierApiConfig->delete();

        return response()->json(['message' => 'Carrier API configuration deleted successfully.']);
    }

    /**
     * Test connectivity to a carrier API.
     */
    public function test(CarrierApiConfig $carrierApiConfig): JsonResponse
    {
        $result = $this->ratingService->testConnection($carrierApiConfig);

        return response()->json($result);
    }

    /**
     * Get paginated logs for a carrier API configuration.
     */
    public function logs(CarrierApiConfig $carrierApiConfig): JsonResponse
    {
        $logs = $carrierApiConfig->logs()
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
}
