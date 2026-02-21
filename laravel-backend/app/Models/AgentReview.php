<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgentReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id', 'user_id', 'rating', 'comment',
        'agent_reply', 'reply_at',
    ];

    protected function casts(): array
    {
        return [
            'reply_at' => 'datetime',
        ];
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
