<?php

namespace App\Http\Controllers;

use App\Models\EmailCampaign;
use App\Models\EmailSend;
use App\Models\EmailTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailCampaignController extends Controller
{
    // Templates
    public function templates(Request $request): JsonResponse
    {
        $query = EmailTemplate::query();

        if ($request->query('category')) {
            $query->where('category', $request->query('category'));
        }

        $templates = $query->orderBy('name')->get();

        return response()->json($templates);
    }

    public function storeTemplate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body_html' => 'required|string',
            'category' => 'string|max:255',
        ]);

        $validated['organization_id'] = $request->user()->organization_id;

        $template = EmailTemplate::create($validated);

        return response()->json($template, 201);
    }

    public function updateTemplate(Request $request, int $templateId): JsonResponse
    {
        $template = EmailTemplate::findOrFail($templateId);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'subject' => 'sometimes|string|max:255',
            'body_html' => 'sometimes|string',
            'category' => 'sometimes|string|max:255',
        ]);

        $template->update($validated);

        return response()->json($template);
    }

    public function destroyTemplate(int $templateId): JsonResponse
    {
        EmailTemplate::findOrFail($templateId)->delete();

        return response()->json(['message' => 'Template deleted']);
    }

    // Campaigns
    public function campaigns(Request $request): JsonResponse
    {
        $query = EmailCampaign::query();

        if ($request->query('status')) {
            $query->where('status', $request->query('status'));
        }

        $campaigns = $query->orderByDesc('created_at')
            ->paginate($request->query('per_page', 20));

        return response()->json($campaigns);
    }

    public function showCampaign(int $campaignId): JsonResponse
    {
        $campaign = EmailCampaign::withCount('sends')
            ->findOrFail($campaignId);

        return response()->json($campaign);
    }

    public function storeCampaign(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body_html' => 'required|string',
            'target_segment' => 'nullable|array',
            'scheduled_at' => 'nullable|date|after:now',
        ]);

        $validated['organization_id'] = $request->user()->organization_id;
        $validated['status'] = $validated['scheduled_at'] ? 'scheduled' : 'draft';

        $campaign = EmailCampaign::create($validated);

        return response()->json($campaign, 201);
    }

    public function updateCampaign(Request $request, int $campaignId): JsonResponse
    {
        $campaign = EmailCampaign::findOrFail($campaignId);

        if (!in_array($campaign->status, ['draft', 'scheduled'])) {
            return response()->json(['message' => 'Cannot edit sent/sending campaign'], 422);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'subject' => 'sometimes|string|max:255',
            'body_html' => 'sometimes|string',
            'target_segment' => 'nullable|array',
            'scheduled_at' => 'nullable|date',
        ]);

        $campaign->update($validated);

        return response()->json($campaign);
    }

    public function destroyCampaign(int $campaignId): JsonResponse
    {
        $campaign = EmailCampaign::findOrFail($campaignId);

        if ($campaign->status === 'sending') {
            return response()->json(['message' => 'Cannot delete while sending'], 422);
        }

        $campaign->delete();

        return response()->json(['message' => 'Campaign deleted']);
    }

    public function sendCampaign(int $campaignId): JsonResponse
    {
        $campaign = EmailCampaign::findOrFail($campaignId);

        if (!in_array($campaign->status, ['draft', 'scheduled'])) {
            return response()->json(['message' => 'Campaign cannot be sent'], 422);
        }

        $campaign->update([
            'status' => 'sending',
            'sent_at' => now(),
        ]);

        // In production, dispatch a job to send emails asynchronously
        // For now, mark as sent
        $campaign->update(['status' => 'sent']);

        return response()->json(['message' => 'Campaign sent']);
    }

    public function cancelCampaign(int $campaignId): JsonResponse
    {
        $campaign = EmailCampaign::findOrFail($campaignId);
        $campaign->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Campaign cancelled']);
    }

    public function campaignAnalytics(int $campaignId): JsonResponse
    {
        $campaign = EmailCampaign::findOrFail($campaignId);

        $sends = EmailSend::where('campaign_id', $campaignId);

        $analytics = [
            'total_sent' => $campaign->sent_count,
            'total_opens' => $campaign->open_count,
            'total_clicks' => $campaign->click_count,
            'open_rate' => $campaign->sent_count > 0
                ? round(($campaign->open_count / $campaign->sent_count) * 100, 1)
                : 0,
            'click_rate' => $campaign->sent_count > 0
                ? round(($campaign->click_count / $campaign->sent_count) * 100, 1)
                : 0,
            'bounced' => (clone $sends)->where('status', 'bounced')->count(),
            'unsubscribed' => (clone $sends)->where('status', 'unsubscribed')->count(),
        ];

        return response()->json($analytics);
    }

    public function campaignSends(Request $request, int $campaignId): JsonResponse
    {
        $sends = EmailSend::where('campaign_id', $campaignId)
            ->with('recipient:id,first_name,last_name,email')
            ->paginate($request->query('per_page', 50));

        return response()->json($sends);
    }
}
