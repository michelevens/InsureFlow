<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id', 'assigned_by', 'consumer_id', 'lead_id', 'title', 'type',
        'priority', 'date', 'start_time', 'end_time', 'status', 'completed_at',
        'location', 'video_link', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function consumer()
    {
        return $this->belongsTo(User::class, 'consumer_id');
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }
}
