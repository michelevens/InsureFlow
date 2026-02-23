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

    // LTC-specific
    public ?float $dailyBenefit = null;
    public ?string $inflationProtection = null;    // none, 1pct_compound, 3pct_compound, 5pct_compound
    public ?string $homeCareBenefit = null;         // 50pct, 80pct, 100pct
    public ?string $homeCareType = null;            // monthly, daily
    public ?string $homeCareBenefitPeriod = null;   // pooled, separate
    public ?string $maritalDiscount = null;         // none, both_insured, one_insured
    public ?string $nonforfeiture = null;           // none, contingent, reduced_paidup
    public ?string $paymentDuration = null;         // lifetime, 10pay, paid_up65
    public ?bool $taxQualified = null;
    public ?bool $partnershipPlan = null;
    public ?string $assistedLiving = null;          // 100pct, 50pct, na
    public ?bool $professionalHomeCare = null;
    public ?string $inflationDuration = null;       // lifetime, limited, buy_up
    public ?string $waiverOfPremium = null;         // included, optional, na
    public ?bool $jointApplicant = null;
    public ?float $premiumOnSpouseDeath = null;

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
