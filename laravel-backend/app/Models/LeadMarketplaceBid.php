<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadMarketplaceBid extends Model
{
    protected $fillable = [
        'listing_id',
        'bidder_id',
        'amount',
        'is_winning',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'is_winning' => 'boolean',
        ];
    }

    public function listing()
    {
        return $this->belongsTo(LeadMarketplaceListing::class, 'listing_id');
    }

    public function bidder()
    {
        return $this->belongsTo(User::class, 'bidder_id');
    }
}
