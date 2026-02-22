<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerListing extends Model
{
    protected $fillable = [
        'user_id',
        'category',
        'business_name',
        'description',
        'service_area',
        'website',
        'phone',
        'email',
        'logo_url',
        'rating',
        'review_count',
        'is_verified',
        'is_active',
    ];

    protected $casts = [
        'service_area' => 'array',
        'rating' => 'decimal:2',
        'review_count' => 'integer',
        'is_verified' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(PartnerReferral::class, 'listing_id');
    }
}
