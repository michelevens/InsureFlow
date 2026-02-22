<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoMeeting extends Model
{
    protected $fillable = [
        'appointment_id', 'host_user_id', 'guest_user_id', 'organization_id',
        'title', 'description', 'status', 'meeting_type', 'external_service',
        'external_url', 'meeting_token', 'scheduled_at', 'started_at',
        'ended_at', 'duration_seconds', 'metadata',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_user_id');
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guest_user_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}
