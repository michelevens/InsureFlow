<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ApiKey extends Model
{
    protected $fillable = [
        'user_id', 'organization_id', 'name', 'key_hash', 'key_prefix',
        'permissions', 'rate_limit', 'last_used_at', 'expires_at', 'is_active',
    ];

    protected $casts = [
        'permissions' => 'array',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    protected $hidden = ['key_hash'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function usageLogs(): HasMany
    {
        return $this->hasMany(ApiUsageLog::class);
    }

    public static function generateKey(): array
    {
        $raw = 'ins_' . Str::random(48);
        return [
            'raw' => $raw,
            'hash' => hash('sha256', $raw),
            'prefix' => substr($raw, 0, 12),
        ];
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function hasPermission(string $permission): bool
    {
        if (!$this->permissions) return true; // null = all permissions
        return in_array($permission, $this->permissions);
    }
}
