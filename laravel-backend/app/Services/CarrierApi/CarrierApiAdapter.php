<?php

namespace App\Services\CarrierApi;

/**
 * Contract for all carrier API integrations.
 *
 * Each carrier adapter implements this interface to provide a uniform way
 * to get quotes, submit applications, and check statuses across different
 * carrier APIs. Adapters handle the translation between InsureFlow's
 * internal data format and the carrier's specific API format.
 */
interface CarrierApiAdapter
{
    /**
     * Get the unique slug identifier for this carrier adapter.
     */
    public function getSlug(): string;

    /**
     * Get the human-readable name of the carrier.
     */
    public function getName(): string;

    /**
     * Check whether this adapter is fully configured and ready to make API calls.
     * Should verify that all required credentials and endpoints are present.
     */
    public function isConfigured(): bool;

    /**
     * Request a quote from the carrier API.
     *
     * @param array $applicationData InsureFlow-formatted application/risk data
     * @return CarrierQuoteResponse The carrier's quote response
     */
    public function getQuote(array $applicationData): CarrierQuoteResponse;

    /**
     * Submit a full application to the carrier.
     *
     * @param array $applicationData InsureFlow-formatted application data
     * @return CarrierApplicationResponse The carrier's submission response
     */
    public function submitApplication(array $applicationData): CarrierApplicationResponse;

    /**
     * Check the status of a previously submitted application.
     *
     * @param string $referenceNumber The carrier-assigned reference number
     * @return CarrierStatusResponse The current application status
     */
    public function checkStatus(string $referenceNumber): CarrierStatusResponse;

    /**
     * Get the list of insurance product types this adapter supports.
     *
     * @return array e.g., ['auto', 'homeowners', 'life_term', 'life_whole']
     */
    public function getSupportedProducts(): array;
}
