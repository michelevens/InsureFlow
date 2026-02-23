<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Carrier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'description', 'logo_url', 'website',
        'am_best_rating', 'states_available', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'states_available' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function products()
    {
        return $this->hasMany(CarrierProduct::class);
    }

    public function agencyAppointments()
    {
        return $this->hasMany(AgencyCarrierAppointment::class);
    }
}
