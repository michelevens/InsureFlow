<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RatingRun extends Model
{
    protected $fillable = [
        'scenario_id', 'user_id', 'product_type', 'rate_table_version',
        'engine_version', 'input_hash', 'input_snapshot', 'output_snapshot',
        'final_premium_annual', 'final_premium_monthly',
        'status', 'error_message', 'duration_ms',
    ];

    protected $casts = [
        'input_snapshot' => 'array',
        'output_snapshot' => 'array',
        'final_premium_annual' => 'decimal:2',
        'final_premium_monthly' => 'decimal:2',
        'duration_ms' => 'integer',
    ];

    public function scenario(): BelongsTo { return $this->belongsTo(LeadScenario::class, 'scenario_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
