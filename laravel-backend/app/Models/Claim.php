<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Claim extends Model
{
    protected $fillable = [
        'policy_id',
        'consumer_id',
        'agent_id',
        'claim_number',
        'type',
        'status',
        'date_of_loss',
        'description',
        'location',
        'estimated_amount',
        'approved_amount',
        'deductible_amount',
        'settlement_amount',
        'details',
        'settled_at',
        'closed_at',
    ];

    protected $casts = [
        'date_of_loss' => 'date',
        'estimated_amount' => 'decimal:2',
        'approved_amount' => 'decimal:2',
        'deductible_amount' => 'decimal:2',
        'settlement_amount' => 'decimal:2',
        'details' => 'array',
        'settled_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public static function generateClaimNumber(): string
    {
        $prefix = 'CLM';
        $year = date('Y');
        $random = strtoupper(substr(uniqid(), -6));
        return "{$prefix}-{$year}-{$random}";
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(Policy::class);
    }

    public function consumer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'consumer_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ClaimActivity::class);
    }

    public function claimDocuments(): HasMany
    {
        return $this->hasMany(ClaimDocument::class);
    }
}
