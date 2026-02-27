<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SellerBalance extends Model
{
    protected $fillable = [
        'agency_id', 'pending_amount', 'available_amount',
        'lifetime_earned', 'lifetime_paid',
    ];

    protected function casts(): array
    {
        return [
            'pending_amount' => 'decimal:2',
            'available_amount' => 'decimal:2',
            'lifetime_earned' => 'decimal:2',
            'lifetime_paid' => 'decimal:2',
        ];
    }

    public function agency()
    {
        return $this->belongsTo(Agency::class);
    }

    /**
     * Credit earnings from a marketplace sale.
     * Credits go straight to available (no hold period for now).
     */
    public function creditSale(float $amount): void
    {
        $this->increment('available_amount', $amount);
        $this->increment('lifetime_earned', $amount);
    }

    /**
     * Reserve amount for a payout request.
     */
    public function reserveForPayout(float $amount): bool
    {
        if ($this->available_amount < $amount) {
            return false;
        }
        $this->decrement('available_amount', $amount);
        return true;
    }

    /**
     * Release reserved amount back (payout rejected/failed).
     */
    public function releaseReserved(float $amount): void
    {
        $this->increment('available_amount', $amount);
    }

    /**
     * Confirm payout completed — move to lifetime_paid.
     */
    public function confirmPayout(float $amount): void
    {
        $this->increment('lifetime_paid', $amount);
    }
}
