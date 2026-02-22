<?php

namespace App\Http\Controllers;

use App\Models\Agency;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SamlController extends Controller
{
    /**
     * Initiate SAML SSO login — redirect to IdP.
     */
    public function login(string $agencySlug)
    {
        $agency = Agency::where('agency_code', strtoupper($agencySlug))
            ->where('sso_enabled', true)
            ->first();

        if (!$agency || !$agency->saml_sso_url) {
            return response()->json(['message' => 'SSO not configured for this agency'], 404);
        }

        // Build SAML AuthnRequest
        $id = '_' . Str::uuid();
        $issueInstant = now()->toIso8601String();
        $acsUrl = url("/api/sso/acs/{$agencySlug}");

        $request = base64_encode(gzdeflate(
            '<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" '
            . 'ID="' . $id . '" Version="2.0" IssueInstant="' . $issueInstant . '" '
            . 'Destination="' . $agency->saml_sso_url . '" '
            . 'AssertionConsumerServiceURL="' . $acsUrl . '">'
            . '<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">'
            . url('/api/sso/metadata') . '</saml:Issuer>'
            . '</samlp:AuthnRequest>'
        ));

        $redirectUrl = $agency->saml_sso_url . '?SAMLRequest=' . urlencode($request);

        return response()->json(['redirect_url' => $redirectUrl]);
    }

    /**
     * Assertion Consumer Service — receives SAML response from IdP.
     */
    public function acs(Request $request, string $agencySlug)
    {
        $agency = Agency::where('agency_code', strtoupper($agencySlug))
            ->where('sso_enabled', true)
            ->firstOrFail();

        $samlResponse = $request->input('SAMLResponse');
        if (!$samlResponse) {
            return response()->json(['message' => 'Missing SAML response'], 400);
        }

        // Decode and parse response
        $xml = base64_decode($samlResponse);
        $doc = new \DOMDocument();
        @$doc->loadXML($xml);

        $xpath = new \DOMXPath($doc);
        $xpath->registerNamespace('saml', 'urn:oasis:names:tc:SAML:2.0:assertion');

        // Extract attributes
        $nameId = $xpath->query('//saml:NameID')->item(0)?->textContent;
        $email = $nameId; // NameID is typically email

        // Try attribute statements
        $attributes = [];
        foreach ($xpath->query('//saml:Attribute') as $attr) {
            $name = $attr->getAttribute('Name');
            $value = $xpath->query('.//saml:AttributeValue', $attr)->item(0)?->textContent;
            if ($name && $value) {
                $attributes[strtolower($name)] = $value;
            }
        }

        $email = $attributes['email'] ?? $attributes['emailaddress'] ?? $email;
        $name = $attributes['name'] ?? $attributes['displayname']
            ?? (($attributes['firstname'] ?? '') . ' ' . ($attributes['lastname'] ?? ''));

        if (!$email) {
            return response()->json(['message' => 'Could not extract email from SAML response'], 400);
        }

        // Find or create user
        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name' => trim($name) ?: explode('@', $email)[0],
                'email' => $email,
                'password' => Str::random(32), // 'hashed' cast auto-hashes
                'role' => $agency->sso_default_role,
                'agency_id' => $agency->id,
                'sso_provider' => 'saml',
                'sso_id' => $nameId,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
        } else {
            $user->update([
                'sso_provider' => 'saml',
                'sso_id' => $nameId,
                'agency_id' => $user->agency_id ?? $agency->id,
            ]);
        }

        $token = $user->createToken('sso-token')->plainTextToken;

        // Redirect to frontend with token
        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://insurons.com')), '/');
        return redirect("{$frontendUrl}/sso/callback?token={$token}");
    }

    /**
     * SAML SP metadata.
     */
    public function metadata()
    {
        $entityId = url('/api/sso/metadata');
        $acsUrl = url('/api/sso/acs/{agency}');

        $xml = '<?xml version="1.0"?>'
            . '<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="' . $entityId . '">'
            . '<md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">'
            . '<md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="' . $acsUrl . '" index="0"/>'
            . '</md:SPSSODescriptor>'
            . '</md:EntityDescriptor>';

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }

    /**
     * Configure SSO for an agency (admin or agency_owner).
     */
    public function configure(Request $request)
    {
        $data = $request->validate([
            'agency_id' => 'required|integer|exists:agencies,id',
            'saml_entity_id' => 'required|string|max:500',
            'saml_sso_url' => 'required|url|max:1000',
            'saml_certificate' => 'required|string',
            'sso_default_role' => 'sometimes|in:agent,agency_owner',
        ]);

        $user = $request->user();
        $agency = Agency::findOrFail($data['agency_id']);

        // Only admin or agency owner can configure
        if (!in_array($user->role, ['admin', 'superadmin']) && $user->id !== $agency->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $agency->update([
            'saml_entity_id' => $data['saml_entity_id'],
            'saml_sso_url' => $data['saml_sso_url'],
            'saml_certificate' => $data['saml_certificate'],
            'sso_enabled' => true,
            'sso_default_role' => $data['sso_default_role'] ?? 'agent',
        ]);

        return response()->json(['message' => 'SSO configured', 'agency' => $agency]);
    }

    /**
     * Disable SSO for an agency.
     */
    public function disable(Request $request, Agency $agency)
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'superadmin']) && $user->id !== $agency->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $agency->update(['sso_enabled' => false]);
        return response()->json(['message' => 'SSO disabled']);
    }
}
