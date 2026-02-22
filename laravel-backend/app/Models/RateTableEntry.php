<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RateTableEntry extends Model
{
    protected $fillable = ['rate_table_id', 'rate_key', 'rate_value', 'dimensions'];

    protected $casts = ['rate_value' => 'decimal:6', 'dimensions' => 'array'];

    public function rateTable(): BelongsTo { return $this->belongsTo(RateTable::class); }
}
