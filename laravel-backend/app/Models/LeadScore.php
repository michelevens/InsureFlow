<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadScore extends Model
{
    protected $fillable = [
        'insurance_profile_id',
        'score',
        'factors',
        'model_version',
    ];

    protected $casts = [
        'score' => 'integer',
        'factors' => 'array',
    ];

    public function insuranceProfile(): BelongsTo
    {
        return $this->belongsTo(InsuranceProfile::class);
    }
}
