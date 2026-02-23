<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlatformProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug', 'name', 'category', 'icon', 'description',
        'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function agencies()
    {
        return $this->belongsToMany(Agency::class, 'agency_products')
            ->withPivot('is_active')
            ->withTimestamps();
    }

    public function carrierAppointments()
    {
        return $this->hasMany(AgencyCarrierAppointment::class);
    }

    public function carrierProducts()
    {
        return $this->hasMany(CarrierProduct::class, 'insurance_type', 'slug');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get active products optionally filtered by agency context.
     */
    public static function visibleProducts(?int $agencyId = null)
    {
        $query = static::where('is_active', true)->orderBy('sort_order');

        if ($agencyId) {
            $query->whereHas('agencies', function ($q) use ($agencyId) {
                $q->where('agencies.id', $agencyId)
                  ->where('agency_products.is_active', true);
            });
        }

        return $query->get();
    }
}
