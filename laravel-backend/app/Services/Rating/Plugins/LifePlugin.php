<?php

namespace App\Services\Rating\Plugins;

use App\Models\RateTable;
use App\Services\Rating\ProductPlugin;
use App\Services\Rating\RateInput;
use App\Services\Rating\RateOutput;

/**
 * Life Insurance Plugin — handles Term, Whole, Universal, Final Expense.
 * Follows the same plugin pattern as DI but with life-specific exposure and factors.
 */
class LifePlugin implements ProductPlugin
{
    private const ENGINE_VERSION = '1.0';

    public static function productTypes(): array
    {
        return ['life_term', 'life_whole', 'life_universal', 'life_final_expense', 'annuity'];
    }

    public function rateProduct(RateInput $input): RateOutput
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

        // Eligibility
        if (!$input->age || $input->age < 18 || $input->age > 80) {
            $output->eligible = false;
            $output->ineligibleReason = 'Applicant must be between 18-80 years old';
            return $output;
        }
        if (!$input->sex) {
            $output->eligible = false;
            $output->ineligibleReason = 'Sex is required for life rating';
            return $output;
        }

        // Exposure: face amount / 1000
        $faceAmount = $this->extractFaceAmount($input);
        if (!$faceAmount || $faceAmount <= 0) {
            $output->eligible = false;
            $output->ineligibleReason = 'Face amount (death benefit) is required';
            return $output;
        }

        $exposure = $faceAmount / 1000;
        $output->exposure = $exposure;

        // Base rate lookup
        $uwClass = $input->uwClass ?? 'standard';
        $tobacco = $input->tobaccoUse ? 'T' : 'NT';
        $rateKey = implode('|', [$input->age, $input->sex, $tobacco, $uwClass]);

        $entry = $rateTable->entries()->where('rate_key', $rateKey)->first();
        if (!$entry) {
            $rateKey = implode('|', [$input->age, $input->sex, $tobacco, '*']);
            $entry = $rateTable->entries()->where('rate_key', $rateKey)->first();
        }
        if (!$entry) {
            $output->eligible = false;
            $output->ineligibleReason = "No base rate found for: {$input->age}|{$input->sex}|{$tobacco}|{$uwClass}";
            return $output;
        }

        $basePremium = (float) $entry->rate_value * $exposure;
        $output->baseRateKey = $entry->rate_key;
        $output->baseRateValue = (float) $entry->rate_value;
        $output->basePremium = $basePremium;

        // Factors, riders, fees, modal — same pattern as DI
        $premiumFactored = $this->applyFactors($rateTable, $input, $basePremium, $output);
        $premiumWithRiders = $this->applyRiders($rateTable, $input, $premiumFactored, $exposure, $output);
        $premiumAnnual = $this->applyFees($rateTable, $premiumWithRiders, $output);
        $this->applyModal($rateTable, $input, $premiumAnnual, $output);

        return $output;
    }

    private function extractFaceAmount(RateInput $input): ?float
    {
        // Look for death_benefit coverage
        foreach ($input->coverages as $cov) {
            if (in_array($cov['coverage_type'] ?? '', ['death_benefit', 'face_amount'])) {
                return (float) ($cov['benefit_amount'] ?? $cov['limit_amount'] ?? 0);
            }
        }
        // Fallback to first life coverage
        foreach ($input->coverages as $cov) {
            if (($cov['coverage_category'] ?? '') === 'life' && ($cov['benefit_amount'] ?? 0) > 0) {
                return (float) $cov['benefit_amount'];
            }
        }
        return $input->metadata['face_amount'] ?? null;
    }

    private function applyFactors(RateTable $rateTable, RateInput $input, float $basePremium, RateOutput $output): float
    {
        $premium = $basePremium;
        $factors = $rateTable->factors()->orderBy('sort_order')->get()->groupBy('factor_code');

        foreach ($factors as $code => $options) {
            $selected = $input->factorSelections[$code] ?? null;
            if (!$selected) continue;
            $factor = $options->firstWhere('option_value', (string) $selected);
            if (!$factor) continue;
            $val = (float) $factor->factor_value;
            if ($factor->apply_mode === 'multiply') $premium *= $val;
            elseif ($factor->apply_mode === 'add') $premium += $val;
            $output->factorsApplied[] = ['code' => $code, 'label' => $factor->factor_label, 'option' => $selected, 'mode' => $factor->apply_mode, 'value' => $val];
        }

        $output->premiumFactored = $premium;
        return $premium;
    }

    private function applyRiders(RateTable $rateTable, RateInput $input, float $premium, float $exposure, RateOutput $output): float
    {
        $result = $premium;
        foreach ($rateTable->riders()->orderBy('sort_order')->get() as $rider) {
            $isSelected = $input->riderSelections[$rider->rider_code] ?? $rider->is_default;
            if (!$isSelected) continue;
            $val = (float) $rider->rider_value;
            $charge = $rider->apply_mode === 'add' ? $val * $exposure : $premium * ($val - 1);
            $result += $charge;
            $output->ridersApplied[] = ['code' => $rider->rider_code, 'label' => $rider->rider_label, 'mode' => $rider->apply_mode, 'value' => $val, 'charge' => round($charge, 2)];
        }
        $output->premiumWithRiders = $result;
        return $result;
    }

    private function applyFees(RateTable $rateTable, float $premium, RateOutput $output): float
    {
        $result = $premium;
        foreach ($rateTable->fees()->orderBy('sort_order')->get() as $fee) {
            $val = (float) $fee->fee_value;
            $amount = $fee->apply_mode === 'percent' ? $result * ($val / 100) : $val;
            if ($fee->fee_type === 'credit') { $result -= abs($amount); $amount = -abs($amount); }
            else { $result += $amount; }
            $output->feesApplied[] = ['code' => $fee->fee_code, 'label' => $fee->fee_label, 'type' => $fee->fee_type, 'mode' => $fee->apply_mode, 'value' => $val, 'amount' => round($amount, 2)];
        }
        $output->premiumAnnual = max(0, $result);
        return $output->premiumAnnual;
    }

    private function applyModal(RateTable $rateTable, RateInput $input, float $annualPremium, RateOutput $output): void
    {
        $mode = $input->paymentMode ?? 'monthly';
        $modal = $rateTable->modalFactors()->where('mode', $mode)->first();
        $factor = $modal ? (float) $modal->factor : match ($mode) { 'annual' => 1.0, 'semiannual' => 0.52, 'quarterly' => 0.265, default => 0.0875 };
        $fee = $modal ? (float) $modal->flat_fee : 0;
        $output->premiumModal = round(($annualPremium * $factor) + $fee, 2);
        $output->modalMode = $mode;
        $output->modalFactor = $factor;
        $output->modalFee = $fee;
    }
}
