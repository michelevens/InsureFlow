<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerReferral extends Model
{
    protected $fillable = [
        'listing_id',
        'referred_by',
        'consumer_id',
        'status',
        'commission_earned',
    ];

    protected $casts = [
        'commission_earned' => 'decimal:2',
    ];

    public function listing(): BelongsTo
    {
        return $this->belongsTo(PartnerListing::class, 'listing_id');
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    public function consumer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'consumer_id');
    }
}
