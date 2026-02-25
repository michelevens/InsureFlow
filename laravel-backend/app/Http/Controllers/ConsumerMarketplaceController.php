<?php

namespace App\Http\Controllers;

use App\Mail\MarketplaceRequestNotificationMail;
use App\Mail\ScenarioSentMail;
use App\Models\Agency;
use App\Models\Lead;
use App\Models\LeadScenario;
use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ConsumerMarketplaceController extends Controller
{
    /**
     * Public: Consumer submits an insurance request to the marketplace.
     * Auto-matches agents by state/insurance type and creates leads.
     */
    public function submitRequest(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'insurance_type' => 'required|string',
            'zip_code' => 'required|string|max:10',
            'state' => 'required|string|size:2',
            'coverage_level' => 'nullable|in:basic,standard,premium',
            'description' => 'nullable|string|max:2000',
            'details' => 'nullable|array',
            'date_of_birth' => 'nullable|date',
        ]);

        return DB::transaction(function () use ($data, $request) {
            // Create the marketplace quote request
            $quoteRequest = QuoteRequest::create([
                'user_id' => $request->user()?->id,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'insurance_type' => $data['insurance_type'],
                'zip_code' => $data['zip_code'],
                'state' => $data['state'],
                'coverage_level' => $data['coverage_level'] ?? 'standard',
                'description' => $data['description'] ?? null,
                'details' => $data['details'] ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'is_marketplace' => true,
                'expires_at' => now()->addDays(30),
            ]);

            // Find matching agencies: active, in the consumer's state, offering the product
            $matchedAgencies = Agency::where('is_active', true)
                ->where('is_verified', true)
                ->where(function ($q) use ($data) {
                    $q->where('state', $data['state'])
                      ->orWhereHas('agents', function ($aq) use ($data) {
                          $aq->whereHas('agentProfile', function ($pq) use ($data) {
                              $pq->whereJsonContains('license_states', $data['state']);
                          });
                      });
                })
                ->get();

            $leadsCreated = 0;

            foreach ($matchedAgencies as $agency) {
                // Find the primary agent (owner) for this agency
                $agent = $agency->owner;
                if (!$agent) continue;

                // Create a lead for each matched agency
                Lead::create([
                    'agent_id' => $agent->id,
                    'agency_id' => $agency->id,
                    'quote_request_id' => $quoteRequest->id,
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'email' => $data['email'],
                    'phone' => $data['phone'] ?? null,
                    'insurance_type' => $data['insurance_type'],
                    'status' => 'new',
                    'source' => 'marketplace',
                    'notes' => $data['description'] ?? null,
                ]);

                $leadsCreated++;

                // Notify the agency owner
                try {
                    Mail::to($agent->email)->queue(new MarketplaceRequestNotificationMail(
                        agentName: $agent->name,
                        consumerName: $data['first_name'] . ' ' . $data['last_name'],
                        insuranceType: $data['insurance_type'],
                        state: $data['state'],
                    ));
                } catch (\Throwable $e) {
                    // Don't fail the request if email fails
                }
            }

            return response()->json([
                'message' => 'Your insurance request has been submitted.',
                'quote_request_id' => $quoteRequest->id,
                'agents_matched' => $leadsCreated,
            ], 201);
        });
    }

    /**
     * Agent: List open marketplace requests matching their state/products.
     */
    public function listOpenRequests(Request $request)
    {
        $user = $request->user();
        $agencyId = $request->attributes->get('agency_id');

        // Get agent's licensed states
        $states = [];
        if ($user->agentProfile?->license_states) {
            $states = $user->agentProfile->license_states;
        }
        if ($user->ownedAgency?->state) {
            $states[] = $user->ownedAgency->state;
        }
        $states = array_unique($states);

        $query = QuoteRequest::where('is_marketplace', true)
            ->where('status', 'pending')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });

        if (!empty($states)) {
            $query->whereIn('state', $states);
        }

        // Exclude requests that already have a lead for this agency
        if ($agencyId) {
            $query->whereDoesntHave('leads', function ($q) use ($agencyId) {
                $q->where('agency_id', $agencyId);
            });
        }

        $requests = $query->orderByDesc('created_at')->paginate(20);

        return response()->json($requests);
    }

    /**
     * Agent: Claim/unlock a marketplace request (creates a lead for their agency).
     */
    public function unlockRequest(Request $request, QuoteRequest $quoteRequest)
    {
        $user = $request->user();
        $agencyId = $request->attributes->get('agency_id');

        if (!$quoteRequest->is_marketplace) {
            return response()->json(['message' => 'Not a marketplace request'], 422);
        }

        // Check if already claimed
        $existing = Lead::where('quote_request_id', $quoteRequest->id)
            ->where('agency_id', $agencyId)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Already claimed', 'lead_id' => $existing->id], 200);
        }

        // TODO: Deduct credits if credit system is enabled
        // For now, allow free access

        $lead = Lead::create([
            'agent_id' => $user->id,
            'agency_id' => $agencyId,
            'quote_request_id' => $quoteRequest->id,
            'first_name' => $quoteRequest->first_name,
            'last_name' => $quoteRequest->last_name,
            'email' => $quoteRequest->email,
            'phone' => $quoteRequest->phone,
            'insurance_type' => $quoteRequest->insurance_type,
            'status' => 'new',
            'source' => 'marketplace',
            'notes' => $quoteRequest->description,
        ]);

        return response()->json([
            'message' => 'Request unlocked',
            'lead_id' => $lead->id,
        ], 201);
    }

    /**
     * Consumer: Dashboard showing received scenarios/quotes.
     */
    public function consumerDashboard(Request $request)
    {
        $user = $request->user();

        // Quote requests submitted by this consumer
        $quoteRequests = QuoteRequest::where('email', $user->email)
            ->orWhere('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        $qrIds = $quoteRequests->pluck('id');

        // Leads created from those requests
        $leads = Lead::whereIn('quote_request_id', $qrIds)
            ->orWhere('consumer_id', $user->id)
            ->with(['agency:id,name,state,city', 'agent:id,name'])
            ->get();

        // Scenarios sent to consumer
        $leadIds = $leads->pluck('id');
        $scenarios = LeadScenario::whereIn('lead_id', $leadIds)
            ->where('consumer_visible', true)
            ->with(['agent:id,name', 'coverages', 'lead.agency:id,name'])
            ->orderByDesc('sent_to_consumer_at')
            ->get();

        // Applications
        $applications = \App\Models\Application::where('user_id', $user->id)
            ->with(['carrierProduct.carrier:id,name', 'agent:id,name'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'quote_requests' => $quoteRequests,
            'scenarios_received' => $scenarios,
            'applications' => $applications,
            'summary' => [
                'total_requests' => $quoteRequests->count(),
                'total_scenarios' => $scenarios->count(),
                'total_applications' => $applications->count(),
                'agents_responding' => $scenarios->pluck('agent_id')->unique()->count(),
            ],
        ]);
    }

    /**
     * Public: Consumer views a scenario via token link (no auth required).
     */
    public function viewScenario(string $token)
    {
        $scenario = LeadScenario::where('consumer_token', $token)
            ->where('consumer_visible', true)
            ->with(['quotes', 'agent:id,name', 'coverages', 'insuredObjects', 'lead.agency:id,name,city,state'])
            ->firstOrFail();

        // Mark as viewed
        if (!$scenario->consumer_viewed_at) {
            $scenario->update([
                'consumer_viewed_at' => now(),
                'consumer_status' => 'viewed',
            ]);
        }

        return response()->json($scenario);
    }

    /**
     * Public: Consumer responds to a scenario (accept/decline) via token.
     */
    public function respondToScenario(Request $request, string $token)
    {
        $data = $request->validate([
            'action' => 'required|in:accept,decline',
        ]);

        $scenario = LeadScenario::where('consumer_token', $token)
            ->where('consumer_visible', true)
            ->firstOrFail();

        $scenario->update([
            'consumer_status' => $data['action'] === 'accept' ? 'accepted' : 'declined',
        ]);

        if ($data['action'] === 'accept') {
            $scenario->update(['status' => 'selected']);

            // Notify agent
            try {
                $agent = $scenario->agent;
                if ($agent) {
                    Mail::to($agent->email)->queue(new \App\Mail\ScenarioAcceptedMail(
                        agentName: $agent->name,
                        consumerName: $scenario->lead->first_name . ' ' . $scenario->lead->last_name,
                        scenarioName: $scenario->scenario_name,
                    ));
                }
            } catch (\Throwable $e) {
                // Don't fail
            }
        }

        return response()->json([
            'message' => $data['action'] === 'accept'
                ? 'Scenario accepted. Your agent will prepare the application.'
                : 'Scenario declined.',
        ]);
    }

    /**
     * Agent: Send a scenario to the consumer (makes it visible + generates token).
     */
    public function sendToConsumer(Request $request, Lead $lead, LeadScenario $scenario)
    {
        if ($scenario->lead_id !== $lead->id) {
            return response()->json(['message' => 'Scenario does not belong to this lead'], 422);
        }

        $token = $scenario->consumer_token ?: Str::random(64);

        $scenario->update([
            'consumer_visible' => true,
            'consumer_token' => $token,
            'sent_to_consumer_at' => now(),
            'consumer_status' => 'pending',
        ]);

        // Send email to consumer
        $consumerEmail = $lead->email;
        $viewUrl = config('app.frontend_url', 'https://insurons.com') . '/scenarios/' . $token . '/view';

        try {
            Mail::to($consumerEmail)->queue(new ScenarioSentMail(
                consumerName: $lead->first_name,
                agentName: $request->user()->name,
                agencyName: $lead->agency?->name ?? 'Your Agent',
                scenarioName: $scenario->scenario_name,
                viewUrl: $viewUrl,
            ));
        } catch (\Throwable $e) {
            // Don't fail
        }

        return response()->json([
            'message' => 'Scenario sent to consumer',
            'consumer_token' => $token,
            'view_url' => $viewUrl,
        ]);
    }
}
