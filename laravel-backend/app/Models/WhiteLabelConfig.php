<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhiteLabelConfig extends Model
{
    protected $fillable = [
        'organization_id', 'agency_id', 'domain', 'brand_name', 'logo_url', 'favicon_url',
        'primary_color', 'secondary_color', 'custom_css', 'branding', 'is_active',
    ];

    protected $casts = [
        'branding' => 'array',
        'is_active' => 'boolean',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function domains(): HasMany
    {
        return $this->hasMany(WhiteLabelDomain::class);
    }
}
