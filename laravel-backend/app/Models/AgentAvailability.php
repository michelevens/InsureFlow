<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgentAvailability extends Model
{
    protected $table = 'agent_availability';

    protected $fillable = [
        'agent_id', 'day_of_week', 'start_time', 'end_time', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public static function dayName(int $day): string
    {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][$day] ?? '';
    }
}
