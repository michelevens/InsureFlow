<?php

namespace App\Http\Controllers;

use App\Models\RoutingRule;
use Illuminate\Http\Request;

class RoutingRuleController extends Controller
{
    public function index(Request $request)
    {
        $agencyId = $request->attributes->get('agency_id');

        if (!$agencyId) {
            return response()->json(['message' => 'Agency context required'], 422);
        }

        $rules = RoutingRule::where('agency_id', $agencyId)
            ->with('targetAgent')
            ->orderByDesc('priority')
            ->get();

        return response()->json($rules);
    }

    public function store(Request $request)
    {
        $agencyId = $request->attributes->get('agency_id');

        if (!$agencyId) {
            return response()->json(['message' => 'Agency context required'], 422);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'priority' => 'sometimes|integer|min:0',
            'insurance_type' => 'nullable|string',
            'zip_codes' => 'nullable|array',
            'states' => 'nullable|array',
            'coverage_level' => 'nullable|in:basic,standard,premium',
            'source' => 'nullable|string',
            'assignment_type' => 'required|in:agent,round_robin,capacity',
            'target_agent_id' => 'nullable|integer|exists:users,id',
            'agent_pool' => 'nullable|array',
            'agent_pool.*' => 'integer|exists:users,id',
            'daily_cap' => 'nullable|integer|min:1',
        ]);

        $rule = RoutingRule::create([
            ...$data,
            'agency_id' => $agencyId,
        ]);

        return response()->json($rule, 201);
    }

    public function update(Request $request, RoutingRule $rule)
    {
        $agencyId = $request->attributes->get('agency_id');
        if ($rule->agency_id !== $agencyId) {
            abort(403);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'priority' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
            'insurance_type' => 'nullable|string',
            'zip_codes' => 'nullable|array',
            'states' => 'nullable|array',
            'coverage_level' => 'nullable|in:basic,standard,premium',
            'source' => 'nullable|string',
            'assignment_type' => 'sometimes|in:agent,round_robin,capacity',
            'target_agent_id' => 'nullable|integer|exists:users,id',
            'agent_pool' => 'nullable|array',
            'daily_cap' => 'nullable|integer|min:1',
        ]);

        $rule->update($data);
        return response()->json($rule);
    }

    public function destroy(Request $request, RoutingRule $rule)
    {
        $agencyId = $request->attributes->get('agency_id');
        if ($rule->agency_id !== $agencyId) {
            abort(403);
        }

        $rule->delete();
        return response()->json(['message' => 'Routing rule deleted']);
    }
}
