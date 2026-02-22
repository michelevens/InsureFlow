<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id', 'agency_id', 'quote_request_id', 'consumer_id',
        'first_name', 'last_name', 'email', 'phone',
        'insurance_type', 'status', 'source', 'estimated_value', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'estimated_value' => 'decimal:2',
        ];
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function consumer()
    {
        return $this->belongsTo(User::class, 'consumer_id');
    }

    public function quoteRequest()
    {
        return $this->belongsTo(QuoteRequest::class);
    }

    public function activities()
    {
        return $this->hasMany(LeadActivity::class);
    }

    public function agency()
    {
        return $this->belongsTo(Agency::class);
    }

    public function insuranceProfile()
    {
        return $this->hasOne(InsuranceProfile::class);
    }

    public function scenarios()
    {
        return $this->hasMany(LeadScenario::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }
}
