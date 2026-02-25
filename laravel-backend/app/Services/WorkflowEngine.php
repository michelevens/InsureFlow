<?php

namespace App\Services;

use App\Models\WorkflowExecution;
use App\Models\WorkflowRule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class WorkflowEngine
{
    /**
     * Fire a trigger event and execute matching workflow rules.
     */
    public function fire(string $event, array $context, ?int $agencyId = null): array
    {
        $rules = WorkflowRule::active()
            ->forEvent($event)
            ->where(function ($q) use ($agencyId) {
                $q->whereNull('agency_id'); // global rules
                if ($agencyId) {
                    $q->orWhere('agency_id', $agencyId);
                }
            })
            ->orderBy('priority')
            ->get();

        $results = [];

        foreach ($rules as $rule) {
            if (!$rule->conditionsMatch($context)) {
                $results[] = ['rule_id' => $rule->id, 'status' => 'skipped', 'reason' => 'conditions_not_met'];
                continue;
            }

            $results[] = $this->executeRule($rule, $event, $context);
        }

        return $results;
    }

    /**
     * Execute a single workflow rule.
     */
    public function executeRule(WorkflowRule $rule, string $event, array $context): array
    {
        $startTime = microtime(true);

        $execution = WorkflowExecution::create([
            'workflow_rule_id' => $rule->id,
            'agency_id' => $rule->agency_id,
            'trigger_event' => $event,
            'trigger_data' => $context,
            'status' => 'running',
        ]);

        $actionResults = [];

        try {
            foreach ($rule->actions as $action) {
                $type = $action['type'] ?? '';
                $config = $action['config'] ?? [];

                $result = $this->executeAction($type, $config, $context);
                $actionResults[] = [
                    'type' => $type,
                    'status' => $result['success'] ? 'completed' : 'failed',
                    'message' => $result['message'] ?? null,
                ];
            }

            $durationMs = (int) ((microtime(true) - $startTime) * 1000);

            $execution->update([
                'actions_executed' => $actionResults,
                'status' => 'completed',
                'duration_ms' => $durationMs,
            ]);

            $rule->increment('execution_count');
            $rule->update(['last_executed_at' => now()]);

            return ['rule_id' => $rule->id, 'status' => 'completed', 'actions' => $actionResults];
        } catch (\Throwable $e) {
            $durationMs = (int) ((microtime(true) - $startTime) * 1000);

            $execution->update([
                'actions_executed' => $actionResults,
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'duration_ms' => $durationMs,
            ]);

            Log::warning('Workflow execution failed', [
                'rule_id' => $rule->id,
                'event' => $event,
                'error' => $e->getMessage(),
            ]);

            return ['rule_id' => $rule->id, 'status' => 'failed', 'error' => $e->getMessage()];
        }
    }

    /**
     * Execute a single action.
     */
    protected function executeAction(string $type, array $config, array $context): array
    {
        return match ($type) {
            'send_notification' => $this->actionSendNotification($config, $context),
            'update_status' => $this->actionUpdateStatus($config, $context),
            'assign_agent' => $this->actionAssignAgent($config, $context),
            'create_task' => $this->actionCreateTask($config, $context),
            'add_tag' => $this->actionAddTag($config, $context),
            'fire_webhook' => $this->actionFireWebhook($config, $context),
            'send_email' => $this->actionSendEmail($config, $context),
            default => ['success' => false, 'message' => "Unknown action type: {$type}"],
        };
    }

    protected function actionSendNotification(array $config, array $context): array
    {
        $message = $config['message'] ?? 'Workflow notification';
        $toRole = $config['to_role'] ?? 'agent'; // agent, agency_owner, consumer

        // Resolve recipient from context
        $userId = match ($toRole) {
            'agent' => $context['agent_id'] ?? null,
            'agency_owner' => $context['agency_owner_id'] ?? null,
            'consumer' => $context['consumer_id'] ?? $context['user_id'] ?? null,
            default => null,
        };

        if (!$userId) {
            return ['success' => false, 'message' => "No {$toRole} found in context"];
        }

        // Replace placeholders in message
        $message = $this->replacePlaceholders($message, $context);

        \App\Models\Notification::create([
            'user_id' => $userId,
            'type' => 'workflow_automation',
            'title' => 'Automation',
            'body' => $message,
            'action_url' => $context['url'] ?? null,
        ]);

        return ['success' => true, 'message' => "Notification sent to user {$userId}"];
    }

    protected function actionUpdateStatus(array $config, array $context): array
    {
        $entity = $config['entity'] ?? 'lead';
        $status = $config['status'] ?? '';
        $id = $context["{$entity}_id"] ?? $context['id'] ?? null;

        if (!$id || !$status) {
            return ['success' => false, 'message' => 'Missing entity ID or status'];
        }

        $model = match ($entity) {
            'lead' => \App\Models\Lead::find($id),
            'application' => \App\Models\Application::find($id),
            'policy' => \App\Models\Policy::find($id),
            'claim' => \App\Models\Claim::find($id),
            default => null,
        };

        if (!$model) {
            return ['success' => false, 'message' => "Entity {$entity} #{$id} not found"];
        }

        $model->update(['status' => $status]);

        return ['success' => true, 'message' => "Updated {$entity} #{$id} status to {$status}"];
    }

    protected function actionAssignAgent(array $config, array $context): array
    {
        $agentId = $config['agent_id'] ?? null;
        $leadId = $context['lead_id'] ?? null;

        if (!$leadId) {
            return ['success' => false, 'message' => 'No lead_id in context'];
        }

        $lead = \App\Models\Lead::find($leadId);
        if (!$lead) {
            return ['success' => false, 'message' => "Lead #{$leadId} not found"];
        }

        if ($agentId) {
            $lead->update(['assigned_agent_id' => $agentId]);
            return ['success' => true, 'message' => "Lead #{$leadId} assigned to agent #{$agentId}"];
        }

        return ['success' => false, 'message' => 'No agent_id specified'];
    }

    protected function actionCreateTask(array $config, array $context): array
    {
        $title = $this->replacePlaceholders($config['title'] ?? 'Follow-up task', $context);
        $dueDays = (int) ($config['due_days'] ?? 1);
        $assignTo = $config['assign_to'] ?? 'agent';

        $userId = match ($assignTo) {
            'agent' => $context['agent_id'] ?? null,
            'agency_owner' => $context['agency_owner_id'] ?? null,
            default => $context['agent_id'] ?? null,
        };

        if (!$userId) {
            return ['success' => false, 'message' => 'No user to assign task to'];
        }

        // Create as appointment/reminder
        \App\Models\Appointment::create([
            'user_id' => $userId,
            'agency_id' => $context['agency_id'] ?? null,
            'title' => $title,
            'type' => 'task',
            'start_time' => now()->addDays($dueDays),
            'end_time' => now()->addDays($dueDays)->addHour(),
            'notes' => "Auto-created by workflow rule. Lead: " . ($context['lead_id'] ?? 'N/A'),
            'status' => 'scheduled',
        ]);

        return ['success' => true, 'message' => "Task created for user #{$userId} due in {$dueDays} days"];
    }

    protected function actionAddTag(array $config, array $context): array
    {
        $tag = $config['tag'] ?? '';
        $leadId = $context['lead_id'] ?? null;

        if (!$leadId || !$tag) {
            return ['success' => false, 'message' => 'Missing lead_id or tag'];
        }

        $lead = \App\Models\Lead::find($leadId);
        if (!$lead) {
            return ['success' => false, 'message' => "Lead #{$leadId} not found"];
        }

        // Store tags in notes or a JSON field
        $notes = $lead->notes ?? '';
        if (!str_contains($notes, "[{$tag}]")) {
            $lead->update(['notes' => trim($notes . " [{$tag}]")]);
        }

        return ['success' => true, 'message' => "Tag [{$tag}] added to lead #{$leadId}"];
    }

    protected function actionFireWebhook(array $config, array $context): array
    {
        $url = $config['url'] ?? '';
        $method = strtoupper($config['method'] ?? 'POST');

        if (!$url) {
            return ['success' => false, 'message' => 'No webhook URL specified'];
        }

        try {
            $client = new \GuzzleHttp\Client(['timeout' => 10]);
            $response = $client->request($method, $url, [
                'json' => $context,
                'headers' => ['Content-Type' => 'application/json'],
            ]);

            return ['success' => true, 'message' => "Webhook fired: {$response->getStatusCode()}"];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => "Webhook failed: {$e->getMessage()}"];
        }
    }

    protected function actionSendEmail(array $config, array $context): array
    {
        $template = $config['template'] ?? 'generic';
        $toRole = $config['to_role'] ?? 'agent';

        $userId = match ($toRole) {
            'agent' => $context['agent_id'] ?? null,
            'agency_owner' => $context['agency_owner_id'] ?? null,
            'consumer' => $context['consumer_id'] ?? $context['user_id'] ?? null,
            default => null,
        };

        if (!$userId) {
            return ['success' => false, 'message' => "No {$toRole} found in context"];
        }

        $user = \App\Models\User::find($userId);
        if (!$user) {
            return ['success' => false, 'message' => "User #{$userId} not found"];
        }

        try {
            $subject = $this->replacePlaceholders($config['subject'] ?? 'Notification from Insurons', $context);
            $body = $this->replacePlaceholders($config['body'] ?? 'You have a new notification.', $context);

            Mail::raw($body, function ($message) use ($user, $subject) {
                $message->to($user->email)->subject($subject);
            });

            return ['success' => true, 'message' => "Email sent to {$user->email}"];
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => "Email failed: {$e->getMessage()}"];
        }
    }

    /**
     * Replace {{placeholder}} tokens in a string with context values.
     */
    protected function replacePlaceholders(string $text, array $context): string
    {
        return preg_replace_callback('/\{\{(\w+(?:\.\w+)*)\}\}/', function ($matches) use ($context) {
            return data_get($context, $matches[1], $matches[0]);
        }, $text);
    }
}
