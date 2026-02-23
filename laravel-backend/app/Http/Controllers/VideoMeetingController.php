<?php

namespace App\Http\Controllers;

use App\Models\VideoMeeting;
use App\Models\VideoMeetingSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VideoMeetingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $status = $request->query('status');

        $query = VideoMeeting::where(function ($q) use ($user) {
            $q->where('host_user_id', $user->id)
              ->orWhere('guest_user_id', $user->id);
        })->with(['host:id,name,email', 'guest:id,name,email']);

        if ($status) {
            $query->where('status', $status);
        }

        $meetings = $query->orderByDesc('scheduled_at')
            ->limit(50)
            ->get();

        return response()->json($meetings);
    }

    public function showByToken(string $token): JsonResponse
    {
        $meeting = VideoMeeting::where('meeting_token', $token)
            ->with(['host:id,name,email', 'guest:id,name,email'])
            ->firstOrFail();

        return response()->json($meeting);
    }

    public function show(int $meetingId): JsonResponse
    {
        $meeting = VideoMeeting::with(['host:id,name,email', 'guest:id,name,email'])
            ->findOrFail($meetingId);

        return response()->json($meeting);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'guest_user_id' => 'nullable|integer|exists:users,id',
            'appointment_id' => 'nullable|integer|exists:appointments,id',
            'scheduled_at' => 'nullable|date',
            'meeting_type' => 'sometimes|in:system,external',
            'external_url' => 'nullable|url',
        ]);

        $user = $request->user();

        $settings = VideoMeetingSetting::where('user_id', $user->id)->first();
        $meetingType = $validated['meeting_type'] ?? ($settings?->preferred_provider === 'custom' ? 'external' : 'system');
        $externalUrl = $validated['external_url'] ?? $settings?->custom_meeting_link;
        $externalService = null;

        if ($meetingType === 'external' && $externalUrl) {
            $externalService = $this->detectService($externalUrl);
        }

        $meeting = VideoMeeting::create([
            'host_user_id' => $user->id,
            'guest_user_id' => $validated['guest_user_id'] ?? null,
            'organization_id' => $user->agency_id,
            'appointment_id' => $validated['appointment_id'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => 'scheduled',
            'meeting_type' => $meetingType,
            'external_service' => $externalService,
            'external_url' => $externalUrl,
            'meeting_token' => Str::uuid()->toString(),
            'scheduled_at' => $validated['scheduled_at'] ?? now(),
        ]);

        $meeting->load(['host:id,name,email', 'guest:id,name,email']);

        return response()->json($meeting, 201);
    }

    public function start(int $meetingId): JsonResponse
    {
        $meeting = VideoMeeting::findOrFail($meetingId);

        $meeting->update([
            'status' => 'in_progress',
            'started_at' => now(),
        ]);

        return response()->json($meeting);
    }

    public function end(int $meetingId): JsonResponse
    {
        $meeting = VideoMeeting::findOrFail($meetingId);

        $duration = $meeting->started_at
            ? (int) abs(now()->diffInSeconds($meeting->started_at))
            : 0;

        $meeting->update([
            'status' => 'completed',
            'ended_at' => now(),
            'duration_seconds' => $duration,
        ]);

        return response()->json($meeting);
    }

    public function cancel(int $meetingId): JsonResponse
    {
        $meeting = VideoMeeting::findOrFail($meetingId);

        $meeting->update(['status' => 'cancelled']);

        return response()->json($meeting);
    }

    public function getSettings(Request $request): JsonResponse
    {
        $settings = VideoMeetingSetting::firstOrCreate(
            ['user_id' => $request->user()->id],
            [
                'preferred_provider' => 'system',
                'waiting_room_enabled' => true,
                'early_join_minutes' => 10,
            ]
        );

        return response()->json($settings);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'preferred_provider' => 'sometimes|in:system,custom',
            'custom_service' => 'nullable|string|max:50',
            'custom_meeting_link' => 'nullable|url',
            'auto_record' => 'sometimes|boolean',
            'waiting_room_enabled' => 'sometimes|boolean',
            'early_join_minutes' => 'sometimes|integer|min:0|max:30',
        ]);

        $settings = VideoMeetingSetting::updateOrCreate(
            ['user_id' => $request->user()->id],
            $validated
        );

        return response()->json($settings);
    }

    public function generateLink(int $meetingId): JsonResponse
    {
        $meeting = VideoMeeting::findOrFail($meetingId);

        if ($meeting->meeting_type === 'external' && $meeting->external_url) {
            return response()->json([
                'url' => $meeting->external_url,
                'type' => 'external',
                'service' => $meeting->external_service,
            ]);
        }

        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://insurons.com')), '/');

        return response()->json([
            'url' => "{$frontendUrl}/meeting/{$meeting->meeting_token}",
            'type' => 'system',
            'token' => $meeting->meeting_token,
        ]);
    }

    private function detectService(string $url): ?string
    {
        $serviceMap = [
            'meet.google.com' => 'google-meet',
            'zoom.us' => 'zoom',
            'teams.microsoft.com' => 'teams',
            'meet.jit.si' => 'jitsi',
            'whereby.com' => 'whereby',
            'daily.co' => 'daily',
            'webex.com' => 'webex',
        ];

        foreach ($serviceMap as $domain => $service) {
            if (str_contains($url, $domain)) {
                return $service;
            }
        }

        return 'other';
    }
}
