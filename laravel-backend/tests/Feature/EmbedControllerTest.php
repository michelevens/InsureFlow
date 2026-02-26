<?php

namespace Tests\Feature;

use App\Models\EmbedPartner;
use App\Models\EmbedSession;
use Tests\TestCase;

class EmbedControllerTest extends TestCase
{
    public function test_config_returns_partner_name_for_valid_key(): void
    {
        $partner = EmbedPartner::factory()->create(['name' => 'Acme Insurance']);

        $response = $this->getJson('/api/embed/config/' . $partner->api_key);

        $response->assertOk()
            ->assertJsonFragment(['partner_name' => 'Acme Insurance']);
    }

    public function test_config_returns_403_for_invalid_key(): void
    {
        $response = $this->getJson('/api/embed/config/emb_invalid_key_here');

        $response->assertStatus(403)
            ->assertJsonFragment(['error' => 'Invalid or inactive API key']);
    }

    public function test_config_returns_403_for_inactive_partner(): void
    {
        $partner = EmbedPartner::factory()->inactive()->create();

        $response = $this->getJson('/api/embed/config/' . $partner->api_key);

        $response->assertStatus(403);
    }

    public function test_quote_creates_session_and_returns_token(): void
    {
        $partner = EmbedPartner::factory()->create();

        $response = $this->postJson('/api/embed/quote', [
            'api_key' => $partner->api_key,
            'insurance_type' => 'auto',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['session_token', 'message', 'redirect_url']);

        $this->assertDatabaseHas('embed_sessions', [
            'embed_partner_id' => $partner->id,
            'insurance_type' => 'auto',
        ]);
    }

    public function test_mark_converted_updates_session(): void
    {
        $partner = EmbedPartner::factory()->create();

        // Create a session via the API
        $quoteResponse = $this->postJson('/api/embed/quote', [
            'api_key' => $partner->api_key,
            'insurance_type' => 'homeowners',
        ]);

        $sessionToken = $quoteResponse->json('session_token');

        // Mark as converted
        $response = $this->postJson('/api/embed/convert', [
            'session_token' => $sessionToken,
        ]);

        $response->assertOk()
            ->assertJsonFragment(['ok' => true]);

        $session = EmbedSession::where('session_token', $sessionToken)->first();
        $this->assertNotNull($session->converted_at);
    }

    public function test_quote_rejects_unauthorized_domain(): void
    {
        $partner = EmbedPartner::factory()->create([
            'allowed_domains' => ['trusted.com'],
        ]);

        $response = $this->postJson('/api/embed/quote', [
            'api_key' => $partner->api_key,
            'insurance_type' => 'auto',
        ], ['Origin' => 'https://evil.com']);

        $response->assertStatus(403)
            ->assertJsonFragment(['error' => 'Domain not allowed']);
    }
}
