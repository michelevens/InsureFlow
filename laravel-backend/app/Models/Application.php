<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference', 'user_id', 'agent_id', 'carrier_product_id',
        'quote_id', 'insurance_type', 'carrier_name',
        'monthly_premium', 'status', 'applicant_data',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'applicant_data' => 'array',
            'monthly_premium' => 'decimal:2',
            'submitted_at' => 'datetime',
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

    public function carrierProduct()
    {
        return $this->belongsTo(CarrierProduct::class);
    }

    public function quote()
    {
        return $this->belongsTo(Quote::class);
    }

    public function policy()
    {
        return $this->hasOne(Policy::class);
    }
}
