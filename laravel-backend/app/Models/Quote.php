<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quote extends Model
{
    use HasFactory;

    protected $fillable = [
        'quote_request_id', 'carrier_product_id', 'monthly_premium',
        'annual_premium', 'deductible', 'coverage_limit',
        'features', 'is_recommended', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'monthly_premium' => 'decimal:2',
            'annual_premium' => 'decimal:2',
            'deductible' => 'decimal:2',
            'is_recommended' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }

    public function quoteRequest()
    {
        return $this->belongsTo(QuoteRequest::class);
    }

    public function carrierProduct()
    {
        return $this->belongsTo(CarrierProduct::class);
    }
}
