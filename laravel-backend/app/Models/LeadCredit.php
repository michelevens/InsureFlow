<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeadCredit extends Model
{
    protected $fillable = [
        'user_id',
        'agency_id',
        'credits_balance',
        'credits_used',
        'last_replenished_at',
    ];

    protected $casts = [
        'last_replenished_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(CreditTransaction::class);
    }

    /**
     * Deduct credits and record the transaction.
     */
    public function deduct(int $amount, string $description, ?string $refType = null, ?int $refId = null): CreditTransaction
    {
        $this->decrement('credits_balance', $amount);
        $this->increment('credits_used', $amount);

        return $this->transactions()->create([
            'user_id' => $this->user_id,
            'type' => 'debit',
            'amount' => $amount,
            'description' => $description,
            'reference_type' => $refType,
            'reference_id' => $refId,
        ]);
    }

    /**
     * Add credits and record the transaction.
     */
    public function addCredits(int $amount, string $description, string $type = 'credit'): CreditTransaction
    {
        $this->increment('credits_balance', $amount);

        return $this->transactions()->create([
            'user_id' => $this->user_id,
            'type' => $type,
            'amount' => $amount,
            'description' => $description,
        ]);
    }
}
