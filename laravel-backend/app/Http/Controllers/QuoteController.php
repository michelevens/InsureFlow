<?php

namespace App\Http\Controllers;

use App\Mail\QuoteReceivedMail;
use App\Models\CarrierProduct;
use App\Models\InsuranceProfile;
use App\Models\Lead;
use App\Models\Quote;
use App\Models\QuoteRequest;
use App\Services\RoutingEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class QuoteController extends Controller
{
    public function __construct(
        private RoutingEngine $router,
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

        // Get matching carrier products
        $products = CarrierProduct::where('insurance_type', $data['insurance_type'])
            ->where('is_active', true)
            ->with('carrier')
            ->get();

        $quotes = [];
        $coverageMultiplier = match ($data['coverage_level'] ?? 'standard') {
            'basic' => 0.8,
            'premium' => 1.3,
            default => 1.0,
        };

        foreach ($products as $i => $product) {
            $basePremium = ($product->min_premium + $product->max_premium) / 2;
            $monthly = round($basePremium * $coverageMultiplier + rand(-20, 20), 2);

            $quote = Quote::create([
                'quote_request_id' => $quoteRequest->id,
                'carrier_product_id' => $product->id,
                'carrier_name' => $product->carrier?->name ?? $product->name,
                'monthly_premium' => $monthly,
                'annual_premium' => round($monthly * 11.5, 2),
                'deductible' => $product->deductible_options[0] ?? 500,
                'coverage_limit' => $product->coverage_options[0] ?? '$100,000',
                'features' => $product->features,
                'is_recommended' => $i === 0,
                'expires_at' => now()->addDays(30),
            ]);

            $quote->load('carrierProduct.carrier');
            $quotes[] = $quote;
        }

        // Create UIP at intake stage
        $profile = InsuranceProfile::findOrCreateFromQuote($quoteRequest, $agencyId);
        if (!empty($quotes)) {
            $lowestQuote = collect($quotes)->sortBy('monthly_premium')->first();
            $profile->advanceTo('quoted', [
                'monthly_premium' => $lowestQuote->monthly_premium,
                'annual_premium' => $lowestQuote->annual_premium,
            ]);
        }

        return response()->json([
            'quote_request_id' => $quoteRequest->id,
            'profile_id' => $profile->id,
            'quotes' => $quotes,
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
}
