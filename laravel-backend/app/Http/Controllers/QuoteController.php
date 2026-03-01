<?php

namespace App\Http\Controllers;

use App\Mail\QuoteReceivedMail;
use App\Models\AgencyCarrierAppointment;
use App\Models\CarrierProduct;
use App\Models\Coverage;
use App\Models\InsuranceProfile;
use App\Models\InsuredObject;
use App\Models\Lead;
use App\Models\LeadScenario;
use App\Models\PlatformProduct;
use App\Models\Quote;
use App\Models\QuoteRequest;
use App\Helpers\ZipToState;
use App\Models\RateTable;
use App\Services\Rating\RatingEngine;
use App\Services\Rating\RateInput;
use App\Services\Rating\RateOutput;
use App\Services\RoutingEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class QuoteController extends Controller
{
    public function __construct(
        private RoutingEngine $router,
        private RatingEngine $ratingEngine,
    ) {}

    public function estimate(Request $request)
    {
        $data = $request->validate([
            'insurance_type' => 'required|string',
            'zip_code' => 'required|string|max:10',
            'coverage_level' => 'sometimes|in:basic,standard,premium',
            'details' => 'nullable|array',
            'first_name' => 'nullable|string',
            'last_name' => 'nullable|string',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'date_of_birth' => 'nullable|date',
            'agency_id' => 'nullable|integer|exists:agencies,id',
        ]);

        $agencyId = $data['agency_id'] ?? $request->attributes->get('agency_id');

        // Validate product is platform-active (if platform_products table has been fully seeded)
        // Try exact slug first, then check expanded types (e.g., "home" → "homeowners")
        $expandedTypes = self::expandInsuranceTypes($data['insurance_type']);
        $platformProduct = PlatformProduct::whereIn('slug', $expandedTypes)
            ->where('is_active', true)
            ->first();

        // Only block if platform_products is fully seeded (30+ products) and type truly doesn't exist
        // This prevents blocking valid quotes when the seeder hasn't been re-run after adding new types
        if (!$platformProduct && PlatformProduct::count() >= 30) {
            return response()->json(['error' => 'This product type is not available'], 422);
        }

        // If agency context, validate agency supports this product
        if ($agencyId && $platformProduct) {
            $agencySupports = DB::table('agency_products')
                ->where('agency_id', $agencyId)
                ->where('platform_product_id', $platformProduct->id)
                ->where('is_active', true)
                ->exists();

            if ($agencySupports === false && DB::table('agency_products')->where('agency_id', $agencyId)->exists()) {
                return response()->json(['error' => 'This product is not available through this agency'], 422);
            }
        }

        $quoteRequest = QuoteRequest::create([
            'user_id' => $request->user()?->id,
            'agency_id' => $agencyId,
            'insurance_type' => $data['insurance_type'],
            'zip_code' => $data['zip_code'],
            'coverage_level' => $data['coverage_level'] ?? 'standard',
            'details' => $data['details'] ?? null,
            'first_name' => $data['first_name'] ?? null,
            'last_name' => $data['last_name'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
        ]);

        // Derive state from ZIP code for geographic filtering
        $state = ZipToState::resolve($data['zip_code']);

        // Map simplified calculator types to all matching carrier product types
        $productTypes = self::expandInsuranceTypes($data['insurance_type']);

        // Get matching carrier products, filtered by agency appointments if applicable
        $query = CarrierProduct::whereIn('insurance_type', $productTypes)
            ->where('is_active', true)
            ->whereHas('carrier', function ($q) use ($state) {
                $q->where('is_active', true);
                if ($state) {
                    $q->whereJsonContains('states_available', $state);
                }
            })
            ->with('carrier');

        if ($agencyId && $platformProduct) {
            $appointedCarrierIds = AgencyCarrierAppointment::where('agency_id', $agencyId)
                ->where('is_active', true)
                ->where('platform_product_id', $platformProduct->id)
                ->pluck('carrier_id')
                ->toArray();

            if (!empty($appointedCarrierIds)) {
                $query->whereIn('carrier_id', $appointedCarrierIds);
            }
        }

        $products = $query->get();

        $quotes = [];
        $coverageMultiplier = match ($data['coverage_level'] ?? 'standard') {
            'basic' => 0.8,
            'premium' => 1.3,
            default => 1.0,
        };

        foreach ($products as $i => $product) {
            // ── Tier 1: Try rate table rating ──
            $rateResult = $this->tryRateTableRating($product, $data, $state);

            if ($rateResult) {
                // Rate table produced a real quote
                $monthly = $rateResult->premiumModal;
                $annual = round($rateResult->premiumAnnual, 2);
                $breakdown = [
                    'rating_source' => 'rate_table',
                    'base_rate' => $rateResult->baseRateValue,
                    'base_rate_key' => $rateResult->baseRateKey,
                    'base_premium' => round($rateResult->basePremium, 2),
                    'coverage_factor' => $coverageMultiplier,
                    'factors_applied' => $rateResult->factorsApplied,
                    'riders_applied' => $rateResult->ridersApplied,
                    'fees_applied' => $rateResult->feesApplied,
                    'rate_table_version' => $rateResult->rateTableVersion,
                    'engine_version' => $rateResult->engineVersion,
                    'modal_mode' => $rateResult->modalMode,
                    'modal_factor' => $rateResult->modalFactor,
                ];
            } else {
                // ── Tier 2: Fallback to min/max estimate ──
                $basePremium = ($product->min_premium + $product->max_premium) / 2;
                $monthly = round($basePremium * $coverageMultiplier + rand(-20, 20), 2);
                $annual = round($monthly * 11.5, 2);

                $baseRate = round($product->base_rate ?? ($monthly * 0.85), 2);
                $policyFee = round($product->policy_fee ?? 5.00, 2);
                $discount = 0;
                $discountLabel = null;

                if ($i > 0) {
                    $discount = round($monthly * 0.05, 2);
                    $discountLabel = 'Multi-policy discount (5%)';
                }

                $breakdown = [
                    'rating_source' => 'estimate',
                    'base_rate' => $baseRate,
                    'coverage_factor' => $coverageMultiplier,
                    'state_factor' => 1.0,
                    'policy_fee' => $policyFee,
                    'discount' => $discount,
                    'discount_label' => $discountLabel,
                ];
            }

            $quote = Quote::create([
                'quote_request_id' => $quoteRequest->id,
                'carrier_product_id' => $product->id,
                'carrier_name' => $product->carrier?->name ?? $product->name,
                'monthly_premium' => $monthly,
                'annual_premium' => $annual,
                'deductible' => $product->deductible_options[0] ?? 500,
                'coverage_limit' => $product->coverage_options[0] ?? '$100,000',
                'features' => $product->features,
                'is_recommended' => $i === 0,
                'expires_at' => now()->addDays(30),
            ]);

            $quote->load('carrierProduct.carrier');

            $quoteData = $quote->toArray();
            $quoteData['breakdown'] = $breakdown;
            $quotes[] = $quoteData;
        }

        // Create UIP at intake stage
        $profile = InsuranceProfile::findOrCreateFromQuote($quoteRequest, $agencyId);
        if (!empty($quotes)) {
            $lowestQuote = collect($quotes)->sortBy('monthly_premium')->first();
            $profile->advanceTo('quoted', [
                'monthly_premium' => $lowestQuote['monthly_premium'],
                'annual_premium' => $lowestQuote['annual_premium'],
            ]);
        }

        return response()->json([
            'quote_request_id' => $quoteRequest->id,
            'profile_id' => $profile->id,
            'quotes' => $quotes,
            'state' => $state,
        ]);
    }

    public function saveContact(Request $request, QuoteRequest $quoteRequest)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:20',
        ]);

        $quoteRequest->update($data);

        // Create a lead from the quote request
        $lowestQuote = $quoteRequest->quotes()->orderBy('monthly_premium')->first();

        $lead = Lead::create([
            'quote_request_id' => $quoteRequest->id,
            'agency_id' => $quoteRequest->agency_id,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'insurance_type' => $quoteRequest->insurance_type,
            'status' => 'new',
            'source' => 'calculator',
            'estimated_value' => $lowestQuote?->annual_premium,
        ]);

        // Auto-create LeadScenario from calculator data → canonical model
        $this->createScenarioFromQuote($lead, $quoteRequest, $lowestQuote);

        // Advance UIP to lead stage + route to agent
        $profile = InsuranceProfile::where('quote_request_id', $quoteRequest->id)->first();
        if ($profile) {
            $profile->update([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? $profile->phone,
                'lead_id' => $lead->id,
            ]);
            $profile->advanceTo('lead', [
                'estimated_value' => $lowestQuote?->annual_premium,
            ]);

            // Route to an agent
            $this->router->route($profile);
            $profile->refresh();

            // Sync agent back to lead
            if ($profile->assigned_agent_id && !$lead->agent_id) {
                $lead->update(['agent_id' => $profile->assigned_agent_id]);
            }
        }

        // Send quote received email
        $quoteCount = $quoteRequest->quotes()->count();
        $lowestPremium = $lowestQuote?->monthly_premium ?? '0.00';

        try {
            Mail::to($data['email'])->send(new QuoteReceivedMail(
                user: null,
                firstName: $data['first_name'],
                email: $data['email'],
                quoteCount: $quoteCount,
                lowestPremium: $lowestPremium,
            ));
        } catch (\Exception $e) {
            \Log::warning('Failed to send quote email', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'message' => 'Contact info saved',
            'lead_id' => $lead->id,
            'profile_id' => $profile?->id,
            'assigned_agent_id' => $profile?->assigned_agent_id,
            'quote_request_id' => $quoteRequest->id,
        ]);
    }

    public function myQuotes(Request $request)
    {
        $quoteRequests = QuoteRequest::where('user_id', $request->user()->id)
            ->with(['quotes.carrierProduct.carrier'])
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($quoteRequests);
    }

    public function show(QuoteRequest $quoteRequest)
    {
        $quoteRequest->load(['quotes.carrierProduct.carrier']);
        return response()->json($quoteRequest);
    }

    // ── Quote Draft Persistence ─────────────────────────

    public function saveDraft(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'insurance_type' => 'nullable|string',
            'zip_code' => 'nullable|string',
            'coverage_level' => 'nullable|string',
            'form_data' => 'required|array',
            'step' => 'integer|min:1|max:2',
        ]);

        // Upsert — one draft per user
        $draft = \App\Models\QuoteDraft::updateOrCreate(
            ['user_id' => $user->id],
            $data,
        );

        return response()->json(['draft' => $draft]);
    }

    public function getDraft(Request $request): \Illuminate\Http\JsonResponse
    {
        $draft = \App\Models\QuoteDraft::where('user_id', $request->user()->id)->first();
        return response()->json(['draft' => $draft]);
    }

    public function deleteDraft(Request $request): \Illuminate\Http\JsonResponse
    {
        \App\Models\QuoteDraft::where('user_id', $request->user()->id)->delete();
        return response()->json(['message' => 'Draft deleted']);
    }

    /**
     * Map calculator insurance_type to canonical product_type.
     */
    private function mapProductType(string $insuranceType): string
    {
        return match ($insuranceType) {
            'auto' => 'auto',
            'home' => 'homeowners',
            'renters' => 'renters',
            'life' => 'life_term',
            'health' => 'health_individual',
            'business' => 'bop',
            'umbrella' => 'umbrella',
            'disability' => 'disability_long_term',
            'ltc' => 'ltc_traditional',
            default => $insuranceType,
        };
    }

    /**
     * Expand a calculator insurance_type into all matching carrier product types.
     * E.g., "life" → ["life", "life_term", "life_whole", "life_universal"]
     */
    public static function expandInsuranceTypes(string $type): array
    {
        $map = [
            'home'       => ['home', 'homeowners'],
            'life'       => ['life', 'life_term', 'life_whole', 'life_universal', 'life_variable'],
            'health'     => ['health', 'health_individual', 'health_group', 'health_supplement'],
            'commercial' => ['commercial', 'commercial_auto', 'bop', 'commercial_property', 'general_liability'],
            'business'   => ['business', 'bop', 'commercial_auto', 'commercial_property', 'general_liability'],
            'disability' => ['disability', 'disability_short_term', 'disability_long_term'],
            'ltc'        => ['ltc', 'ltc_traditional', 'ltc_hybrid'],
            'umbrella'   => ['umbrella', 'umbrella_personal', 'umbrella_commercial'],
        ];

        return $map[$type] ?? [$type];
    }

    /**
     * Auto-create a LeadScenario with InsuredObjects and Coverages
     * from the calculator's QuoteRequest data.
     */
    private function createScenarioFromQuote(Lead $lead, QuoteRequest $quoteRequest, ?Quote $bestQuote): void
    {
        $productType = $this->mapProductType($quoteRequest->insurance_type);
        $details = $quoteRequest->details ?? [];

        $scenario = LeadScenario::create([
            'lead_id' => $lead->id,
            'scenario_name' => ucfirst(str_replace('_', ' ', $productType)) . ' Coverage',
            'product_type' => $productType,
            'priority' => 1,
            'status' => 'draft',
            'target_premium_monthly' => $bestQuote?->monthly_premium,
            'best_quoted_premium' => $bestQuote?->monthly_premium,
            'total_quotes_received' => $quoteRequest->quotes()->count(),
            'metadata_json' => [
                'source' => 'calculator',
                'zip_code' => $quoteRequest->zip_code,
                'coverage_level' => $quoteRequest->coverage_level,
            ],
        ]);

        // Create InsuredObject based on insurance type
        match ($quoteRequest->insurance_type) {
            'auto' => $this->createVehicleObject($scenario, $details, $lead),
            'home', 'renters' => $this->createPropertyObject($scenario, $details, $quoteRequest),
            'life', 'health', 'disability', 'ltc' => $this->createPersonObject($scenario, $lead, $quoteRequest),
            'business' => $this->createBusinessObject($scenario, $lead),
            default => $this->createPersonObject($scenario, $lead, $quoteRequest),
        };

        // Create default coverages based on insurance type
        $this->createDefaultCoverages($scenario, $quoteRequest, $bestQuote);
    }

    private function createVehicleObject(LeadScenario $scenario, array $details, Lead $lead): void
    {
        // Also create the primary driver as a person
        InsuredObject::create([
            'insurable_type' => LeadScenario::class,
            'insurable_id' => $scenario->id,
            'object_type' => 'person',
            'name' => "{$lead->first_name} {$lead->last_name}",
            'relationship' => 'primary',
            'sort_order' => 0,
        ]);

        if (!empty($details['vehicle_year']) || !empty($details['vehicle_make'])) {
            $vehicleName = trim(($details['vehicle_year'] ?? '') . ' ' . ($details['vehicle_make'] ?? '') . ' ' . ($details['vehicle_model'] ?? ''));
            InsuredObject::create([
                'insurable_type' => LeadScenario::class,
                'insurable_id' => $scenario->id,
                'object_type' => 'vehicle',
                'name' => $vehicleName ?: 'Primary Vehicle',
                'vehicle_year' => $details['vehicle_year'] ?? null,
                'vehicle_make' => $details['vehicle_make'] ?? null,
                'vehicle_model' => $details['vehicle_model'] ?? null,
                'sort_order' => 1,
            ]);
        }
    }

    private function createPropertyObject(LeadScenario $scenario, array $details, QuoteRequest $quoteRequest): void
    {
        InsuredObject::create([
            'insurable_type' => LeadScenario::class,
            'insurable_id' => $scenario->id,
            'object_type' => 'property',
            'name' => 'Primary Residence',
            'zip' => $quoteRequest->zip_code,
            'year_built' => $details['year_built'] ?? null,
            'square_footage' => $details['square_footage'] ?? null,
            'details_json' => !empty($details['home_value']) ? ['home_value' => $details['home_value']] : null,
            'sort_order' => 0,
        ]);
    }

    private function createPersonObject(LeadScenario $scenario, Lead $lead, QuoteRequest $quoteRequest): void
    {
        InsuredObject::create([
            'insurable_type' => LeadScenario::class,
            'insurable_id' => $scenario->id,
            'object_type' => 'person',
            'name' => "{$lead->first_name} {$lead->last_name}",
            'relationship' => 'primary',
            'date_of_birth' => $quoteRequest->date_of_birth,
            'zip' => $quoteRequest->zip_code,
            'sort_order' => 0,
        ]);
    }

    private function createBusinessObject(LeadScenario $scenario, Lead $lead): void
    {
        InsuredObject::create([
            'insurable_type' => LeadScenario::class,
            'insurable_id' => $scenario->id,
            'object_type' => 'business',
            'name' => "{$lead->first_name} {$lead->last_name} Business",
            'sort_order' => 0,
        ]);
    }

    /**
     * Attempt to rate a CarrierProduct via the RatingEngine using rate tables.
     * Returns a RateOutput on success, or null if no rate table exists.
     */
    private function tryRateTableRating(CarrierProduct $product, array $data, ?string $state): ?RateOutput
    {
        $productType = $product->rate_table_product_type ?? $this->mapProductType($product->insurance_type);

        // Check if a rate table exists for this carrier + product type
        $rateTable = RateTable::activeFor($productType, $product->carrier_id);
        if (!$rateTable) {
            return null;
        }

        // Check if a plugin is registered for this product type
        if (!in_array($productType, $this->ratingEngine->registeredProducts())) {
            return null;
        }

        $input = $this->buildRateInputFromRequest($productType, $product, $data, $state);

        try {
            $plugin = $this->resolvePlugin($productType);
            if (!$plugin) {
                return null;
            }

            $output = $plugin->rateProduct($input);

            if (!$output->eligible || $output->premiumModal <= 0) {
                return null;
            }

            return $output;
        } catch (\Throwable $e) {
            \Log::warning('Rate table rating failed, falling back to estimate', [
                'carrier' => $product->carrier?->name,
                'product_type' => $productType,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Resolve a rating plugin by product type (mirrors RatingEngine logic).
     */
    private function resolvePlugin(string $productType): ?\App\Services\Rating\ProductPlugin
    {
        $pluginMap = [];
        foreach ([
            \App\Services\Rating\Plugins\DisabilityPlugin::class,
            \App\Services\Rating\Plugins\LifePlugin::class,
            \App\Services\Rating\Plugins\PropertyCasualtyPlugin::class,
        ] as $class) {
            foreach ($class::productTypes() as $pt) {
                $pluginMap[$pt] = $class;
            }
        }
        $class = $pluginMap[$productType] ?? null;
        return $class ? new $class() : null;
    }

    /**
     * Build a RateInput from the calculator request data (no LeadScenario context).
     */
    private function buildRateInputFromRequest(string $productType, CarrierProduct $product, array $data, ?string $state): RateInput
    {
        $input = new RateInput();
        $input->productType = $productType;
        $input->carrierId = $product->carrier_id;
        $input->state = $state;
        $input->paymentMode = 'monthly';

        $details = $data['details'] ?? [];

        // Demographics
        if (!empty($data['date_of_birth'])) {
            $input->age = (int) now()->diffInYears($data['date_of_birth']);
        } elseif (!empty($details['age'])) {
            $input->age = (int) $details['age'];
        }
        $input->sex = $details['sex'] ?? $details['gender'] ?? null;
        $input->tobaccoUse = isset($details['tobacco_use']) ? (bool) $details['tobacco_use'] : null;
        $input->occupation = $details['occupation'] ?? null;
        $input->annualIncome = isset($details['annual_income']) ? (float) $details['annual_income'] : null;

        // Build insured objects from details
        $input->insuredObjects = $this->buildInsuredObjectsFromDetails($data['insurance_type'], $details, $data);
        $input->coverages = $this->buildCoveragesFromDetails($data['insurance_type'], $details);

        // DI / LTC specifics
        if (!empty($details['monthly_benefit'])) {
            $input->monthlyBenefitRequested = (float) $details['monthly_benefit'];
        }
        if (!empty($details['daily_benefit'])) {
            $input->dailyBenefit = (float) $details['daily_benefit'];
        }
        if (!empty($details['elimination_period'])) {
            $input->eliminationPeriodDays = (int) $details['elimination_period'];
        }
        if (!empty($details['benefit_period'])) {
            $input->benefitPeriod = $details['benefit_period'];
        }
        if (!empty($details['occupation_class'])) {
            $input->occupationClass = $details['occupation_class'];
        }

        // Life specifics
        if (!empty($details['face_amount'])) {
            $input->metadata['face_amount'] = (float) $details['face_amount'];
        }
        if (!empty($details['term_length'])) {
            $input->metadata['term_length'] = (int) $details['term_length'];
        }

        // Factor/rider selections from details
        if (!empty($details['factor_selections'])) {
            $input->factorSelections = $details['factor_selections'];
        }
        if (!empty($details['rider_selections'])) {
            $input->riderSelections = $details['rider_selections'];
        }

        $input->metadata = array_merge($input->metadata, $details);

        return $input;
    }

    /**
     * Build insured objects array from calculator request details.
     */
    private function buildInsuredObjectsFromDetails(string $insuranceType, array $details, array $data): array
    {
        $objects = [];

        switch ($insuranceType) {
            case 'auto':
                $objects[] = [
                    'object_type' => 'person',
                    'name' => trim(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? '')) ?: 'Primary Driver',
                    'relationship' => 'primary',
                    'date_of_birth' => $data['date_of_birth'] ?? null,
                ];
                if (!empty($details['vehicle_year']) || !empty($details['vehicle_make'])) {
                    $objects[] = [
                        'object_type' => 'vehicle',
                        'name' => trim(($details['vehicle_year'] ?? '') . ' ' . ($details['vehicle_make'] ?? '') . ' ' . ($details['vehicle_model'] ?? '')),
                        'vehicle_year' => $details['vehicle_year'] ?? null,
                        'vehicle_make' => $details['vehicle_make'] ?? null,
                        'vehicle_model' => $details['vehicle_model'] ?? null,
                    ];
                }
                break;

            case 'home':
            case 'renters':
                $objects[] = [
                    'object_type' => 'property',
                    'name' => 'Primary Residence',
                    'zip' => $data['zip_code'],
                    'year_built' => $details['year_built'] ?? null,
                    'square_footage' => $details['square_footage'] ?? null,
                    'construction_type' => $details['construction_type'] ?? null,
                ];
                break;

            case 'business':
                $objects[] = [
                    'object_type' => 'business',
                    'name' => $details['business_name'] ?? 'Business',
                    'annual_revenue' => $details['annual_revenue'] ?? null,
                    'employee_count' => $details['employee_count'] ?? null,
                ];
                break;

            default:
                // Person-based: life, health, disability, ltc
                $objects[] = [
                    'object_type' => 'person',
                    'name' => trim(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? '')) ?: 'Primary Insured',
                    'relationship' => 'primary',
                    'date_of_birth' => $data['date_of_birth'] ?? null,
                    'gender' => $details['sex'] ?? $details['gender'] ?? null,
                    'tobacco_use' => $details['tobacco_use'] ?? null,
                    'occupation' => $details['occupation'] ?? null,
                    'annual_income' => $details['annual_income'] ?? null,
                    'state' => null, // set from zip
                ];
                break;
        }

        return $objects;
    }

    /**
     * Build coverages array from calculator request details.
     */
    private function buildCoveragesFromDetails(string $insuranceType, array $details): array
    {
        $coverages = [];

        switch ($insuranceType) {
            case 'auto':
                $coverages[] = ['coverage_type' => 'bodily_injury', 'coverage_category' => 'liability', 'limit_amount' => $details['liability_limit'] ?? 100000];
                $coverages[] = ['coverage_type' => 'collision', 'coverage_category' => 'property', 'deductible_amount' => $details['deductible'] ?? 500];
                $coverages[] = ['coverage_type' => 'comprehensive', 'coverage_category' => 'property', 'deductible_amount' => $details['deductible'] ?? 500];
                break;

            case 'home':
                $coverages[] = ['coverage_type' => 'dwelling', 'coverage_category' => 'property', 'limit_amount' => $details['home_value'] ?? $details['dwelling_coverage'] ?? 300000];
                $coverages[] = ['coverage_type' => 'liability', 'coverage_category' => 'liability', 'limit_amount' => $details['liability_limit'] ?? 100000];
                break;

            case 'renters':
                $coverages[] = ['coverage_type' => 'personal_property', 'coverage_category' => 'property', 'limit_amount' => $details['personal_property'] ?? 30000];
                $coverages[] = ['coverage_type' => 'liability', 'coverage_category' => 'liability', 'limit_amount' => $details['liability_limit'] ?? 100000];
                break;

            case 'life':
                $coverages[] = ['coverage_type' => 'death_benefit', 'coverage_category' => 'life', 'benefit_amount' => $details['face_amount'] ?? 500000];
                break;

            case 'disability':
                $coverages[] = ['coverage_type' => 'monthly_disability_benefit', 'coverage_category' => 'disability', 'benefit_amount' => $details['monthly_benefit'] ?? 5000, 'elimination_period_days' => $details['elimination_period'] ?? 90, 'benefit_period' => $details['benefit_period'] ?? 'to_age_65'];
                break;

            case 'ltc':
                $coverages[] = ['coverage_type' => 'daily_ltc_benefit', 'coverage_category' => 'specialty', 'benefit_amount' => $details['daily_benefit'] ?? 150, 'benefit_period' => $details['benefit_period'] ?? '3_years', 'elimination_period_days' => $details['elimination_period'] ?? 90];
                break;

            case 'business':
                $coverages[] = ['coverage_type' => 'general_liability', 'coverage_category' => 'liability', 'limit_amount' => $details['liability_limit'] ?? 1000000, 'aggregate_limit' => $details['aggregate_limit'] ?? 2000000];
                break;
        }

        return $coverages;
    }

    private function createDefaultCoverages(LeadScenario $scenario, QuoteRequest $quoteRequest, ?Quote $bestQuote): void
    {
        $coverageMap = [
            'auto' => [
                ['coverage_type' => 'bodily_injury', 'coverage_category' => 'liability', 'limit_amount' => 100000],
                ['coverage_type' => 'property_damage', 'coverage_category' => 'liability', 'limit_amount' => 50000],
                ['coverage_type' => 'collision', 'coverage_category' => 'property', 'deductible_amount' => $bestQuote?->deductible ?? 500],
                ['coverage_type' => 'comprehensive', 'coverage_category' => 'property', 'deductible_amount' => $bestQuote?->deductible ?? 500],
            ],
            'home' => [
                ['coverage_type' => 'dwelling', 'coverage_category' => 'property', 'limit_amount' => 300000],
                ['coverage_type' => 'personal_property', 'coverage_category' => 'property', 'limit_amount' => 100000],
                ['coverage_type' => 'liability', 'coverage_category' => 'liability', 'limit_amount' => 100000],
            ],
            'renters' => [
                ['coverage_type' => 'personal_property', 'coverage_category' => 'property', 'limit_amount' => 30000],
                ['coverage_type' => 'liability', 'coverage_category' => 'liability', 'limit_amount' => 100000],
            ],
            'life' => [
                ['coverage_type' => 'death_benefit', 'coverage_category' => 'life', 'benefit_amount' => 500000],
            ],
            'health' => [
                ['coverage_type' => 'medical', 'coverage_category' => 'medical', 'deductible_amount' => 1500],
            ],
            'disability' => [
                ['coverage_type' => 'monthly_disability_benefit', 'coverage_category' => 'disability', 'benefit_amount' => 5000, 'benefit_period' => 'to_age_65', 'elimination_period_days' => 90],
            ],
            'ltc' => [
                ['coverage_type' => 'daily_ltc_benefit', 'coverage_category' => 'specialty', 'benefit_amount' => 150, 'benefit_period' => '3_years', 'elimination_period_days' => 90],
            ],
            'business' => [
                ['coverage_type' => 'general_liability', 'coverage_category' => 'liability', 'limit_amount' => 1000000],
                ['coverage_type' => 'business_property', 'coverage_category' => 'property', 'limit_amount' => 500000],
            ],
            'umbrella' => [
                ['coverage_type' => 'umbrella_liability', 'coverage_category' => 'liability', 'limit_amount' => 1000000],
            ],
        ];

        $coverages = $coverageMap[$quoteRequest->insurance_type] ?? [];

        foreach ($coverages as $i => $cov) {
            Coverage::create([
                'coverable_type' => LeadScenario::class,
                'coverable_id' => $scenario->id,
                'coverage_type' => $cov['coverage_type'],
                'coverage_category' => $cov['coverage_category'],
                'limit_amount' => $cov['limit_amount'] ?? null,
                'deductible_amount' => $cov['deductible_amount'] ?? null,
                'benefit_amount' => $cov['benefit_amount'] ?? null,
                'benefit_period' => $cov['benefit_period'] ?? null,
                'elimination_period_days' => $cov['elimination_period_days'] ?? null,
                'is_included' => true,
                'sort_order' => $i,
            ]);
        }
    }
}
