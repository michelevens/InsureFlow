<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invite extends Model
{
    protected $fillable = [
        'email', 'token', 'role', 'agency_id', 'invited_by',
        'agency_name', 'contact_name', 'custom_message',
        'accepted_at', 'expires_at',
        'email_opened_at', 'link_clicked_at', 'open_count', 'click_count',
    ];

    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
            'expires_at' => 'datetime',
            'email_opened_at' => 'datetime',
            'link_clicked_at' => 'datetime',
        ];
    }

    public function agency()
    {
        return $this->belongsTo(Agency::class);
    }

    public function inviter()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function isPending(): bool
    {
        return is_null($this->accepted_at) && $this->expires_at->isFuture();
    }
}
