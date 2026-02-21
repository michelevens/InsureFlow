<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InsuranceProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'agency_id', 'user_id',
        'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'zip_code',
        'insurance_type', 'coverage_level', 'current_stage',
        'quote_request_id', 'lead_id', 'application_id', 'policy_id',
        'assigned_agent_id',
        'estimated_value', 'monthly_premium', 'annual_premium',
        'source', 'details', 'data_snapshot', 'notes',
        'status', 'stage_updated_at', 'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
            'data_snapshot' => 'array',
            'date_of_birth' => 'date',
            'estimated_value' => 'decimal:2',
            'monthly_premium' => 'decimal:2',
            'annual_premium' => 'decimal:2',
            'stage_updated_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    // --- Relationships ---

    public function agency()
    {
        return $this->belongsTo(Agency::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignedAgent()
    {
        return $this->belongsTo(User::class, 'assigned_agent_id');
    }

    public function quoteRequest()
    {
        return $this->belongsTo(QuoteRequest::class);
    }

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function policy()
    {
        return $this->belongsTo(Policy::class);
    }

    // --- Scopes ---

    public function scopeForAgency($query, $agencyId)
    {
        return $query->where('agency_id', $agencyId);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeAtStage($query, string $stage)
    {
        return $query->where('current_stage', $stage);
    }

    // --- Stage Progression ---

    public function advanceTo(string $stage, array $attributes = []): self
    {
        $this->update(array_merge($attributes, [
            'current_stage' => $stage,
            'stage_updated_at' => now(),
        ]));

        return $this;
    }

    public function snapshotData(): array
    {
        $snapshot = [
            'profile' => $this->only(['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'zip_code']),
            'insurance' => $this->only(['insurance_type', 'coverage_level']),
            'stage' => $this->current_stage,
            'snapshot_at' => now()->toISOString(),
        ];

        if ($this->quoteRequest) {
            $snapshot['quote_request'] = $this->quoteRequest->only(['id', 'details', 'status']);
            $quotes = $this->quoteRequest->quotes()->get(['id', 'carrier_name', 'monthly_premium', 'annual_premium']);
            $snapshot['quotes'] = $quotes->toArray();
        }

        if ($this->lead) {
            $snapshot['lead'] = $this->lead->only(['id', 'status', 'source', 'estimated_value']);
        }

        if ($this->application) {
            $snapshot['application'] = $this->application->only(['id', 'reference', 'status', 'carrier_name', 'monthly_premium']);
        }

        if ($this->policy) {
            $snapshot['policy'] = $this->policy->only(['id', 'policy_number', 'status', 'monthly_premium', 'effective_date', 'expiration_date']);
        }

        return $snapshot;
    }

    // --- Factory Methods ---

    public static function findOrCreateFromQuote(QuoteRequest $quoteRequest, ?int $agencyId = null): self
    {
        if (!$quoteRequest->email) {
            return self::create([
                'agency_id' => $agencyId,
                'user_id' => $quoteRequest->user_id,
                'first_name' => $quoteRequest->first_name ?? 'Unknown',
                'last_name' => $quoteRequest->last_name ?? '',
                'email' => 'anonymous-' . $quoteRequest->id . '@placeholder.local',
                'phone' => $quoteRequest->phone,
                'date_of_birth' => $quoteRequest->date_of_birth,
                'zip_code' => $quoteRequest->zip_code,
                'insurance_type' => $quoteRequest->insurance_type,
                'coverage_level' => $quoteRequest->coverage_level ?? 'standard',
                'current_stage' => 'intake',
                'quote_request_id' => $quoteRequest->id,
                'source' => 'calculator',
                'details' => $quoteRequest->details,
            ]);
        }

        // Find existing profile for this email + insurance type within the agency
        $existing = self::where('email', $quoteRequest->email)
            ->where('insurance_type', $quoteRequest->insurance_type)
            ->when($agencyId, fn ($q) => $q->where('agency_id', $agencyId))
            ->first();

        if ($existing) {
            $existing->update([
                'quote_request_id' => $quoteRequest->id,
                'first_name' => $quoteRequest->first_name ?? $existing->first_name,
                'last_name' => $quoteRequest->last_name ?? $existing->last_name,
                'phone' => $quoteRequest->phone ?? $existing->phone,
                'date_of_birth' => $quoteRequest->date_of_birth ?? $existing->date_of_birth,
                'zip_code' => $quoteRequest->zip_code ?? $existing->zip_code,
                'details' => $quoteRequest->details ?? $existing->details,
            ]);
            return $existing;
        }

        return self::create([
            'agency_id' => $agencyId,
            'user_id' => $quoteRequest->user_id,
            'first_name' => $quoteRequest->first_name ?? 'Unknown',
            'last_name' => $quoteRequest->last_name ?? '',
            'email' => $quoteRequest->email,
            'phone' => $quoteRequest->phone,
            'date_of_birth' => $quoteRequest->date_of_birth,
            'zip_code' => $quoteRequest->zip_code,
            'insurance_type' => $quoteRequest->insurance_type,
            'coverage_level' => $quoteRequest->coverage_level ?? 'standard',
            'current_stage' => 'intake',
            'quote_request_id' => $quoteRequest->id,
            'source' => 'calculator',
            'details' => $quoteRequest->details,
        ]);
    }
}
