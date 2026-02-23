<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgencyCarrierAppointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'agency_id', 'carrier_id', 'platform_product_id',
        'appointment_number', 'effective_date', 'termination_date',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'effective_date' => 'date',
            'termination_date' => 'date',
        ];
    }

    public function agency()
    {
        return $this->belongsTo(Agency::class);
    }

    public function carrier()
    {
        return $this->belongsTo(Carrier::class);
    }

    public function platformProduct()
    {
        return $this->belongsTo(PlatformProduct::class);
    }
}
