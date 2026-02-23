<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComplianceRequirement extends Model
{
    use HasFactory;

    protected $fillable = [
        'state', 'insurance_type', 'requirement_type', 'title', 'description',
        'details', 'category', 'is_required', 'frequency', 'authority', 'reference_url',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'json',
            'is_required' => 'boolean',
        ];
    }

    public function packItems()
    {
        return $this->hasMany(CompliancePackItem::class);
    }

    /**
     * Find requirements matching given states and insurance types.
     */
    public static function forStatesAndProducts(array $states, array $insuranceTypes)
    {
        return static::where(function ($q) use ($states) {
            $q->whereIn('state', $states)->orWhere('state', 'ALL');
        })->where(function ($q) use ($insuranceTypes) {
            $q->whereIn('insurance_type', $insuranceTypes)->orWhere('insurance_type', 'ALL');
        })->get();
    }
}
