<?php

namespace App\Http\Controllers;

use App\Models\Agency;
use App\Models\Application;
use App\Models\Coverage;
use App\Models\InsuredObject;
use App\Models\Lead;
use App\Models\LeadScenario;
use App\Models\ScenarioQuote;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LeadScenarioController extends Controller
{
    /**
     * List scenarios for a lead.
     */
    public function index(Lead $lead)
    {
        $scenarios = $lead->scenarios()
            ->with(['insuredObjects', 'coverages', 'selectedCarrier', 'applications', 'quotes.carrier'])
            ->orderBy('priority')
            ->get();

        return response()->json($scenarios);
    }

    /**
     * Create a new scenario for a lead.
     */
    public function store(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'scenario_name' => 'required|string|max:255',
            'product_type' => 'required|string|max:100',
            'priority' => 'sometimes|integer|min:1|max:5',
            'effective_date_desired' => 'nullable|date',
            'current_carrier' => 'nullable|string|max:255',
            'current_premium_monthly' => 'nullable|numeric',
            'current_policy_number' => 'nullable|string|max:100',
            'current_policy_expiration' => 'nullable|date',
            'target_premium_monthly' => 'nullable|numeric',
            'risk_factors' => 'nullable|array',
            'metadata_json' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $scenario = $lead->scenarios()->create([
            ...$data,
            'agent_id' => $request->user()->id,
            'status' => 'draft',
        ]);

        // Auto-populate suggested coverages for the product type
        $suggestedCoverages = LeadScenario::suggestedCoverages($data['product_type']);
        foreach ($suggestedCoverages as $i => $cov) {
            $scenario->coverages()->create([
                ...$cov,
                'sort_order' => $i,
            ]);
        }

        $scenario->load(['insuredObjects', 'coverages']);

        return response()->json($scenario, 201);
    }

    /**
     * Show a single scenario with all related data.
     */
    public function show(Lead $lead, LeadScenario $scenario)
    {
        $scenario->load(['insuredObjects', 'coverages', 'selectedCarrier', 'applications']);
        return response()->json($scenario);
    }

    /**
     * Update a scenario.
     */
    public function update(Request $request, Lead $lead, LeadScenario $scenario)
    {
        $data = $request->validate([
            'scenario_name' => 'sometimes|string|max:255',
            'product_type' => 'sometimes|string|max:100',
            'priority' => 'sometimes|integer|min:1|max:5',
            'status' => 'sometimes|string|in:draft,quoting,quoted,comparing,selected,applied,bound,declined,expired',
            'selected_carrier_id' => 'nullable|integer|exists:carriers,id',
            'effective_date_desired' => 'nullable|date',
            'current_carrier' => 'nullable|string|max:255',
            'current_premium_monthly' => 'nullable|numeric',
            'current_policy_number' => 'nullable|string|max:100',
            'current_policy_expiration' => 'nullable|date',
            'target_premium_monthly' => 'nullable|numeric',
            'best_quoted_premium' => 'nullable|numeric',
            'risk_factors' => 'nullable|array',
            'metadata_json' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $scenario->update($data);
        $scenario->load(['insuredObjects', 'coverages']);

        return response()->json($scenario);
    }

    /**
     * Delete a scenario.
     */
    public function destroy(Lead $lead, LeadScenario $scenario)
    {
        $scenario->delete();
        return response()->json(['message' => 'Scenario deleted']);
    }

    // ── Insured Objects ─────────────────────────────────

    /**
     * Add an insured object to a scenario.
     */
    public function addInsuredObject(Request $request, Lead $lead, LeadScenario $scenario)
    {
        $data = $request->validate([
            'object_type' => 'required|in:person,vehicle,property,business,other',
            'name' => 'required|string|max:255',
            'relationship' => 'nullable|string|max:100',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'address_line1' => 'nullable|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:2',
            'zip' => 'nullable|string|max:10',
            'vehicle_year' => 'nullable|integer',
            'vehicle_make' => 'nullable|string|max:100',
            'vehicle_model' => 'nullable|string|max:100',
            'vin' => 'nullable|string|max:17',
            'year_built' => 'nullable|integer',
            'square_footage' => 'nullable|integer',
            'construction_type' => 'nullable|string|max:100',
            'fein' => 'nullable|string|max:20',
            'naics_code' => 'nullable|string|max:10',
            'annual_revenue' => 'nullable|numeric',
            'employee_count' => 'nullable|integer',
            'height_inches' => 'nullable|integer',
            'weight_lbs' => 'nullable|integer',
            'tobacco_use' => 'nullable|boolean',
            'occupation' => 'nullable|string|max:255',
            'annual_income' => 'nullable|numeric',
            'details_json' => 'nullable|array',
        ]);

        $maxSort = $scenario->insuredObjects()->max('sort_order') ?? -1;
        $obj = $scenario->insuredObjects()->create([...$data, 'sort_order' => $maxSort + 1]);

        return response()->json($obj, 201);
    }

    /**
     * Update an insured object.
     */
    public function updateInsuredObject(Request $request, Lead $lead, LeadScenario $scenario, InsuredObject $object)
    {
        $data = $request->validate([
            'object_type' => 'sometimes|in:person,vehicle,property,business,other',
            'name' => 'sometimes|string|max:255',
            'relationship' => 'nullable|string|max:100',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'address_line1' => 'nullable|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:2',
            'zip' => 'nullable|string|max:10',
            'vehicle_year' => 'nullable|integer',
            'vehicle_make' => 'nullable|string|max:100',
            'vehicle_model' => 'nullable|string|max:100',
            'vin' => 'nullable|string|max:17',
            'year_built' => 'nullable|integer',
            'square_footage' => 'nullable|integer',
            'construction_type' => 'nullable|string|max:100',
            'fein' => 'nullable|string|max:20',
            'naics_code' => 'nullable|string|max:10',
            'annual_revenue' => 'nullable|numeric',
            'employee_count' => 'nullable|integer',
            'height_inches' => 'nullable|integer',
            'weight_lbs' => 'nullable|integer',
            'tobacco_use' => 'nullable|boolean',
            'occupation' => 'nullable|string|max:255',
            'annual_income' => 'nullable|numeric',
            'details_json' => 'nullable|array',
        ]);

        $object->update($data);
        return response()->json($object);
    }

    /**
     * Remove an insured object.
     */
    public function removeInsuredObject(Lead $lead, LeadScenario $scenario, InsuredObject $object)
    {
        $object->delete();
        return response()->json(['message' => 'Insured object removed']);
    }

    // ── Coverages ─────────────────────────────────

    /**
     * Add or update a coverage on a scenario.
     */
    public function addCoverage(Request $request, Lead $lead, LeadScenario $scenario)
    {
        $data = $request->validate([
            'coverage_type' => 'required|string|max:100',
            'coverage_category' => 'required|string|in:liability,property,medical,life,disability,specialty',
            'limit_amount' => 'nullable|numeric',
            'per_occurrence_limit' => 'nullable|numeric',
            'aggregate_limit' => 'nullable|numeric',
            'deductible_amount' => 'nullable|numeric',
            'benefit_amount' => 'nullable|numeric',
            'benefit_period' => 'nullable|string|max:100',
            'elimination_period_days' => 'nullable|integer',
            'coinsurance_pct' => 'nullable|numeric',
            'copay_amount' => 'nullable|numeric',
            'is_included' => 'sometimes|boolean',
            'details_json' => 'nullable|array',
        ]);

        $maxSort = $scenario->coverages()->max('sort_order') ?? -1;
        $coverage = $scenario->coverages()->create([...$data, 'sort_order' => $maxSort + 1]);

        return response()->json($coverage, 201);
    }

    /**
     * Update a coverage.
     */
    public function updateCoverage(Request $request, Lead $lead, LeadScenario $scenario, Coverage $coverage)
    {
        $data = $request->validate([
            'coverage_type' => 'sometimes|string|max:100',
            'coverage_category' => 'sometimes|string|in:liability,property,medical,life,disability,specialty',
            'limit_amount' => 'nullable|numeric',
            'per_occurrence_limit' => 'nullable|numeric',
            'aggregate_limit' => 'nullable|numeric',
            'deductible_amount' => 'nullable|numeric',
            'benefit_amount' => 'nullable|numeric',
            'benefit_period' => 'nullable|string|max:100',
            'elimination_period_days' => 'nullable|integer',
            'coinsurance_pct' => 'nullable|numeric',
            'copay_amount' => 'nullable|numeric',
            'is_included' => 'sometimes|boolean',
            'premium_allocated' => 'nullable|numeric',
            'details_json' => 'nullable|array',
        ]);

        $coverage->update($data);
        return response()->json($coverage);
    }

    /**
     * Remove a coverage.
     */
    public function removeCoverage(Lead $lead, LeadScenario $scenario, Coverage $coverage)
    {
        $coverage->delete();
        return response()->json(['message' => 'Coverage removed']);
    }

    // ── Conversion ─────────────────────────────────

    /**
     * Convert a scenario into an application (sent to a specific carrier).
     */
    public function convertToApplication(Request $request, Lead $lead, LeadScenario $scenario)
    {
        $data = $request->validate([
            'carrier_product_id' => 'nullable|integer|exists:carrier_products,id',
            'carrier_name' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $agencyId = $request->attributes->get('agency_id');

        // Create the application
        $application = Application::create([
            'reference' => 'APP-' . strtoupper(Str::random(8)),
            'user_id' => $lead->consumer_id ?? $user->id,
            'agent_id' => $user->id,
            'agency_id' => $agencyId,
            'carrier_product_id' => $data['carrier_product_id'] ?? null,
            'lead_scenario_id' => $scenario->id,
            'lead_id' => $lead->id,
            'insurance_type' => $scenario->product_type,
            'carrier_name' => $data['carrier_name'],
            'status' => 'draft',
        ]);

        // Copy insured objects from scenario to application
        foreach ($scenario->insuredObjects as $obj) {
            $newObj = $obj->replicate();
            $newObj->insurable_type = Application::class;
            $newObj->insurable_id = $application->id;
            $newObj->save();
        }

        // Copy coverages from scenario to application
        foreach ($scenario->coverages as $cov) {
            $newCov = $cov->replicate();
            $newCov->coverable_type = Application::class;
            $newCov->coverable_id = $application->id;
            $newCov->save();
        }

        // Update scenario counters
        $scenario->increment('total_applications');
        if ($scenario->status === 'draft' || $scenario->status === 'quoting') {
            $scenario->update(['status' => 'applied']);
        }

        // Update lead status
        if ($lead->status === 'new' || $lead->status === 'contacted' || $lead->status === 'quoted') {
            $lead->update(['status' => 'applied']);
        }

        $application->load(['insuredObjects', 'coverages']);

        return response()->json($application, 201);
    }

    // ── Reference Data ─────────────────────────────────

    /**
     * Return all product types grouped by category.
     */
    public function productTypes()
    {
        return response()->json(LeadScenario::productTypes());
    }

    /**
     * Return suggested coverages for a product type.
     */
    public function suggestedCoverages(string $productType)
    {
        return response()->json([
            'product_type' => $productType,
            'primary_object_type' => LeadScenario::primaryObjectType($productType),
            'coverages' => LeadScenario::suggestedCoverages($productType),
            'coverage_types' => Coverage::typesByCategory(),
        ]);
    }

    // ── Carrier Quotes (multi-carrier comparison) ─────

    /**
     * Add a carrier quote to a scenario.
     */
    public function addQuote(Request $request, Lead $lead, LeadScenario $scenario)
    {
        $data = $request->validate([
            'carrier_id' => 'nullable|integer|exists:carriers,id',
            'carrier_product_id' => 'nullable|integer|exists:carrier_products,id',
            'carrier_name' => 'required|string|max:255',
            'product_name' => 'nullable|string|max:255',
            'premium_monthly' => 'nullable|numeric|min:0',
            'premium_annual' => 'nullable|numeric|min:0',
            'premium_semi_annual' => 'nullable|numeric|min:0',
            'premium_quarterly' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,quoted,declined,expired,selected',
            'am_best_rating' => 'nullable|string|max:10',
            'financial_strength_score' => 'nullable|numeric|min:0|max:10',
            'coverage_details' => 'nullable|array',
            'endorsements' => 'nullable|array',
            'exclusions' => 'nullable|array',
            'discounts_applied' => 'nullable|array',
            'agent_notes' => 'nullable|string',
            'is_recommended' => 'nullable|boolean',
        ]);

        if (!empty($data['is_recommended'])) {
            $scenario->quotes()->update(['is_recommended' => false]);
        }

        $quote = $scenario->quotes()->create(array_merge($data, [
            'quoted_at' => ($data['status'] ?? 'pending') === 'quoted' ? now() : null,
        ]));

        // Update scenario stats
        $scenario->update([
            'total_quotes_received' => $scenario->quotes()->where('status', 'quoted')->count(),
            'best_quoted_premium' => $scenario->quotes()->where('status', 'quoted')->min('premium_monthly'),
            'status' => $scenario->status === 'draft' ? 'quoting' : $scenario->status,
        ]);

        return response()->json($quote->load('carrier'), 201);
    }

    /**
     * Update a carrier quote.
     */
    public function updateQuote(Request $request, Lead $lead, LeadScenario $scenario, ScenarioQuote $quote)
    {
        $data = $request->validate([
            'carrier_name' => 'sometimes|string|max:255',
            'product_name' => 'nullable|string|max:255',
            'premium_monthly' => 'nullable|numeric|min:0',
            'premium_annual' => 'nullable|numeric|min:0',
            'premium_semi_annual' => 'nullable|numeric|min:0',
            'premium_quarterly' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,quoted,declined,expired,selected',
            'am_best_rating' => 'nullable|string|max:10',
            'financial_strength_score' => 'nullable|numeric|min:0|max:10',
            'coverage_details' => 'nullable|array',
            'endorsements' => 'nullable|array',
            'exclusions' => 'nullable|array',
            'discounts_applied' => 'nullable|array',
            'decline_reason' => 'nullable|string',
            'agent_notes' => 'nullable|string',
            'is_recommended' => 'nullable|boolean',
        ]);

        if (!empty($data['is_recommended'])) {
            $scenario->quotes()->where('id', '!=', $quote->id)->update(['is_recommended' => false]);
        }

        if (isset($data['status']) && $data['status'] === 'quoted' && !$quote->quoted_at) {
            $data['quoted_at'] = now();
        }

        $quote->update($data);

        // Update scenario stats
        $scenario->update([
            'total_quotes_received' => $scenario->quotes()->where('status', 'quoted')->count(),
            'best_quoted_premium' => $scenario->quotes()->where('status', 'quoted')->min('premium_monthly'),
        ]);

        return response()->json($quote->load('carrier'));
    }

    /**
     * Remove a carrier quote.
     */
    public function removeQuote(Lead $lead, LeadScenario $scenario, ScenarioQuote $quote)
    {
        $quote->delete();

        $scenario->update([
            'total_quotes_received' => $scenario->quotes()->where('status', 'quoted')->count(),
            'best_quoted_premium' => $scenario->quotes()->where('status', 'quoted')->min('premium_monthly'),
        ]);

        return response()->json(['message' => 'Quote removed']);
    }

    /**
     * Select a carrier quote (marks it as 'selected' and updates scenario).
     */
    public function selectQuote(Lead $lead, LeadScenario $scenario, ScenarioQuote $quote)
    {
        // Deselect any previously selected quote
        $scenario->quotes()->where('status', 'selected')->update(['status' => 'quoted']);

        $quote->update(['status' => 'selected']);

        $scenario->update([
            'selected_carrier_id' => $quote->carrier_id,
            'best_quoted_premium' => $quote->premium_monthly,
            'status' => 'selected',
        ]);

        return response()->json([
            'message' => 'Carrier quote selected',
            'quote' => $quote->load('carrier'),
        ]);
    }

    // ── Proposal PDF ─────────────────────────────────

    /**
     * Generate a stunning PDF proposal for a scenario.
     */
    public function generateProposal(Request $request, Lead $lead, LeadScenario $scenario)
    {
        $scenario->load(['insuredObjects', 'coverages', 'quotes.carrier']);

        $user = $request->user();
        $agency = Agency::where('id', $user->agency_id)->first();

        // Build agency data for header
        $agencyData = $agency ? [
            'name' => $agency->name,
            'phone' => $agency->phone,
            'email' => $agency->email,
            'website' => $agency->website,
            'address' => $agency->address,
            'city' => $agency->city,
            'state' => $agency->state,
            'zip_code' => $agency->zip_code,
        ] : [
            'name' => $user->name . ' Insurance',
            'phone' => null,
            'email' => $user->email,
            'website' => null,
            'address' => null,
            'city' => null,
            'state' => null,
            'zip_code' => null,
        ];

        // Client name from lead contact
        $clientName = $lead->first_name
            ? trim($lead->first_name . ' ' . ($lead->last_name ?? ''))
            : ($lead->company_name ?? 'Valued Client');

        $data = [
            'scenario' => $scenario,
            'insuredObjects' => $scenario->insuredObjects,
            'coverages' => $scenario->coverages,
            'quotes' => $scenario->quotes->sortBy('premium_monthly'),
            'agency' => $agencyData,
            'client_name' => $clientName,
            'agent_name' => $user->name,
        ];

        try {
            $pdf = Pdf::loadView('documents.proposal', $data)
                ->setPaper('letter')
                ->setOptions(['isPhpEnabled' => true, 'isRemoteEnabled' => false]);

            $filename = 'Proposal-' . Str::slug($scenario->scenario_name) . '-' . now()->format('Y-m-d') . '.pdf';

            return $pdf->download($filename);
        } catch (\Throwable $e) {
            \Log::error('Proposal PDF generation failed', [
                'lead_id' => $lead->id,
                'scenario_id' => $scenario->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'PDF generation failed: ' . $e->getMessage()], 500);
        }
    }
}
