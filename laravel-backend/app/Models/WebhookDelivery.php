<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookDelivery extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'webhook_id', 'event_type', 'payload',
        'response_status', 'response_body', 'response_time_ms',
        'error_message', 'status', 'attempt',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'created_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($delivery) {
            $delivery->created_at = $delivery->created_at ?? now();
        });
    }

    public function webhook()
    {
        return $this->belongsTo(Webhook::class);
    }
}
