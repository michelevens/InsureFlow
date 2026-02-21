<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'role', 'phone', 'is_active', 'agency_id',
        'email_verification_token', 'approved_at',
        'mfa_secret', 'mfa_enabled', 'mfa_backup_codes',
    ];

    protected $hidden = ['password', 'remember_token', 'mfa_secret', 'mfa_backup_codes'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'approved_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'mfa_enabled' => 'boolean',
        ];
    }

    public function agentProfile()
    {
        return $this->hasOne(AgentProfile::class);
    }

    public function agency()
    {
        return $this->belongsTo(Agency::class);
    }

    public function ownedAgency()
    {
        return $this->hasOne(Agency::class, 'owner_id');
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function policies()
    {
        return $this->hasMany(Policy::class);
    }

    public function leads()
    {
        return $this->hasMany(Lead::class, 'agent_id');
    }

    public function commissions()
    {
        return $this->hasMany(Commission::class, 'agent_id');
    }

    public function reviews()
    {
        return $this->hasMany(AgentReview::class, 'agent_id');
    }

    public function quoteRequests()
    {
        return $this->hasMany(QuoteRequest::class);
    }

    public function subscription()
    {
        return $this->hasOne(Subscription::class)->latest();
    }

    public function referralCode()
    {
        return $this->hasOne(ReferralCode::class);
    }

    public function insuranceProfiles()
    {
        return $this->hasMany(InsuranceProfile::class);
    }

    public function assignedProfiles()
    {
        return $this->hasMany(InsuranceProfile::class, 'assigned_agent_id');
    }
}
