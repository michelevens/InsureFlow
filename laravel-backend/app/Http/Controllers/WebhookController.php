<?php

namespace App\Http\Controllers;

use App\Models\Webhook;
use App\Models\WebhookDelivery;
use App\Services\WebhookDispatchService;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function index(Request $request)
    {
        $webhooks = Webhook::where('user_id', $request->user()->id)
            ->withCount('deliveries')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($webhooks);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'url' => 'required|url|max:500',
            'events' => 'required|array|min:1',
            'events.*' => 'string',
        ]);

        $webhook = Webhook::create([
            ...$data,
            'user_id' => $request->user()->id,
        ]);

        return response()->json($webhook, 201);
    }

    public function update(Request $request, Webhook $webhook)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'url' => 'sometimes|url|max:500',
            'events' => 'sometimes|array|min:1',
            'events.*' => 'string',
            'is_active' => 'sometimes|boolean',
        ]);

        $webhook->update($data);
        return response()->json($webhook);
    }

    public function destroy(Webhook $webhook)
    {
        $webhook->delete();
        return response()->json(['message' => 'Webhook deleted']);
    }

    public function deliveries(Webhook $webhook)
    {
        $deliveries = $webhook->deliveries()->limit(50)->get();
        return response()->json($deliveries);
    }

    public function test(Request $request, Webhook $webhook, WebhookDispatchService $service)
    {
        $delivery = $service->send($webhook, 'test.ping', [
            'message' => 'Webhook test from Insurons',
            'timestamp' => now()->toIso8601String(),
        ]);

        return response()->json($delivery);
    }

    public function retry(WebhookDelivery $delivery, WebhookDispatchService $service)
    {
        $newDelivery = $service->retry($delivery);
        return response()->json($newDelivery);
    }

    public function eventTypes()
    {
        return response()->json(WebhookDispatchService::eventTypes());
    }
}
