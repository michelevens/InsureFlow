<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CarrierProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'carrier_id', 'name', 'insurance_type', 'product_code',
        'rate_table_product_type', 'underwriting_type', 'description',
        'min_premium', 'max_premium', 'deductible_options',
        'coverage_options', 'features', 'states_available',
        'eligible_states', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'deductible_options' => 'array',
            'coverage_options' => 'array',
            'features' => 'array',
            'states_available' => 'array',
            'eligible_states' => 'array',
            'min_premium' => 'decimal:2',
            'max_premium' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function carrier()
    {
        return $this->belongsTo(Carrier::class);
    }

    public function quotes()
    {
        return $this->hasMany(Quote::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }
}
