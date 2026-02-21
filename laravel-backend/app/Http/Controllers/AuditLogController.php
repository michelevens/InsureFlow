<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * List audit logs (admin only).
     * GET /admin/audit-logs
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = AuditLog::with('actor:id,name,role');

        if ($request->filled('auditable_type')) {
            $query->where('auditable_type', $request->input('auditable_type'));
        }
        if ($request->filled('event_type')) {
            $query->where('event_type', $request->input('event_type'));
        }
        if ($request->filled('actor_id')) {
            $query->where('actor_id', $request->input('actor_id'));
        }
        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->input('date_to'));
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 50));

        return response()->json($logs);
    }

    /**
     * Get audit trail for a specific entity.
     * GET /audit-logs/{entity_type}/{entity_id}
     */
    public function forEntity(Request $request, string $entityType, string $entityId): JsonResponse
    {
        $logs = AuditLog::where('auditable_type', $entityType)
            ->where('auditable_id', $entityId)
            ->with('actor:id,name,role')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($logs);
    }
}
