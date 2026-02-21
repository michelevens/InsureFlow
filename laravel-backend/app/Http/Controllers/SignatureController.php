<?php

namespace App\Http\Controllers;

use App\Mail\SignatureRequestMail;
use App\Models\Application;
use App\Models\Signature;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SignatureController extends Controller
{
    /**
     * List signatures for an application.
     * GET /applications/{application}/signatures
     */
    public function index(Request $request, Application $application): JsonResponse
    {
        $signatures = $application->signatures()
            ->with(['signer:id,name', 'requester:id,name'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['signatures' => $signatures]);
    }

    /**
     * Request a signature from someone.
     * POST /applications/{application}/signatures
     */
    public function requestSignature(Request $request, Application $application): JsonResponse
    {
        $validated = $request->validate([
            'signer_name' => 'required|string|max:255',
            'signer_email' => 'required|email|max:255',
            'signer_role' => 'required|in:applicant,agent,carrier_rep,agency_owner',
            'message' => 'nullable|string|max:2000',
        ]);

        // Check for existing pending request
        $existing = $application->signatures()
            ->where('signer_email', $validated['signer_email'])
            ->where('status', 'requested')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'A signature request is already pending for this email'], 422);
        }

        $signature = Signature::create([
            'signable_type' => Application::class,
            'signable_id' => $application->id,
            'signer_role' => $validated['signer_role'],
            'signer_name' => $validated['signer_name'],
            'signer_email' => $validated['signer_email'],
            'requested_by' => $request->user()->id,
            'status' => 'requested',
            'request_message' => $validated['message'] ?? null,
            'requested_at' => now(),
        ]);

        // Send email notification
        try {
            $signUrl = rtrim(config('app.frontend_url', 'https://insurons.com'), '/')
                . '/signatures/' . $signature->id;
            Mail::to($validated['signer_email'])->send(new SignatureRequestMail(
                requesterName: $request->user()->name,
                signerName: $validated['signer_name'],
                signUrl: $signUrl,
                message: $validated['message'] ?? null,
            ));
        } catch (\Throwable $e) {
            Log::warning('Failed to send signature request email: ' . $e->getMessage());
        }

        return response()->json($signature->load('requester:id,name'), 201);
    }

    /**
     * Sign — submit a canvas-drawn signature.
     * PUT /signatures/{signature}/sign
     */
    public function sign(Request $request, Signature $signature): JsonResponse
    {
        $user = $request->user();

        if (!$this->canSign($user, $signature)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($signature->status !== 'requested') {
            return response()->json(['message' => 'This signature request is no longer pending'], 422);
        }

        $validated = $request->validate([
            'signature_data' => 'required|string', // base64 PNG
        ]);

        $signature->update([
            'status' => 'signed',
            'signature_data' => $validated['signature_data'],
            'signer_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'signed_at' => now(),
        ]);

        return response()->json($signature);
    }

    /**
     * Reject a signature request.
     * PUT /signatures/{signature}/reject
     */
    public function reject(Request $request, Signature $signature): JsonResponse
    {
        $user = $request->user();

        if (!$this->canSign($user, $signature)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($signature->status !== 'requested') {
            return response()->json(['message' => 'This signature request is no longer pending'], 422);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $signature->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['reason'] ?? null,
            'rejected_at' => now(),
        ]);

        return response()->json($signature);
    }

    /**
     * Get pending signature requests for the current user.
     * GET /signatures/pending
     */
    public function myPending(Request $request): JsonResponse
    {
        $signatures = Signature::forUser($request->user())
            ->requested()
            ->with(['signable', 'requester:id,name'])
            ->orderByDesc('requested_at')
            ->get();

        return response()->json(['signatures' => $signatures]);
    }

    private function canSign($user, Signature $signature): bool
    {
        if (in_array($user->role, ['admin', 'superadmin'])) return true;
        if ($signature->signer_id === $user->id) return true;
        if ($signature->signer_email === $user->email) return true;
        return false;
    }
}
