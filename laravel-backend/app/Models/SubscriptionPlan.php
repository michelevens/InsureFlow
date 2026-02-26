<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'description', 'monthly_price', 'annual_price',
        'target_role', 'features', 'limits', 'is_active', 'sort_order',
        'lead_credits_per_month', 'can_access_marketplace',
    ];

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'limits' => 'array',
            'monthly_price' => 'decimal:2',
            'annual_price' => 'decimal:2',
            'is_active' => 'boolean',
            'can_access_marketplace' => 'boolean',
        ];
    }
}
