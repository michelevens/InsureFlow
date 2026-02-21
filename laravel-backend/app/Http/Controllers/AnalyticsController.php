<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Lead;
use App\Models\Policy;
use App\Models\User;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        return match ($user->role) {
            'consumer' => $this->consumerStats($user),
            'agent' => $this->agentStats($user),
            'agency_owner' => $this->agencyStats($user),
            'carrier' => $this->carrierStats($user),
            'admin', 'superadmin' => $this->adminStats(),
            default => response()->json(['message' => 'Unknown role'], 400),
        };
    }

    private function consumerStats($user)
    {
        return response()->json([
            'quotes' => $user->quoteRequests()->count(),
            'applications' => $user->applications()->count(),
            'active_policies' => $user->policies()->where('status', 'active')->count(),
            'total_premium' => $user->policies()->where('status', 'active')->sum('monthly_premium'),
        ]);
    }

    private function agentStats($user)
    {
        return response()->json([
            'total_leads' => Lead::where('agent_id', $user->id)->count(),
            'new_leads' => Lead::where('agent_id', $user->id)->where('status', 'new')->count(),
            'applications' => Application::where('agent_id', $user->id)->count(),
            'policies_bound' => Policy::where('agent_id', $user->id)->count(),
            'total_commission' => $user->commissions()->sum('commission_amount'),
            'avg_rating' => $user->agentProfile?->avg_rating ?? 0,
        ]);
    }

    private function agencyStats($user)
    {
        $agency = $user->ownedAgency;
        if (!$agency) {
            return response()->json(['message' => 'No agency found'], 404);
        }

        $agentIds = $agency->agents()->pluck('id');

        return response()->json([
            'team_members' => $agentIds->count(),
            'total_leads' => Lead::whereIn('agent_id', $agentIds)->count(),
            'total_policies' => Policy::whereIn('agent_id', $agentIds)->count(),
            'total_revenue' => Policy::whereIn('agent_id', $agentIds)->sum('annual_premium'),
        ]);
    }

    private function carrierStats()
    {
        return response()->json([
            'active_products' => \App\Models\CarrierProduct::where('is_active', true)->count(),
            'total_applications' => Application::count(),
            'total_policies' => Policy::count(),
            'premium_volume' => Policy::where('status', 'active')->sum('annual_premium'),
        ]);
    }

    private function adminStats()
    {
        return response()->json([
            'total_users' => User::count(),
            'total_agents' => User::where('role', 'agent')->count(),
            'total_agencies' => \App\Models\Agency::count(),
            'total_leads' => Lead::count(),
            'total_policies' => Policy::count(),
            'total_applications' => Application::count(),
            'platform_revenue' => Policy::where('status', 'active')->sum('annual_premium'),
        ]);
    }
}
