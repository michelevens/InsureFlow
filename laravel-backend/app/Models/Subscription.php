<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'user_id', 'subscription_plan_id', 'stripe_subscription_id',
        'stripe_customer_id', 'status', 'billing_cycle',
        'current_period_start', 'current_period_end', 'canceled_at',
    ];

    protected function casts(): array
    {
        return [
            'current_period_start' => 'datetime',
            'current_period_end' => 'datetime',
            'canceled_at' => 'datetime',
        ];
    }

    public function user() { return $this->belongsTo(User::class); }
    public function plan() { return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id'); }

    public function isActive(): bool
    {
        return $this->status === 'active' && ($this->current_period_end === null || $this->current_period_end->isFuture());
    }
}
