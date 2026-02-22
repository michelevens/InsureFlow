<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgentBlockedDate extends Model
{
    protected $fillable = ['agent_id', 'blocked_date', 'reason'];

    protected function casts(): array
    {
        return [
            'blocked_date' => 'date',
        ];
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }
}
