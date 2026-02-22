<?php

namespace App\Services\Rating\Plugins;

use App\Models\RateTable;
use App\Services\Rating\ProductPlugin;
use App\Services\Rating\RateInput;
use App\Services\Rating\RateOutput;

/**
 * Property & Casualty Plugin — handles Auto, Home, Renters, Commercial lines.
 * Exposure is based on insured value / 1000. Factors include territory, construction, etc.
 */
class PropertyCasualtyPlugin implements ProductPlugin
{
    private const ENGINE_VERSION = '1.0';

    public static function productTypes(): array
    {
        return [
            'auto', 'homeowners', 'renters', 'condo', 'flood',
            'umbrella_personal', 'motorcycle', 'boat', 'rv',
            'commercial_gl', 'commercial_property', 'bop',
            'workers_comp', 'commercial_auto', 'professional_liability',
            'cyber_liability', 'directors_officers', 'epli',
            'surety_bond', 'umbrella_commercial', 'inland_marine',
        ];
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

        if (!$input->state) {
            $output->eligible = false;
            $output->ineligibleReason = 'State is required for P&C rating';
            return $output;
        }

        // Determine exposure based on product type
        $exposure = $this->calculateExposure($input);
        if ($exposure <= 0) {
            $output->eligible = false;
            $output->ineligibleReason = 'Could not determine insured value/exposure';
            return $output;
        }
        $output->exposure = $exposure;

        // Base rate lookup by state + product subtype
        $rateKey = $this->buildRateKey($input);
        $entry = $rateTable->entries()->where('rate_key', $rateKey)->first();
        if (!$entry) {
            $rateKey = $input->state . '|*';
            $entry = $rateTable->entries()->where('rate_key', $rateKey)->first();
        }
        if (!$entry) {
            $output->eligible = false;
            $output->ineligibleReason = "No base rate found for: {$rateKey}";
            return $output;
        }

        $basePremium = (float) $entry->rate_value * $exposure;
        $output->baseRateKey = $entry->rate_key;
        $output->baseRateValue = (float) $entry->rate_value;
        $output->basePremium = $basePremium;

        // Factors
        $premium = $basePremium;
        foreach ($rateTable->factors()->orderBy('sort_order')->get()->groupBy('factor_code') as $code => $options) {
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

        // Riders/endorsements
        foreach ($rateTable->riders()->orderBy('sort_order')->get() as $rider) {
            $isSelected = $input->riderSelections[$rider->rider_code] ?? $rider->is_default;
            if (!$isSelected) continue;
            $val = (float) $rider->rider_value;
            $charge = $rider->apply_mode === 'add' ? $val * $exposure : $premium * ($val - 1);
            $premium += $charge;
            $output->ridersApplied[] = ['code' => $rider->rider_code, 'label' => $rider->rider_label, 'mode' => $rider->apply_mode, 'value' => $val, 'charge' => round($charge, 2)];
        }
        $output->premiumWithRiders = $premium;

        // Fees and credits
        foreach ($rateTable->fees()->orderBy('sort_order')->get() as $fee) {
            $val = (float) $fee->fee_value;
            $amount = $fee->apply_mode === 'percent' ? $premium * ($val / 100) : $val;
            if ($fee->fee_type === 'credit') { $premium -= abs($amount); $amount = -abs($amount); }
            else { $premium += $amount; }
            $output->feesApplied[] = ['code' => $fee->fee_code, 'label' => $fee->fee_label, 'type' => $fee->fee_type, 'mode' => $fee->apply_mode, 'value' => $val, 'amount' => round($amount, 2)];
        }
        $output->premiumAnnual = max(0, $premium);

        // Modal
        $mode = $input->paymentMode ?? 'monthly';
        $modal = $rateTable->modalFactors()->where('mode', $mode)->first();
        $factor = $modal ? (float) $modal->factor : match ($mode) { 'annual' => 1.0, 'semiannual' => 0.52, 'quarterly' => 0.265, default => 0.0875 };
        $fee = $modal ? (float) $modal->flat_fee : 0;
        $output->premiumModal = round(($output->premiumAnnual * $factor) + $fee, 2);
        $output->modalMode = $mode;
        $output->modalFactor = $factor;
        $output->modalFee = $fee;

        return $output;
    }

    private function calculateExposure(RateInput $input): float
    {
        // For auto: per-vehicle
        if (in_array($input->productType, ['auto', 'commercial_auto', 'motorcycle', 'boat', 'rv'])) {
            $vehicleCount = count(array_filter($input->insuredObjects, fn ($o) => ($o['object_type'] ?? '') === 'vehicle'));
            return max($vehicleCount, 1);
        }
        // For property: insured value / 1000
        foreach ($input->coverages as $cov) {
            if (in_array($cov['coverage_type'] ?? '', ['dwelling', 'building', 'business_income', 'personal_property'])) {
                $val = (float) ($cov['limit_amount'] ?? 0);
                if ($val > 0) return $val / 1000;
            }
        }
        // For liability: per $1M aggregate
        foreach ($input->coverages as $cov) {
            $agg = (float) ($cov['aggregate_limit'] ?? $cov['limit_amount'] ?? 0);
            if ($agg > 0) return $agg / 1000000;
        }
        // For workers comp: payroll / 100
        foreach ($input->insuredObjects as $obj) {
            if (($obj['object_type'] ?? '') === 'business' && ($obj['annual_revenue'] ?? 0) > 0) {
                return (float) $obj['annual_revenue'] / 100;
            }
        }
        return 1; // fallback
    }

    private function buildRateKey(RateInput $input): string
    {
        $parts = [$input->state];
        // Add vehicle year range or construction type if relevant
        foreach ($input->insuredObjects as $obj) {
            if (($obj['object_type'] ?? '') === 'vehicle' && !empty($obj['vehicle_year'])) {
                $parts[] = $this->yearBand((int) $obj['vehicle_year']);
                break;
            }
            if (($obj['object_type'] ?? '') === 'property' && !empty($obj['construction_type'])) {
                $parts[] = $obj['construction_type'];
                break;
            }
        }
        return implode('|', $parts);
    }

    private function yearBand(int $year): string
    {
        $age = date('Y') - $year;
        if ($age <= 3) return 'new';
        if ($age <= 7) return 'mid';
        return 'old';
    }
}
