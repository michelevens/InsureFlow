<?php

namespace App\Http\Controllers;

use App\Models\AiChatConversation;
use App\Models\AiChatMessage;
use App\Services\InsuranceAiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AiChatController extends Controller
{
    public function __construct(private InsuranceAiService $aiService) {}

    /**
     * List user's AI chat conversations.
     */
    public function conversations(Request $request)
    {
        $conversations = AiChatConversation::where('user_id', $request->user()->id)
            ->orderByDesc('updated_at')
            ->limit(50)
            ->get(['id', 'title', 'message_count', 'updated_at']);

        return response()->json($conversations);
    }

    /**
     * Get messages for a specific conversation.
     */
    public function messages(Request $request, string $conversationId)
    {
        $conversation = AiChatConversation::where('id', $conversationId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $messages = $conversation->messages()
            ->orderBy('created_at')
            ->get(['id', 'role', 'content', 'created_at']);

        return response()->json($messages);
    }

    /**
     * Send a message and get AI response.
     */
    public function chat(Request $request)
    {
        $data = $request->validate([
            'message' => 'required|string|max:2000',
            'conversation_id' => 'nullable|uuid',
            'context_page' => 'nullable|string|max:100',
        ]);

        $user = $request->user();

        // Rate limiting
        $dailyLimit = $this->aiService->getDailyLimit($user);
        $cacheKey = "ai_chat_count:{$user->id}:" . now()->format('Y-m-d');
        $todayCount = Cache::get($cacheKey, 0);

        if ($todayCount >= $dailyLimit) {
            return response()->json([
                'message' => "You've reached your daily limit of {$dailyLimit} AI messages. Upgrade your plan for more.",
                'limit_reached' => true,
            ], 429);
        }

        // Get or create conversation
        $conversation = null;
        if (!empty($data['conversation_id'])) {
            $conversation = AiChatConversation::where('id', $data['conversation_id'])
                ->where('user_id', $user->id)
                ->first();
        }

        if (!$conversation) {
            $conversation = AiChatConversation::create([
                'user_id' => $user->id,
                'title' => mb_substr($data['message'], 0, 80),
                'context_page' => $data['context_page'] ?? null,
            ]);
        }

        // Save user message
        AiChatMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $data['message'],
            'created_at' => now(),
        ]);

        // Build message history (last 20 messages for context)
        $history = $conversation->messages()
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->reverse()
            ->map(fn($m) => ['role' => $m->role, 'content' => $m->content])
            ->values()
            ->toArray();

        // Get AI response
        $result = $this->aiService->chat($user, $history, $data['context_page']);

        // Save assistant message
        $assistantMessage = AiChatMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $result['content'],
            'tokens_used' => $result['tokens'],
            'created_at' => now(),
        ]);

        // Update conversation stats
        $conversation->increment('message_count', 2);
        $conversation->increment('total_tokens', $result['tokens']);
        $conversation->touch();

        // Increment daily count
        Cache::put($cacheKey, $todayCount + 1, now()->endOfDay());

        return response()->json([
            'conversation_id' => $conversation->id,
            'message' => [
                'id' => $assistantMessage->id,
                'role' => 'assistant',
                'content' => $result['content'],
                'created_at' => $assistantMessage->created_at,
            ],
            'daily_count' => $todayCount + 1,
            'daily_limit' => $dailyLimit,
        ]);
    }

    /**
     * Get contextual suggestions based on user role and current page.
     */
    public function suggestions(Request $request)
    {
        $contextPage = $request->query('page');
        $suggestions = $this->aiService->getSuggestions($request->user(), $contextPage);

        return response()->json(['suggestions' => $suggestions]);
    }

    /**
     * Delete a conversation.
     */
    public function deleteConversation(Request $request, string $conversationId)
    {
        $conversation = AiChatConversation::where('id', $conversationId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $conversation->delete();

        return response()->json(['message' => 'Conversation deleted']);
    }
}
