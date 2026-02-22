<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RateRider extends Model
{
    protected $fillable = [
        'rate_table_id', 'rider_code', 'rider_label',
        'apply_mode', 'rider_value', 'rate_key_pattern',
        'is_default', 'sort_order',
    ];

    protected $casts = [
        'rider_value' => 'decimal:6',
        'is_default' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function rateTable(): BelongsTo { return $this->belongsTo(RateTable::class); }
}
