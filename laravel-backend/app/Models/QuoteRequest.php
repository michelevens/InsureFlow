<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuoteRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'insurance_type', 'zip_code', 'coverage_level',
        'details', 'first_name', 'last_name', 'email', 'phone',
        'date_of_birth',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
            'date_of_birth' => 'date',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function quotes()
    {
        return $this->hasMany(Quote::class);
    }
}
