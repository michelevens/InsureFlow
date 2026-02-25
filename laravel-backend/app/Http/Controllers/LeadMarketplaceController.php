<?php

namespace App\Http\Controllers;

use App\Models\Agency;
use App\Models\InsuranceProfile;
use App\Models\Lead;
use App\Models\LeadEngagementEvent;
use App\Models\LeadMarketplaceBid;
use App\Models\LeadMarketplaceListing;
use App\Models\LeadMarketplaceTransaction;
use App\Services\LeadScoringService;
use App\Services\NotificationService;
use App\Services\RoutingEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Stripe\Checkout\Session as StripeSession;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class LeadMarketplaceController extends Controller
{
    public function __construct(
        private LeadScoringService $scorer,
        private RoutingEngine $router,
        private NotificationService $notifications,
    ) {}

    /**
     * Browse active marketplace listings (buyers).
     */
    public function browse(Request $request)
    {
        $user = $request->user();

        $query = LeadMarketplaceListing::active()
            ->where('seller_agency_id', '!=', $user->agency_id) // can't buy own listings
            ->with('sellerAgency:id,name');

        // Filters
        if ($type = $request->query('insurance_type')) {
            $query->forType($type);
        }
        if ($state = $request->query('state')) {
            $query->inState($state);
        }
        if ($grade = $request->query('grade')) {
            $query->where('lead_grade', strtoupper($grade));
        }
        if ($maxPrice = $request->query('max_price')) {
            $query->where('asking_price', '<=', $maxPrice);
        }
        if ($minScore = $request->query('min_score')) {
            $query->where('lead_score', '>=', $minScore);
        }

        // Sort
        $sort = $request->query('sort', 'newest');
        $query = match ($sort) {
            'price_asc' => $query->orderBy('asking_price'),
            'price_desc' => $query->orderByDesc('asking_price'),
            'score_desc' => $query->orderByDesc('lead_score'),
            'oldest' => $query->orderBy('created_at'),
            default => $query->orderByDesc('created_at'), // newest
        };

        $listings = $query->paginate(20);

        return response()->json($listings);
    }

    /**
     * View a single listing detail (anonymized info for buyers).
     */
    public function show(LeadMarketplaceListing $listing)
    {
        if ($listing->status !== 'active') {
            return response()->json(['message' => 'This listing is no longer available'], 404);
        }

        return response()->json([
            'listing' => $listing->only([
                'id', 'insurance_type', 'state', 'zip_prefix', 'coverage_level', 'urgency',
                'asking_price', 'lead_score', 'lead_grade',
                'has_phone', 'has_email', 'days_old', 'seller_notes', 'created_at', 'expires_at',
            ]),
            'seller' => [
                'agency_name' => $listing->sellerAgency?->name,
            ],
        ]);
    }

    /**
     * Purchase a listing — reveals lead info, creates new profile+lead for buyer.
     * If Stripe is configured, returns 402 requiring payment first.
     * If Stripe is NOT configured, falls back to direct purchase (completePurchase).
     */
    public function purchase(Request $request, LeadMarketplaceListing $listing)
    {
        $user = $request->user();

        if ($listing->status !== 'active') {
            return response()->json(['message' => 'This listing is no longer available'], 410);
        }

        if ($listing->seller_agency_id === $user->agency_id) {
            return response()->json(['message' => 'You cannot purchase your own listing'], 422);
        }

        // Check expiry
        if ($listing->expires_at && $listing->expires_at->isPast()) {
            $listing->update(['status' => 'expired']);
            return response()->json(['message' => 'This listing has expired'], 410);
        }

        // If Stripe is configured, require payment first
        if (config('services.stripe.secret')) {
            return response()->json([
                'message' => 'Payment required. Use /checkout or /pay-intent endpoint.',
                'requires_payment' => true,
                'listing_id' => $listing->id,
                'amount' => $listing->asking_price,
            ], 402);
        }

        // Stripe not configured — fall back to direct purchase
        return $this->completePurchase($listing, $user);
    }

    /**
     * Create a Stripe Checkout session for purchasing a lead listing.
     */
    public function createCheckoutForLead(Request $request, LeadMarketplaceListing $listing)
    {
        $user = $request->user();

        if ($listing->status !== 'active') {
            return response()->json(['message' => 'This listing is no longer available'], 410);
        }
        if ($listing->seller_agency_id === $user->agency_id) {
            return response()->json(['message' => 'You cannot purchase your own listing'], 422);
        }
        if ($listing->expires_at && $listing->expires_at->isPast()) {
            $listing->update(['status' => 'expired']);
            return response()->json(['message' => 'This listing has expired'], 410);
        }

        $stripeSecret = config('services.stripe.secret');
        if (!$stripeSecret) {
            // Stripe not configured — fall back to direct purchase
            return $this->completePurchase($listing, $user);
        }

        Stripe::setApiKey($stripeSecret);

        $purchasePrice = $listing->asking_price;
        $platformFeePct = $listing->platform_fee_pct ?? config('marketplace.platform_fee_pct', 10);
        $platformFee = round($purchasePrice * ($platformFeePct / 100), 2);
        $sellerPayout = round($purchasePrice - $platformFee, 2);

        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://insurons.com')), '/');

        try {
            $session = StripeSession::create([
                'payment_method_types' => ['card'],
                'mode' => 'payment',
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'usd',
                        'unit_amount' => (int) round($purchasePrice * 100), // cents
                        'product_data' => [
                            'name' => "Lead Purchase — {$listing->insurance_type} ({$listing->state})",
                            'description' => "Marketplace lead #{$listing->id}, Grade {$listing->lead_grade}",
                        ],
                    ],
                    'quantity' => 1,
                ]],
                'customer_email' => $user->email,
                'metadata' => [
                    'type' => 'marketplace_lead_purchase',
                    'listing_id' => $listing->id,
                    'buyer_id' => $user->id,
                    'seller_agency_id' => $listing->seller_agency_id,
                    'lead_id' => $listing->lead_id,
                ],
                'success_url' => "{$frontendUrl}/lead-marketplace?purchased=true",
                'cancel_url' => "{$frontendUrl}/lead-marketplace?canceled=true",
            ]);

            // Create pending transaction record
            $transaction = LeadMarketplaceTransaction::create([
                'listing_id' => $listing->id,
                'buyer_agency_id' => $user->agency_id,
                'buyer_user_id' => $user->id,
                'seller_agency_id' => $listing->seller_agency_id,
                'purchase_price' => $purchasePrice,
                'platform_fee' => $platformFee,
                'seller_payout' => $sellerPayout,
                'stripe_checkout_session_id' => $session->id,
                'payment_status' => 'pending',
                'platform_fee_amount' => $platformFee,
                'seller_payout_amount' => $sellerPayout,
            ]);

            return response()->json([
                'checkout_url' => $session->url,
                'session_id' => $session->id,
                'transaction_id' => $transaction->id,
            ]);
        } catch (\Exception $e) {
            \Log::error('Stripe checkout creation failed', ['error' => $e->getMessage(), 'listing_id' => $listing->id]);
            return response()->json(['error' => 'Failed to create checkout session'], 503);
        }
    }

    /**
     * Create a Stripe PaymentIntent for in-app payment of a lead listing.
     */
    public function createPaymentIntent(Request $request, LeadMarketplaceListing $listing)
    {
        $user = $request->user();

        if ($listing->status !== 'active') {
            return response()->json(['message' => 'This listing is no longer available'], 410);
        }
        if ($listing->seller_agency_id === $user->agency_id) {
            return response()->json(['message' => 'You cannot purchase your own listing'], 422);
        }
        if ($listing->expires_at && $listing->expires_at->isPast()) {
            $listing->update(['status' => 'expired']);
            return response()->json(['message' => 'This listing has expired'], 410);
        }

        $stripeSecret = config('services.stripe.secret');
        if (!$stripeSecret) {
            return response()->json(['error' => 'Payment system not configured'], 503);
        }

        Stripe::setApiKey($stripeSecret);

        $purchasePrice = $listing->asking_price;
        $platformFeePct = $listing->platform_fee_pct ?? config('marketplace.platform_fee_pct', 10);
        $platformFee = round($purchasePrice * ($platformFeePct / 100), 2);
        $sellerPayout = round($purchasePrice - $platformFee, 2);

        try {
            $paymentIntent = PaymentIntent::create([
                'amount' => (int) round($purchasePrice * 100), // cents
                'currency' => 'usd',
                'metadata' => [
                    'type' => 'marketplace_lead_purchase',
                    'listing_id' => $listing->id,
                    'buyer_id' => $user->id,
                    'seller_agency_id' => $listing->seller_agency_id,
                    'lead_id' => $listing->lead_id,
                ],
            ]);

            // Create pending transaction record
            $transaction = LeadMarketplaceTransaction::create([
                'listing_id' => $listing->id,
                'buyer_agency_id' => $user->agency_id,
                'buyer_user_id' => $user->id,
                'seller_agency_id' => $listing->seller_agency_id,
                'purchase_price' => $purchasePrice,
                'platform_fee' => $platformFee,
                'seller_payout' => $sellerPayout,
                'stripe_payment_intent_id' => $paymentIntent->id,
                'payment_status' => 'pending',
                'platform_fee_amount' => $platformFee,
                'seller_payout_amount' => $sellerPayout,
            ]);

            return response()->json([
                'client_secret' => $paymentIntent->client_secret,
                'payment_intent_id' => $paymentIntent->id,
                'transaction_id' => $transaction->id,
            ]);
        } catch (\Exception $e) {
            \Log::error('Stripe PaymentIntent creation failed', ['error' => $e->getMessage(), 'listing_id' => $listing->id]);
            return response()->json(['error' => 'Failed to create payment intent'], 503);
        }
    }

    /**
     * Complete a lead purchase — transfer lead data to buyer, create profile+lead, mark listing sold.
     * Extracted from the original purchase() logic. Can be called directly (no Stripe)
     * or after Stripe webhook confirms payment.
     */
    public function completePurchase(LeadMarketplaceListing $listing, $user, ?LeadMarketplaceTransaction $existingTx = null)
    {
        return DB::transaction(function () use ($listing, $user, $existingTx) {
            // Lock the listing row to prevent double-purchase
            $listing = LeadMarketplaceListing::lockForUpdate()->find($listing->id);
            if ($listing->status !== 'active') {
                return response()->json(['message' => 'This listing was just purchased by someone else'], 409);
            }

            // Calculate fees
            $purchasePrice = $listing->asking_price;
            $platformFeePct = $listing->platform_fee_pct ?? config('marketplace.platform_fee_pct', 10);
            $platformFee = round($purchasePrice * ($platformFeePct / 100), 2);
            $sellerPayout = round($purchasePrice - $platformFee, 2);

            // Get original profile data
            $originalProfile = $listing->insuranceProfile;
            if (!$originalProfile) {
                return response()->json(['message' => 'Source profile no longer exists'], 410);
            }

            // Create new InsuranceProfile for buyer's agency
            $newProfile = InsuranceProfile::create([
                'agency_id' => $user->agency_id,
                'first_name' => $originalProfile->first_name,
                'last_name' => $originalProfile->last_name,
                'email' => $originalProfile->email,
                'phone' => $originalProfile->phone,
                'zip_code' => $originalProfile->zip_code,
                'date_of_birth' => $originalProfile->date_of_birth,
                'insurance_type' => $originalProfile->insurance_type,
                'coverage_level' => $originalProfile->coverage_level,
                'current_stage' => 'lead',
                'source' => 'marketplace',
                'details' => $originalProfile->details,
                'notes' => "Purchased from lead marketplace (listing #{$listing->id})",
                'status' => 'active',
            ]);

            // Create Lead for buyer
            $newLead = Lead::create([
                'agency_id' => $user->agency_id,
                'first_name' => $originalProfile->first_name,
                'last_name' => $originalProfile->last_name,
                'email' => $originalProfile->email,
                'phone' => $originalProfile->phone,
                'insurance_type' => $originalProfile->insurance_type,
                'source' => 'marketplace',
                'status' => 'new',
                'estimated_value' => $originalProfile->estimated_value,
                'notes' => "Marketplace purchase — listing #{$listing->id}",
            ]);

            $newProfile->update(['lead_id' => $newLead->id]);

            // Route the new lead through buyer's routing rules
            $this->router->route($newProfile);
            $newLead->update(['agent_id' => $newProfile->fresh()->assigned_agent_id]);

            // Score the new lead
            try {
                $this->scorer->score($newProfile);
            } catch (\Throwable $e) {
                \Log::warning('Failed to score marketplace lead', ['profile_id' => $newProfile->id, 'error' => $e->getMessage()]);
            }

            // Create or update transaction record
            if ($existingTx) {
                $existingTx->update([
                    'purchase_price' => $purchasePrice,
                    'platform_fee' => $platformFee,
                    'seller_payout' => $sellerPayout,
                    'new_profile_id' => $newProfile->id,
                    'new_lead_id' => $newLead->id,
                    'payment_status' => 'completed',
                    'platform_fee_amount' => $platformFee,
                    'seller_payout_amount' => $sellerPayout,
                    'paid_at' => now(),
                ]);
                $transaction = $existingTx;
            } else {
                $transaction = LeadMarketplaceTransaction::create([
                    'listing_id' => $listing->id,
                    'buyer_agency_id' => $user->agency_id,
                    'buyer_user_id' => $user->id,
                    'seller_agency_id' => $listing->seller_agency_id,
                    'purchase_price' => $purchasePrice,
                    'platform_fee' => $platformFee,
                    'seller_payout' => $sellerPayout,
                    'new_profile_id' => $newProfile->id,
                    'new_lead_id' => $newLead->id,
                    'payment_status' => 'completed',
                    'platform_fee_amount' => $platformFee,
                    'seller_payout_amount' => $sellerPayout,
                    'paid_at' => now(),
                ]);
            }

            // Mark listing as sold
            $listing->update([
                'status' => 'sold',
                'sold_at' => now(),
                'platform_fee' => $platformFee,
            ]);

            // Track engagement on original profile
            LeadEngagementEvent::create([
                'insurance_profile_id' => $originalProfile->id,
                'event_type' => 'marketplace_sold',
                'metadata' => [
                    'buyer_agency_id' => $user->agency_id,
                    'purchase_price' => $purchasePrice,
                    'listing_id' => $listing->id,
                ],
                'created_at' => now(),
            ]);

            // Notify seller agency owner
            $sellerOwner = $listing->sellerAgency?->owner;
            if ($sellerOwner) {
                $this->notifications->send(
                    $sellerOwner->id, 'marketplace_sale',
                    'Lead Sold!',
                    "Your lead listing was purchased for \${$purchasePrice}. Payout: \${$sellerPayout}",
                    'dollar-sign', '/lead-marketplace/my-listings',
                    ['listing_id' => $listing->id, 'transaction_id' => $transaction->id],
                );
            }

            return response()->json([
                'message' => 'Lead purchased successfully',
                'transaction_id' => $transaction->id,
                'lead' => [
                    'id' => $newLead->id,
                    'profile_id' => $newProfile->id,
                    'first_name' => $newProfile->first_name,
                    'last_name' => $newProfile->last_name,
                    'email' => $newProfile->email,
                    'phone' => $newProfile->phone,
                    'insurance_type' => $newProfile->insurance_type,
                ],
                'cost' => [
                    'purchase_price' => $purchasePrice,
                    'platform_fee' => $platformFee,
                ],
            ], 201);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // SELLER endpoints
    // ═══════════════════════════════════════════════════════════════

    /**
     * List my agency's marketplace listings.
     */
    public function myListings(Request $request)
    {
        $user = $request->user();

        $listings = LeadMarketplaceListing::where('seller_agency_id', $user->agency_id)
            ->with('transaction:id,listing_id,buyer_agency_id,purchase_price,platform_fee,seller_payout,created_at')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($listings);
    }

    /**
     * Create a new listing from an existing insurance profile.
     */
    public function createListing(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'insurance_profile_id' => 'nullable|integer|required_without:lead_id',
            'lead_id' => 'nullable|integer|required_without:insurance_profile_id',
            'asking_price' => 'required|numeric|min:1|max:9999.99',
            'seller_notes' => 'nullable|string|max:500',
            'expires_in_days' => 'nullable|integer|min:1|max:90',
        ]);

        // Resolve profile from either insurance_profile_id or lead_id
        if (!empty($data['insurance_profile_id'])) {
            $profile = InsuranceProfile::where('id', $data['insurance_profile_id'])
                ->where('agency_id', $user->agency_id)
                ->where('status', 'active')
                ->first();
        } else {
            $lead = Lead::where('id', $data['lead_id'])
                ->where('agency_id', $user->agency_id)
                ->first();

            if (!$lead) {
                return response()->json(['message' => 'Lead not found or not in your agency'], 404);
            }

            $profile = InsuranceProfile::where('lead_id', $lead->id)
                ->where('agency_id', $user->agency_id)
                ->where('status', 'active')
                ->first();

            // Auto-create a profile from the lead if none exists
            if (!$profile) {
                $profile = InsuranceProfile::create([
                    'agency_id' => $user->agency_id,
                    'first_name' => $lead->first_name,
                    'last_name' => $lead->last_name,
                    'email' => $lead->email,
                    'phone' => $lead->phone,
                    'insurance_type' => $lead->insurance_type,
                    'coverage_level' => 'standard',
                    'current_stage' => 'lead',
                    'lead_id' => $lead->id,
                    'source' => $lead->source ?? 'crm',
                    'status' => 'active',
                ]);
            }
        }

        if (!$profile) {
            return response()->json(['message' => 'Profile not found or not eligible'], 404);
        }

        // Only allow selling leads the agency acquired through own effort
        // (intake_link, calculator, crm, referral, etc.) — NOT marketplace-purchased leads
        if ($profile->source === 'marketplace') {
            return response()->json(['message' => 'Marketplace-purchased leads cannot be re-listed for sale'], 422);
        }

        // Check if already listed
        $existing = LeadMarketplaceListing::where('insurance_profile_id', $profile->id)
            ->where('status', 'active')
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'This profile already has an active listing'], 422);
        }

        // Get lead score
        $leadScore = $profile->leadScore?->score;

        $listing = LeadMarketplaceListing::create([
            'seller_agency_id' => $user->agency_id,
            'insurance_profile_id' => $profile->id,
            'lead_id' => $profile->lead_id,
            'insurance_type' => $profile->insurance_type,
            'state' => $profile->zip_code ? $this->stateFromZip($profile->zip_code) : null,
            'zip_prefix' => $profile->zip_code ? substr($profile->zip_code, 0, 3) : null,
            'coverage_level' => $profile->coverage_level,
            'urgency' => $profile->details['urgency'] ?? null,
            'asking_price' => $data['asking_price'],
            'lead_score' => $leadScore,
            'lead_grade' => $this->gradeFromScore($leadScore),
            'has_phone' => !empty($profile->phone),
            'has_email' => !empty($profile->email),
            'days_old' => $profile->created_at ? (int) now()->diffInDays($profile->created_at) : 0,
            'seller_notes' => $data['seller_notes'] ?? null,
            'expires_at' => isset($data['expires_in_days']) ? now()->addDays($data['expires_in_days']) : now()->addDays(30),
        ]);

        // Track engagement
        LeadEngagementEvent::create([
            'insurance_profile_id' => $profile->id,
            'event_type' => 'marketplace_listed',
            'metadata' => ['listing_id' => $listing->id, 'asking_price' => $data['asking_price']],
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Lead listed on marketplace',
            'listing' => $listing,
        ], 201);
    }

    /**
     * Withdraw a listing.
     */
    public function withdraw(Request $request, LeadMarketplaceListing $listing)
    {
        $user = $request->user();

        if ($listing->seller_agency_id !== $user->agency_id) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        if ($listing->status !== 'active') {
            return response()->json(['message' => 'Listing is not active'], 422);
        }

        $listing->update(['status' => 'withdrawn']);

        return response()->json(['message' => 'Listing withdrawn']);
    }

    /**
     * Get marketplace stats for dashboard.
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        $agencyId = $user->agency_id;

        $activeListings = LeadMarketplaceListing::where('seller_agency_id', $agencyId)
            ->where('status', 'active')->count();

        $totalSold = LeadMarketplaceTransaction::where('seller_agency_id', $agencyId)->count();
        $totalRevenue = LeadMarketplaceTransaction::where('seller_agency_id', $agencyId)
            ->sum('seller_payout');

        $totalPurchased = LeadMarketplaceTransaction::where('buyer_agency_id', $agencyId)->count();
        $totalSpent = LeadMarketplaceTransaction::where('buyer_agency_id', $agencyId)
            ->sum('purchase_price');

        $marketplaceActive = LeadMarketplaceListing::active()->count();

        return response()->json([
            'seller' => [
                'active_listings' => $activeListings,
                'total_sold' => $totalSold,
                'total_revenue' => round($totalRevenue, 2),
            ],
            'buyer' => [
                'total_purchased' => $totalPurchased,
                'total_spent' => round($totalSpent, 2),
            ],
            'marketplace' => [
                'total_active_listings' => $marketplaceActive,
            ],
        ]);
    }

    /**
     * Get my transaction history (buys + sells).
     */
    public function transactions(Request $request)
    {
        $user = $request->user();
        $agencyId = $user->agency_id;
        $type = $request->query('type', 'all'); // 'bought', 'sold', 'all'

        $query = LeadMarketplaceTransaction::with('listing:id,insurance_type,state,lead_grade');

        if ($type === 'bought') {
            $query->where('buyer_agency_id', $agencyId);
        } elseif ($type === 'sold') {
            $query->where('seller_agency_id', $agencyId);
        } else {
            $query->where(function ($q) use ($agencyId) {
                $q->where('buyer_agency_id', $agencyId)
                  ->orWhere('seller_agency_id', $agencyId);
            });
        }

        $transactions = $query->orderByDesc('created_at')->paginate(20);

        // Add direction flag
        $transactions->getCollection()->transform(function ($tx) use ($agencyId) {
            $tx->direction = $tx->buyer_agency_id === $agencyId ? 'bought' : 'sold';
            return $tx;
        });

        return response()->json($transactions);
    }

    // ═══════════════════════════════════════════════════════════════
    // AUCTION / BIDDING
    // ═══════════════════════════════════════════════════════════════

    /**
     * Place a bid on an auction-type listing.
     */
    public function placeBid(Request $request, LeadMarketplaceListing $listing)
    {
        $user = $request->user();

        // Validate listing is an auction and still active
        if ($listing->listing_type !== 'auction' || $listing->status !== 'active') {
            return response()->json(['message' => 'This listing is not available for bidding'], 422);
        }
        if ($listing->auction_ends_at && $listing->auction_ends_at->isPast()) {
            return response()->json(['message' => 'Auction has ended'], 422);
        }
        // Can't bid on own listing
        if ($listing->seller_agency_id === ($user->agency_id ?? 0)) {
            return response()->json(['message' => 'Cannot bid on your own listing'], 422);
        }

        $data = $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        // Must be higher than current bid and min_bid
        $minRequired = max($listing->min_bid ?? 0, ($listing->current_bid ?? 0) + 0.50);
        if ($data['amount'] < $minRequired) {
            return response()->json(['message' => "Bid must be at least \${$minRequired}"], 422);
        }

        DB::transaction(function () use ($listing, $user, $data) {
            // Mark previous winning bid as not winning
            LeadMarketplaceBid::where('listing_id', $listing->id)
                ->where('is_winning', true)
                ->update(['is_winning' => false]);

            // Create new bid
            LeadMarketplaceBid::create([
                'listing_id' => $listing->id,
                'bidder_id' => $user->id,
                'amount' => $data['amount'],
                'is_winning' => true,
            ]);

            $listing->update([
                'current_bid' => $data['amount'],
                'current_bidder_id' => $user->id,
                'bid_count' => $listing->bid_count + 1,
            ]);
        });

        return response()->json([
            'message' => 'Bid placed successfully',
            'current_bid' => $data['amount'],
            'bid_count' => $listing->fresh()->bid_count,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // SUGGESTED PRICING
    // ═══════════════════════════════════════════════════════════════

    /**
     * Get suggested price based on historical transaction data.
     */
    public function suggestPrice(Request $request)
    {
        $data = $request->validate([
            'insurance_type' => 'required|string',
            'state' => 'nullable|string',
            'lead_score' => 'nullable|integer',
        ]);

        // Calculate suggested price based on historical transaction data
        $query = LeadMarketplaceTransaction::query()
            ->join('lead_marketplace_listings', 'lead_marketplace_listings.id', '=', 'lead_marketplace_transactions.listing_id');

        if (!empty($data['insurance_type'])) {
            $query->where('lead_marketplace_listings.insurance_type', $data['insurance_type']);
        }

        $avgPrice = (clone $query)->avg('lead_marketplace_transactions.purchase_price') ?? 15.00;
        $medianPrice = $avgPrice; // Simplified
        $recentCount = (clone $query)->where('lead_marketplace_transactions.created_at', '>', now()->subDays(30))->count();

        // Adjust by lead score
        $score = $data['lead_score'] ?? 50;
        $scoreMultiplier = 0.5 + ($score / 100); // 50 score = 1.0x, 100 score = 1.5x, 0 score = 0.5x
        $suggested = round($avgPrice * $scoreMultiplier, 2);
        $suggested = max(5.00, min(500.00, $suggested)); // Clamp

        return response()->json([
            'suggested_price' => $suggested,
            'avg_market_price' => round((float) $avgPrice, 2),
            'recent_transactions' => $recentCount,
            'price_range' => [
                'low' => round($suggested * 0.7, 2),
                'high' => round($suggested * 1.3, 2),
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // BULK LISTING
    // ═══════════════════════════════════════════════════════════════

    /**
     * List multiple leads at once on the marketplace.
     */
    public function bulkList(Request $request)
    {
        $user = $request->user();
        $agency = $user->ownedAgency ?? $user->agency;
        if (!$agency) {
            return response()->json(['message' => 'No agency found'], 404);
        }

        $data = $request->validate([
            'lead_ids' => 'required|array|min:1|max:50',
            'lead_ids.*' => 'integer|exists:leads,id',
            'asking_price' => 'required|numeric|min:1|max:9999',
            'listing_type' => 'sometimes|in:fixed_price,auction',
            'min_bid' => 'nullable|numeric|min:1',
            'duration_days' => 'sometimes|integer|in:7,14,30,60,90',
            'seller_notes' => 'nullable|string|max:500',
        ]);

        $created = 0;
        $skipped = 0;
        $errors = [];

        foreach ($data['lead_ids'] as $leadId) {
            $lead = Lead::find($leadId);
            if (!$lead || $lead->agency_id !== $agency->id) {
                $skipped++;
                $errors[] = "Lead #{$leadId}: not found or not yours";
                continue;
            }
            // Can't sell marketplace-purchased leads
            if ($lead->source === 'marketplace') {
                $skipped++;
                $errors[] = "Lead #{$leadId}: marketplace-purchased leads cannot be re-listed";
                continue;
            }
            // Check if already listed
            $profile = $lead->insuranceProfile;
            if (!$profile) {
                $skipped++;
                $errors[] = "Lead #{$leadId}: no insurance profile found";
                continue;
            }

            $existing = LeadMarketplaceListing::where('insurance_profile_id', $profile->id)
                ->where('status', 'active')->exists();
            if ($existing) {
                $skipped++;
                $errors[] = "Lead #{$leadId}: already listed";
                continue;
            }

            $durationDays = $data['duration_days'] ?? 30;
            $listingType = $data['listing_type'] ?? 'fixed_price';
            $leadScore = $profile->leadScore?->score ?? 0;

            LeadMarketplaceListing::create([
                'insurance_profile_id' => $profile->id,
                'seller_agency_id' => $agency->id,
                'lead_id' => $lead->id,
                'insurance_type' => $lead->insurance_type ?? $profile->insurance_type ?? 'general',
                'state' => $profile->zip_code ? $this->stateFromZip($profile->zip_code) : null,
                'zip_prefix' => $profile->zip_code ? substr($profile->zip_code, 0, 3) : null,
                'lead_score' => $leadScore,
                'lead_grade' => $this->gradeFromScore($leadScore),
                'has_phone' => !empty($profile->phone),
                'has_email' => !empty($profile->email),
                'days_old' => $profile->created_at ? (int) now()->diffInDays($profile->created_at) : 0,
                'asking_price' => $data['asking_price'],
                'listing_type' => $listingType,
                'min_bid' => $data['min_bid'] ?? null,
                'auction_ends_at' => $listingType === 'auction'
                    ? now()->addDays($durationDays) : null,
                'expires_at' => now()->addDays($durationDays),
                'seller_notes' => $data['seller_notes'] ?? null,
                'status' => 'active',
            ]);
            $created++;
        }

        return response()->json([
            'message' => "{$created} leads listed, {$skipped} skipped",
            'created' => $created,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════

    private function gradeFromScore(?int $score): string
    {
        if ($score === null) return 'C';
        if ($score >= 80) return 'A';
        if ($score >= 60) return 'B';
        if ($score >= 40) return 'C';
        if ($score >= 20) return 'D';
        return 'F';
    }

    /**
     * Simple ZIP → state mapping (first 3 digits). Returns null if unknown.
     */
    private function stateFromZip(?string $zip): ?string
    {
        if (!$zip || strlen($zip) < 3) return null;
        $prefix = (int) substr($zip, 0, 3);

        // Simplified mapping of 3-digit ZIP prefixes to states
        return match (true) {
            $prefix >= 100 && $prefix <= 149 => 'NY',
            $prefix >= 150 && $prefix <= 196 => 'PA',
            $prefix >= 200 && $prefix <= 205 => 'DC',
            $prefix >= 206 && $prefix <= 246 => 'VA',
            $prefix >= 247 && $prefix <= 268 => 'NC',
            $prefix >= 270 && $prefix <= 289 => 'NC',
            $prefix >= 290 && $prefix <= 299 => 'SC',
            $prefix >= 300 && $prefix <= 319 => 'GA',
            $prefix >= 320 && $prefix <= 349 => 'FL',
            $prefix >= 350 && $prefix <= 369 => 'AL',
            $prefix >= 370 && $prefix <= 385 => 'TN',
            $prefix >= 386 && $prefix <= 397 => 'MS',
            $prefix >= 400 && $prefix <= 427 => 'KY',
            $prefix >= 430 && $prefix <= 458 => 'OH',
            $prefix >= 460 && $prefix <= 479 => 'IN',
            $prefix >= 480 && $prefix <= 499 => 'MI',
            $prefix >= 500 && $prefix <= 528 => 'IA',
            $prefix >= 530 && $prefix <= 549 => 'WI',
            $prefix >= 550 && $prefix <= 567 => 'MN',
            $prefix >= 570 && $prefix <= 577 => 'SD',
            $prefix >= 580 && $prefix <= 588 => 'ND',
            $prefix >= 590 && $prefix <= 599 => 'MT',
            $prefix >= 600 && $prefix <= 629 => 'IL',
            $prefix >= 630 && $prefix <= 658 => 'MO',
            $prefix >= 660 && $prefix <= 679 => 'KS',
            $prefix >= 680 && $prefix <= 693 => 'NE',
            $prefix >= 700 && $prefix <= 714 => 'LA',
            $prefix >= 716 && $prefix <= 729 => 'AR',
            $prefix >= 730 && $prefix <= 749 => 'OK',
            $prefix >= 750 && $prefix <= 799 => 'TX',
            $prefix >= 800 && $prefix <= 816 => 'CO',
            $prefix >= 820 && $prefix <= 831 => 'WY',
            $prefix >= 832 && $prefix <= 838 => 'ID',
            $prefix >= 840 && $prefix <= 847 => 'UT',
            $prefix >= 850 && $prefix <= 865 => 'AZ',
            $prefix >= 870 && $prefix <= 884 => 'NM',
            $prefix >= 889 && $prefix <= 898 => 'NV',
            $prefix >= 900 && $prefix <= 961 => 'CA',
            $prefix >= 970 && $prefix <= 979 => 'OR',
            $prefix >= 980 && $prefix <= 994 => 'WA',
            default => null,
        };
    }
}
