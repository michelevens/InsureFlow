<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Webhook extends Model
{
    protected $fillable = [
        'user_id', 'name', 'url', 'events', 'secret',
        'is_active', 'failure_count', 'last_triggered_at',
    ];

    protected function casts(): array
    {
        return [
            'events' => 'array',
            'is_active' => 'boolean',
            'last_triggered_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($webhook) {
            if (empty($webhook->secret)) {
                $webhook->secret = 'whsec_' . Str::random(48);
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function deliveries()
    {
        return $this->hasMany(WebhookDelivery::class)->orderByDesc('created_at');
    }
}
