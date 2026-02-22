<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RenewalOpportunity extends Model
{
    protected $fillable = [
        'policy_id',
        'agent_id',
        'consumer_id',
        'status',
        'renewal_date',
        'current_premium',
        'best_new_premium',
        'retention_score',
        'retention_factors',
        'notes',
        'last_contacted_at',
    ];

    protected $casts = [
        'renewal_date' => 'date',
        'current_premium' => 'decimal:2',
        'best_new_premium' => 'decimal:2',
        'retention_score' => 'integer',
        'retention_factors' => 'array',
        'last_contacted_at' => 'datetime',
    ];

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function consumer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'consumer_id');
    }

    public function scopeUpcoming($query, int $days = 90)
    {
        return $query->where('renewal_date', '<=', now()->addDays($days))
            ->where('renewal_date', '>=', now())
            ->whereNotIn('status', ['renewed', 'lost']);
    }
}
