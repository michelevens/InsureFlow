<?php

namespace App\Http\Controllers;

use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TestimonialController extends Controller
{
    /**
     * Public: Get all published testimonials.
     */
    public function published()
    {
        $testimonials = Testimonial::published()
            ->orderByDesc('published_at')
            ->get(['id', 'name', 'role', 'company', 'rating', 'content', 'photo_url', 'published_at']);

        return response()->json(['testimonials' => $testimonials]);
    }

    /**
     * Authenticated user submits feedback.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'content' => 'required|string|min:10|max:1000',
            'role'    => 'nullable|string|max:100',
            'company' => 'nullable|string|max:150',
        ]);

        $user = Auth::user();

        $testimonial = Testimonial::create([
            'user_id' => $user->id,
            'name'    => $user->name,
            'role'    => $validated['role'] ?? null,
            'company' => $validated['company'] ?? null,
            'rating'  => $validated['rating'],
            'content' => $validated['content'],
        ]);

        return response()->json([
            'message'     => 'Thank you for your feedback!',
            'testimonial' => $testimonial,
        ], 201);
    }

    /**
     * Admin: List all testimonials (published + pending).
     */
    public function index(Request $request)
    {
        $query = Testimonial::with('user:id,name,email')
            ->orderByDesc('created_at');

        if ($request->has('status')) {
            $query->where('is_published', $request->status === 'published');
        }

        $testimonials = $query->paginate(20);

        return response()->json($testimonials);
    }

    /**
     * Admin: Publish or unpublish a testimonial.
     */
    public function togglePublish(Testimonial $testimonial)
    {
        $testimonial->is_published = !$testimonial->is_published;
        $testimonial->published_at = $testimonial->is_published ? now() : null;
        $testimonial->save();

        return response()->json([
            'message'     => $testimonial->is_published ? 'Testimonial published.' : 'Testimonial unpublished.',
            'testimonial' => $testimonial,
        ]);
    }

    /**
     * Admin: Delete a testimonial.
     */
    public function destroy(Testimonial $testimonial)
    {
        $testimonial->delete();

        return response()->json(['message' => 'Testimonial deleted.']);
    }

    /**
     * Admin: Update testimonial content (edit before publishing).
     */
    public function update(Request $request, Testimonial $testimonial)
    {
        $validated = $request->validate([
            'name'    => 'sometimes|string|max:100',
            'role'    => 'nullable|string|max:100',
            'company' => 'nullable|string|max:150',
            'rating'  => 'sometimes|integer|min:1|max:5',
            'content' => 'sometimes|string|min:10|max:1000',
        ]);

        $testimonial->update($validated);

        return response()->json([
            'message'     => 'Testimonial updated.',
            'testimonial' => $testimonial,
        ]);
    }
}
