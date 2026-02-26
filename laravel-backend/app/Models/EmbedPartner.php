<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class EmbedPartner extends Model
{
    use HasFactory;
    protected $fillable = [
        'name', 'api_key', 'allowed_domains', 'commission_share_percent',
        'contact_email', 'contact_name', 'is_active', 'widget_config',
        'webhook_url', 'webhook_secret',
    ];

    protected $casts = [
        'allowed_domains' => 'array',
        'widget_config' => 'array',
        'is_active' => 'boolean',
        'commission_share_percent' => 'decimal:2',
    ];

    protected $hidden = ['api_key', 'webhook_secret'];

    public function sessions(): HasMany
    {
        return $this->hasMany(EmbedSession::class, 'embed_partner_id');
    }

    public static function boot(): void
    {
        parent::boot();
        static::creating(function ($partner) {
            if (!$partner->api_key) {
                $partner->api_key = 'emb_' . Str::random(48);
            }
        });
    }

    public function conversionRate(): float
    {
        $total = $this->sessions()->count();
        if ($total === 0) return 0;
        $converted = $this->sessions()->whereNotNull('converted_at')->count();
        return round(($converted / $total) * 100, 1);
    }
}
