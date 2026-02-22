<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class WhiteLabelDomain extends Model
{
    protected $fillable = [
        'white_label_config_id', 'domain', 'ssl_status', 'verified_at', 'txt_record',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function config(): BelongsTo
    {
        return $this->belongsTo(WhiteLabelConfig::class, 'white_label_config_id');
    }

    public static function boot(): void
    {
        parent::boot();
        static::creating(function ($domain) {
            if (!$domain->txt_record) {
                $domain->txt_record = 'insurons-verify=' . Str::random(32);
            }
        });
    }
}
