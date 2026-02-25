<?php

namespace App\Http\Controllers;

use App\Models\WorkflowExecution;
use App\Models\WorkflowRule;
use App\Services\WorkflowEngine;
use Illuminate\Http\Request;

class WorkflowRuleController extends Controller
{
    public function __construct(private WorkflowEngine $engine) {}

    /**
     * List workflow rules for the user's agency.
     */
    public function index(Request $request)
    {
        $agencyId = $request->attributes->get('agency_id');

        $rules = WorkflowRule::where('agency_id', $agencyId)
            ->with('creator:id,name')
            ->withCount('executions')
            ->orderBy('priority')
            ->orderBy('name')
            ->get();

        return response()->json(['rules' => $rules]);
    }

    /**
     * Create a new workflow rule.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'trigger_event' => 'required|string|in:' . implode(',', array_keys(WorkflowRule::triggerEvents())),
            'conditions' => 'nullable|array',
            'conditions.*.field' => 'required_with:conditions|string',
            'conditions.*.operator' => 'required_with:conditions|string',
            'conditions.*.value' => 'nullable',
            'actions' => 'required|array|min:1',
            'actions.*.type' => 'required|string',
            'actions.*.config' => 'required|array',
            'delay_minutes' => 'nullable|integer|min:0|max:10080', // max 7 days
            'priority' => 'nullable|integer|min:1|max:100',
            'is_active' => 'nullable|boolean',
        ]);

        $agencyId = $request->attributes->get('agency_id');

        $rule = WorkflowRule::create([
            'agency_id' => $agencyId,
            'created_by' => $request->user()->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'trigger_event' => $data['trigger_event'],
            'conditions' => $data['conditions'] ?? [],
            'actions' => $data['actions'],
            'delay_minutes' => $data['delay_minutes'] ?? 0,
            'priority' => $data['priority'] ?? 50,
            'is_active' => $data['is_active'] ?? true,
        ]);

        $rule->load('creator:id,name');

        return response()->json(['rule' => $rule], 201);
    }

    /**
     * Show a single workflow rule with recent executions.
     */
    public function show(Request $request, WorkflowRule $rule)
    {
        $agencyId = $request->attributes->get('agency_id');
        if ($rule->agency_id !== $agencyId) {
            abort(403);
        }

        $rule->load('creator:id,name');
        $rule->loadCount('executions');

        $recentExecutions = $rule->executions()
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'rule' => $rule,
            'recent_executions' => $recentExecutions,
        ]);
    }

    /**
     * Update a workflow rule.
     */
    public function update(Request $request, WorkflowRule $rule)
    {
        $agencyId = $request->attributes->get('agency_id');
        if ($rule->agency_id !== $agencyId) {
            abort(403);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'trigger_event' => 'sometimes|string|in:' . implode(',', array_keys(WorkflowRule::triggerEvents())),
            'conditions' => 'nullable|array',
            'actions' => 'sometimes|array|min:1',
            'delay_minutes' => 'nullable|integer|min:0|max:10080',
            'priority' => 'nullable|integer|min:1|max:100',
            'is_active' => 'nullable|boolean',
        ]);

        $rule->update($data);
        $rule->load('creator:id,name');

        return response()->json(['rule' => $rule]);
    }

    /**
     * Delete a workflow rule.
     */
    public function destroy(Request $request, WorkflowRule $rule)
    {
        $agencyId = $request->attributes->get('agency_id');
        if ($rule->agency_id !== $agencyId) {
            abort(403);
        }

        $rule->delete();

        return response()->json(['message' => 'Workflow rule deleted.']);
    }

    /**
     * Toggle a workflow rule active/inactive.
     */
    public function toggle(Request $request, WorkflowRule $rule)
    {
        $agencyId = $request->attributes->get('agency_id');
        if ($rule->agency_id !== $agencyId) {
            abort(403);
        }

        $rule->update(['is_active' => !$rule->is_active]);

        return response()->json([
            'rule' => $rule,
            'message' => $rule->is_active ? 'Rule activated.' : 'Rule deactivated.',
        ]);
    }

    /**
     * Test-execute a workflow rule with sample context.
     */
    public function test(Request $request, WorkflowRule $rule)
    {
        $agencyId = $request->attributes->get('agency_id');
        if ($rule->agency_id !== $agencyId) {
            abort(403);
        }

        $context = $request->input('context', [
            'lead_id' => 0,
            'agent_id' => $request->user()->id,
            'agency_id' => $agencyId,
            'agency_owner_id' => $request->user()->id,
            'insurance_type' => 'auto',
            'state' => 'TX',
        ]);

        $result = $this->engine->executeRule($rule, $rule->trigger_event, $context);

        return response()->json(['result' => $result]);
    }

    /**
     * Get execution log for the agency.
     */
    public function executions(Request $request)
    {
        $agencyId = $request->attributes->get('agency_id');

        $executions = WorkflowExecution::where('agency_id', $agencyId)
            ->with('rule:id,name,trigger_event')
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json($executions);
    }

    /**
     * Get available trigger events and action types for the UI.
     */
    public function options()
    {
        return response()->json([
            'trigger_events' => WorkflowRule::triggerEvents(),
            'action_types' => WorkflowRule::actionTypes(),
            'operators' => [
                'equals' => 'Equals',
                'not_equals' => 'Not Equals',
                'contains' => 'Contains',
                'greater_than' => 'Greater Than',
                'less_than' => 'Less Than',
                'in' => 'Is One Of',
                'not_in' => 'Is Not One Of',
                'is_empty' => 'Is Empty',
                'is_not_empty' => 'Is Not Empty',
            ],
            'condition_fields' => [
                'insurance_type' => 'Insurance Type',
                'state' => 'State',
                'lead_score' => 'Lead Score',
                'lead_source' => 'Lead Source',
                'premium' => 'Premium Amount',
                'carrier_name' => 'Carrier Name',
                'status' => 'Status',
            ],
        ]);
    }
}
