<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get notifications for the authenticated user.
     * GET /notifications
     */
    public function index(Request $request): JsonResponse
    {
        $query = Notification::where('user_id', $request->user()->id);

        if ($request->boolean('unread_only')) {
            $query->whereNull('read_at');
        }

        $notifications = $query->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'body' => $n->body,
                'icon' => $n->icon,
                'action_url' => $n->action_url,
                'data' => $n->data,
                'read' => $n->isRead(),
                'created_at' => $n->created_at->toIso8601String(),
            ]);

        return response()->json(['notifications' => $notifications]);
    }

    /**
     * Get unread notification count.
     * GET /notifications/unread-count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark a notification as read.
     * PUT /notifications/{id}/read
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json(['status' => 'ok']);
    }

    /**
     * Mark all notifications as read.
     * POST /notifications/mark-all-read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['status' => 'ok']);
    }
}
