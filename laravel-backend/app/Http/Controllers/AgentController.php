<?php

namespace App\Http\Controllers;

use App\Models\AgentProfile;
use App\Models\AgentReview;
use App\Models\User;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function index(Request $request)
    {
        $query = AgentProfile::with('user');

        if ($search = $request->query('search')) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%");
            });
        }

        if ($specialty = $request->query('specialty')) {
            $query->whereJsonContains('specialties', $specialty);
        }

        if ($state = $request->query('state')) {
            $query->where('state', $state);
        }

        $agents = $query->orderByDesc('avg_rating')->paginate(20);

        return response()->json($agents);
    }

    public function show($id)
    {
        $profile = AgentProfile::where('user_id', $id)
            ->with(['user', 'reviews.user'])
            ->firstOrFail();

        return response()->json($profile);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'bio' => 'nullable|string|max:1000',
            'license_number' => 'nullable|string',
            'license_states' => 'nullable|array',
            'specialties' => 'nullable|array',
            'carriers' => 'nullable|array',
            'years_experience' => 'nullable|integer|min:0',
            'city' => 'nullable|string',
            'state' => 'nullable|string|max:2',
            'response_time' => 'nullable|string',
        ]);

        $profile = AgentProfile::updateOrCreate(
            ['user_id' => $user->id],
            $data
        );

        return response()->json($profile);
    }

    public function reviews($agentId)
    {
        $reviews = AgentReview::where('agent_id', $agentId)
            ->with('user')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($reviews);
    }

    public function storeReview(Request $request, $agentId)
    {
        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        $review = AgentReview::updateOrCreate(
            ['agent_id' => $agentId, 'user_id' => $request->user()->id],
            $data
        );

        // Update agent avg_rating
        $avg = AgentReview::where('agent_id', $agentId)->avg('rating');
        $count = AgentReview::where('agent_id', $agentId)->count();
        AgentProfile::where('user_id', $agentId)->update([
            'avg_rating' => round($avg, 2),
            'review_count' => $count,
        ]);

        return response()->json($review, 201);
    }

    public function replyToReview(Request $request, AgentReview $review)
    {
        $data = $request->validate([
            'agent_reply' => 'required|string|max:2000',
        ]);

        $review->update([
            'agent_reply' => $data['agent_reply'],
            'reply_at' => now(),
        ]);

        return response()->json($review);
    }
}
