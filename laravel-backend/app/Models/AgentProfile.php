<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgentProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'bio', 'license_number', 'npn', 'npn_verified',
        'npn_verified_at', 'npn_verified_by', 'license_lookup_url',
        'license_states', 'specialties', 'carriers', 'years_experience',
        'avg_rating', 'review_count', 'clients_served',
        'response_time', 'city', 'state',
        'is_claimed', 'claimed_by', 'claimed_at', 'source', 'source_id',
        'full_name', 'county', 'lines_of_authority', 'license_type',
        'license_issue_date', 'license_expiration_date', 'license_status',
    ];

    protected function casts(): array
    {
        return [
            'license_states' => 'array',
            'specialties' => 'array',
            'carriers' => 'array',
            'lines_of_authority' => 'array',
            'avg_rating' => 'decimal:2',
            'npn_verified_at' => 'datetime',
            'claimed_at' => 'datetime',
            'license_issue_date' => 'date',
            'license_expiration_date' => 'date',
            'is_claimed' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function claimedByUser()
    {
        return $this->belongsTo(User::class, 'claimed_by');
    }

    public function reviews()
    {
        return $this->hasMany(AgentReview::class, 'agent_id', 'user_id');
    }

    /**
     * Scope: unclaimed profiles available for agents to claim.
     */
    public function scopeUnclaimed($query)
    {
        return $query->where('is_claimed', false)->whereNull('user_id');
    }

    /**
     * Scope: search by NPN.
     */
    public function scopeByNpn($query, string $npn)
    {
        return $query->where('npn', $npn);
    }
}
