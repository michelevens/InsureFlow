<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuoteRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'agency_id', 'insurance_type', 'zip_code', 'state',
        'coverage_level', 'details', 'description', 'first_name', 'last_name',
        'email', 'phone', 'date_of_birth', 'is_marketplace', 'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
            'date_of_birth' => 'date',
            'is_marketplace' => 'boolean',
            'expires_at' => 'datetime',
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

    public function agency()
    {
        return $this->belongsTo(Agency::class);
    }

    public function insuranceProfile()
    {
        return $this->hasOne(InsuranceProfile::class);
    }

    public function leads()
    {
        return $this->hasMany(Lead::class, 'quote_request_id');
    }
}
