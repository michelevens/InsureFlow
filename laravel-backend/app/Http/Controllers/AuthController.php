<?php

namespace App\Http\Controllers;

use App\Mail\EmailVerificationMail;
use App\Mail\RegistrationReceivedMail;
use App\Mail\WelcomeMail;
use App\Models\Agency;
use App\Models\Lead;
use App\Models\QuoteRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => ['required', 'confirmed', Password::min(8)->letters()->mixedCase()->numbers()],
            'role' => 'sometimes|in:consumer,agent,agency_owner,carrier',
            'phone' => 'nullable|string|max:20',
            'referral_code' => 'nullable|string|max:20',
            'agency_code' => 'nullable|string|max:20',
        ]);

        $role = $data['role'] ?? 'consumer';
        $needsApproval = in_array($role, ['agent', 'agency_owner', 'carrier']);

        // Resolve agency from agency code (for agents joining an agency)
        $agencyId = null;
        if (!empty($data['agency_code']) && $role === 'agent') {
            $agency = Agency::where('agency_code', strtoupper($data['agency_code']))
                ->where('is_active', true)
                ->first();

            if (!$agency) {
                return response()->json(['message' => 'Invalid agency code'], 422);
            }

            $agencyId = $agency->id;
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'], // 'hashed' cast auto-hashes
            'role' => $role,
            'phone' => $data['phone'] ?? null,
            'agency_id' => $agencyId,
            'is_active' => !$needsApproval,
            'email_verification_token' => Str::random(64),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        // Send emails (non-blocking — registration succeeds even if email fails)
        $verificationUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://insurons.com')), '/')
            . '/verify-email/' . $user->email_verification_token;

        try {
            Mail::to($user->email)->send(new WelcomeMail($user));
            Mail::to($user->email)->send(new EmailVerificationMail($user, $verificationUrl));

            if ($needsApproval) {
                Mail::to($user->email)->send(new RegistrationReceivedMail($user));
            }
        } catch (\Exception $e) {
            \Log::warning('Registration emails failed for user ' . $user->id . ': ' . $e->getMessage());
        }

        // Apply referral code if provided
        if (!empty($data['referral_code'])) {
            $this->applyReferralCode($user, $data['referral_code']);
        }

        return response()->json([
            'user' => $user,
            'token' => $token,
            'email_verified' => false,
            'needs_approval' => $needsApproval,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::guard('web')->attempt($data)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = Auth::guard('web')->user();

        if (!$user->is_active) {
            Auth::logout();
            return response()->json(['message' => 'Account is deactivated or pending approval'], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'email_verified' => !is_null($user->email_verified_at),
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $user->load(['agentProfile', 'agency', 'ownedAgency']);
        return response()->json([
            'user' => $user,
            'onboarding_completed' => (bool) $user->onboarding_completed,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
        ]);

        $user->update($data);
        return response()->json($user);
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = $request->user();

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $user->update(['password' => $data['password']]); // 'hashed' cast auto-hashes
        return response()->json(['message' => 'Password updated']);
    }

    public function registerFromQuote(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => ['required', 'confirmed', Password::min(8)],
            'phone' => 'nullable|string|max:20',
            'quote_request_id' => 'required|integer|exists:quote_requests,id',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'], // 'hashed' cast auto-hashes
            'role' => 'consumer',
            'phone' => $data['phone'] ?? null,
            'email_verification_token' => Str::random(64),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        // Link the quote request to the new user
        QuoteRequest::where('id', $data['quote_request_id'])
            ->whereNull('user_id')
            ->update(['user_id' => $user->id]);

        // Link any leads from this quote request to the new user
        Lead::where('quote_request_id', $data['quote_request_id'])
            ->whereNull('consumer_id')
            ->update(['consumer_id' => $user->id]);

        // Send welcome email
        Mail::to($user->email)->send(new WelcomeMail($user));

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function verifyEmail(string $token)
    {
        $user = User::where('email_verification_token', $token)->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid or expired verification token'], 422);
        }

        $user->update([
            'email_verified_at' => now(),
            'email_verification_token' => null,
        ]);

        return response()->json(['message' => 'Email verified successfully']);
    }

    public function resendVerification(Request $request)
    {
        $user = $request->user();

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified'], 422);
        }

        $user->update(['email_verification_token' => Str::random(64)]);

        $verificationUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://insurons.com')), '/')
            . '/verify-email/' . $user->email_verification_token;

        Mail::to($user->email)->send(new EmailVerificationMail($user, $verificationUrl));

        return response()->json(['message' => 'Verification email sent']);
    }

    public function checkEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $exists = User::where('email', $request->email)->exists();
        return response()->json(['exists' => $exists]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Don't reveal whether email exists
            return response()->json(['message' => 'If that email exists, a reset link has been sent.']);
        }

        try {
            $token = Str::random(64);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                ['token' => Hash::make($token), 'created_at' => now()]
            );

            $resetUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://insurons.com')), '/')
                . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);

            Mail::to($user->email)->send(new \App\Mail\PasswordResetMail($user, $resetUrl));
        } catch (\Throwable $e) {
            \Log::warning('Password reset failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Password reset is temporarily unavailable. Please try again later or contact support.',
            ], 503);
        }

        return response()->json(['message' => 'If that email exists, a reset link has been sent.']);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $data['email'])
            ->first();

        if (!$record || !Hash::check($data['token'], $record->token)) {
            return response()->json(['message' => 'Invalid or expired reset token'], 422);
        }

        // Check if token is older than 60 minutes
        if (now()->diffInMinutes($record->created_at) > 60) {
            return response()->json(['message' => 'Reset token has expired'], 422);
        }

        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->update(['password' => $data['password']]); // 'hashed' cast auto-hashes

        DB::table('password_reset_tokens')->where('email', $data['email'])->delete();

        return response()->json(['message' => 'Password reset successfully']);
    }

    public function demoLogin(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        // Allow known demo accounts (both domain variants) + ennhealth.com agency/agent accounts
        $demoEmails = [
            'consumer@insureflow.com',
            'agent@insureflow.com',
            'agent2@insureflow.com',
            'agency@insureflow.com',
            'carrier@insureflow.com',
            'admin@insureflow.com',
            'superadmin@insureflow.com',
            'consumer@insurons.com',
            'agent@insurons.com',
            'agent2@insurons.com',
            'agency@insurons.com',
            'carrier@insurons.com',
            'admin@insurons.com',
            'superadmin@insurons.com',
        ];

        $isDemoEmail = in_array($data['email'], $demoEmails)
            || str_contains($data['email'], '@ennhealth.com');

        if (!$isDemoEmail) {
            return response()->json(['message' => 'Not a demo account'], 403);
        }

        // Try exact email first, then swap domain variant
        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            $altEmail = str_contains($data['email'], '@insurons.com')
                ? str_replace('@insurons.com', '@insureflow.com', $data['email'])
                : str_replace('@insureflow.com', '@insurons.com', $data['email']);
            $user = User::where('email', $altEmail)->first();
        }

        if (!$user) {
            return response()->json(['message' => 'Demo account not found. Please run the seeder.'], 404);
        }

        // Reset password to known value (fixes any corruption from double-hashing)
        // Also ensure demo account is active and email-verified
        $user->password = 'password'; // 'hashed' cast auto-hashes
        $user->is_active = true;
        $user->email_verified_at = $user->email_verified_at ?? now();
        $user->save();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'email_verified' => !is_null($user->email_verified_at),
        ]);
    }

    private function applyReferralCode(User $user, string $code): void
    {
        $referralCode = \App\Models\ReferralCode::where('code', strtoupper($code))->first();

        if (!$referralCode || $referralCode->user_id === $user->id) {
            return;
        }

        if ($referralCode->max_uses && $referralCode->uses >= $referralCode->max_uses) {
            return;
        }

        \App\Models\Referral::create([
            'referrer_id' => $referralCode->user_id,
            'referred_id' => $user->id,
            'referral_code_id' => $referralCode->id,
            'status' => 'pending',
        ]);

        $referralCode->increment('uses');

        \App\Models\ReferralCredit::create([
            'user_id' => $user->id,
            'amount' => 10.00,
            'type' => 'bonus',
            'description' => 'Welcome bonus for joining via referral',
        ]);
    }
}
