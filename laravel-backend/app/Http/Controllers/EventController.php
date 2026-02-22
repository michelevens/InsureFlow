<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Event::with(['host:id,first_name,last_name', 'organization:id,name'])
            ->withCount('registrations');

        if ($request->query('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->query('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->query('upcoming')) {
            $query->where('start_at', '>', now())->orderBy('start_at');
        } else {
            $query->orderByDesc('start_at');
        }

        $events = $query->paginate($request->query('per_page', 20));

        return response()->json($events);
    }

    public function show(int $eventId): JsonResponse
    {
        $event = Event::with([
            'host:id,first_name,last_name',
            'organization:id,name',
            'registrations.user:id,first_name,last_name,email',
        ])->findOrFail($eventId);

        return response()->json($event);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:webinar,in_person,hybrid',
            'location' => 'nullable|string|max:255',
            'meeting_url' => 'nullable|url|max:255',
            'start_at' => 'required|date|after:now',
            'end_at' => 'required|date|after:start_at',
            'max_attendees' => 'nullable|integer|min:1',
            'status' => 'in:draft,published',
        ]);

        $validated['host_id'] = $request->user()->id;
        $validated['organization_id'] = $request->user()->agency_id;

        $event = Event::create($validated);

        return response()->json($event->load('host:id,first_name,last_name'), 201);
    }

    public function update(Request $request, int $eventId): JsonResponse
    {
        $event = Event::findOrFail($eventId);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|in:webinar,in_person,hybrid',
            'location' => 'nullable|string|max:255',
            'meeting_url' => 'nullable|url|max:255',
            'start_at' => 'sometimes|date',
            'end_at' => 'sometimes|date',
            'max_attendees' => 'nullable|integer|min:1',
            'status' => 'sometimes|in:draft,published,cancelled,completed',
        ]);

        $event->update($validated);

        return response()->json($event);
    }

    public function destroy(int $eventId): JsonResponse
    {
        Event::findOrFail($eventId)->delete();

        return response()->json(['message' => 'Event deleted']);
    }

    public function register(Request $request, int $eventId): JsonResponse
    {
        $event = Event::findOrFail($eventId);
        $userId = $request->user()->id;

        if ($event->max_attendees && $event->registration_count >= $event->max_attendees) {
            return response()->json(['message' => 'Event is full'], 422);
        }

        $existing = EventRegistration::where('event_id', $eventId)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Already registered'], 422);
        }

        $registration = EventRegistration::create([
            'event_id' => $eventId,
            'user_id' => $userId,
            'status' => 'registered',
        ]);

        $event->increment('registration_count');

        return response()->json($registration, 201);
    }

    public function cancelRegistration(Request $request, int $eventId): JsonResponse
    {
        $registration = EventRegistration::where('event_id', $eventId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $registration->update(['status' => 'cancelled']);
        Event::where('id', $eventId)->decrement('registration_count');

        return response()->json(['message' => 'Registration cancelled']);
    }

    public function attend(Request $request, int $eventId, int $userId): JsonResponse
    {
        $registration = EventRegistration::where('event_id', $eventId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $registration->update([
            'status' => 'attended',
            'attended_at' => now(),
        ]);

        return response()->json($registration);
    }

    public function myEvents(Request $request): JsonResponse
    {
        $registrations = EventRegistration::where('user_id', $request->user()->id)
            ->with('event')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($registrations);
    }
}
