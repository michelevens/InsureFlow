<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowRule extends Model
{
    protected $fillable = [
        'agency_id', 'created_by', 'name', 'description',
        'trigger_event', 'conditions', 'actions',
        'delay_minutes', 'is_active', 'priority',
        'execution_count', 'last_executed_at',
    ];

    protected function casts(): array
    {
        return [
            'conditions' => 'array',
            'actions' => 'array',
            'is_active' => 'boolean',
            'last_executed_at' => 'datetime',
        ];
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function executions(): HasMany
    {
        return $this->hasMany(WorkflowExecution::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForEvent($query, string $event)
    {
        return $query->where('trigger_event', $event);
    }

    public function scopeForAgency($query, ?int $agencyId)
    {
        return $query->where('agency_id', $agencyId);
    }

    /**
     * Check if conditions match the given context data.
     */
    public function conditionsMatch(array $context): bool
    {
        if (empty($this->conditions)) {
            return true;
        }

        foreach ($this->conditions as $condition) {
            $field = $condition['field'] ?? '';
            $operator = $condition['operator'] ?? 'equals';
            $value = $condition['value'] ?? null;
            $actual = data_get($context, $field);

            $match = match ($operator) {
                'equals' => $actual == $value,
                'not_equals' => $actual != $value,
                'contains' => is_string($actual) && str_contains(strtolower($actual), strtolower($value ?? '')),
                'greater_than' => is_numeric($actual) && $actual > $value,
                'less_than' => is_numeric($actual) && $actual < $value,
                'in' => is_array($value) && in_array($actual, $value),
                'not_in' => is_array($value) && !in_array($actual, $value),
                'is_empty' => empty($actual),
                'is_not_empty' => !empty($actual),
                default => true,
            };

            if (!$match) {
                return false;
            }
        }

        return true;
    }

    /**
     * Available trigger events.
     */
    public static function triggerEvents(): array
    {
        return [
            'lead_created' => 'New Lead Created',
            'lead_assigned' => 'Lead Assigned to Agent',
            'lead_status_changed' => 'Lead Status Changed',
            'lead_score_updated' => 'Lead Score Updated',
            'scenario_created' => 'Quote Scenario Created',
            'scenario_quoted' => 'Quote Received from Carrier',
            'scenario_accepted' => 'Consumer Accepted Scenario',
            'application_created' => 'Application Created',
            'application_signed' => 'Application Signed',
            'application_submitted' => 'Application Submitted',
            'application_status_changed' => 'Application Status Changed',
            'policy_issued' => 'Policy Issued',
            'policy_renewed' => 'Policy Renewed',
            'policy_cancelled' => 'Policy Cancelled',
            'renewal_approaching' => 'Renewal Approaching (30 days)',
            'claim_filed' => 'Claim Filed',
            'claim_status_changed' => 'Claim Status Changed',
            'commission_received' => 'Commission Received',
            'document_uploaded' => 'Document Uploaded',
            'signature_completed' => 'E-Signature Completed',
            'marketplace_lead_purchased' => 'Marketplace Lead Purchased',
            'intake_form_submitted' => 'Intake Form Submitted',
        ];
    }

    /**
     * Available action types.
     */
    public static function actionTypes(): array
    {
        return [
            'send_email' => ['label' => 'Send Email', 'config' => ['template', 'to_role']],
            'send_notification' => ['label' => 'Send In-App Notification', 'config' => ['message', 'to_role']],
            'assign_agent' => ['label' => 'Assign to Agent', 'config' => ['agent_id', 'method']],
            'update_status' => ['label' => 'Update Status', 'config' => ['entity', 'status']],
            'create_task' => ['label' => 'Create Follow-up Task', 'config' => ['title', 'due_days', 'assign_to']],
            'add_tag' => ['label' => 'Add Tag/Label', 'config' => ['tag']],
            'fire_webhook' => ['label' => 'Fire Webhook', 'config' => ['url', 'method']],
            'delay_then' => ['label' => 'Wait Then Continue', 'config' => ['minutes', 'next_action']],
        ];
    }
}
