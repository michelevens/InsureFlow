<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InsuredObject extends Model
{
    use HasFactory;

    protected $fillable = [
        'insurable_type', 'insurable_id', 'object_type', 'name', 'relationship',
        'date_of_birth', 'gender', 'address_line1', 'address_line2', 'city', 'state', 'zip',
        'vehicle_year', 'vehicle_make', 'vehicle_model', 'vin',
        'year_built', 'square_footage', 'construction_type',
        'fein', 'naics_code', 'annual_revenue', 'employee_count',
        'height_inches', 'weight_lbs', 'tobacco_use', 'occupation', 'annual_income',
        'details_json', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'details_json' => 'array',
            'date_of_birth' => 'date',
            'tobacco_use' => 'boolean',
            'annual_revenue' => 'decimal:2',
            'annual_income' => 'decimal:2',
        ];
    }

    public function insurable()
    {
        return $this->morphTo();
    }

    /**
     * Valid object types.
     */
    public static function objectTypes(): array
    {
        return ['person', 'vehicle', 'property', 'business', 'other'];
    }
}
