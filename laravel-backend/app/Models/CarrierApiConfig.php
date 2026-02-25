<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CarrierApiConfig extends Model
{
    protected $fillable = [
        'carrier_id',
        'api_type',
        'base_url',
        'auth_type',
        'adapter_type',
        'api_key',
        'api_secret',
        'auth_config',
        'credentials_encrypted',
        'field_mapping',
        'field_mappings',
        'endpoints',
        'headers',
        'supported_products',
        'rate_limit_per_minute',
        'timeout_seconds',
        'is_active',
        'sandbox_mode',
        'sandbox_url',
        'last_tested_at',
        'last_test_status',
    ];

    protected function casts(): array
    {
        return [
            'field_mapping' => 'array',
            'field_mappings' => 'array',
            'auth_config' => 'array',
            'endpoints' => 'array',
            'headers' => 'array',
            'supported_products' => 'array',
            'credentials_encrypted' => 'encrypted',
            'api_key' => 'encrypted',
            'api_secret' => 'encrypted',
            'is_active' => 'boolean',
            'sandbox_mode' => 'boolean',
            'last_tested_at' => 'datetime',
        ];
    }

    /**
     * Fields that should be hidden when serialized to JSON (sensitive data).
     */
    protected $hidden = [
        'api_key',
        'api_secret',
        'credentials_encrypted',
    ];

    public function carrier(): BelongsTo
    {
        return $this->belongsTo(Carrier::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(CarrierApiLog::class);
    }

    /**
     * Check if this config has credentials configured (without revealing them).
     */
    public function getHasCredentialsAttribute(): bool
    {
        return !empty($this->api_key)
            || !empty($this->api_secret)
            || !empty($this->credentials_encrypted);
    }

    /**
     * Append computed attributes to JSON.
     */
    protected $appends = ['has_credentials'];
}
