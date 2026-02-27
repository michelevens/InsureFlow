<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Carrier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'naic_code', 'naic_group_code', 'domicile_state',
        'description', 'logo', 'website', 'phone', 'email',
        'am_best_rating', 'sp_rating', 'am_best_financial_size', 'year_founded',
        'naic_complaint_ratio', 'market_segment', 'lines_of_business',
        'headquarters_city', 'headquarters_state', 'total_premium_written',
        'is_admitted', 'distribution_model', 'carrier_metadata',
        'states_available', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'states_available' => 'array',
            'lines_of_business' => 'array',
            'carrier_metadata' => 'array',
            'is_active' => 'boolean',
            'is_admitted' => 'boolean',
            'naic_complaint_ratio' => 'decimal:2',
            'total_premium_written' => 'decimal:2',
        ];
    }

    public function products()
    {
        return $this->hasMany(CarrierProduct::class);
    }

    public function rateTables()
    {
        return $this->hasMany(RateTable::class);
    }

    public function agencyAppointments()
    {
        return $this->hasMany(AgencyCarrierAppointment::class);
    }
}
