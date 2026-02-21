<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id', 'first_name', 'last_name', 'email', 'phone',
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

    public function activities()
    {
        return $this->hasMany(LeadActivity::class);
    }
}
