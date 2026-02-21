<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiChatMessage extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'conversation_id',
        'role',
        'content',
        'tokens_used',
        'created_at',
    ];

    protected $casts = [
        'tokens_used' => 'integer',
        'created_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AiChatConversation::class, 'conversation_id');
    }
}
