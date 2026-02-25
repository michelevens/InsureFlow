<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionSplit extends Model
{
    protected $fillable = [
        'commission_id', 'agent_id', 'split_percentage',
        'split_amount', 'role', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'split_percentage' => 'decimal:2',
            'split_amount' => 'decimal:2',
        ];
    }

    public function commission(): BelongsTo
    {
        return $this->belongsTo(Commission::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }
}
