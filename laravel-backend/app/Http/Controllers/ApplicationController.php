<?php

namespace App\Http\Controllers;

use App\Models\Application;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Application::with(['carrierProduct.carrier', 'agent', 'user']);

        if ($user->role === 'consumer') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'agent') {
            $query->where('agent_id', $user->id);
        } elseif ($user->role === 'carrier') {
            $query->whereHas('carrierProduct.carrier', function ($q) {
                // In production, filter by carrier user association
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $applications = $query->orderByDesc('created_at')->paginate(20);

        return response()->json($applications);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'carrier_product_id' => 'required|exists:carrier_products,id',
            'quote_id' => 'nullable|exists:quotes,id',
            'insurance_type' => 'required|string',
            'carrier_name' => 'required|string',
            'monthly_premium' => 'required|numeric',
            'applicant_data' => 'nullable|array',
        ]);

        $application = Application::create([
            ...$data,
            'reference' => 'APP-' . strtoupper(uniqid()),
            'user_id' => $request->user()->id,
            'status' => 'draft',
        ]);

        return response()->json($application, 201);
    }

    public function show(Application $application)
    {
        $application->load(['carrierProduct.carrier', 'agent', 'user', 'quote', 'policy']);
        return response()->json($application);
    }

    public function submit(Application $application)
    {
        $application->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return response()->json($application);
    }

    public function updateStatus(Request $request, Application $application)
    {
        $data = $request->validate([
            'status' => 'required|in:draft,submitted,under_review,approved,declined,bound',
        ]);

        $application->update($data);
        return response()->json($application);
    }
}
