<?php

namespace App\Http\Controllers;

use App\Models\HelpArticle;
use App\Models\HelpCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HelpCenterController extends Controller
{
    public function categories(): JsonResponse
    {
        $categories = HelpCategory::withCount(['articles' => fn($q) => $q->where('is_published', true)])
            ->orderBy('sort_order')
            ->get();

        return response()->json($categories);
    }

    public function articles(Request $request): JsonResponse
    {
        $query = HelpArticle::with('category:id,name,slug')
            ->where('is_published', true);

        if ($request->has('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category));
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content_markdown', 'like', "%{$search}%")
                  ->orWhereJsonContains('tags', $search);
            });
        }

        $articles = $query->orderBy('sort_order')->get();

        return response()->json($articles);
    }

    public function showArticle(string $slug): JsonResponse
    {
        $article = HelpArticle::with('category:id,name,slug')
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        $article->increment('view_count');

        return response()->json($article);
    }

    public function vote(Request $request, HelpArticle $article): JsonResponse
    {
        $data = $request->validate([
            'helpful' => 'required|boolean',
        ]);

        if ($data['helpful']) {
            $article->increment('helpful_count');
        } else {
            $article->increment('not_helpful_count');
        }

        return response()->json(['message' => 'Thanks for your feedback']);
    }

    // Admin endpoints
    public function storeCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:help_categories,slug',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $category = HelpCategory::create($data);
        return response()->json($category, 201);
    }

    public function storeArticle(Request $request): JsonResponse
    {
        $data = $request->validate([
            'help_category_id' => 'required|exists:help_categories,id',
            'title' => 'required|string|max:255',
            'content_markdown' => 'required|string',
            'tags' => 'nullable|array',
            'is_published' => 'sometimes|boolean',
        ]);

        $article = HelpArticle::create($data);
        return response()->json($article, 201);
    }

    public function updateArticle(Request $request, HelpArticle $article): JsonResponse
    {
        $data = $request->validate([
            'help_category_id' => 'sometimes|exists:help_categories,id',
            'title' => 'sometimes|string|max:255',
            'content_markdown' => 'sometimes|string',
            'tags' => 'nullable|array',
            'is_published' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
        ]);

        $article->update($data);
        return response()->json($article);
    }

    public function destroyArticle(HelpArticle $article): JsonResponse
    {
        $article->delete();
        return response()->json(['message' => 'Article deleted']);
    }
}
