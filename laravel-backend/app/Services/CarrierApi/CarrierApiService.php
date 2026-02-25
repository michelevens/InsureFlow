<?php

namespace App\Services\CarrierApi;

use App\Models\CarrierApiConfig;
use App\Services\CarrierApi\Adapters\GenericRestAdapter;
use App\Services\CarrierApi\Adapters\ProgressiveAdapter;
use App\Services\CarrierApi\Adapters\TravelersAdapter;
use Illuminate\Support\Facades\Log;

/**
 * Main service that routes carrier API requests to the correct adapter.
 *
 * This service manages the registry of carrier adapters, loads configurations
 * from the database, and provides a unified interface for getting quotes,
 * submitting applications, and checking statuses across multiple carriers.
 *
 * Usage:
 *   $service = app(CarrierApiService::class);
 *   $quote = $service->getQuote('progressive', $applicationData);
 *   $quotes = $service->getMultiCarrierQuotes(['progressive', 'travelers'], $applicationData);
 */
class CarrierApiService
{
    /** @var array<string, CarrierApiAdapter> */
    protected array $adapters = [];

    public function __construct()
    {
        $this->registerBuiltInAdapters();
    }

    /**
     * Register a carrier API adapter.
     */
    public function registerAdapter(CarrierApiAdapter $adapter): void
    {
        $this->adapters[$adapter->getSlug()] = $adapter;
    }

    /**
     * Get the adapter for a specific carrier by slug.
     */
    public function getAdapter(string $carrierSlug): ?CarrierApiAdapter
    {
        return $this->adapters[$carrierSlug] ?? null;
    }

    /**
     * Get all registered adapters.
     *
     * @return array<string, CarrierApiAdapter>
     */
    public function getAllAdapters(): array
    {
        return $this->adapters;
    }

    /**
     * Get all carriers that have fully configured and active adapters.
     *
     * @return array<string, array{slug: string, name: string, configured: bool, products: array}>
     */
    public function getConfiguredCarriers(): array
    {
        $carriers = [];

        foreach ($this->adapters as $slug => $adapter) {
            if ($adapter->isConfigured()) {
                $carriers[$slug] = [
                    'slug' => $adapter->getSlug(),
                    'name' => $adapter->getName(),
                    'configured' => true,
                    'products' => $adapter->getSupportedProducts(),
                ];
            }
        }

        return $carriers;
    }

    /**
     * Get available adapter types (for admin UI).
     *
     * @return array<int, array{type: string, name: string, description: string}>
     */
    public function getAvailableAdapterTypes(): array
    {
        return [
            [
                'type' => 'generic_rest',
                'name' => 'Generic REST API',
                'description' => 'Configurable adapter for any carrier with a REST API. Uses field mappings and configurable endpoints.',
            ],
            [
                'type' => 'progressive',
                'name' => 'Progressive',
                'description' => 'Pre-configured adapter for Progressive Insurance API with default field mappings and endpoints.',
            ],
            [
                'type' => 'travelers',
                'name' => 'Travelers',
                'description' => 'Pre-configured adapter for Travelers Insurance API with OAuth2 authentication and LOB code mapping.',
            ],
        ];
    }

    /**
     * Get a quote from a specific carrier.
     */
    public function getQuote(string $carrierSlug, array $data): CarrierQuoteResponse
    {
        $adapter = $this->getAdapter($carrierSlug);

        if ($adapter === null) {
            return CarrierQuoteResponse::failure(
                errorMessage: "No adapter found for carrier: {$carrierSlug}",
                carrier: $carrierSlug,
            );
        }

        if (!$adapter->isConfigured()) {
            return CarrierQuoteResponse::failure(
                errorMessage: "Carrier adapter '{$carrierSlug}' is not fully configured",
                carrier: $adapter->getName(),
            );
        }

        return $adapter->getQuote($data);
    }

    /**
     * Get quotes from multiple carriers in parallel.
     *
     * @param  array  $carrierSlugs  List of carrier slugs to query
     * @param  array  $data          The application/risk data
     * @return array<string, CarrierQuoteResponse>  Keyed by carrier slug
     */
    public function getMultiCarrierQuotes(array $carrierSlugs, array $data): array
    {
        $results = [];

        // If no specific carriers requested, use all configured carriers
        if (empty($carrierSlugs)) {
            $carrierSlugs = array_keys($this->getConfiguredCarriers());
        }

        // Sequential execution for now — can be replaced with async/parallel later
        foreach ($carrierSlugs as $slug) {
            $results[$slug] = $this->getQuote($slug, $data);
        }

        return $results;
    }

    /**
     * Submit an application to a specific carrier.
     */
    public function submitApplication(string $carrierSlug, array $data): CarrierApplicationResponse
    {
        $adapter = $this->getAdapter($carrierSlug);

        if ($adapter === null) {
            return CarrierApplicationResponse::failure(
                errorMessage: "No adapter found for carrier: {$carrierSlug}",
            );
        }

        if (!$adapter->isConfigured()) {
            return CarrierApplicationResponse::failure(
                errorMessage: "Carrier adapter '{$carrierSlug}' is not fully configured",
            );
        }

        return $adapter->submitApplication($data);
    }

    /**
     * Check the status of an application at a specific carrier.
     */
    public function checkStatus(string $carrierSlug, string $referenceNumber): CarrierStatusResponse
    {
        $adapter = $this->getAdapter($carrierSlug);

        if ($adapter === null) {
            return CarrierStatusResponse::failure(
                errorMessage: "No adapter found for carrier: {$carrierSlug}",
            );
        }

        if (!$adapter->isConfigured()) {
            return CarrierStatusResponse::failure(
                errorMessage: "Carrier adapter '{$carrierSlug}' is not fully configured",
            );
        }

        return $adapter->checkStatus($referenceNumber);
    }

    /**
     * Load carrier API configs from the database and register adapters.
     *
     * Reads all active carrier_api_configs records, determines the adapter type,
     * and instantiates the appropriate adapter class for each.
     */
    protected function registerBuiltInAdapters(): void
    {
        try {
            $configs = CarrierApiConfig::where('is_active', true)
                ->with('carrier')
                ->get();

            foreach ($configs as $config) {
                $carrierSlug = $config->carrier?->slug;

                if (empty($carrierSlug)) {
                    continue;
                }

                $adapterType = $config->adapter_type ?? 'generic_rest';
                $configArray = $this->buildConfigArray($config);

                $adapter = $this->createAdapter($adapterType, $carrierSlug, $config->carrier->name, $configArray);

                if ($adapter !== null) {
                    $this->adapters[$carrierSlug] = $adapter;
                }
            }
        } catch (\Throwable $e) {
            // If the table doesn't exist yet (pre-migration) or DB is down,
            // don't crash — just log and continue with no adapters
            Log::warning('Could not load carrier API configs from database', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Build a config array from a CarrierApiConfig model for adapter construction.
     */
    protected function buildConfigArray(CarrierApiConfig $config): array
    {
        return [
            'config_id' => $config->id,
            'base_url' => $config->base_url,
            'auth_type' => $config->auth_type,
            'api_key' => $config->api_key,
            'api_secret' => $config->api_secret,
            'auth_config' => $config->auth_config ?? [],
            'field_mappings' => $config->field_mappings ?? $config->field_mapping ?? [],
            'endpoints' => $config->endpoints ?? [],
            'headers' => $config->headers ?? [],
            'supported_products' => $config->supported_products ?? [],
            'sandbox_mode' => $config->sandbox_mode ?? true,
            'sandbox_url' => $config->sandbox_url,
            'timeout_seconds' => $config->timeout_seconds ?? 30,
            'rate_limit_per_minute' => $config->rate_limit_per_minute ?? 60,
            'credentials_encrypted' => $config->credentials_encrypted,
            'adapter_type' => $config->adapter_type ?? 'generic_rest',
        ];
    }

    /**
     * Create the appropriate adapter instance based on adapter type.
     */
    protected function createAdapter(
        string $adapterType,
        string $slug,
        string $name,
        array $config,
    ): ?CarrierApiAdapter {
        return match ($adapterType) {
            'progressive' => new ProgressiveAdapter($config),
            'travelers' => new TravelersAdapter($config),
            'generic_rest' => new GenericRestAdapter($slug, $name, $config),
            default => new GenericRestAdapter($slug, $name, $config),
        };
    }
}
