<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class InsuranceAiService
{
    private ?string $apiKey;
    private string $model;

    public function __construct()
    {
        $this->apiKey = config('services.anthropic.api_key') ?: null;
        $this->model = config('services.anthropic.model') ?: 'claude-sonnet-4-20250514';
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    public function chat(User $user, array $messageHistory, string $contextPage = null): array
    {
        if (!$this->isConfigured()) {
            return [
                'content' => 'AI assistant is not yet configured. Please contact your administrator.',
                'tokens' => 0,
            ];
        }

        $systemPrompt = $this->buildSystemPrompt($user, $contextPage);

        try {
            $response = Http::withHeaders([
                'x-api-key' => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])->timeout(30)->post('https://api.anthropic.com/v1/messages', [
                'model' => $this->model,
                'max_tokens' => 1024,
                'system' => $systemPrompt,
                'messages' => $messageHistory,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'content' => $data['content'][0]['text'] ?? '',
                    'tokens' => ($data['usage']['input_tokens'] ?? 0) + ($data['usage']['output_tokens'] ?? 0),
                ];
            }

            Log::error('AI chat API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'content' => 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
                'tokens' => 0,
            ];
        } catch (\Exception $e) {
            Log::error('AI chat exception: ' . $e->getMessage());

            return [
                'content' => 'I apologize, but I\'m temporarily unavailable. Please try again shortly.',
                'tokens' => 0,
            ];
        }
    }

    public function getSuggestions(User $user, string $contextPage = null): array
    {
        $role = $user->role;

        $suggestions = match ($role) {
            'consumer' => [
                'What types of insurance do I need?',
                'How do deductibles affect my premium?',
                'What does my homeowner\'s policy cover?',
                'How can I lower my insurance costs?',
            ],
            'agent' => match ($contextPage) {
                'leads' => [
                    'Help me draft a follow-up email for a warm lead',
                    'What questions should I ask during a needs assessment?',
                    'How do I overcome price objections?',
                    'Suggest a cross-selling strategy for this client',
                ],
                'applications' => [
                    'What documents are needed for this application type?',
                    'Help me explain coverage exclusions to a client',
                    'Draft a policy comparison summary',
                    'What underwriting factors matter most here?',
                ],
                default => [
                    'Help me write a prospecting email',
                    'What are the latest insurance market trends?',
                    'How do I calculate coverage needs for a family?',
                    'Draft a client renewal reminder',
                ],
            },
            'agency_owner' => [
                'How can I improve agent retention?',
                'What metrics should I track for agency performance?',
                'Help me draft a recruitment posting for agents',
                'Suggest strategies to increase policy count per agent',
            ],
            'carrier' => [
                'What pricing factors should I consider for a new product?',
                'Help me draft product bulletin for agents',
                'What are the top loss ratios by line of business?',
                'Suggest competitive positioning for my products',
            ],
            default => [
                'How does insurance work?',
                'What coverage do I need?',
                'How are premiums calculated?',
                'What is an insurance deductible?',
            ],
        };

        return $suggestions;
    }

    public function getDailyLimit(User $user): int
    {
        // Check subscription tier for rate limiting
        $subscription = $user->subscription;

        if ($user->role === 'admin' || $user->role === 'superadmin') {
            return 1000;
        }

        if ($subscription && $subscription->status === 'active') {
            return 500; // Pro tier
        }

        return 50; // Free tier
    }

    private function buildSystemPrompt(User $user, ?string $contextPage): string
    {
        $roleContext = match ($user->role) {
            'consumer' => "You are helping a consumer (policyholder) understand their insurance needs. "
                . "Explain concepts in simple, jargon-free language. "
                . "Help them understand their coverage options, compare quotes, and make informed decisions. "
                . "Never provide specific legal or financial advice — suggest they consult their agent for personalized guidance.",

            'agent' => "You are an expert insurance assistant helping a licensed insurance agent. "
                . "Help with sales strategies, client communication drafts, coverage analysis, "
                . "underwriting questions, cross-selling opportunities, and market trends. "
                . "Be specific and actionable. You can use industry terminology.",

            'agency_owner' => "You are a business intelligence assistant for an insurance agency owner. "
                . "Help with agency performance analysis, agent management strategies, "
                . "recruitment, training recommendations, and growth planning. "
                . "Focus on metrics, benchmarks, and actionable strategies.",

            'carrier' => "You are a product strategy assistant for an insurance carrier representative. "
                . "Help with product development, pricing strategies, competitive analysis, "
                . "loss ratio optimization, and distribution channel management.",

            default => "You are a helpful insurance assistant on the Insurons platform. "
                . "Help users understand insurance concepts and navigate the platform.",
        };

        $pageContext = '';
        if ($contextPage) {
            $pageContext = "\n\nThe user is currently on the '{$contextPage}' page of the platform.";
        }

        return "You are Insurons AI, an intelligent insurance assistant built into the Insurons platform. "
            . "{$roleContext}"
            . "{$pageContext}"
            . "\n\nGuidelines:"
            . "\n- Be concise but thorough. Use bullet points for clarity."
            . "\n- If asked about specific policy details you don't have, say so and suggest checking the relevant section."
            . "\n- Never fabricate policy numbers, coverage amounts, or specific carrier information."
            . "\n- For compliance-sensitive topics, remind users to verify with their state's department of insurance."
            . "\n- Keep responses under 500 words unless the user asks for more detail.";
    }
}
