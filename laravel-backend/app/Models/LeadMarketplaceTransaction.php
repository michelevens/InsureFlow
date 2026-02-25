<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadMarketplaceTransaction extends Model
{
    protected $fillable = [
        'listing_id', 'buyer_agency_id', 'buyer_user_id', 'seller_agency_id',
        'purchase_price', 'platform_fee', 'seller_payout',
        'new_profile_id', 'new_lead_id',
        'status', 'refund_reason',
        'stripe_payment_intent_id', 'stripe_checkout_session_id',
        'payment_status', 'platform_fee_amount', 'seller_payout_amount', 'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'purchase_price' => 'decimal:2',
            'platform_fee' => 'decimal:2',
            'seller_payout' => 'decimal:2',
            'platform_fee_amount' => 'decimal:2',
            'seller_payout_amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function listing()
    {
        return $this->belongsTo(LeadMarketplaceListing::class, 'listing_id');
    }

    public function buyerAgency()
    {
        return $this->belongsTo(Agency::class, 'buyer_agency_id');
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_user_id');
    }

    public function sellerAgency()
    {
        return $this->belongsTo(Agency::class, 'seller_agency_id');
    }

    public function newProfile()
    {
        return $this->belongsTo(InsuranceProfile::class, 'new_profile_id');
    }

    public function newLead()
    {
        return $this->belongsTo(Lead::class, 'new_lead_id');
    }
}
