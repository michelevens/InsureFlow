<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadMarketplaceListing extends Model
{
    protected $fillable = [
        'seller_agency_id', 'insurance_profile_id', 'lead_id',
        'insurance_type', 'state', 'zip_prefix', 'coverage_level', 'urgency',
        'asking_price', 'listing_type', 'min_bid', 'current_bid', 'current_bidder_id',
        'auction_ends_at', 'bid_count', 'suggested_price',
        'platform_fee', 'platform_fee_pct',
        'lead_score', 'lead_grade', 'has_phone', 'has_email', 'days_old',
        'status', 'expires_at', 'sold_at', 'seller_notes',
    ];

    protected function casts(): array
    {
        return [
            'asking_price' => 'decimal:2',
            'min_bid' => 'decimal:2',
            'current_bid' => 'decimal:2',
            'suggested_price' => 'decimal:2',
            'platform_fee' => 'decimal:2',
            'platform_fee_pct' => 'decimal:2',
            'has_phone' => 'boolean',
            'has_email' => 'boolean',
            'expires_at' => 'datetime',
            'sold_at' => 'datetime',
            'auction_ends_at' => 'datetime',
        ];
    }

    public function sellerAgency()
    {
        return $this->belongsTo(Agency::class, 'seller_agency_id');
    }

    public function insuranceProfile()
    {
        return $this->belongsTo(InsuranceProfile::class);
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function transaction()
    {
        return $this->hasOne(LeadMarketplaceTransaction::class, 'listing_id');
    }

    public function bids()
    {
        return $this->hasMany(LeadMarketplaceBid::class, 'listing_id');
    }

    public function currentBidder()
    {
        return $this->belongsTo(User::class, 'current_bidder_id');
    }

    // --- Scopes ---

    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
    }

    public function scopeForType($query, string $type)
    {
        return $query->where('insurance_type', $type);
    }

    public function scopeInState($query, string $state)
    {
        return $query->where('state', strtoupper($state));
    }

    // --- Helpers ---

    public function gradeFromScore(): string
    {
        $score = $this->lead_score ?? 0;
        if ($score >= 80) return 'A';
        if ($score >= 60) return 'B';
        if ($score >= 40) return 'C';
        if ($score >= 20) return 'D';
        return 'F';
    }
}
