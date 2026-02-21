<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Commission extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id', 'policy_id', 'carrier_name',
        'premium_amount', 'commission_rate', 'commission_amount',
        'status', 'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'premium_amount' => 'decimal:2',
            'commission_rate' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'paid_at' => 'date',
        ];
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function policy()
    {
        return $this->belongsTo(Policy::class);
    }
}
