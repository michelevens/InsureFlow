<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use Illuminate\Http\Request;

class PolicyController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Policy::with(['carrierProduct.carrier', 'agent', 'user']);

        if ($user->role === 'consumer') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'agent') {
            $query->where('agent_id', $user->id);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $policies = $query->orderByDesc('created_at')->paginate(20);

        return response()->json($policies);
    }

    public function show(Policy $policy)
    {
        $policy->load(['carrierProduct.carrier', 'agent', 'user', 'application', 'commissions']);
        return response()->json($policy);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'application_id' => 'nullable|exists:applications,id',
            'user_id' => 'required|exists:users,id',
            'agent_id' => 'nullable|exists:users,id',
            'carrier_product_id' => 'required|exists:carrier_products,id',
            'type' => 'required|string',
            'carrier_name' => 'required|string',
            'monthly_premium' => 'required|numeric',
            'annual_premium' => 'required|numeric',
            'deductible' => 'nullable|numeric',
            'coverage_limit' => 'nullable|string',
            'coverage_details' => 'nullable|array',
            'effective_date' => 'required|date',
            'expiration_date' => 'required|date',
        ]);

        $policy = Policy::create([
            ...$data,
            'policy_number' => 'POL-' . strtoupper(uniqid()),
            'status' => 'active',
        ]);

        return response()->json($policy, 201);
    }

    public function updateStatus(Request $request, Policy $policy)
    {
        $data = $request->validate([
            'status' => 'required|in:active,expiring_soon,expired,cancelled',
        ]);

        $policy->update($data);
        return response()->json($policy);
    }
}
