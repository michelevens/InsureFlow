<?php

namespace App\Http\Controllers;

use App\Mail\InvitationMail;
use App\Models\Agency;
use App\Models\Invite;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class InviteController extends Controller
{
    /**
     * Admin invites a user (agent, agency_owner, carrier).
     * POST /admin/invites
     */
    public function adminInvite(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'email' => 'required|email',
            'role' => 'required|in:agent,agency_owner,carrier',
            'agency_id' => 'nullable|integer|exists:agencies,id',
        ]);

        // Don't invite existing users
        if (User::where('email', $data['email'])->exists()) {
            return response()->json(['message' => 'A user with this email already exists'], 422);
        }

        // Check for pending invite
        $existing = Invite::where('email', $data['email'])
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();

        if ($existing) {
            return response()->json(['message' => 'An active invite already exists for this email'], 422);
        }

        $invite = Invite::create([
            'email' => $data['email'],
            'token' => Str::random(64),
            'role' => $data['role'],
            'agency_id' => $data['agency_id'] ?? null,
            'invited_by' => $user->id,
            'expires_at' => now()->addDays(7),
        ]);

        $inviteUrl = rtrim(config('app.frontend_url', 'https://insurons.com'), '/')
            . '/invite/' . $invite->token;

        $agencyName = $invite->agency_id
            ? Agency::find($invite->agency_id)?->name ?? 'Insurons'
            : 'Insurons';

        try {
            Mail::to($data['email'])->send(new InvitationMail(
                inviterName: $user->name,
                agencyName: $agencyName,
                inviteUrl: $inviteUrl,
                role: $data['role'],
            ));
        } catch (\Exception $e) {
            \Log::warning('Invite email failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Invitation sent',
            'invite' => $invite,
            'invite_url' => $inviteUrl,
        ], 201);
    }

    /**
     * Agency owner invites an agent to their agency.
     * POST /agency/invites
     */
    public function agencyInvite(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'agency_owner') {
            return response()->json(['message' => 'Only agency owners can invite agents'], 403);
        }

        $agency = Agency::where('owner_id', $user->id)->first();

        if (!$agency) {
            return response()->json(['message' => 'No agency found for your account'], 404);
        }

        $data = $request->validate([
            'email' => 'required|email',
        ]);

        // Don't invite existing users in this agency
        $existingUser = User::where('email', $data['email'])->first();
        if ($existingUser && $existingUser->agency_id === $agency->id) {
            return response()->json(['message' => 'This user is already in your agency'], 422);
        }

        // Check for pending invite
        $existing = Invite::where('email', $data['email'])
            ->where('agency_id', $agency->id)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();

        if ($existing) {
            return response()->json(['message' => 'An active invite already exists for this email'], 422);
        }

        $invite = Invite::create([
            'email' => $data['email'],
            'token' => Str::random(64),
            'role' => 'agent',
            'agency_id' => $agency->id,
            'invited_by' => $user->id,
            'expires_at' => now()->addDays(7),
        ]);

        $inviteUrl = rtrim(config('app.frontend_url', 'https://insurons.com'), '/')
            . '/invite/' . $invite->token;

        try {
            Mail::to($data['email'])->send(new InvitationMail(
                inviterName: $user->name,
                agencyName: $agency->name,
                inviteUrl: $inviteUrl,
                role: 'Agent',
            ));
        } catch (\Exception $e) {
            \Log::warning('Agency invite email failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Invitation sent',
            'invite' => $invite,
            'invite_url' => $inviteUrl,
        ], 201);
    }

    /**
     * List pending invites for an agency.
     * GET /agency/invites
     */
    public function agencyInvites(Request $request): JsonResponse
    {
        $user = $request->user();
        $agency = Agency::where('owner_id', $user->id)->first();

        if (!$agency) {
            return response()->json(['message' => 'No agency found'], 404);
        }

        $invites = Invite::where('agency_id', $agency->id)
            ->with('inviter:id,name')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($invites);
    }

    /**
     * Get invite details (public — for accept invite page).
     * GET /invites/{token}
     */
    public function show(string $token): JsonResponse
    {
        $invite = Invite::where('token', $token)
            ->with(['agency:id,name', 'inviter:id,name'])
            ->first();

        if (!$invite) {
            return response()->json(['message' => 'Invite not found'], 404);
        }

        if ($invite->accepted_at) {
            return response()->json(['message' => 'This invite has already been used'], 422);
        }

        if ($invite->expires_at->isPast()) {
            return response()->json(['message' => 'This invite has expired'], 422);
        }

        return response()->json([
            'email' => $invite->email,
            'role' => $invite->role,
            'agency_name' => $invite->agency?->name ?? 'Insurons',
            'inviter_name' => $invite->inviter?->name ?? 'Admin',
        ]);
    }

    /**
     * Accept an invite — creates user account and links to agency.
     * POST /invites/{token}/accept
     */
    public function accept(Request $request, string $token): JsonResponse
    {
        $invite = Invite::where('token', $token)->first();

        if (!$invite || $invite->accepted_at || $invite->expires_at->isPast()) {
            return response()->json(['message' => 'Invalid or expired invite'], 422);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        // Check if user already exists with this email
        $existingUser = User::where('email', $invite->email)->first();

        if ($existingUser) {
            // Link existing user to agency
            if ($invite->agency_id) {
                $existingUser->update(['agency_id' => $invite->agency_id]);
            }
            $invite->update(['accepted_at' => now()]);
            $authToken = $existingUser->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Invite accepted, linked to agency',
                'user' => $existingUser,
                'token' => $authToken,
            ]);
        }

        // Create new user
        $user = User::create([
            'name' => $data['name'],
            'email' => $invite->email,
            'password' => Hash::make($data['password']),
            'role' => $invite->role,
            'agency_id' => $invite->agency_id,
            'is_active' => true,
            'email_verified_at' => now(), // Verified via invite email
        ]);

        $invite->update(['accepted_at' => now()]);

        $authToken = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Account created successfully',
            'user' => $user,
            'token' => $authToken,
        ], 201);
    }

    /**
     * Admin lists all invites.
     * GET /admin/invites
     */
    public function adminListInvites(Request $request): JsonResponse
    {
        $query = Invite::with(['agency:id,name', 'inviter:id,name']);

        if ($status = $request->query('status')) {
            if ($status === 'pending') {
                $query->whereNull('accepted_at')->where('expires_at', '>', now());
            } elseif ($status === 'accepted') {
                $query->whereNotNull('accepted_at');
            } elseif ($status === 'expired') {
                $query->whereNull('accepted_at')->where('expires_at', '<=', now());
            }
        }

        $invites = $query->orderByDesc('created_at')->paginate(20);

        return response()->json($invites);
    }
}
