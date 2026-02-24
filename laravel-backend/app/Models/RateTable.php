<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RateTable extends Model
{
    protected $fillable = [
        'product_type', 'version', 'name', 'carrier_id',
        'effective_date', 'expiration_date', 'is_active', 'metadata',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'expiration_date' => 'date',
        'is_active' => 'boolean',
        'metadata' => 'array',
    ];

    public function carrier(): BelongsTo { return $this->belongsTo(Carrier::class); }
    public function entries(): HasMany { return $this->hasMany(RateTableEntry::class); }
    public function factors(): HasMany { return $this->hasMany(RateFactor::class); }
    public function riders(): HasMany { return $this->hasMany(RateRider::class); }
    public function fees(): HasMany { return $this->hasMany(RateFee::class); }
    public function modalFactors(): HasMany { return $this->hasMany(RateModalFactor::class); }

    /**
     * Find the active rate table for a product type, optionally carrier-specific.
     * Falls back to generic (carrier_id = null) if carrier-specific not found.
     */
    public static function activeFor(string $productType, ?int $carrierId = null, ?string $version = null): ?self
    {
        $baseQuery = static::where('product_type', $productType)->where('is_active', true);

        if ($version) {
            return (clone $baseQuery)->where('version', $version)->first();
        }

        $dateScope = fn ($q) => $q->where('effective_date', '<=', now())
            ->where(fn ($sub) => $sub->whereNull('expiration_date')->orWhere('expiration_date', '>=', now()));

        // Try carrier-specific first
        if ($carrierId) {
            $carrierTable = (clone $baseQuery)->where('carrier_id', $carrierId)
                ->where($dateScope)
                ->orderByDesc('effective_date')->first();
            if ($carrierTable) return $carrierTable;
        }

        // Fall back to generic (carrier_id = null)
        return (clone $baseQuery)->whereNull('carrier_id')
            ->where($dateScope)
            ->orderByDesc('effective_date')->first();
    }
}
