<?php

namespace App\Http\Controllers;

use App\Mail\EmbedLeadConvertedMail;
use App\Mail\EmbedQuoteStartedMail;
use App\Mail\InvitationMail;
use App\Models\Agency;
use App\Models\EmbedPartner;
use App\Models\EmbedSession;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class EmbedController extends Controller
{
    // --- Admin / Partner management (authenticated) ---

    public function index(Request $request): JsonResponse
    {
        $partners = EmbedPartner::withCount('sessions')
            ->withCount(['sessions as converted_count' => fn($q) => $q->whereNotNull('converted_at')])
            ->get();

        return response()->json($partners);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'allowed_domains' => 'nullable|array',
            'allowed_domains.*' => 'string|max:255',
            'commission_share_percent' => 'nullable|numeric|min:0|max:100',
            'contact_email' => 'nullable|email|max:255',
            'contact_name' => 'nullable|string|max:255',
            'widget_config' => 'nullable|array',
            'webhook_url' => 'nullable|url|max:500',
        ]);

        // Auto-generate webhook secret if webhook_url is provided
        if (!empty($data['webhook_url'])) {
            $data['webhook_secret'] = Str::random(64);
        }

        $partner = EmbedPartner::create($data);

        // Return with api_key and webhook_secret visible (only on creation)
        return response()->json([
            ...$partner->toArray(),
            'api_key' => $partner->api_key,
            'webhook_secret' => $partner->webhook_secret,
        ], 201);
    }

    public function show(EmbedPartner $partner): JsonResponse
    {
        $partner->loadCount('sessions');
        $partner->loadCount(['sessions as converted_count' => fn($q) => $q->whereNotNull('converted_at')]);

        return response()->json($partner);
    }

    public function update(Request $request, EmbedPartner $partner): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'allowed_domains' => 'nullable|array',
            'commission_share_percent' => 'nullable|numeric|min:0|max:100',
            'contact_email' => 'nullable|email|max:255',
            'contact_name' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
            'widget_config' => 'nullable|array',
            'webhook_url' => 'nullable|url|max:500',
        ]);

        // Generate new secret if webhook_url changed and partner doesn't have one
        if (!empty($data['webhook_url']) && !$partner->webhook_secret) {
            $data['webhook_secret'] = Str::random(64);
        }

        $partner->update($data);
        return response()->json($partner);
    }

    public function destroy(EmbedPartner $partner): JsonResponse
    {
        $partner->delete();
        return response()->json(['message' => 'Partner removed']);
    }

    public function regenerateKey(EmbedPartner $partner): JsonResponse
    {
        $partner->update(['api_key' => 'emb_' . Str::random(48)]);

        return response()->json(['api_key' => $partner->api_key]);
    }

    public function sessions(EmbedPartner $partner, Request $request): JsonResponse
    {
        $sessions = $partner->sessions()
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        return response()->json($sessions);
    }

    public function analytics(EmbedPartner $partner): JsonResponse
    {
        $total = $partner->sessions()->count();
        $converted = $partner->sessions()->whereNotNull('converted_at')->count();
        $byDomain = $partner->sessions()
            ->selectRaw('source_domain, COUNT(*) as total, SUM(CASE WHEN converted_at IS NOT NULL THEN 1 ELSE 0 END) as conversions')
            ->groupBy('source_domain')
            ->get();

        return response()->json([
            'total_sessions' => $total,
            'conversions' => $converted,
            'conversion_rate' => $total > 0 ? round(($converted / $total) * 100, 1) : 0,
            'by_domain' => $byDomain,
        ]);
    }

    // --- Public embed endpoints (API key auth) ---

    public function config(string $apiKey): JsonResponse
    {
        $partner = EmbedPartner::where('api_key', $apiKey)->where('is_active', true)->first();
        if (!$partner) {
            return response()->json(['error' => 'Invalid or inactive API key'], 403);
        }

        return response()->json([
            'partner_name' => $partner->name,
            'widget_config' => $partner->widget_config,
        ]);
    }

    public function quote(Request $request): JsonResponse
    {
        $apiKey = $request->header('X-Embed-Key') ?? $request->input('api_key');
        $partner = EmbedPartner::where('api_key', $apiKey)->where('is_active', true)->first();

        if (!$partner) {
            return response()->json(['error' => 'Invalid or inactive API key'], 403);
        }

        // Validate origin domain
        $origin = $request->header('Origin');
        if ($partner->allowed_domains && $origin) {
            $originHost = parse_url($origin, PHP_URL_HOST);
            if (!in_array($originHost, $partner->allowed_domains)) {
                return response()->json(['error' => 'Domain not allowed'], 403);
            }
        }

        // Create session
        $session = EmbedSession::create([
            'embed_partner_id' => $partner->id,
            'source_domain' => $request->header('Origin'),
            'insurance_type' => $request->input('insurance_type'),
            'session_token' => Str::random(64),
            'quote_data' => $request->input('quote_data'),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Fire session.created webhook
        $this->dispatchWebhook($session, 'embed.session.created');

        // Email partner about new quote session
        $this->notifyPartner($partner, $session, 'started');

        return response()->json([
            'session_token' => $session->session_token,
            'message' => 'Quote session created. Redirect user to complete quote.',
            'redirect_url' => config('app.frontend_url') . '/calculator?embed=' . $session->session_token,
        ]);
    }

    public function widgetCode(EmbedPartner $partner): JsonResponse
    {
        $frontendUrl = rtrim(config('app.frontend_url', 'https://insurons.com'), '/');
        $code = '<script src="' . $frontendUrl . '/embed/insurons-widget.js" data-key="' . $partner->api_key . '"></script>';

        return response()->json([
            'embed_code' => $code,
            'api_key' => $partner->api_key,
        ]);
    }

    public function linkSession(Request $request): JsonResponse
    {
        $data = $request->validate([
            'session_token' => 'required|string',
            'quote_request_id' => 'required|integer|exists:quote_requests,id',
        ]);

        $session = EmbedSession::where('session_token', $data['session_token'])->first();
        if ($session && !$session->quote_request_id) {
            try {
                $session->update(['quote_request_id' => $data['quote_request_id']]);
            } catch (\Throwable $e) {
                Log::warning('Link session failed', ['error' => $e->getMessage()]);
            }
        }

        return response()->json(['ok' => true]);
    }

    // --- Embed Team Signup (public — API key validated) ---

    public function teamConfig(string $apiKey): JsonResponse
    {
        $partner = EmbedPartner::where('api_key', $apiKey)
            ->where('is_active', true)
            ->where('embed_type', 'team_signup')
            ->with('agency:id,name,city,state,description')
            ->first();

        if (!$partner || !$partner->agency) {
            return response()->json(['error' => 'Invalid or inactive widget key'], 403);
        }

        return response()->json([
            'partner_name' => $partner->name,
            'agency' => [
                'name' => $partner->agency->name,
                'city' => $partner->agency->city,
                'state' => $partner->agency->state,
                'description' => $partner->agency->description,
            ],
            'widget_config' => $partner->widget_config,
        ]);
    }

    public function teamSignup(Request $request): JsonResponse
    {
        $apiKey = $request->input('api_key');
        $partner = EmbedPartner::where('api_key', $apiKey)
            ->where('is_active', true)
            ->where('embed_type', 'team_signup')
            ->first();

        if (!$partner || !$partner->agency_id) {
            return response()->json(['error' => 'Invalid or inactive widget key'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:30',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        // Check if user already exists
        $existing = User::where('email', $data['email'])->first();
        if ($existing) {
            if ($existing->agency_id === $partner->agency_id) {
                return response()->json(['error' => 'You are already a member of this agency'], 422);
            }
            return response()->json(['error' => 'An account with this email already exists. Please log in at insurons.com'], 422);
        }

        $agency = Agency::find($partner->agency_id);
        if (!$agency) {
            return response()->json(['error' => 'Agency not found'], 404);
        }

        // Create the agent account
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => 'agent',
            'agency_id' => $partner->agency_id,
            'is_active' => false, // Requires agency owner approval
            'email_verified_at' => now(), // Verified via embed signup
        ]);

        // Notify partner (agency) about new signup
        if ($partner->contact_email) {
            try {
                Mail::to($partner->contact_email)->queue(new \App\Mail\EmbedTeamSignupMail(
                    partner: $partner,
                    agency: $agency,
                    agent: $user,
                    sourceDomain: $request->header('Origin') ?? 'Direct',
                ));
            } catch (\Throwable $e) {
                Log::warning('Team signup email failed', ['error' => $e->getMessage()]);
            }
        }

        // Fire webhook
        if ($partner->webhook_url) {
            $payload = [
                'event' => 'embed.team.signup',
                'data' => [
                    'partner_id' => $partner->id,
                    'agency_id' => $agency->id,
                    'agency_name' => $agency->name,
                    'agent' => [
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                    ],
                    'source_domain' => $request->header('Origin'),
                ],
                'timestamp' => now()->toIso8601String(),
            ];

            $signature = hash_hmac('sha256', json_encode($payload), $partner->webhook_secret ?? '');

            try {
                Http::timeout(10)
                    ->withHeaders([
                        'X-Webhook-Signature' => $signature,
                        'X-Webhook-Event' => 'embed.team.signup',
                    ])
                    ->post($partner->webhook_url, $payload);
            } catch (\Throwable $e) {
                Log::warning('Team signup webhook failed', ['error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'ok' => true,
            'message' => 'Application submitted! The agency will review and activate your account.',
            'agent_name' => $user->name,
            'agency_name' => $agency->name,
        ], 201);
    }

    public function markConverted(Request $request): JsonResponse
    {
        $sessionToken = $request->input('session_token');
        $session = EmbedSession::where('session_token', $sessionToken)->first();

        if ($session && !$session->converted_at) {
            $session->update(['converted_at' => now()]);
            $session->load(['partner', 'quoteRequest']);

            // Fire webhook with enriched data (includes contact info)
            $this->dispatchWebhook($session, 'embed.session.converted');

            // Email partner about the new lead
            if ($session->partner) {
                $this->notifyPartner($session->partner, $session, 'converted');
            }
        }

        return response()->json(['ok' => true]);
    }

    public function testWebhook(EmbedPartner $partner): JsonResponse
    {
        if (!$partner->webhook_url) {
            return response()->json(['error' => 'No webhook URL configured'], 422);
        }

        $payload = [
            'event' => 'embed.test',
            'data' => [
                'partner_id' => $partner->id,
                'partner_name' => $partner->name,
                'message' => 'This is a test webhook from Insurons.',
            ],
            'timestamp' => now()->toIso8601String(),
        ];

        try {
            $signature = hash_hmac('sha256', json_encode($payload), $partner->webhook_secret ?? '');

            $response = Http::timeout(10)
                ->withHeaders(['X-Webhook-Signature' => $signature])
                ->post($partner->webhook_url, $payload);

            return response()->json([
                'success' => $response->successful(),
                'status_code' => $response->status(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 502);
        }
    }

    private function notifyPartner(EmbedPartner $partner, EmbedSession $session, string $type): void
    {
        if (!$partner->contact_email) {
            return;
        }

        try {
            if ($type === 'started') {
                Mail::to($partner->contact_email)->queue(new EmbedQuoteStartedMail(
                    partner: $partner,
                    insuranceType: $session->insurance_type ?? 'Unknown',
                    sourceDomain: $session->source_domain ?? 'Direct',
                    sessionToken: $session->session_token,
                ));
            } elseif ($type === 'converted') {
                $session->loadMissing('quoteRequest');
                if ($session->quoteRequest) {
                    Mail::to($partner->contact_email)->queue(new EmbedLeadConvertedMail(
                        partner: $partner,
                        session: $session,
                    ));
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Embed partner email failed', [
                'partner_id' => $partner->id,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function dispatchWebhook(EmbedSession $session, string $event = 'embed.session.converted'): void
    {
        $partner = $session->partner;
        if (!$partner || !$partner->webhook_url) {
            return;
        }

        $data = [
            'session_token' => $session->session_token,
            'insurance_type' => $session->insurance_type,
            'source_domain' => $session->source_domain,
            'partner_id' => $partner->id,
            'quote_data' => $session->quote_data,
        ];

        if ($session->converted_at) {
            $data['converted_at'] = $session->converted_at->toIso8601String();
        }

        // Include contact info on conversion if available
        if ($event === 'embed.session.converted') {
            $session->loadMissing('quoteRequest');
            $qr = $session->quoteRequest;
            if ($qr) {
                $data['contact'] = [
                    'first_name' => $qr->first_name,
                    'last_name' => $qr->last_name,
                    'email' => $qr->email,
                    'phone' => $qr->phone,
                    'zip_code' => $qr->zip_code,
                    'coverage_level' => $qr->coverage_level,
                ];
            }
        }

        $payload = [
            'event' => $event,
            'data' => $data,
            'timestamp' => now()->toIso8601String(),
        ];

        $signature = hash_hmac('sha256', json_encode($payload), $partner->webhook_secret ?? '');

        $startTime = microtime(true);
        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'X-Webhook-Signature' => $signature,
                    'X-Webhook-Event' => $event,
                ])
                ->post($partner->webhook_url, $payload);

            Log::info('Embed webhook dispatched', [
                'event' => $event,
                'partner_id' => $partner->id,
                'status' => $response->status(),
                'success' => $response->successful(),
                'response_time_ms' => (int) ((microtime(true) - $startTime) * 1000),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Embed webhook failed', [
                'event' => $event,
                'partner_id' => $partner->id,
                'url' => $partner->webhook_url,
                'error' => $e->getMessage(),
                'response_time_ms' => (int) ((microtime(true) - $startTime) * 1000),
            ]);
        }
    }
}
