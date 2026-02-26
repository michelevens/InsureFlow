<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function send(int $userId, string $type, string $title, string $body, ?string $icon = null, ?string $actionUrl = null, ?array $data = null): Notification
    {
        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'icon' => $icon,
            'action_url' => $actionUrl,
            'data' => $data,
        ]);

        // Fire-and-forget push to all user's subscribed devices
        $this->sendPush($userId, $title, $body, $actionUrl);

        return $notification;
    }

    /**
     * Send Web Push notifications to all of a user's subscribed devices.
     * Requires VAPID keys in env and minishlink/web-push package.
     */
    protected function sendPush(int $userId, string $title, string $body, ?string $actionUrl = null): void
    {
        $vapidPublic = config('services.webpush.vapid_public_key');
        $vapidPrivate = config('services.webpush.vapid_private_key');
        $vapidSubject = config('services.webpush.vapid_subject', 'mailto:support@insurons.com');

        if (!$vapidPublic || !$vapidPrivate) return;
        if (!class_exists(\Minishlink\WebPush\WebPush::class)) return;

        $subscriptions = PushSubscription::where('user_id', $userId)->get();
        if ($subscriptions->isEmpty()) return;

        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'action_url' => $actionUrl,
            'tag' => 'insurons-' . time(),
        ]);

        try {
            $webPush = new \Minishlink\WebPush\WebPush([
                'VAPID' => [
                    'subject' => $vapidSubject,
                    'publicKey' => $vapidPublic,
                    'privateKey' => $vapidPrivate,
                ],
            ]);

            foreach ($subscriptions as $sub) {
                $subscription = \Minishlink\WebPush\Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'publicKey' => $sub->p256dh_key,
                    'authToken' => $sub->auth_token,
                ]);
                $webPush->queueNotification($subscription, $payload);
            }

            foreach ($webPush->flush() as $report) {
                if ($report->isSubscriptionExpired()) {
                    PushSubscription::where('endpoint', $report->getEndpoint())->delete();
                }
            }
        } catch (\Throwable $e) {
            Log::debug('Web Push send failed: ' . $e->getMessage());
        }
    }

    public function notifyLeadAssigned(int $agentId, string $leadName, int $leadId): Notification
    {
        return $this->send(
            $agentId, 'lead_assigned',
            'New Lead Assigned',
            "You've been assigned a new lead: {$leadName}",
            'target', "/crm/leads/{$leadId}",
            ['lead_id' => $leadId],
        );
    }

    public function notifyQuoteReceived(int $consumerId, string $agentName, int $quoteId): Notification
    {
        return $this->send(
            $consumerId, 'quote_received',
            'New Quote Received',
            "{$agentName} has sent you a quote",
            'file-text', "/portal/quotes",
            ['quote_id' => $quoteId],
        );
    }

    public function notifyApplicationStatus(int $userId, string $status, int $applicationId): Notification
    {
        $statusLabels = [
            'submitted' => 'Application Submitted',
            'under_review' => 'Application Under Review',
            'approved' => 'Application Approved',
            'declined' => 'Application Declined',
        ];
        return $this->send(
            $userId, 'application_status',
            $statusLabels[$status] ?? 'Application Update',
            "Your insurance application status has been updated to: {$status}",
            'clipboard-list', "/applications",
            ['application_id' => $applicationId, 'status' => $status],
        );
    }

    public function notifyPolicyUpdate(int $userId, string $policyNumber, string $message): Notification
    {
        return $this->send(
            $userId, 'policy_update',
            'Policy Update',
            $message,
            'shield-check', "/policies",
            ['policy_number' => $policyNumber],
        );
    }

    public function notifyNewMessage(int $userId, string $senderName, int $conversationId): Notification
    {
        return $this->send(
            $userId, 'new_message',
            'New Message',
            "{$senderName} sent you a message",
            'message-square', "/messages",
            ['conversation_id' => $conversationId],
        );
    }

    public function notifyCommissionEarned(int $agentId, string $amount, int $commissionId): Notification
    {
        return $this->send(
            $agentId, 'commission_earned',
            'Commission Earned',
            "You earned a commission of {$amount}",
            'dollar-sign', "/commissions",
            ['commission_id' => $commissionId],
        );
    }

    public function notifyProfileAdvanced(int $userId, string $stage, int $profileId): Notification
    {
        return $this->send(
            $userId, 'profile_advanced',
            'Profile Stage Updated',
            "Your insurance profile has moved to: {$stage}",
            'trending-up', "/portal/applications",
            ['profile_id' => $profileId, 'stage' => $stage],
        );
    }

    public function notifyInviteAccepted(int $inviterId, string $userName, string $role): Notification
    {
        return $this->send(
            $inviterId, 'invite_accepted',
            'Invite Accepted',
            "{$userName} accepted your invitation and joined as {$role}",
            'user-plus', "/agency/team",
        );
    }
}
