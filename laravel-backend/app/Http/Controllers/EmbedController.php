<?php

namespace App\Http\Controllers;

use App\Models\EmbedPartner;
use App\Models\EmbedSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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
        ]);

        $partner = EmbedPartner::create($data);

        // Return with the api_key visible (only on creation)
        return response()->json([
            ...$partner->toArray(),
            'api_key' => $partner->api_key,
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
        ]);

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

        // Use the existing QuoteController estimate logic (simplified here)
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

    public function markConverted(Request $request): JsonResponse
    {
        $sessionToken = $request->input('session_token');
        $session = EmbedSession::where('session_token', $sessionToken)->first();

        if ($session && !$session->converted_at) {
            $session->update(['converted_at' => now()]);
        }

        return response()->json(['ok' => true]);
    }
}
