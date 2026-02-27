<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SellerPayoutRequest extends Model
{
    protected $fillable = [
        'agency_id', 'requested_by', 'amount',
        'status', 'payout_method',
        'stripe_transfer_id', 'stripe_account_id',
        'admin_notes', 'failure_reason',
        'reviewed_by', 'reviewed_at', 'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'reviewed_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function agency()
    {
        return $this->belongsTo(Agency::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
