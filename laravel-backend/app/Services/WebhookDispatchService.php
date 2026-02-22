<?php

namespace App\Services;

use App\Models\Webhook;
use App\Models\WebhookDelivery;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookDispatchService
{
    /**
     * Dispatch an event to all matching webhooks.
     */
    public function dispatch(string $eventType, array $payload, ?int $userId = null): void
    {
        $query = Webhook::where('is_active', true)
            ->where('failure_count', '<', 10);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $webhooks = $query->get()->filter(function ($webhook) use ($eventType) {
            return in_array($eventType, $webhook->events) || in_array('*', $webhook->events);
        });

        foreach ($webhooks as $webhook) {
            $this->send($webhook, $eventType, $payload);
        }
    }

    /**
     * Send a single webhook delivery.
     */
    public function send(Webhook $webhook, string $eventType, array $payload): WebhookDelivery
    {
        $body = [
            'event' => $eventType,
            'data' => $payload,
            'timestamp' => now()->toIso8601String(),
        ];

        $signature = hash_hmac('sha256', json_encode($body), $webhook->secret);

        $delivery = new WebhookDelivery([
            'webhook_id' => $webhook->id,
            'event_type' => $eventType,
            'payload' => $body,
            'status' => 'pending',
        ]);

        $startTime = microtime(true);

        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'X-Webhook-Signature' => $signature,
                    'X-Webhook-Event' => $eventType,
                    'Content-Type' => 'application/json',
                ])
                ->post($webhook->url, $body);

            $delivery->response_status = $response->status();
            $delivery->response_body = substr($response->body(), 0, 5000);
            $delivery->response_time_ms = (int) ((microtime(true) - $startTime) * 1000);
            $delivery->status = $response->successful() ? 'success' : 'failed';

            if ($response->successful()) {
                $webhook->update(['failure_count' => 0, 'last_triggered_at' => now()]);
            } else {
                $webhook->increment('failure_count');
            }
        } catch (\Exception $e) {
            $delivery->error_message = substr($e->getMessage(), 0, 500);
            $delivery->response_time_ms = (int) ((microtime(true) - $startTime) * 1000);
            $delivery->status = 'failed';
            $webhook->increment('failure_count');
            Log::warning("Webhook delivery failed: {$e->getMessage()}", ['webhook_id' => $webhook->id]);
        }

        $delivery->save();
        return $delivery;
    }

    /**
     * Retry a failed delivery.
     */
    public function retry(WebhookDelivery $delivery): WebhookDelivery
    {
        return $this->send(
            $delivery->webhook,
            $delivery->event_type,
            $delivery->payload['data'] ?? []
        );
    }

    /**
     * List all supported event types.
     */
    public static function eventTypes(): array
    {
        return [
            'lead.created' => 'A new lead is created',
            'lead.updated' => 'A lead is updated',
            'lead.status_changed' => 'Lead status changes',
            'scenario.created' => 'A scenario is created for a lead',
            'application.created' => 'A new application is created',
            'application.submitted' => 'An application is submitted',
            'application.status_changed' => 'Application status changes',
            'policy.created' => 'A new policy is created',
            'policy.bound' => 'A policy is bound',
            'policy.cancelled' => 'A policy is cancelled',
            'claim.filed' => 'A new claim is filed',
            'claim.status_changed' => 'Claim status changes',
            'commission.earned' => 'A commission is earned',
            'payout.completed' => 'A payout is completed',
            'renewal.upcoming' => 'A renewal is upcoming',
        ];
    }
}
