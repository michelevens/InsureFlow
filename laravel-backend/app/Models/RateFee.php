<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RateFee extends Model
{
    protected $fillable = [
        'rate_table_id', 'fee_code', 'fee_label',
        'fee_type', 'apply_mode', 'fee_value', 'sort_order',
    ];

    protected $casts = ['fee_value' => 'decimal:4', 'sort_order' => 'integer'];

    public function rateTable(): BelongsTo { return $this->belongsTo(RateTable::class); }
}
