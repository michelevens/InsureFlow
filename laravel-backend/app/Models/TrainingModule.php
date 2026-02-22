<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TrainingModule extends Model
{
    protected $fillable = [
        'organization_id', 'title', 'description', 'content_type', 'content_url',
        'content_body', 'category', 'duration_minutes', 'sort_order', 'is_required', 'is_published',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_published' => 'boolean',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function completions(): HasMany
    {
        return $this->hasMany(TrainingCompletion::class);
    }
}
