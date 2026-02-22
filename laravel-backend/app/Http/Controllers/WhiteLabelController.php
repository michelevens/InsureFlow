<?php

namespace App\Http\Controllers;

use App\Models\WhiteLabelConfig;
use App\Models\WhiteLabelDomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhiteLabelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $configs = WhiteLabelConfig::with(['organization', 'domains'])
            ->whereHas('organization', function ($q) use ($request) {
                // User must belong to the org
                $q->whereHas('members', fn($m) => $m->where('user_id', $request->user()->id));
            })
            ->get();

        return response()->json($configs);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'brand_name' => 'required|string|max:255',
            'domain' => 'nullable|string|max:255|unique:white_label_configs,domain',
            'logo_url' => 'nullable|url|max:500',
            'favicon_url' => 'nullable|url|max:500',
            'primary_color' => 'nullable|string|max:7',
            'secondary_color' => 'nullable|string|max:7',
            'custom_css' => 'nullable|string',
            'branding' => 'nullable|array',
        ]);

        $config = WhiteLabelConfig::create($data);
        $config->load(['organization', 'domains']);

        return response()->json($config, 201);
    }

    public function show(WhiteLabelConfig $config): JsonResponse
    {
        $config->load(['organization', 'domains']);
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
        $config->load(['organization', 'domains']);

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
