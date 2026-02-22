<?php

namespace App\Services\Rating;

/**
 * Normalized output from any product rating plugin.
 * Contains full premium breakdown and audit trail.
 */
class RateOutput
{
    public bool $eligible = true;
    public ?string $ineligibleReason = null;

    // Premium breakdown
    public float $exposure = 0;
    public float $basePremium = 0;
    public float $premiumFactored = 0;
    public float $premiumWithRiders = 0;
    public float $premiumAnnual = 0;
    public float $premiumModal = 0;

    // Audit items
    public ?string $baseRateKey = null;
    public ?float $baseRateValue = null;
    public array $factorsApplied = [];   // [{ code, label, option, mode, value }]
    public array $ridersApplied = [];    // [{ code, label, mode, value, charge }]
    public array $feesApplied = [];      // [{ code, label, type, mode, value, amount }]
    public ?string $modalMode = null;
    public ?float $modalFactor = null;
    public ?float $modalFee = null;

    // Metadata
    public ?string $rateTableVersion = null;
    public string $engineVersion = '1.0';
    public ?string $inputHash = null;
    public string $productType = '';
    public string $paymentMode = 'monthly';

    public function toArray(): array
    {
        return [
            'eligible' => $this->eligible,
            'ineligible_reason' => $this->ineligibleReason,
            'exposure' => round($this->exposure, 4),
            'base_premium' => round($this->basePremium, 2),
            'premium_factored' => round($this->premiumFactored, 2),
            'premium_with_riders' => round($this->premiumWithRiders, 2),
            'premium_annual' => round($this->premiumAnnual, 2),
            'premium_modal' => round($this->premiumModal, 2),
            'payment_mode' => $this->paymentMode,
            'base_rate_key' => $this->baseRateKey,
            'base_rate_value' => $this->baseRateValue,
            'factors_applied' => $this->factorsApplied,
            'riders_applied' => $this->ridersApplied,
            'fees_applied' => $this->feesApplied,
            'modal_mode' => $this->modalMode,
            'modal_factor' => $this->modalFactor,
            'modal_fee' => $this->modalFee,
            'rate_table_version' => $this->rateTableVersion,
            'engine_version' => $this->engineVersion,
            'input_hash' => $this->inputHash,
        ];
    }
}
