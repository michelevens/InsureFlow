<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RateTable extends Model
{
    protected $fillable = [
        'product_type', 'version', 'name', 'effective_date',
        'expiration_date', 'is_active', 'metadata',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'expiration_date' => 'date',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    public function entries(): HasMany { return $this->hasMany(RateTableEntry::class); }
    public function factors(): HasMany { return $this->hasMany(RateFactor::class); }
    public function riders(): HasMany { return $this->hasMany(RateRider::class); }
    public function fees(): HasMany { return $this->hasMany(RateFee::class); }
    public function modalFactors(): HasMany { return $this->hasMany(RateModalFactor::class); }

    /**
     * Find the active rate table for a product type.
     */
    public static function activeFor(string $productType, ?string $version = null): ?self
    {
        $query = static::where('product_type', $productType)->where('is_active', true);
        if ($version) {
            $query->where('version', $version);
        } else {
            $query->where('effective_date', '<=', now())
                  ->where(fn ($q) => $q->whereNull('expiration_date')->orWhere('expiration_date', '>=', now()));
        }
        return $query->orderByDesc('effective_date')->first();
    }
}
