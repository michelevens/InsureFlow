<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CreditTransaction extends Model
{
    protected $fillable = [
        'lead_credit_id',
        'user_id',
        'type',
        'amount',
        'description',
        'reference_type',
        'reference_id',
    ];

    public function leadCredit(): BelongsTo
    {
        return $this->belongsTo(LeadCredit::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }
}
