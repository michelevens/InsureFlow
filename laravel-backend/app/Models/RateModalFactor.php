<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RateModalFactor extends Model
{
    protected $fillable = ['rate_table_id', 'mode', 'factor', 'flat_fee'];

    protected $casts = ['factor' => 'decimal:6', 'flat_fee' => 'decimal:2'];

    public function rateTable(): BelongsTo { return $this->belongsTo(RateTable::class); }
}
