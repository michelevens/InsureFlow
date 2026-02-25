<?php

namespace App\Http\Controllers;

use App\Models\Agency;
use App\Models\WhiteLabelConfig;
use App\Models\WhiteLabelDomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhiteLabelController extends Controller
{
    /**
     * Resolve the agency for the current user (agency_owner via ownership or agency_id).
     */
    private function resolveAgency(Request $request): ?Agency
    {
        $user = $request->user();

        if ($user->role === 'agency_owner') {
            return Agency::where('owner_id', $user->id)->first()
                ?? ($user->agency_id ? Agency::find($user->agency_id) : null);
        }

        return $user->agency_id ? Agency::find($user->agency_id) : null;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = WhiteLabelConfig::with(['organization', 'agency', 'domains']);

        if (in_array($user->role, ['admin', 'superadmin'])) {
            // Admins see all configs
            $configs = $query->get();
        } else {
            // Agency owners see their agency's configs
            $agency = $this->resolveAgency($request);
            if (!$agency) {
                return response()->json([]);
            }
            $configs = $query->where('agency_id', $agency->id)->get();
        }

        return response()->json($configs);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'brand_name' => 'required|string|max:255',
            'domain' => 'nullable|string|max:255|unique:white_label_configs,domain',
            'logo_url' => 'nullable|url|max:500',
            'favicon_url' => 'nullable|url|max:500',
            'primary_color' => 'nullable|string|max:7',
            'secondary_color' => 'nullable|string|max:7',
            'custom_css' => 'nullable|string',
            'branding' => 'nullable|array',
        ]);

        // Auto-assign agency_id for agency owners
        if (in_array($user->role, ['agency_owner', 'agent'])) {
            $agency = $this->resolveAgency($request);
            if (!$agency) {
                return response()->json(['message' => 'No agency found for your account'], 422);
            }
            $data['agency_id'] = $agency->id;
        } elseif ($request->has('organization_id')) {
            $data['organization_id'] = $request->input('organization_id');
        }

        $config = WhiteLabelConfig::create($data);
        $config->load(['organization', 'agency', 'domains']);

        return response()->json($config, 201);
    }

    public function show(WhiteLabelConfig $config): JsonResponse
    {
        $config->load(['organization', 'agency', 'domains']);
        return response()->json($config);
    }

    public function update(Request $request, WhiteLabelConfig $config): JsonResponse
    {
        $data = $request->validate([
            'brand_name' => 'sometimes|string|max:255',
            'domain' => 'sometimes|nullable|string|max:255|unique:white_label_configs,domain,' . $config->id,
            'logo_url' => 'nullable|url|max:500',
            'favicon_url' => 'nullable|url|max:500',
            'primary_color' => 'nullable|string|max:7',
            'secondary_color' => 'nullable|string|max:7',
            'custom_css' => 'nullable|string',
            'branding' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        $config->update($data);
        $config->load(['organization', 'agency', 'domains']);

        return response()->json($config);
    }

    public function destroy(WhiteLabelConfig $config): JsonResponse
    {
        $config->delete();
        return response()->json(['message' => 'White-label config deleted']);
    }

    public function addDomain(Request $request, WhiteLabelConfig $config): JsonResponse
    {
        $data = $request->validate([
            'domain' => 'required|string|max:255|unique:white_label_domains,domain',
        ]);

        $domain = $config->domains()->create($data);

        return response()->json($domain, 201);
    }

    public function verifyDomain(WhiteLabelDomain $domain): JsonResponse
    {
        // In production: check DNS TXT record matches $domain->txt_record
        // For now: auto-verify
        $domain->update([
            'ssl_status' => 'active',
            'verified_at' => now(),
        ]);

        return response()->json($domain);
    }

    public function removeDomain(WhiteLabelDomain $domain): JsonResponse
    {
        $domain->delete();
        return response()->json(['message' => 'Domain removed']);
    }

    public function preview(WhiteLabelConfig $config): JsonResponse
    {
        return response()->json([
            'brand_name' => $config->brand_name,
            'logo_url' => $config->logo_url,
            'favicon_url' => $config->favicon_url,
            'primary_color' => $config->primary_color,
            'secondary_color' => $config->secondary_color,
            'custom_css' => $config->custom_css,
            'branding' => $config->branding,
        ]);
    }
}
