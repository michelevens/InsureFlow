<?php

namespace App\Services\CarrierApi;

class CarrierStatusResponse
{
    public function __construct(
        public bool $success,
        public ?string $status = null,
        public ?string $policyNumber = null,
        public ?string $errorMessage = null,
        public array $rawResponse = [],
    ) {}

    /**
     * Create a successful status response.
     */
    public static function success(
        string $status,
        ?string $policyNumber = null,
        array $rawResponse = [],
    ): self {
        return new self(
            success: true,
            status: $status,
            policyNumber: $policyNumber,
            rawResponse: $rawResponse,
        );
    }

    /**
     * Create a failed status response.
     */
    public static function failure(string $errorMessage, array $rawResponse = []): self
    {
        return new self(
            success: false,
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
            'status' => $this->status,
            'policy_number' => $this->policyNumber,
            'error_message' => $this->errorMessage,
        ];
    }
}
