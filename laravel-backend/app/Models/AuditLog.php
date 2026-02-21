<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuditLog extends Model
{
    use HasUuids;

    const UPDATED_AT = null;

    protected $fillable = [
        'auditable_type',
        'auditable_id',
        'event_type',
        'actor_id',
        'actor_role',
        'old_values',
        'new_values',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'metadata' => 'array',
        ];
    }

    /**
     * Fields that must never appear in old_values / new_values.
     */
    private static array $sensitiveFields = [
        'password',
        'mfa_secret',
        'mfa_backup_codes',
        'remember_token',
        'email_verification_token',
    ];

    // ── Immutability Guards ──────────────────────────────────────

    public function save(array $options = [])
    {
        if ($this->exists) {
            throw new \RuntimeException('AuditLog records are immutable and cannot be updated.');
        }

        return parent::save($options);
    }

    public function delete()
    {
        throw new \RuntimeException('AuditLog records are immutable and cannot be deleted.');
    }

    // ── Static Factories ─────────────────────────────────────────

    /**
     * Record an audit event. Failures are logged but never bubble up.
     */
    public static function record(
        string $auditableType,
        string $auditableId,
        string $eventType,
        ?int $actorId,
        string $actorRole,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $metadata = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
    ): ?self {
        try {
            return self::create([
                'auditable_type' => $auditableType,
                'auditable_id' => (string) $auditableId,
                'event_type' => $eventType,
                'actor_id' => $actorId,
                'actor_role' => $actorRole,
                'old_values' => self::maskSensitive($oldValues),
                'new_values' => self::maskSensitive($newValues),
                'metadata' => $metadata,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to record audit log', [
                'auditable_type' => $auditableType,
                'auditable_id' => $auditableId,
                'event_type' => $eventType,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Record from an HTTP request context.
     */
    public static function recordFromRequest(
        string $auditableType,
        string $auditableId,
        string $eventType,
        ?Request $request = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $metadata = null,
    ): ?self {
        $user = $request?->user();

        return self::record(
            auditableType: $auditableType,
            auditableId: (string) $auditableId,
            eventType: $eventType,
            actorId: $user?->id,
            actorRole: $user?->role ?? 'system',
            oldValues: $oldValues,
            newValues: $newValues,
            metadata: $metadata,
            ipAddress: $request?->ip(),
            userAgent: $request ? substr((string) $request->userAgent(), 0, 500) : null,
        );
    }

    /**
     * Strip sensitive fields from value arrays.
     */
    private static function maskSensitive(?array $values): ?array
    {
        if ($values === null) {
            return null;
        }

        foreach (self::$sensitiveFields as $field) {
            if (array_key_exists($field, $values)) {
                $values[$field] = '[REDACTED]';
            }
        }

        return $values;
    }

    // ── Relations ────────────────────────────────────────────────

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
