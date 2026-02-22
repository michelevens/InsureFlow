<?php

namespace App\Services\Rating;

/**
 * Normalized input for any product rating plugin.
 * Built from a LeadScenario + its InsuredObjects + Coverages.
 */
class RateInput
{
    public string $productType;
    public int $scenarioId;
    public ?string $rateTableVersion = null;
    public string $paymentMode = 'monthly'; // annual, semiannual, quarterly, monthly

    // Primary insured person
    public ?int $age = null;
    public ?string $sex = null;  // M, F
    public ?string $state = null;
    public ?bool $tobaccoUse = null;
    public ?string $occupation = null;
    public ?float $annualIncome = null;
    public ?float $heightInches = null;
    public ?float $weightLbs = null;

    // DI-specific
    public ?float $monthlyBenefitRequested = null;
    public ?float $existingCoverageMonthly = null;
    public ?int $eliminationPeriodDays = null;
    public ?string $benefitPeriod = null;
    public ?string $occupationClass = null;
    public ?string $uwClass = null;
    public ?string $definitionOfDisability = null;

    // Factor selections (factor_code => option_value)
    public array $factorSelections = [];

    // Rider selections (rider_code => true/false or custom params)
    public array $riderSelections = [];

    // Risk factors from scenario
    public array $riskFactors = [];

    // Raw insured objects and coverages for plugin access
    public array $insuredObjects = [];
    public array $coverages = [];

    // Arbitrary metadata
    public array $metadata = [];
}
