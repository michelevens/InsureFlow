<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApiKeyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $keys = ApiKey::where('user_id', $request->user()->id)
            ->withCount('usageLogs')
            ->get();

        return response()->json($keys);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
            'rate_limit' => 'nullable|integer|min:100|max:100000',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $keyData = ApiKey::generateKey();

        $key = ApiKey::create([
            'user_id' => $request->user()->id,
            'organization_id' => $request->user()->agency_id,
            'name' => $data['name'],
            'key_hash' => $keyData['hash'],
            'key_prefix' => $keyData['prefix'],
            'permissions' => $data['permissions'] ?? null,
            'rate_limit' => $data['rate_limit'] ?? 1000,
            'expires_at' => $data['expires_at'] ?? null,
        ]);

        return response()->json([
            ...$key->toArray(),
            'api_key' => $keyData['raw'], // only shown once
        ], 201);
    }

    public function update(Request $request, ApiKey $apiKey): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'permissions' => 'nullable|array',
            'rate_limit' => 'nullable|integer|min:100|max:100000',
            'is_active' => 'sometimes|boolean',
            'expires_at' => 'nullable|date',
        ]);

        $apiKey->update($data);
        return response()->json($apiKey);
    }

    public function destroy(ApiKey $apiKey): JsonResponse
    {
        $apiKey->delete();
        return response()->json(['message' => 'API key deleted']);
    }

    public function usage(Request $request): JsonResponse
    {
        $keyId = $request->query('key_id');
        $days = $request->query('days', 30);

        $query = DB::table('api_usage_logs')
            ->join('api_keys', 'api_usage_logs.api_key_id', '=', 'api_keys.id')
            ->where('api_keys.user_id', $request->user()->id)
            ->where('api_usage_logs.created_at', '>=', now()->subDays($days));

        if ($keyId) {
            $query->where('api_key_id', $keyId);
        }

        $daily = (clone $query)
            ->selectRaw("DATE(api_usage_logs.created_at) as date, COUNT(*) as requests, AVG(response_time_ms) as avg_response_ms")
            ->groupByRaw("DATE(api_usage_logs.created_at)")
            ->orderBy('date')
            ->get();

        $byEndpoint = (clone $query)
            ->selectRaw('endpoint, method, COUNT(*) as requests, AVG(response_time_ms) as avg_response_ms')
            ->groupBy('endpoint', 'method')
            ->orderByDesc('requests')
            ->limit(20)
            ->get();

        $byStatus = (clone $query)
            ->selectRaw('response_status, COUNT(*) as count')
            ->groupBy('response_status')
            ->get();

        return response()->json([
            'daily' => $daily,
            'by_endpoint' => $byEndpoint,
            'by_status' => $byStatus,
            'total_requests' => $daily->sum('requests'),
        ]);
    }

    public function availablePermissions(): JsonResponse
    {
        return response()->json([
            'read:policies' => 'Read policy data',
            'write:policies' => 'Create/update policies',
            'read:applications' => 'Read applications',
            'write:applications' => 'Submit applications',
            'read:quotes' => 'Read quote data',
            'write:quotes' => 'Create quotes',
            'read:claims' => 'Read claims data',
            'write:claims' => 'File/update claims',
            'read:agents' => 'Read agent directory',
            'read:analytics' => 'Access analytics data',
            'webhooks:manage' => 'Manage webhooks',
        ]);
    }
}
