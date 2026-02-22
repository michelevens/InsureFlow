<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\AgentAvailability;
use App\Models\AgentBlockedDate;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    /**
     * List appointments for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Appointment::with(['agent', 'consumer', 'lead']);

        if ($user->role === 'consumer') {
            $query->where('consumer_id', $user->id);
        } else {
            $query->where('agent_id', $user->id);
        }

        if ($request->has('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $appointments = $query->orderBy('date')->orderBy('start_time')->get();

        return response()->json($appointments);
    }

    /**
     * Create a new appointment.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'agent_id' => 'required|integer|exists:users,id',
            'consumer_id' => 'nullable|integer|exists:users,id',
            'lead_id' => 'nullable|integer|exists:leads,id',
            'title' => 'required|string|max:255',
            'type' => 'sometimes|in:consultation,review,follow_up,claim,renewal,other',
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'location' => 'nullable|string|max:255',
            'video_link' => 'nullable|url|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Check for conflicts
        $conflict = Appointment::where('agent_id', $data['agent_id'])
            ->where('date', $data['date'])
            ->where('status', '!=', 'cancelled')
            ->where(function ($q) use ($data) {
                $q->whereBetween('start_time', [$data['start_time'], $data['end_time']])
                  ->orWhereBetween('end_time', [$data['start_time'], $data['end_time']])
                  ->orWhere(function ($q2) use ($data) {
                      $q2->where('start_time', '<=', $data['start_time'])
                         ->where('end_time', '>=', $data['end_time']);
                  });
            })
            ->exists();

        if ($conflict) {
            return response()->json(['message' => 'Time slot conflicts with an existing appointment'], 422);
        }

        // Check blocked dates
        $blocked = AgentBlockedDate::where('agent_id', $data['agent_id'])
            ->where('blocked_date', $data['date'])
            ->exists();

        if ($blocked) {
            return response()->json(['message' => 'Agent is unavailable on this date'], 422);
        }

        $appointment = Appointment::create($data);
        $appointment->load(['agent', 'consumer']);

        return response()->json($appointment, 201);
    }

    /**
     * Show a single appointment.
     */
    public function show(Appointment $appointment)
    {
        $appointment->load(['agent', 'consumer', 'lead']);
        return response()->json($appointment);
    }

    /**
     * Update appointment status (confirm, complete, cancel, no_show).
     */
    public function updateStatus(Request $request, Appointment $appointment)
    {
        $data = $request->validate([
            'status' => 'required|in:scheduled,confirmed,completed,cancelled,no_show',
            'notes' => 'nullable|string|max:1000',
        ]);

        $appointment->update($data);
        return response()->json($appointment);
    }

    /**
     * Update appointment details.
     */
    public function update(Request $request, Appointment $appointment)
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:consultation,review,follow_up,claim,renewal,other',
            'date' => 'sometimes|date|after_or_equal:today',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'video_link' => 'nullable|url|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        $appointment->update($data);
        return response()->json($appointment);
    }

    /**
     * Delete an appointment.
     */
    public function destroy(Appointment $appointment)
    {
        $appointment->delete();
        return response()->json(['message' => 'Appointment deleted']);
    }

    // ── Availability ─────────────────────────────

    /**
     * Get agent's weekly availability schedule.
     */
    public function getAvailability(Request $request)
    {
        $agentId = $request->query('agent_id', $request->user()->id);
        $availability = AgentAvailability::where('agent_id', $agentId)
            ->orderBy('day_of_week')
            ->get();

        return response()->json($availability);
    }

    /**
     * Set agent's weekly availability (bulk upsert).
     */
    public function setAvailability(Request $request)
    {
        $data = $request->validate([
            'schedule' => 'required|array',
            'schedule.*.day_of_week' => 'required|integer|between:0,6',
            'schedule.*.start_time' => 'required|date_format:H:i',
            'schedule.*.end_time' => 'required|date_format:H:i|after:schedule.*.start_time',
            'schedule.*.is_active' => 'sometimes|boolean',
        ]);

        $agentId = $request->user()->id;

        // Delete existing and recreate
        AgentAvailability::where('agent_id', $agentId)->delete();

        $records = [];
        foreach ($data['schedule'] as $slot) {
            $records[] = AgentAvailability::create([
                'agent_id' => $agentId,
                'day_of_week' => $slot['day_of_week'],
                'start_time' => $slot['start_time'],
                'end_time' => $slot['end_time'],
                'is_active' => $slot['is_active'] ?? true,
            ]);
        }

        return response()->json($records);
    }

    /**
     * Get blocked dates for an agent.
     */
    public function getBlockedDates(Request $request)
    {
        $agentId = $request->query('agent_id', $request->user()->id);
        $dates = AgentBlockedDate::where('agent_id', $agentId)
            ->where('blocked_date', '>=', now()->toDateString())
            ->orderBy('blocked_date')
            ->get();

        return response()->json($dates);
    }

    /**
     * Block a date.
     */
    public function blockDate(Request $request)
    {
        $data = $request->validate([
            'blocked_date' => 'required|date|after_or_equal:today',
            'reason' => 'nullable|string|max:255',
        ]);

        $blocked = AgentBlockedDate::create([
            'agent_id' => $request->user()->id,
            ...$data,
        ]);

        return response()->json($blocked, 201);
    }

    /**
     * Unblock a date.
     */
    public function unblockDate(AgentBlockedDate $blockedDate)
    {
        $blockedDate->delete();
        return response()->json(['message' => 'Date unblocked']);
    }

    /**
     * Get available time slots for a specific agent on a date.
     */
    public function availableSlots(Request $request)
    {
        $data = $request->validate([
            'agent_id' => 'required|integer|exists:users,id',
            'date' => 'required|date|after_or_equal:today',
            'duration_minutes' => 'sometimes|integer|min:15|max:120',
        ]);

        $duration = $data['duration_minutes'] ?? 30;
        $date = $data['date'];
        $agentId = $data['agent_id'];

        // Check blocked
        $blocked = AgentBlockedDate::where('agent_id', $agentId)
            ->where('blocked_date', $date)
            ->exists();

        if ($blocked) {
            return response()->json(['slots' => [], 'blocked' => true]);
        }

        // Get availability for this day of week
        $dayOfWeek = date('w', strtotime($date));
        $availability = AgentAvailability::where('agent_id', $agentId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->first();

        if (!$availability) {
            return response()->json(['slots' => [], 'no_availability' => true]);
        }

        // Get existing appointments
        $booked = Appointment::where('agent_id', $agentId)
            ->where('date', $date)
            ->where('status', '!=', 'cancelled')
            ->get(['start_time', 'end_time']);

        // Generate slots
        $slots = [];
        $start = strtotime($availability->start_time);
        $end = strtotime($availability->end_time);
        $step = $duration * 60;

        for ($time = $start; $time + $step <= $end; $time += $step) {
            $slotStart = date('H:i', $time);
            $slotEnd = date('H:i', $time + $step);

            // Check overlap with booked appointments
            $isBooked = $booked->contains(function ($appt) use ($slotStart, $slotEnd) {
                return $appt->start_time < $slotEnd && $appt->end_time > $slotStart;
            });

            $slots[] = [
                'start_time' => $slotStart,
                'end_time' => $slotEnd,
                'available' => !$isBooked,
            ];
        }

        return response()->json(['slots' => $slots]);
    }
}
