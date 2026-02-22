<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobPosting extends Model
{
    protected $fillable = [
        'agency_id', 'user_id', 'title', 'description', 'requirements',
        'compensation', 'location', 'is_remote', 'status', 'employment_type',
    ];

    protected $casts = [
        'requirements' => 'array',
        'compensation' => 'array',
        'is_remote' => 'boolean',
    ];

    public function agency(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Agency::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }
}
