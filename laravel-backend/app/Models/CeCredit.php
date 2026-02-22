<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CeCredit extends Model
{
    protected $fillable = [
        'user_id', 'course_name', 'provider', 'hours', 'category',
        'state', 'completion_date', 'certificate_url', 'course_number',
    ];

    protected $casts = [
        'completion_date' => 'date',
        'hours' => 'decimal:1',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
