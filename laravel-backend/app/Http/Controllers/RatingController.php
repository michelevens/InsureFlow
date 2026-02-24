<?php

namespace App\Http\Controllers;

use App\Models\LeadScenario;
use App\Models\RatingRun;
use App\Services\Rating\RatingEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RatingController extends Controller
{
    /**
     * Rate a scenario — the main entry point.
     * POST /rate/scenario/{scenarioId}
     */
    public function rateScenario(Request $request, int $scenarioId): JsonResponse
    {
        $scenario = LeadScenario::with(['insuredObjects', 'coverages'])->findOrFail($scenarioId);

        $overrides = $request->validate([
            'payment_mode' => 'sometimes|string|in:annual,semiannual,quarterly,monthly',
            'rate_table_version' => 'sometimes|string',
            'monthly_benefit_requested' => 'sometimes|numeric|min:0',
            'elimination_period_days' => 'sometimes|integer|min:0',
            'benefit_period' => 'sometimes|string',
            'occupation_class' => 'sometimes|string',
            'uw_class' => 'sometimes|string',
            'definition_of_disability' => 'sometimes|string',
            'factor_selections' => 'sometimes|array',
            'rider_selections' => 'sometimes|array',
        ]);

        $engine = new RatingEngine();
        $output = $engine->rateScenario($scenario, $overrides, $request->user()->id);

        return response()->json([
            'rating' => $output->toArray(),
            'scenario_id' => $scenario->id,
            'product_type' => $scenario->product_type,
        ], $output->eligible ? 200 : 422);
    }

    /**
     * Get available rating options (factors, riders, fees) for a product type.
     * GET /rate/options/{productType}
     */
    public function productOptions(Request $request, string $productType): JsonResponse
    {
        $carrierId = $request->has('carrier_id') ? (int) $request->carrier_id : null;
        $engine = new RatingEngine();
        $options = $engine->getProductOptions($productType, $carrierId);

        if (!$options) {
            return response()->json([
                'message' => "No rating options available for product type: {$productType}",
            ], 404);
        }

        return response()->json($options);
    }

    /**
     * Get audit trail for a specific rating run.
     * GET /rate/audit/{runId}
     */
    public function auditRun(int $runId): JsonResponse
    {
        $run = RatingRun::with('user:id,name,email')->findOrFail($runId);

        return response()->json([
            'id' => $run->id,
            'scenario_id' => $run->scenario_id,
            'product_type' => $run->product_type,
            'rate_table_version' => $run->rate_table_version,
            'engine_version' => $run->engine_version,
            'input_hash' => $run->input_hash,
            'input_snapshot' => $run->input_snapshot,
            'output_snapshot' => $run->output_snapshot,
            'final_premium_annual' => $run->final_premium_annual,
            'final_premium_monthly' => $run->final_premium_monthly,
            'status' => $run->status,
            'error_message' => $run->error_message,
            'duration_ms' => $run->duration_ms,
            'user' => $run->user,
            'created_at' => $run->created_at,
        ]);
    }

    /**
     * Get rating history for a scenario.
     * GET /rate/history/{scenarioId}
     */
    public function scenarioHistory(int $scenarioId): JsonResponse
    {
        $runs = RatingRun::where('scenario_id', $scenarioId)
            ->select('id', 'product_type', 'rate_table_version', 'status',
                     'final_premium_annual', 'final_premium_monthly',
                     'duration_ms', 'input_hash', 'created_at')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json($runs);
    }

    /**
     * List all registered product types that can be rated.
     * GET /rate/products
     */
    public function registeredProducts(): JsonResponse
    {
        $engine = new RatingEngine();
        return response()->json([
            'products' => $engine->registeredProducts(),
        ]);
    }
}
