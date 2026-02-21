<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Agency extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'agency_code', 'owner_id', 'description', 'phone', 'email',
        'website', 'address', 'city', 'state', 'zip_code',
        'is_verified', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function agents()
    {
        return $this->hasMany(User::class, 'agency_id');
    }

    public function insuranceProfiles()
    {
        return $this->hasMany(InsuranceProfile::class);
    }

    public function routingRules()
    {
        return $this->hasMany(RoutingRule::class);
    }
}
