<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id', 'agency_id', 'quote_request_id', 'consumer_id',
        'first_name', 'last_name', 'email', 'phone', 'zip_code', 'state',
        'insurance_type', 'status', 'source', 'estimated_value', 'notes',
        'is_pool', 'pool_status', 'max_claims', 'current_claims',
        'awarded_agency_id', 'pool_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'estimated_value' => 'decimal:2',
            'is_pool' => 'boolean',
            'pool_expires_at' => 'datetime',
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

    public function poolClaims()
    {
        return $this->hasMany(LeadPoolClaim::class);
    }

    public function awardedAgency()
    {
        return $this->belongsTo(Agency::class, 'awarded_agency_id');
    }
}
