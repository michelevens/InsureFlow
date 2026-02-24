<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference', 'user_id', 'agent_id', 'agency_id', 'carrier_product_id',
        'quote_id', 'lead_scenario_id', 'lead_id', 'insurance_type', 'carrier_name',
        'monthly_premium', 'status', 'applicant_data', 'submitted_at',
        'signing_token', 'signer_name', 'signature_data', 'signer_ip', 'signed_at',
    ];

    protected function casts(): array
    {
        return [
            'applicant_data' => 'array',
            'monthly_premium' => 'decimal:2',
            'submitted_at' => 'datetime',
            'signed_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function carrierProduct()
    {
        return $this->belongsTo(CarrierProduct::class);
    }

    public function quote()
    {
        return $this->belongsTo(Quote::class);
    }

    public function policy()
    {
        return $this->hasOne(Policy::class);
    }

    public function agency()
    {
        return $this->belongsTo(Agency::class);
    }

    public function insuranceProfile()
    {
        return $this->hasOne(InsuranceProfile::class);
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function signatures()
    {
        return $this->morphMany(Signature::class, 'signable');
    }

    public function leadScenario()
    {
        return $this->belongsTo(LeadScenario::class);
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function insuredObjects()
    {
        return $this->morphMany(InsuredObject::class, 'insurable')->orderBy('sort_order');
    }

    public function coverages()
    {
        return $this->morphMany(Coverage::class, 'coverable')->orderBy('sort_order');
    }
}
