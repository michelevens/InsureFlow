<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadPoolClaim extends Model
{
    protected $fillable = [
        'lead_id', 'agency_id', 'claimed_by', 'status',
        'claimed_at', 'quote_deadline', 'quoted_at', 'credits_spent',
    ];

    protected function casts(): array
    {
        return [
            'claimed_at' => 'datetime',
            'quote_deadline' => 'datetime',
            'quoted_at' => 'datetime',
        ];
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function agency()
    {
        return $this->belongsTo(Agency::class);
    }

    public function claimedBy()
    {
        return $this->belongsTo(User::class, 'claimed_by');
    }

    public function isExpired(): bool
    {
        return $this->status === 'claimed' && $this->quote_deadline && $this->quote_deadline->isPast();
    }
}
