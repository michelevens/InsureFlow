<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RateFactor extends Model
{
    protected $fillable = [
        'rate_table_id', 'factor_code', 'factor_label',
        'option_value', 'apply_mode', 'factor_value', 'sort_order',
    ];

    protected $casts = ['factor_value' => 'decimal:6', 'sort_order' => 'integer'];

    public function rateTable(): BelongsTo { return $this->belongsTo(RateTable::class); }
}
