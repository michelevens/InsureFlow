<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Policy extends Model
{
    use HasFactory;

    protected $fillable = [
        'policy_number', 'application_id', 'user_id', 'agent_id',
        'carrier_product_id', 'type', 'carrier_name',
        'monthly_premium', 'annual_premium', 'deductible',
        'coverage_limit', 'coverage_details', 'status',
        'effective_date', 'expiration_date',
    ];

    protected function casts(): array
    {
        return [
            'coverage_details' => 'array',
            'monthly_premium' => 'decimal:2',
            'annual_premium' => 'decimal:2',
            'deductible' => 'decimal:2',
            'effective_date' => 'date',
            'expiration_date' => 'date',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function carrierProduct()
    {
        return $this->belongsTo(CarrierProduct::class);
    }

    public function commissions()
    {
        return $this->hasMany(Commission::class);
    }
}
