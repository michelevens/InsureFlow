<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class GeneratedDocument extends Model
{
    protected $fillable = [
        'documentable_type', 'documentable_id', 'template_type',
        'file_path', 'file_name', 'file_size', 'metadata', 'generated_by',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function documentable(): MorphTo
    {
        return $this->morphTo();
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
