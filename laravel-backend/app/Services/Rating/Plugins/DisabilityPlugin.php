<?php

namespace App\Services\Rating\Plugins;

use App\Models\RateTable;
use App\Services\Rating\ProductPlugin;
use App\Services\Rating\RateInput;
use App\Services\Rating\RateOutput;

/**
 * Disability Insurance Plugin — Gold Standard Reference Implementation.
 *
 * Canonical DI Rating Formula:
 *   Step 0: Eligibility & Income Replacement Caps
 *   Step 1: Exposure Normalization
 *   Step 2: Base Premium Lookup
 *   Step 3: Multiplicative Factors
 *   Step 4: Rider Layer
 *   Step 5: Fees and Credits
 *   Step 6: Modal Conversion
 *
 * DI is just one plugin in the multi-family platform.
 * No DI-specific shortcuts in the core engine.
 */
class DisabilityPlugin implements ProductPlugin
{
    private const BENEFIT_UNIT = 100;
    private const ENGINE_VERSION = '1.0';

    // Default replacement ratios by income band
    private const REPLACEMENT_RATIOS = [
        ['max_income' => 5000,  'ratio' => 0.70],
        ['max_income' => 10000, 'ratio' => 0.65],
        ['max_income' => 15000, 'ratio' => 0.60],
        ['max_income' => 25000, 'ratio' => 0.55],
        ['max_income' => PHP_FLOAT_MAX, 'ratio' => 0.50],
    ];

    public static function productTypes(): array
    {
        return ['disability_std', 'disability_ltd', 'long_term_care'];
    }

    public function rateProduct(RateInput $input): RateOutput
    {
        // LTC has a different eligibility/exposure model
        if ($input->productType === 'long_term_care') {
            return $this->rateLTC($input);
        }

        $output = new RateOutput();
        $output->engineVersion = self::ENGINE_VERSION;

        // Resolve rate table
        $rateTable = RateTable::activeFor($input->productType, $input->rateTableVersion);
        if (!$rateTable) {
            $output->eligible = false;
            $output->ineligibleReason = "No active rate table for {$input->productType}";
            return $output;
        }
        $output->rateTableVersion = $rateTable->version;

        // ─── Step 0: Eligibility & Income Replacement Caps ─────
        $monthlyIncome = $input->annualIncome ? $input->annualIncome / 12 : null;

        if (!$monthlyIncome || $monthlyIncome <= 0) {
            $output->eligible = false;
            $output->ineligibleReason = 'Annual income is required for DI rating';
            return $output;
        }
        if (!$input->age || $input->age < 18 || $input->age > 65) {
            $output->eligible = false;
            $output->ineligibleReason = 'Applicant must be between 18-65 years old';
            return $output;
        }
        if (!$input->sex) {
            $output->eligible = false;
            $output->ineligibleReason = 'Sex is required for DI rating';
            return $output;
        }
        if (!$input->state) {
            $output->eligible = false;
            $output->ineligibleReason = 'State is required for DI rating';
            return $output;
        }

        // Replacement ratio
        $replacementRatio = 0.60; // default
        foreach (self::REPLACEMENT_RATIOS as $band) {
            if ($monthlyIncome <= $band['max_income']) {
                $replacementRatio = $band['ratio'];
                break;
            }
        }

        $maxBenefitAllowed = ($monthlyIncome * $replacementRatio) - ($input->existingCoverageMonthly ?? 0);
        $requestedBenefit = $input->monthlyBenefitRequested ?? $maxBenefitAllowed;
        $monthlyBenefitApproved = min($requestedBenefit, $maxBenefitAllowed);

        if ($monthlyBenefitApproved <= 0) {
            $output->eligible = false;
            $output->ineligibleReason = 'Existing coverage exceeds maximum benefit allowed';
            return $output;
        }

        // ─── Step 1: Exposure Normalization ────────────────────
        $exposure = $monthlyBenefitApproved / self::BENEFIT_UNIT;
        $output->exposure = $exposure;

        // ─── Step 2: Base Premium Lookup ───────────────────────
        $occClass = $input->occupationClass ?? '4A';
        $uwClass = $input->uwClass ?? 'standard';
        $sex = $this->normalizeSex($input->sex);
        $rateKey = implode('|', [$input->age, $sex, $input->state, $occClass, $uwClass]);

        $entry = $rateTable->entries()->where('rate_key', $rateKey)->first();

        // Fallback: try without state, then without uwClass
        if (!$entry) {
            $rateKey = implode('|', [$input->age, $sex, '*', $occClass, $uwClass]);
            $entry = $rateTable->entries()->where('rate_key', $rateKey)->first();
        }
        if (!$entry) {
            $rateKey = implode('|', [$input->age, $sex, '*', $occClass, '*']);
            $entry = $rateTable->entries()->where('rate_key', $rateKey)->first();
        }

        if (!$entry) {
            $output->eligible = false;
            $output->ineligibleReason = "No base rate found for key: {$input->age}|{$input->sex}|{$input->state}|{$occClass}|{$uwClass}";
            return $output;
        }

        $baseRate = (float) $entry->rate_value;
        $basePremium = $baseRate * $exposure;
        $output->baseRateKey = $entry->rate_key;
        $output->baseRateValue = $baseRate;
        $output->basePremium = $basePremium;

        // Steps 3-6: shared pipeline
        return $this->applyFactorsRidersFees($rateTable, $input, $output, $basePremium, $exposure);
    }

    /**
     * Long Term Care rating — separate flow from DI.
     * LTC uses daily benefit as exposure base, not income replacement.
     * Exposure = Daily Benefit / 10.
     */
    private function rateLTC(RateInput $input): RateOutput
    {
        $output = new RateOutput();
        $output->engineVersion = self::ENGINE_VERSION;

        $rateTable = RateTable::activeFor($input->productType, $input->rateTableVersion);
        if (!$rateTable) {
            $output->eligible = false;
            $output->ineligibleReason = "No active rate table for {$input->productType}";
            return $output;
        }
        $output->rateTableVersion = $rateTable->version;

        // Eligibility checks
        if (!$input->age || $input->age < 18 || $input->age > 85) {
            $output->eligible = false;
            $output->ineligibleReason = 'Applicant must be between 18-85 years old for LTC';
            return $output;
        }
        if (!$input->sex) {
            $output->eligible = false;
            $output->ineligibleReason = 'Sex is required for LTC rating';
            return $output;
        }

        // Determine daily benefit from coverages or metadata
        $dailyBenefit = 0;
        foreach ($input->coverages as $cov) {
            if (in_array($cov['coverage_type'] ?? '', ['ltc_facility', 'ltc_daily', 'long_term_care'])) {
                $dailyBenefit = (float) ($cov['benefit_amount'] ?? $cov['limit_amount'] ?? 0);
                if ($dailyBenefit > 0) break;
            }
        }
        if ($dailyBenefit <= 0) {
            $dailyBenefit = (float) ($input->metadata['daily_benefit'] ?? 150); // default $150/day
        }

        // Exposure = daily benefit / 10
        $exposure = $dailyBenefit / 10;
        $output->exposure = $exposure;

        // Base rate lookup: age|sex|state|uwClass
        $uwClass = $input->uwClass ?? 'standard';
        $sex = $this->normalizeSex($input->sex);
        $rateKey = implode('|', [$input->age, $sex, $input->state ?? '*', $uwClass]);
        $entry = $rateTable->entries()->where('rate_key', $rateKey)->first();

        // Fallback: wildcard state
        if (!$entry) {
            $rateKey = implode('|', [$input->age, $sex, '*', $uwClass]);
            $entry = $rateTable->entries()->where('rate_key', $rateKey)->first();
        }
        // Fallback: wildcard uwClass
        if (!$entry) {
            $rateKey = implode('|', [$input->age, $sex, '*', '*']);
            $entry = $rateTable->entries()->where('rate_key', $rateKey)->first();
        }

        if (!$entry) {
            $output->eligible = false;
            $output->ineligibleReason = "No LTC base rate found for age {$input->age}, sex {$input->sex}, class {$uwClass}";
            return $output;
        }

        $baseRate = (float) $entry->rate_value;
        $basePremium = $baseRate * $exposure;
        $output->baseRateKey = $entry->rate_key;
        $output->baseRateValue = $baseRate;
        $output->basePremium = $basePremium;

        // Steps 3-6 are identical to DI — reuse the shared pipeline
        return $this->applyFactorsRidersFees($rateTable, $input, $output, $basePremium, $exposure);
    }

    /**
     * Shared pipeline for Steps 3-6: Factors → Riders → Fees → Modal.
     * Used by both DI and LTC rating paths.
     */
    private function applyFactorsRidersFees(
        RateTable $rateTable, RateInput $input, RateOutput $output,
        float $basePremium, float $exposure
    ): RateOutput {
        // ─── Step 3: Multiplicative Factors ────────────────────
        $premiumFactored = $basePremium;
        $factorsApplied = [];

        $availableFactors = $rateTable->factors()->orderBy('sort_order')->get()->groupBy('factor_code');
        foreach ($availableFactors as $code => $options) {
            $selected = $input->factorSelections[$code] ?? $this->autoSelectFactor($code, $input);
            if ($selected === null) continue;
            $factor = $options->firstWhere('option_value', (string) $selected);
            if (!$factor) continue;
            $factorValue = (float) $factor->factor_value;
            $mode = $factor->apply_mode;
            if ($mode === 'multiply') $premiumFactored *= $factorValue;
            elseif ($mode === 'add') $premiumFactored += $factorValue;
            elseif ($mode === 'subtract') $premiumFactored -= $factorValue;
            $factorsApplied[] = ['code' => $code, 'label' => $factor->factor_label, 'option' => $selected, 'mode' => $mode, 'value' => $factorValue];
        }
        $output->premiumFactored = $premiumFactored;
        $output->factorsApplied = $factorsApplied;

        // ─── Step 4: Rider Layer ───────────────────────────────
        $premiumWithRiders = $premiumFactored;
        $ridersApplied = [];
        foreach ($rateTable->riders()->orderBy('sort_order')->get() as $rider) {
            $isSelected = $input->riderSelections[$rider->rider_code] ?? $rider->is_default;
            if (!$isSelected) continue;
            $riderValue = (float) $rider->rider_value;
            $riderCharge = $rider->apply_mode === 'add' ? $riderValue * $exposure : $premiumFactored * ($riderValue - 1);
            $premiumWithRiders += $riderCharge;
            $ridersApplied[] = ['code' => $rider->rider_code, 'label' => $rider->rider_label, 'mode' => $rider->apply_mode, 'value' => $riderValue, 'charge' => round($riderCharge, 2)];
        }
        $output->premiumWithRiders = $premiumWithRiders;
        $output->ridersApplied = $ridersApplied;

        // ─── Step 5: Fees and Credits ──────────────────────────
        $premiumAnnual = $premiumWithRiders;
        $feesApplied = [];
        foreach ($rateTable->fees()->orderBy('sort_order')->get() as $fee) {
            $feeValue = (float) $fee->fee_value;
            $amount = $fee->apply_mode === 'add' ? $feeValue : $premiumAnnual * ($feeValue / 100);
            if ($fee->fee_type === 'credit') { $premiumAnnual -= abs($amount); $amount = -abs($amount); }
            else { $premiumAnnual += $amount; }
            $feesApplied[] = ['code' => $fee->fee_code, 'label' => $fee->fee_label, 'type' => $fee->fee_type, 'mode' => $fee->apply_mode, 'value' => $feeValue, 'amount' => round($amount, 2)];
        }
        $output->premiumAnnual = max(0, $premiumAnnual);
        $output->feesApplied = $feesApplied;

        // ─── Step 6: Modal Conversion ──────────────────────────
        $mode = $input->paymentMode ?? 'monthly';
        $modal = $rateTable->modalFactors()->where('mode', $mode)->first();
        $modalFactor = $modal ? (float) $modal->factor : $this->defaultModalFactor($mode);
        $modalFee = $modal ? (float) $modal->flat_fee : 0;
        $output->premiumModal = round(($output->premiumAnnual * $modalFactor) + $modalFee, 2);
        $output->modalMode = $mode;
        $output->modalFactor = $modalFactor;
        $output->modalFee = $modalFee;

        return $output;
    }

    /**
     * Auto-select a factor value based on input fields when the user hasn't explicitly chosen.
     */
    private function autoSelectFactor(string $code, RateInput $input): ?string
    {
        return match ($code) {
            'elimination_period' => $input->eliminationPeriodDays ? (string) $input->eliminationPeriodDays : null,
            'benefit_period' => $input->benefitPeriod,
            'definition_of_disability' => $input->definitionOfDisability,
            'smoker_status' => $input->tobaccoUse !== null ? ($input->tobaccoUse ? 'yes' : 'no') : null,
            'occupation_class' => $input->occupationClass,
            'uw_class', 'health_class' => $input->uwClass,
            'bmi_build' => $this->calculateBmiCategory($input),
            default => null,
        };
    }

    private function calculateBmiCategory(RateInput $input): ?string
    {
        if (!$input->heightInches || !$input->weightLbs) return null;
        $bmi = ($input->weightLbs / ($input->heightInches * $input->heightInches)) * 703;
        if ($bmi < 18.5) return 'underweight';
        if ($bmi < 25) return 'normal';
        if ($bmi < 30) return 'overweight';
        if ($bmi < 35) return 'obese_1';
        return 'obese_2';
    }

    /**
     * Normalize sex input to single-letter code for rate key matching.
     * Accepts: male/female/m/f/M/F → M/F
     */
    private function normalizeSex(?string $sex): ?string
    {
        if (!$sex) return null;
        $s = strtolower(trim($sex));
        if (in_array($s, ['m', 'male'])) return 'M';
        if (in_array($s, ['f', 'female'])) return 'F';
        return strtoupper($s[0] ?? '');
    }

    private function defaultModalFactor(string $mode): float
    {
        return match ($mode) {
            'annual' => 1.0,
            'semiannual' => 0.52,
            'quarterly' => 0.265,
            'monthly' => 0.0875,
            default => 0.0875,
        };
    }
}
