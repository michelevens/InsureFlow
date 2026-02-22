<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DataSubscription extends Model
{
    protected $fillable = [
        'organization_id', 'user_id', 'product_type', 'tier', 'price_monthly', 'is_active',
    ];

    protected $casts = [
        'price_monthly' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(DataReport::class);
    }
}
