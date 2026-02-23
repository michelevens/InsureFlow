<?php

namespace App\Http\Controllers;

use App\Mail\AccountApprovedMail;
use App\Models\Agency;
use App\Models\Carrier;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    // --- Users ---

    public function users(Request $request)
    {
        $query = User::query();

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        $users = $query->orderByDesc('created_at')->paginate(20);

        $counts = User::selectRaw("role, count(*) as count")
            ->groupBy('role')
            ->pluck('count', 'role');

        return response()->json([
            'users' => $users,
            'counts' => $counts,
        ]);
    }

    public function showUser(User $user)
    {
        $user->load(['agentProfile', 'agency', 'ownedAgency']);
        return response()->json($user);
    }

    public function updateUser(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'role' => 'sometimes|in:consumer,agent,agency_owner,carrier,admin,superadmin',
            'is_active' => 'sometimes|boolean',
        ]);

        $user->update($data);
        return response()->json($user);
    }

    public function approveUser(User $user)
    {
        $user->update([
            'is_active' => true,
            'approved_at' => now(),
        ]);

        Mail::to($user->email)->send(new AccountApprovedMail($user));

        return response()->json(['message' => 'User approved', 'user' => $user]);
    }

    public function deactivateUser(User $user)
    {
        $user->update(['is_active' => false]);
        return response()->json(['message' => 'User deactivated', 'user' => $user]);
    }

    // --- Agencies ---

    public function agencies(Request $request)
    {
        $query = Agency::with('owner');

        if ($search = $request->query('search')) {
            $query->where('name', 'ilike', "%{$search}%");
        }

        $agencies = $query->orderByDesc('created_at')->paginate(20);

        return response()->json($agencies);
    }

    public function showAgency(Agency $agency)
    {
        $agency->load(['owner', 'agents.agentProfile']);
        return response()->json($agency);
    }

    public function updateAgency(Request $request, Agency $agency)
    {
        $data = $request->validate([
            'is_verified' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
        ]);

        $agency->update($data);
        return response()->json($agency);
    }

    // --- Subscription Plans ---

    public function plans()
    {
        $plans = SubscriptionPlan::orderBy('sort_order')->get();
        return response()->json($plans);
    }

    public function storePlan(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:subscription_plans',
            'description' => 'nullable|string',
            'monthly_price' => 'required|numeric|min:0',
            'annual_price' => 'required|numeric|min:0',
            'target_role' => 'required|string',
            'features' => 'nullable|array',
            'limits' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
        ]);

        $plan = SubscriptionPlan::create($data);
        return response()->json($plan, 201);
    }

    public function updatePlan(Request $request, SubscriptionPlan $plan)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'monthly_price' => 'sometimes|numeric|min:0',
            'annual_price' => 'sometimes|numeric|min:0',
            'features' => 'nullable|array',
            'limits' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
        ]);

        $plan->update($data);
        return response()->json($plan);
    }

    public function deletePlan(SubscriptionPlan $plan)
    {
        $plan->delete();
        return response()->json(['message' => 'Plan deleted']);
    }

    // --- User Management ---

    public function createUser(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|in:consumer,agent,agency_owner,carrier,admin',
            'password' => 'required|string|min:8',
            'agency_id' => 'nullable|exists:agencies,id',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'password' => Hash::make($data['password']),
            'agency_id' => $data['agency_id'] ?? null,
            'is_active' => true,
        ]);

        return response()->json($user, 201);
    }

    public function resetPassword(User $user)
    {
        $tempPassword = Str::random(12);
        $user->update(['password' => Hash::make($tempPassword)]);

        return response()->json([
            'message' => 'Password reset successfully',
            'temporary_password' => $tempPassword,
        ]);
    }

    // --- Carriers ---

    public function carriers(Request $request)
    {
        $query = Carrier::withCount(['products', 'agencyAppointments']);

        if ($search = $request->query('search')) {
            $query->where('name', 'ilike', "%{$search}%");
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function showCarrier(Carrier $carrier)
    {
        $carrier->load('products');
        $carrier->loadCount('agencyAppointments');
        return response()->json($carrier);
    }

    public function storeCarrier(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:carriers',
            'description' => 'nullable|string',
            'logo_url' => 'nullable|string',
            'website' => 'nullable|string',
            'am_best_rating' => 'nullable|string|max:10',
            'states_available' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        $carrier = Carrier::create($data);
        return response()->json($carrier, 201);
    }

    public function updateCarrier(Request $request, Carrier $carrier)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'logo_url' => 'nullable|string',
            'website' => 'nullable|string',
            'am_best_rating' => 'nullable|string|max:10',
            'states_available' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        $carrier->update($data);
        return response()->json($carrier);
    }

    // --- Analytics ---

    public function analytics()
    {
        $monthlyUsers = User::selectRaw("to_char(created_at, 'YYYY-MM') as month, count(*) as count")
            ->groupByRaw("to_char(created_at, 'YYYY-MM')")
            ->orderBy('month')
            ->get();

        return response()->json([
            'monthly_users' => $monthlyUsers,
            'total_users' => User::count(),
            'active_users' => User::where('is_active', true)->count(),
        ]);
    }
}
