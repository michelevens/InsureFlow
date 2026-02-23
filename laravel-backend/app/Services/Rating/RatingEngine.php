<?php

namespace App\Services\Rating;

use App\Models\LeadScenario;
use App\Models\RatingRun;
use App\Services\Rating\Plugins\DisabilityPlugin;
use App\Services\Rating\Plugins\LifePlugin;
use App\Services\Rating\Plugins\PropertyCasualtyPlugin;
use Illuminate\Support\Facades\Log;

/**
 * Core Rating Engine — resolves plugins by productType, never branches on product family.
 *
 * Golden Flow: Scenario → Build RateInput → Resolve Plugin → rateProduct() → RateOutput → Audit
 */
class RatingEngine
{
    /** @var array<string, class-string<ProductPlugin>> product_type => plugin class */
    private array $pluginMap = [];

    public function __construct()
    {
        $this->registerPlugins([
            DisabilityPlugin::class,
            LifePlugin::class,
            PropertyCasualtyPlugin::class,
        ]);
    }

    /**
     * Register plugin classes. Each plugin declares which productTypes it handles.
     * @param class-string<ProductPlugin>[] $pluginClasses
     */
    public function registerPlugins(array $pluginClasses): void
    {
        foreach ($pluginClasses as $class) {
            foreach ($class::productTypes() as $productType) {
                $this->pluginMap[$productType] = $class;
            }
        }
    }

    /**
     * Rate a scenario. This is the main entry point.
     */
    public function rateScenario(
        LeadScenario $scenario,
        array $overrides = [],
        ?int $userId = null
    ): RateOutput {
        $startTime = microtime(true);

        // 1. Build normalized input from scenario
        $input = $this->buildInput($scenario, $overrides);

        // 2. Compute input hash for reproducibility
        $input->scenarioId = $scenario->id;
        $inputHash = hash('sha256', json_encode([
            'product_type' => $input->productType,
            'age' => $input->age,
            'sex' => $input->sex,
            'state' => $input->state,
            'tobacco' => $input->tobaccoUse,
            'benefit_requested' => $input->monthlyBenefitRequested,
            'factors' => $input->factorSelections,
            'riders' => $input->riderSelections,
            'mode' => $input->paymentMode,
        ]));

        // 3. Resolve plugin by productType
        $plugin = $this->resolvePlugin($input->productType);
        if (!$plugin) {
            $output = new RateOutput();
            $output->eligible = false;
            $output->ineligibleReason = "No rating plugin registered for product type: {$input->productType}";
            $output->productType = $input->productType;
            $output->inputHash = $inputHash;

            $this->recordRun($scenario, $input, $output, $inputHash, $userId, $startTime, 'error');
            return $output;
        }

        // 4. Execute plugin rating
        try {
            $output = $plugin->rateProduct($input);
            $output->inputHash = $inputHash;
            $output->productType = $input->productType;
            $output->paymentMode = $input->paymentMode;

            $status = $output->eligible ? 'completed' : 'ineligible';
            $this->recordRun($scenario, $input, $output, $inputHash, $userId, $startTime, $status);

            // Update scenario with best quoted premium
            if ($output->eligible && $output->premiumModal > 0) {
                $monthlyPremium = $input->paymentMode === 'monthly'
                    ? $output->premiumModal
                    : round($output->premiumAnnual / 12, 2);

                $scenario->update([
                    'best_quoted_premium' => min(
                        $scenario->best_quoted_premium ?? PHP_FLOAT_MAX,
                        $monthlyPremium
                    ),
                    'total_quotes_received' => ($scenario->total_quotes_received ?? 0) + 1,
                ]);
            }

            return $output;
        } catch (\Throwable $e) {
            Log::error("Rating engine error for {$input->productType}", [
                'scenario_id' => $scenario->id,
                'error' => $e->getMessage(),
            ]);

            $output = new RateOutput();
            $output->eligible = false;
            $output->ineligibleReason = 'Rating engine error: ' . $e->getMessage();
            $output->productType = $input->productType;
            $output->inputHash = $inputHash;

            $this->recordRun($scenario, $input, $output, $inputHash, $userId, $startTime, 'error', $e->getMessage());
            return $output;
        }
    }

    /**
     * Get available factors and riders for a product type (for UI).
     */
    public function getProductOptions(string $productType): ?array
    {
        $plugin = $this->resolvePlugin($productType);
        if (!$plugin) return null;

        // Use reflection or a static method if available
        $rateTable = \App\Models\RateTable::activeFor($productType);
        if (!$rateTable) return null;

        return [
            'product_type' => $productType,
            'rate_table_version' => $rateTable->version,
            'factors' => $rateTable->factors()
                ->select('factor_code', 'factor_label', 'option_value', 'apply_mode', 'factor_value')
                ->orderBy('factor_code')->orderBy('sort_order')
                ->get()->groupBy('factor_code')
                ->map(fn ($items) => [
                    'label' => $items->first()->factor_label,
                    'options' => $items->map(fn ($f) => [
                        'value' => $f->option_value,
                        'factor' => (float) $f->factor_value,
                        'mode' => $f->apply_mode,
                    ])->values(),
                ]),
            'riders' => $rateTable->riders()
                ->select('rider_code', 'rider_label', 'apply_mode', 'rider_value', 'is_default')
                ->orderBy('sort_order')
                ->get()->map(fn ($r) => [
                    'code' => $r->rider_code,
                    'label' => $r->rider_label,
                    'mode' => $r->apply_mode,
                    'value' => (float) $r->rider_value,
                    'default' => $r->is_default,
                ]),
            'fees' => $rateTable->fees()
                ->select('fee_code', 'fee_label', 'fee_type', 'apply_mode', 'fee_value')
                ->orderBy('sort_order')
                ->get(),
            'modal_factors' => $rateTable->modalFactors()
                ->select('mode', 'factor', 'flat_fee')
                ->get(),
        ];
    }

    /**
     * List all registered product types and their plugin status.
     */
    public function registeredProducts(): array
    {
        return array_keys($this->pluginMap);
    }

    // ─── Private ───────────────────────────────────────────────

    private function resolvePlugin(string $productType): ?ProductPlugin
    {
        $class = $this->pluginMap[$productType] ?? null;
        if (!$class) return null;
        return new $class();
    }

    private function buildInput(LeadScenario $scenario, array $overrides): RateInput
    {
        $input = new RateInput();
        $input->productType = $scenario->product_type;
        $input->scenarioId = $scenario->id;

        // Load related data
        $scenario->loadMissing(['insuredObjects', 'coverages']);

        // Raw data for plugin access
        $input->insuredObjects = $scenario->insuredObjects->toArray();
        $input->coverages = $scenario->coverages->toArray();
        $input->riskFactors = $scenario->risk_factors ?? [];

        // Extract primary insured person
        $primary = $scenario->insuredObjects->firstWhere('object_type', 'person');
        if ($primary) {
            if ($primary->date_of_birth) {
                $input->age = (int) now()->diffInYears($primary->date_of_birth);
            }
            $input->sex = $primary->gender;
            $input->state = $primary->state;
            $input->tobaccoUse = $primary->tobacco_use;
            $input->occupation = $primary->occupation;
            $input->annualIncome = $primary->annual_income ? (float) $primary->annual_income : null;
            $input->heightInches = $primary->height_inches ? (float) $primary->height_inches : null;
            $input->weightLbs = $primary->weight_lbs ? (float) $primary->weight_lbs : null;
        }

        // DI-specific: extract from coverages
        $diCoverage = $scenario->coverages->firstWhere('coverage_category', 'disability');
        if ($diCoverage) {
            $input->monthlyBenefitRequested = $diCoverage->benefit_amount ? (float) $diCoverage->benefit_amount : null;
            $input->eliminationPeriodDays = $diCoverage->elimination_period_days;
            $input->benefitPeriod = $diCoverage->benefit_period;
        }

        // Scenario metadata — fallback for demographics when no insured objects
        $metadata = $scenario->metadata_json ?? [];

        // If no primary insured person, use metadata for demographics
        if (!$primary) {
            $input->age = isset($metadata['age']) ? (int) $metadata['age'] : null;
            $input->sex = $metadata['sex'] ?? $metadata['gender'] ?? null;
            $input->state = $metadata['state'] ?? null;
            $input->tobaccoUse = $metadata['tobacco_use'] ?? null;
            $input->occupation = $metadata['occupation'] ?? null;
            $input->annualIncome = isset($metadata['annual_income']) ? (float) $metadata['annual_income'] : null;
            $input->heightInches = isset($metadata['height_inches']) ? (float) $metadata['height_inches'] : null;
            $input->weightLbs = isset($metadata['weight_lbs']) ? (float) $metadata['weight_lbs'] : null;
        }

        $input->occupationClass = $metadata['occupation_class'] ?? null;
        $input->uwClass = $metadata['uw_class'] ?? 'standard';
        $input->definitionOfDisability = $metadata['definition_of_disability'] ?? null;
        $input->existingCoverageMonthly = isset($metadata['existing_coverage_monthly'])
            ? (float) $metadata['existing_coverage_monthly'] : null;

        // Pass full metadata to plugin (for product-specific fields like daily_benefit)
        $input->metadata = array_merge($input->metadata, $metadata);

        // Apply overrides (UI selections)
        foreach ($overrides as $key => $value) {
            if ($key === 'factor_selections') $input->factorSelections = $value;
            elseif ($key === 'rider_selections') $input->riderSelections = $value;
            elseif ($key === 'payment_mode') $input->paymentMode = $value;
            elseif ($key === 'rate_table_version') $input->rateTableVersion = $value;
            elseif ($key === 'monthly_benefit_requested') $input->monthlyBenefitRequested = (float) $value;
            elseif ($key === 'elimination_period_days') $input->eliminationPeriodDays = (int) $value;
            elseif ($key === 'benefit_period') $input->benefitPeriod = $value;
            elseif ($key === 'occupation_class') $input->occupationClass = $value;
            elseif ($key === 'uw_class') $input->uwClass = $value;
            elseif ($key === 'definition_of_disability') $input->definitionOfDisability = $value;
            elseif (property_exists($input, $key)) $input->$key = $value;
            else $input->metadata[$key] = $value;
        }

        return $input;
    }

    private function recordRun(
        LeadScenario $scenario,
        RateInput $input,
        RateOutput $output,
        string $inputHash,
        ?int $userId,
        float $startTime,
        string $status,
        ?string $errorMessage = null,
    ): void {
        $durationMs = (int) ((microtime(true) - $startTime) * 1000);

        RatingRun::create([
            'scenario_id' => $scenario->id,
            'user_id' => $userId,
            'product_type' => $input->productType,
            'rate_table_version' => $output->rateTableVersion,
            'engine_version' => $output->engineVersion,
            'input_hash' => $inputHash,
            'input_snapshot' => [
                'age' => $input->age,
                'sex' => $input->sex,
                'state' => $input->state,
                'tobacco_use' => $input->tobaccoUse,
                'occupation' => $input->occupation,
                'annual_income' => $input->annualIncome,
                'monthly_benefit_requested' => $input->monthlyBenefitRequested,
                'elimination_period_days' => $input->eliminationPeriodDays,
                'benefit_period' => $input->benefitPeriod,
                'occupation_class' => $input->occupationClass,
                'uw_class' => $input->uwClass,
                'factor_selections' => $input->factorSelections,
                'rider_selections' => $input->riderSelections,
                'payment_mode' => $input->paymentMode,
            ],
            'output_snapshot' => $output->toArray(),
            'final_premium_annual' => $output->premiumAnnual,
            'final_premium_monthly' => $input->paymentMode === 'monthly'
                ? $output->premiumModal
                : round($output->premiumAnnual / 12, 2),
            'status' => $status,
            'error_message' => $errorMessage ?? $output->ineligibleReason,
            'duration_ms' => $durationMs,
        ]);
    }
}
