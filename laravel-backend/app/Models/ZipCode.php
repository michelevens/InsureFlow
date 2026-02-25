<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZipCode extends Model
{
    protected $fillable = [
        'zip', 'city', 'state', 'county', 'latitude', 'longitude', 'timezone',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }
}
