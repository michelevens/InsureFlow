<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoMeetingSetting extends Model
{
    protected $fillable = [
        'user_id', 'preferred_provider', 'custom_service', 'custom_meeting_link',
        'auto_record', 'waiting_room_enabled', 'early_join_minutes',
    ];

    protected $casts = [
        'auto_record' => 'boolean',
        'waiting_room_enabled' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
