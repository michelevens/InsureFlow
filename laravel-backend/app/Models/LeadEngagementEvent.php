<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadEngagementEvent extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'insurance_profile_id',
        'event_type',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function insuranceProfile(): BelongsTo
    {
        return $this->belongsTo(InsuranceProfile::class);
    }
}
