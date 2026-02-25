<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class TaskController extends Controller
{
    /**
     * List tasks for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Appointment::with(['agent', 'consumer', 'lead'])
            ->where('type', 'task');

        // Scope by role
        if (in_array($user->role, ['agent', 'agency_owner'])) {
            if ($user->role === 'agency_owner') {
                $agencyId = $user->agency_id;
                $query->whereHas('agent', fn ($q) => $q->where('agency_id', $agencyId));
            } else {
                $query->where('agent_id', $user->id);
            }
        } elseif (!in_array($user->role, ['admin', 'superadmin'])) {
            $query->where('agent_id', $user->id);
        }

        // Filters
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        if ($request->has('priority') && $request->priority) {
            $query->where('priority', $request->priority);
        }
        if ($request->boolean('overdue')) {
            $query->where('date', '<', Carbon::today())
                  ->whereNull('completed_at')
                  ->whereNotIn('status', ['completed', 'cancelled']);
        }
        if ($request->boolean('today')) {
            $query->where('date', Carbon::today());
        }

        $tasks = $query->orderByRaw("CASE WHEN completed_at IS NULL THEN 0 ELSE 1 END")
                       ->orderByRaw("CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END")
                       ->orderBy('date')
                       ->get();

        // Counts
        $baseQuery = Appointment::where('type', 'task');
        if (in_array($user->role, ['agent', 'agency_owner'])) {
            if ($user->role === 'agency_owner') {
                $agencyId = $user->agency_id;
                $baseQuery->whereHas('agent', fn ($q) => $q->where('agency_id', $agencyId));
            } else {
                $baseQuery->where('agent_id', $user->id);
            }
        } elseif (!in_array($user->role, ['admin', 'superadmin'])) {
            $baseQuery->where('agent_id', $user->id);
        }

        $counts = [
            'total' => (clone $baseQuery)->count(),
            'pending' => (clone $baseQuery)->whereNull('completed_at')->whereNotIn('status', ['completed', 'cancelled'])->count(),
            'overdue' => (clone $baseQuery)->where('date', '<', Carbon::today())->whereNull('completed_at')->whereNotIn('status', ['completed', 'cancelled'])->count(),
            'completed_today' => (clone $baseQuery)->whereDate('completed_at', Carbon::today())->count(),
            'due_today' => (clone $baseQuery)->where('date', Carbon::today())->whereNull('completed_at')->count(),
        ];

        return response()->json(compact('tasks', 'counts'));
    }

    /**
     * Create a task.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'lead_id' => 'nullable|integer|exists:leads,id',
            'date' => 'required|date',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'notes' => 'nullable|string|max:2000',
            'agent_id' => 'nullable|integer|exists:users,id',
        ]);

        $task = Appointment::create([
            'agent_id' => $data['agent_id'] ?? $request->user()->id,
            'assigned_by' => $request->user()->id,
            'lead_id' => $data['lead_id'] ?? null,
            'title' => $data['title'],
            'type' => 'task',
            'priority' => $data['priority'] ?? 'medium',
            'date' => $data['date'],
            'start_time' => '09:00',
            'end_time' => '09:30',
            'status' => 'scheduled',
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json($task->load(['agent', 'lead']), 201);
    }

    /**
     * Complete a task.
     */
    public function complete(Request $request, Appointment $task)
    {
        if ($task->type !== 'task') {
            return response()->json(['message' => 'Not a task'], 422);
        }

        $task->update([
            'status' => 'completed',
            'completed_at' => Carbon::now(),
        ]);

        return response()->json($task);
    }

    /**
     * Reopen a completed task.
     */
    public function reopen(Request $request, Appointment $task)
    {
        if ($task->type !== 'task') {
            return response()->json(['message' => 'Not a task'], 422);
        }

        $task->update([
            'status' => 'scheduled',
            'completed_at' => null,
        ]);

        return response()->json($task);
    }

    /**
     * Update a task.
     */
    public function update(Request $request, Appointment $task)
    {
        if ($task->type !== 'task') {
            return response()->json(['message' => 'Not a task'], 422);
        }

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'date' => 'sometimes|date',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'notes' => 'nullable|string|max:2000',
            'status' => 'sometimes|in:scheduled,confirmed,completed,cancelled',
            'agent_id' => 'sometimes|integer|exists:users,id',
        ]);

        if (isset($data['status']) && $data['status'] === 'completed') {
            $data['completed_at'] = Carbon::now();
        }

        $task->update($data);

        return response()->json($task->load(['agent', 'lead']));
    }

    /**
     * Delete a task.
     */
    public function destroy(Request $request, Appointment $task)
    {
        if ($task->type !== 'task') {
            return response()->json(['message' => 'Not a task'], 422);
        }

        $task->delete();

        return response()->json(['message' => 'Task deleted']);
    }
}
