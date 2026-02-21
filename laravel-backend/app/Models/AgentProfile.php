<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgentProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'bio', 'license_number', 'license_states',
        'specialties', 'carriers', 'years_experience',
        'avg_rating', 'review_count', 'clients_served',
        'response_time', 'city', 'state',
    ];

    protected function casts(): array
    {
        return [
            'license_states' => 'array',
            'specialties' => 'array',
            'carriers' => 'array',
            'avg_rating' => 'decimal:2',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviews()
    {
        return $this->hasMany(AgentReview::class, 'agent_id', 'user_id');
    }
}
