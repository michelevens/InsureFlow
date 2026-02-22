<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailCampaign extends Model
{
    protected $fillable = [
        'organization_id',
        'name',
        'subject',
        'body_html',
        'target_segment',
        'status',
        'scheduled_at',
        'sent_at',
        'sent_count',
        'open_count',
        'click_count',
    ];

    protected $casts = [
        'target_segment' => 'array',
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
        'sent_count' => 'integer',
        'open_count' => 'integer',
        'click_count' => 'integer',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function sends(): HasMany
    {
        return $this->hasMany(EmailSend::class, 'campaign_id');
    }
}
