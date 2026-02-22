<?php

namespace App\Http\Controllers;

use App\Models\ForumCategory;
use App\Models\ForumPost;
use App\Models\ForumTopic;
use App\Models\ForumVote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ForumController extends Controller
{
    // Categories
    public function categories(): JsonResponse
    {
        $categories = ForumCategory::orderBy('order')
            ->withCount('topics')
            ->get();

        return response()->json($categories);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'order' => 'integer',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $category = ForumCategory::create($validated);

        return response()->json($category, 201);
    }

    // Topics
    public function topics(Request $request, int $categoryId): JsonResponse
    {
        $query = ForumTopic::where('category_id', $categoryId)
            ->with(['author:id,first_name,last_name', 'category:id,name,slug'])
            ->withCount('posts');

        if ($request->query('sort') === 'popular') {
            $query->orderByDesc('view_count');
        } else {
            $query->orderByDesc('is_pinned')->orderByDesc('last_reply_at');
        }

        $topics = $query->paginate($request->query('per_page', 20));

        return response()->json($topics);
    }

    public function showTopic(int $topicId): JsonResponse
    {
        $topic = ForumTopic::with([
            'author:id,first_name,last_name',
            'category:id,name,slug',
            'posts' => fn($q) => $q->with('author:id,first_name,last_name')->orderBy('created_at'),
        ])->findOrFail($topicId);

        $topic->increment('view_count');

        return response()->json($topic);
    }

    public function storeTopic(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:forum_categories,id',
            'title' => 'required|string|max:255',
            'body' => 'required|string',
        ]);

        $validated['author_id'] = $request->user()->id;
        $validated['slug'] = Str::slug($validated['title']) . '-' . Str::random(6);

        $topic = ForumTopic::create($validated);

        ForumCategory::where('id', $validated['category_id'])->increment('topic_count');

        return response()->json($topic->load('author:id,first_name,last_name'), 201);
    }

    public function updateTopic(Request $request, int $topicId): JsonResponse
    {
        $topic = ForumTopic::findOrFail($topicId);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'body' => 'sometimes|string',
            'is_pinned' => 'sometimes|boolean',
            'is_locked' => 'sometimes|boolean',
        ]);

        $topic->update($validated);

        return response()->json($topic);
    }

    public function destroyTopic(int $topicId): JsonResponse
    {
        $topic = ForumTopic::findOrFail($topicId);
        ForumCategory::where('id', $topic->category_id)->decrement('topic_count');
        $topic->delete();

        return response()->json(['message' => 'Topic deleted']);
    }

    // Posts (replies)
    public function storePost(Request $request, int $topicId): JsonResponse
    {
        $topic = ForumTopic::findOrFail($topicId);

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        $post = ForumPost::create([
            'topic_id' => $topic->id,
            'author_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        $topic->increment('reply_count');
        $topic->update(['last_reply_at' => now()]);

        return response()->json($post->load('author:id,first_name,last_name'), 201);
    }

    public function updatePost(Request $request, int $postId): JsonResponse
    {
        $post = ForumPost::findOrFail($postId);

        $validated = $request->validate([
            'content' => 'sometimes|string',
            'is_solution' => 'sometimes|boolean',
        ]);

        $post->update($validated);

        return response()->json($post);
    }

    public function destroyPost(int $postId): JsonResponse
    {
        $post = ForumPost::findOrFail($postId);
        ForumTopic::where('id', $post->topic_id)->decrement('reply_count');
        $post->delete();

        return response()->json(['message' => 'Post deleted']);
    }

    // Voting
    public function vote(Request $request, int $postId): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:upvote,downvote',
        ]);

        $userId = $request->user()->id;

        $existing = ForumVote::where('post_id', $postId)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            if ($existing->type === $validated['type']) {
                $existing->delete();
                if ($validated['type'] === 'upvote') {
                    ForumPost::where('id', $postId)->decrement('upvote_count');
                }
                return response()->json(['message' => 'Vote removed']);
            }
            $existing->update(['type' => $validated['type']]);
        } else {
            ForumVote::create([
                'post_id' => $postId,
                'user_id' => $userId,
                'type' => $validated['type'],
            ]);
        }

        if ($validated['type'] === 'upvote') {
            ForumPost::where('id', $postId)->increment('upvote_count');
        } else {
            ForumPost::where('id', $postId)->decrement('upvote_count');
        }

        return response()->json(['message' => 'Vote recorded']);
    }

    public function markSolution(int $postId): JsonResponse
    {
        $post = ForumPost::findOrFail($postId);

        // Unmark other solutions in same topic
        ForumPost::where('topic_id', $post->topic_id)
            ->where('is_solution', true)
            ->update(['is_solution' => false]);

        $post->update(['is_solution' => true]);

        return response()->json(['message' => 'Marked as solution']);
    }
}
