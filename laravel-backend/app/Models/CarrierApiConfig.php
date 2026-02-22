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
        'credentials_encrypted',
        'field_mapping',
        'rate_limit_per_minute',
        'timeout_seconds',
        'is_active',
        'last_tested_at',
    ];

    protected function casts(): array
    {
        return [
            'field_mapping' => 'array',
            'credentials_encrypted' => 'encrypted',
            'is_active' => 'boolean',
            'last_tested_at' => 'datetime',
        ];
    }

    public function carrier(): BelongsTo
    {
        return $this->belongsTo(Carrier::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(CarrierApiLog::class);
    }
}
