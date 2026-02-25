<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowExecution extends Model
{
    protected $fillable = [
        'workflow_rule_id', 'agency_id', 'trigger_event',
        'trigger_data', 'actions_executed', 'status',
        'error_message', 'duration_ms',
    ];

    protected function casts(): array
    {
        return [
            'trigger_data' => 'array',
            'actions_executed' => 'array',
        ];
    }

    public function rule(): BelongsTo
    {
        return $this->belongsTo(WorkflowRule::class, 'workflow_rule_id');
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }
}
