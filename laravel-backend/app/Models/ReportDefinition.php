<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportDefinition extends Model
{
    protected $fillable = [
        'organization_id',
        'user_id',
        'name',
        'description',
        'query_config',
        'schedule',
        'recipients',
        'last_run_at',
        'is_active',
    ];

    protected $casts = [
        'query_config' => 'array',
        'recipients' => 'array',
        'last_run_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function runs(): HasMany
    {
        return $this->hasMany(ReportRun::class, 'definition_id');
    }
}
