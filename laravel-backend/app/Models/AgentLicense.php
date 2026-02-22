<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentLicense extends Model
{
    protected $fillable = [
        'user_id', 'state', 'license_number', 'license_type', 'lines_of_authority',
        'status', 'issue_date', 'expiration_date', 'npn',
    ];

    protected $casts = [
        'lines_of_authority' => 'array',
        'issue_date' => 'date',
        'expiration_date' => 'date',
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
