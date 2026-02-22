<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmbedSession extends Model
{
    protected $fillable = [
        'embed_partner_id', 'source_domain', 'insurance_type', 'session_token',
        'quote_data', 'quote_request_id', 'converted_at', 'ip_address', 'user_agent',
    ];

    protected $casts = [
        'quote_data' => 'array',
        'converted_at' => 'datetime',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(EmbedPartner::class, 'embed_partner_id');
    }

    public function quoteRequest(): BelongsTo
    {
        return $this->belongsTo(\App\Models\QuoteRequest::class);
    }
}
