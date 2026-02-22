<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportRun extends Model
{
    protected $fillable = [
        'definition_id',
        'status',
        'file_path',
        'file_format',
        'row_count',
        'started_at',
        'completed_at',
        'error_message',
    ];

    protected $casts = [
        'row_count' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function definition(): BelongsTo
    {
        return $this->belongsTo(ReportDefinition::class, 'definition_id');
    }
}
