<?php

namespace Tests\Feature;

use App\Models\Agency;
use App\Models\Lead;
use App\Models\LeadScenario;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class ConsumerMarketplaceTest extends TestCase
{
    public function test_submit_request_creates_quote_request(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/marketplace/insurance/request', [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane@example.com',
            'insurance_type' => 'auto',
            'zip_code' => '90210',
            'state' => 'CA',
            'coverage_level' => 'standard',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'quote_request_id', 'agents_matched']);

        $this->assertDatabaseHas('quote_requests', [
            'email' => 'jane@example.com',
            'insurance_type' => 'auto',
            'is_marketplace' => true,
        ]);
    }

    public function test_submit_request_matches_agencies_in_same_state(): void
    {
        Mail::fake();

        // Create an active, verified agency in CA with an owner
        $owner = User::factory()->agent()->create();
        $agency = Agency::create([
            'name' => 'CA Agency',
            'slug' => 'ca-agency',
            'agency_code' => Str::upper(Str::random(8)),
            'owner_id' => $owner->id,
            'state' => 'CA',
            'is_active' => true,
            'is_verified' => true,
        ]);

        $response = $this->postJson('/api/marketplace/insurance/request', [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane@example.com',
            'insurance_type' => 'auto',
            'zip_code' => '90210',
            'state' => 'CA',
        ]);

        $response->assertStatus(201);
        $this->assertGreaterThanOrEqual(1, $response->json('agents_matched'));

        $this->assertDatabaseHas('leads', [
            'agency_id' => $agency->id,
            'email' => 'jane@example.com',
            'source' => 'marketplace',
        ]);
    }

    public function test_view_scenario_by_valid_token(): void
    {
        // Build the full chain: user → agency → lead → scenario
        $agent = User::factory()->agent()->create();
        $agency = Agency::create([
            'name' => 'Test Agency',
            'slug' => 'test-agency',
            'agency_code' => Str::upper(Str::random(8)),
            'owner_id' => $agent->id,
            'state' => 'TX',
            'is_active' => true,
            'is_verified' => true,
        ]);

        $lead = Lead::create([
            'agent_id' => $agent->id,
            'agency_id' => $agency->id,
            'first_name' => 'Bob',
            'last_name' => 'Jones',
            'email' => 'bob@example.com',
            'insurance_type' => 'homeowners',
            'status' => 'quoted',
            'source' => 'marketplace',
        ]);

        $token = Str::random(64);
        LeadScenario::create([
            'lead_id' => $lead->id,
            'agent_id' => $agent->id,
            'scenario_name' => 'Homeowners $500k',
            'product_type' => 'homeowners',
            'consumer_visible' => true,
            'consumer_token' => $token,
            'sent_to_consumer_at' => now(),
            'consumer_status' => 'pending',
        ]);

        $response = $this->getJson("/api/scenarios/{$token}/view");

        $response->assertOk()
            ->assertJsonFragment(['scenario_name' => 'Homeowners $500k'])
            ->assertJsonFragment(['consumer_status' => 'viewed']);
    }

    public function test_respond_to_scenario_accept(): void
    {
        Mail::fake();

        $agent = User::factory()->agent()->create();
        $agency = Agency::create([
            'name' => 'Accept Agency',
            'slug' => 'accept-agency',
            'agency_code' => Str::upper(Str::random(8)),
            'owner_id' => $agent->id,
            'state' => 'FL',
            'is_active' => true,
            'is_verified' => true,
        ]);

        $lead = Lead::create([
            'agent_id' => $agent->id,
            'agency_id' => $agency->id,
            'first_name' => 'Alice',
            'last_name' => 'Wonder',
            'email' => 'alice@example.com',
            'insurance_type' => 'life_term',
            'status' => 'quoted',
            'source' => 'direct',
        ]);

        $token = Str::random(64);
        $scenario = LeadScenario::create([
            'lead_id' => $lead->id,
            'agent_id' => $agent->id,
            'scenario_name' => 'Term Life $1M',
            'product_type' => 'life_term',
            'consumer_visible' => true,
            'consumer_token' => $token,
            'sent_to_consumer_at' => now(),
            'consumer_status' => 'pending',
        ]);

        $response = $this->postJson("/api/scenarios/{$token}/respond", [
            'action' => 'accept',
        ]);

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Scenario accepted. Your agent will prepare the application.']);

        $scenario->refresh();
        $this->assertEquals('accepted', $scenario->consumer_status);
    }
}
