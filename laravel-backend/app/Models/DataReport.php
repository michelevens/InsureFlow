<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DataReport extends Model
{
    protected $fillable = [
        'data_subscription_id', 'user_id', 'report_type', 'title',
        'file_path', 'parameters', 'results', 'status',
    ];

    protected $casts = [
        'parameters' => 'array',
        'results' => 'array',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(DataSubscription::class, 'data_subscription_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
