<?php

namespace App\Http\Controllers;

use App\Mail\NewMessageMail;
use App\Models\Conversation;
use App\Models\InsuranceProfile;
use App\Models\Lead;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MessageController extends Controller
{
    public function __construct(protected NotificationService $notifications) {}

    /**
     * List all conversations for the authenticated user.
     * GET /conversations
     */
    public function conversations(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $conversations = Conversation::where('user_one_id', $userId)
            ->orWhere('user_two_id', $userId)
            ->with(['userOne', 'userTwo'])
            ->orderByDesc('last_message_at')
            ->get()
            ->map(function ($conv) use ($userId) {
                $other = $conv->getOtherUser($userId);
                $lastMessage = $conv->messages()->latest()->first();
                $unread = $conv->messages()
                    ->where('sender_id', '!=', $userId)
                    ->whereNull('read_at')
                    ->count();

                return [
                    'id' => $conv->id,
                    'other_user' => [
                        'id' => $other->id,
                        'name' => $other->name,
                        'role' => $other->role,
                    ],
                    'context_type' => $conv->context_type,
                    'context_id' => $conv->context_id,
                    'last_message' => $lastMessage?->body,
                    'last_message_at' => $lastMessage?->created_at?->toIso8601String(),
                    'unread_count' => $unread,
                ];
            });

        return response()->json(['conversations' => $conversations]);
    }

    /**
     * Get messages for a conversation.
     * GET /conversations/{id}/messages
     */
    public function messages(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()->id;

        $conv = Conversation::where(function ($q) use ($userId) {
            $q->where('user_one_id', $userId)->orWhere('user_two_id', $userId);
        })->findOrFail($id);

        // Mark unread messages as read
        $conv->messages()
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = $conv->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => [
                'id' => $m->id,
                'sender_id' => $m->sender_id,
                'body' => $m->body,
                'type' => $m->type,
                'attachment_url' => $m->attachment_url,
                'read_at' => $m->read_at?->toIso8601String(),
                'created_at' => $m->created_at->toIso8601String(),
            ]);

        return response()->json(['messages' => $messages]);
    }

    /**
     * Send a message in a conversation.
     * POST /conversations/{id}/messages
     */
    public function send(Request $request, int $id): JsonResponse
    {
        $request->validate(['body' => 'required|string|max:5000']);
        $userId = $request->user()->id;

        $conv = Conversation::where(function ($q) use ($userId) {
            $q->where('user_one_id', $userId)->orWhere('user_two_id', $userId);
        })->findOrFail($id);

        $message = $conv->messages()->create([
            'sender_id' => $userId,
            'body' => $request->body,
        ]);
        $conv->update(['last_message_at' => now()]);

        // Send notifications (non-blocking)
        $recipient = $conv->getOtherUser($userId);

        // Push + in-app notification
        try {
            $this->notifications->notifyNewMessage($recipient->id, $request->user()->name, $id);
        } catch (\Throwable $e) {
            Log::debug('Push notification failed for message: ' . $e->getMessage());
        }

        // Email notification
        try {
            Mail::to($recipient->email)->send(new NewMessageMail(
                senderName: $request->user()->name,
                messagePreview: mb_substr($request->body, 0, 100),
                conversationUrl: rtrim(config('app.frontend_url', 'https://insurons.com'), '/') . '/messages',
            ));
        } catch (\Throwable $e) {
            Log::warning('Message notification email failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => [
                'id' => $message->id,
                'sender_id' => $message->sender_id,
                'body' => $message->body,
                'type' => $message->type,
                'attachment_url' => null,
                'read_at' => null,
                'created_at' => $message->created_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get new messages since a given message ID (for efficient polling).
     * GET /conversations/{id}/new-messages?after=123
     */
    public function newMessages(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()->id;
        $afterId = (int) $request->query('after', '0');

        $conv = Conversation::where(function ($q) use ($userId) {
            $q->where('user_one_id', $userId)->orWhere('user_two_id', $userId);
        })->findOrFail($id);

        // Mark new messages from other user as read
        $conv->messages()
            ->where('sender_id', '!=', $userId)
            ->where('id', '>', $afterId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = $conv->messages()
            ->where('id', '>', $afterId)
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => [
                'id' => $m->id,
                'sender_id' => $m->sender_id,
                'body' => $m->body,
                'type' => $m->type,
                'attachment_url' => $m->attachment_url,
                'read_at' => $m->read_at?->toIso8601String(),
                'created_at' => $m->created_at->toIso8601String(),
            ]);

        return response()->json(['messages' => $messages]);
    }

    /**
     * Start a new conversation with initial message.
     * POST /conversations
     */
    public function startConversation(Request $request): JsonResponse
    {
        $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'body' => 'required|string|max:5000',
            'context_type' => 'nullable|in:quote,application,policy,lead',
            'context_id' => 'nullable|integer',
        ]);

        $userId = $request->user()->id;
        $recipientId = (int) $request->recipient_id;

        if ($userId === $recipientId) {
            return response()->json(['message' => 'Cannot message yourself'], 422);
        }

        // Check for existing conversation
        $conv = Conversation::where(function ($q) use ($userId, $recipientId) {
            $q->where('user_one_id', $userId)->where('user_two_id', $recipientId);
        })->orWhere(function ($q) use ($userId, $recipientId) {
            $q->where('user_one_id', $recipientId)->where('user_two_id', $userId);
        })->first();

        if (!$conv) {
            $conv = Conversation::create([
                'user_one_id' => min($userId, $recipientId),
                'user_two_id' => max($userId, $recipientId),
                'context_type' => $request->context_type,
                'context_id' => $request->context_id,
                'last_message_at' => now(),
            ]);
        }

        $message = $conv->messages()->create([
            'sender_id' => $userId,
            'body' => $request->body,
        ]);
        $conv->update(['last_message_at' => now()]);

        $other = $conv->getOtherUser($userId);

        // Send email notification (non-blocking)
        try {
            Mail::to($other->email)->send(new NewMessageMail(
                senderName: $request->user()->name,
                messagePreview: mb_substr($request->body, 0, 100),
                conversationUrl: rtrim(config('app.frontend_url', 'https://insurons.com'), '/') . '/messages',
            ));
        } catch (\Throwable $e) {
            Log::warning('Message notification email failed: ' . $e->getMessage());
        }

        return response()->json([
            'conversation' => [
                'id' => $conv->id,
                'other_user' => ['id' => $other->id, 'name' => $other->name, 'role' => $other->role],
                'context_type' => $conv->context_type,
                'context_id' => $conv->context_id,
                'last_message' => $message->body,
                'last_message_at' => $message->created_at->toIso8601String(),
                'unread_count' => 0,
            ],
            'message' => [
                'id' => $message->id,
                'sender_id' => $message->sender_id,
                'body' => $message->body,
                'type' => $message->type,
                'attachment_url' => null,
                'read_at' => null,
                'created_at' => $message->created_at->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Search users the current user can message.
     * GET /conversations/users?q=search
     */
    public function searchUsers(Request $request): JsonResponse
    {
        $request->validate(['q' => 'nullable|string|max:100']);
        $user = $request->user();
        $query = $request->q;

        $relatedIds = collect();

        // Agents in same agency
        if ($user->agency_id) {
            $relatedIds = $relatedIds->merge(
                User::where('agency_id', $user->agency_id)
                    ->where('id', '!=', $user->id)
                    ->pluck('id')
            );
        }

        // Agency owner → all agents in their agency
        if ($user->role === 'agency_owner') {
            $agency = $user->ownedAgency;
            if ($agency) {
                $relatedIds = $relatedIds->merge(
                    User::where('agency_id', $agency->id)
                        ->where('id', '!=', $user->id)
                        ->pluck('id')
                );
            }
        }

        // Agents see their assigned consumers (via insurance profiles)
        if (in_array($user->role, ['agent', 'agency_owner'])) {
            $relatedIds = $relatedIds->merge(
                InsuranceProfile::where('assigned_agent_id', $user->id)
                    ->pluck('user_id')
            );
        }

        // Consumers see their assigned agents
        if ($user->role === 'consumer') {
            $relatedIds = $relatedIds->merge(
                InsuranceProfile::where('user_id', $user->id)
                    ->whereNotNull('assigned_agent_id')
                    ->pluck('assigned_agent_id')
            );
        }

        // Existing conversation partners
        $relatedIds = $relatedIds->merge(
            Conversation::where('user_one_id', $user->id)->pluck('user_two_id')
        );
        $relatedIds = $relatedIds->merge(
            Conversation::where('user_two_id', $user->id)->pluck('user_one_id')
        );

        // Admin/superadmin can message anyone
        if (in_array($user->role, ['admin', 'superadmin'])) {
            $userQuery = User::where('id', '!=', $user->id)
                ->select('id', 'name', 'email', 'role');
        } else {
            $relatedIds = $relatedIds->unique()->reject(fn($id) => $id == $user->id)->values();

            if ($relatedIds->isEmpty()) {
                return response()->json(['users' => []]);
            }

            $userQuery = User::whereIn('id', $relatedIds)
                ->select('id', 'name', 'email', 'role');
        }

        if ($query && strlen($query) >= 2) {
            $userQuery->where(function ($q) use ($query) {
                $q->where('name', 'ilike', "%{$query}%")
                    ->orWhere('email', 'ilike', "%{$query}%");
            });
        }

        $users = $userQuery->orderBy('name')->limit(20)->get();

        return response()->json(['users' => $users]);
    }

    /**
     * Signal that the user is typing.
     * POST /conversations/{id}/typing
     */
    public function typing(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()->id;

        Conversation::where(function ($q) use ($userId) {
            $q->where('user_one_id', $userId)->orWhere('user_two_id', $userId);
        })->findOrFail($id);

        Cache::put("typing.{$id}.{$userId}", true, 5);

        return response()->json(['status' => 'ok']);
    }

    /**
     * Check if the other user is typing.
     * GET /conversations/{id}/typing
     */
    public function typingStatus(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()->id;

        $conv = Conversation::where(function ($q) use ($userId) {
            $q->where('user_one_id', $userId)->orWhere('user_two_id', $userId);
        })->findOrFail($id);

        $otherId = $conv->getOtherUser($userId)->id;
        $isTyping = Cache::get("typing.{$id}.{$otherId}", false);

        return response()->json(['is_typing' => $isTyping]);
    }

    /**
     * Mark a specific message as read.
     * PUT /messages/{id}/read
     */
    public function markRead(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()->id;

        $message = \App\Models\Message::where('id', $id)
            ->whereHas('conversation', function ($q) use ($userId) {
                $q->where('user_one_id', $userId)->orWhere('user_two_id', $userId);
            })
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->first();

        if ($message) {
            $message->update(['read_at' => now()]);
        }

        return response()->json(['status' => 'ok']);
    }
}
