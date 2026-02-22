<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarrierApiLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'carrier_api_config_id',
        'request_hash',
        'request_method',
        'request_url',
        'request_payload',
        'response_status',
        'response_body',
        'response_time_ms',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'request_payload' => 'array',
            'created_at' => 'datetime',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (CarrierApiLog $log) {
            $log->created_at = $log->freshTimestamp();
        });
    }

    public function config(): BelongsTo
    {
        return $this->belongsTo(CarrierApiConfig::class, 'carrier_api_config_id');
    }
}
