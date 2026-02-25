<?php

namespace App\Services\CarrierApi;

class CarrierQuoteResponse
{
    public function __construct(
        public bool $success,
        public ?float $monthlyPremium = null,
        public ?float $annualPremium = null,
        public ?string $quoteNumber = null,
        public ?string $carrier = null,
        public array $coverages = [],
        public array $endorsements = [],
        public array $exclusions = [],
        public array $discounts = [],
        public ?string $errorMessage = null,
        public array $rawResponse = [],
    ) {}

    /**
     * Create a successful quote response.
     */
    public static function success(
        float $monthlyPremium,
        float $annualPremium,
        string $carrier,
        ?string $quoteNumber = null,
        array $coverages = [],
        array $endorsements = [],
        array $exclusions = [],
        array $discounts = [],
        array $rawResponse = [],
    ): self {
        return new self(
            success: true,
            monthlyPremium: $monthlyPremium,
            annualPremium: $annualPremium,
            quoteNumber: $quoteNumber,
            carrier: $carrier,
            coverages: $coverages,
            endorsements: $endorsements,
            exclusions: $exclusions,
            discounts: $discounts,
            rawResponse: $rawResponse,
        );
    }

    /**
     * Create a failed quote response.
     */
    public static function failure(string $errorMessage, string $carrier, array $rawResponse = []): self
    {
        return new self(
            success: false,
            carrier: $carrier,
            errorMessage: $errorMessage,
            rawResponse: $rawResponse,
        );
    }

    /**
     * Convert to array for JSON serialization.
     */
    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'monthly_premium' => $this->monthlyPremium,
            'annual_premium' => $this->annualPremium,
            'quote_number' => $this->quoteNumber,
            'carrier' => $this->carrier,
            'coverages' => $this->coverages,
            'endorsements' => $this->endorsements,
            'exclusions' => $this->exclusions,
            'discounts' => $this->discounts,
            'error_message' => $this->errorMessage,
        ];
    }
}
