<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EoPolicy extends Model
{
    protected $fillable = [
        'user_id', 'carrier', 'policy_number', 'coverage_amount', 'deductible',
        'effective_date', 'expiration_date', 'status', 'certificate_url',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'expiration_date' => 'date',
        'coverage_amount' => 'decimal:2',
        'deductible' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpiring(int $days = 30): bool
    {
        return $this->expiration_date->isBetween(now(), now()->addDays($days));
    }

    public function isExpired(): bool
    {
        return $this->expiration_date->isPast();
    }

    public function scopeExpiringSoon($query, int $days = 60)
    {
        return $query->where('expiration_date', '<=', now()->addDays($days))
                     ->where('expiration_date', '>=', now())
                     ->where('status', 'active');
    }
}
