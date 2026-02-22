<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizationMember extends Model
{
    protected $table = 'organization_members';

    protected $fillable = [
        'organization_id', 'user_id', 'role', 'permissions', 'is_primary',
    ];

    protected function casts(): array
    {
        return [
            'permissions' => 'array',
            'is_primary' => 'boolean',
        ];
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
