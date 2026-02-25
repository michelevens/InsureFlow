<?php

namespace App\Services\CarrierApi;

class CarrierApplicationResponse
{
    public function __construct(
        public bool $success,
        public ?string $referenceNumber = null,
        public ?string $status = null,
        public ?string $errorMessage = null,
        public array $rawResponse = [],
    ) {}

    /**
     * Create a successful application response.
     */
    public static function success(
        string $referenceNumber,
        string $status = 'submitted',
        array $rawResponse = [],
    ): self {
        return new self(
            success: true,
            referenceNumber: $referenceNumber,
            status: $status,
            rawResponse: $rawResponse,
        );
    }

    /**
     * Create a failed application response.
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
            'reference_number' => $this->referenceNumber,
            'status' => $this->status,
            'error_message' => $this->errorMessage,
        ];
    }
}
