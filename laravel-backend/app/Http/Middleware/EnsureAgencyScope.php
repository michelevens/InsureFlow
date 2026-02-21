<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAgencyScope
{
    /**
     * Enforce tenant isolation: scope requests to the authenticated user's agency.
     *
     * Sets request->attributes['agency_id'] for controllers to use.
     * Superadmin/admin can optionally override with ?agency_id= query param.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Determine the active agency context
        $agencyId = null;

        // Superadmin/admin can scope to any agency via query param
        if (in_array($user->role, ['superadmin', 'admin']) && $request->query('agency_id')) {
            $agencyId = (int) $request->query('agency_id');
        }
        // Agency owner — use their owned agency
        elseif ($user->role === 'agency_owner') {
            $owned = $user->ownedAgency;
            $agencyId = $owned?->id;
        }
        // Agent — use their assigned agency
        elseif ($user->agency_id) {
            $agencyId = $user->agency_id;
        }

        // Store agency context on the request for controllers
        $request->attributes->set('agency_id', $agencyId);
        $request->attributes->set('is_platform_admin', in_array($user->role, ['superadmin', 'admin']));

        return $next($request);
    }
}
