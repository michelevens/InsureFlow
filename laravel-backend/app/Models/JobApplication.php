<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplication extends Model
{
    protected $fillable = [
        'job_posting_id', 'applicant_name', 'applicant_email', 'applicant_phone',
        'resume_url', 'cover_letter', 'experience', 'status', 'notes',
    ];

    protected $casts = [
        'experience' => 'array',
    ];

    public function posting(): BelongsTo
    {
        return $this->belongsTo(JobPosting::class, 'job_posting_id');
    }
}
