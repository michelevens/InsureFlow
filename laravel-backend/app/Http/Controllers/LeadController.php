<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadActivity;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $query = Lead::where('agent_id', $request->user()->id)
            ->with('activities');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'ilike', "%{$search}%")
                  ->orWhere('last_name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        $leads = $query->orderByDesc('created_at')->paginate(20);

        // Get counts by status
        $counts = Lead::where('agent_id', $request->user()->id)
            ->selectRaw("status, count(*) as count")
            ->groupBy('status')
            ->pluck('count', 'status');

        return response()->json([
            'leads' => $leads,
            'counts' => $counts,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:20',
            'insurance_type' => 'required|string',
            'source' => 'nullable|string',
            'estimated_value' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $lead = Lead::create([
            ...$data,
            'agent_id' => $request->user()->id,
            'status' => 'new',
        ]);

        return response()->json($lead, 201);
    }

    public function show(Lead $lead)
    {
        $lead->load('activities.user');
        return response()->json($lead);
    }

    public function update(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email',
            'phone' => 'nullable|string|max:20',
            'insurance_type' => 'sometimes|string',
            'status' => 'sometimes|in:new,contacted,quoted,applied,won,lost',
            'estimated_value' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $oldStatus = $lead->status;
        $lead->update($data);

        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            LeadActivity::create([
                'lead_id' => $lead->id,
                'user_id' => $request->user()->id,
                'type' => 'status_change',
                'description' => "Status changed from {$oldStatus} to {$data['status']}",
            ]);
        }

        return response()->json($lead);
    }

    public function addActivity(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'type' => 'required|in:note,call,email,meeting,status_change',
            'description' => 'required|string',
            'metadata' => 'nullable|array',
        ]);

        $activity = LeadActivity::create([
            ...$data,
            'lead_id' => $lead->id,
            'user_id' => $request->user()->id,
        ]);

        return response()->json($activity, 201);
    }
}
