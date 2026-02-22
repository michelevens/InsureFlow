<?php

namespace App\Http\Controllers;

use App\Models\ReportDefinition;
use App\Models\ReportRun;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ReportDefinition::where('user_id', $request->user()->id)
            ->with('user:id,first_name,last_name');

        if ($request->query('active_only')) {
            $query->where('is_active', true);
        }

        $reports = $query->orderByDesc('updated_at')
            ->paginate($request->query('per_page', 20));

        return response()->json($reports);
    }

    public function show(int $reportId): JsonResponse
    {
        $report = ReportDefinition::with([
            'user:id,first_name,last_name',
            'runs' => fn($q) => $q->orderByDesc('created_at')->limit(10),
        ])->findOrFail($reportId);

        return response()->json($report);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'query_config' => 'required|array',
            'schedule' => 'nullable|string|max:255',
            'recipients' => 'nullable|array',
        ]);

        $validated['user_id'] = $request->user()->id;
        $validated['organization_id'] = $request->user()->agency_id;

        $report = ReportDefinition::create($validated);

        return response()->json($report, 201);
    }

    public function update(Request $request, int $reportId): JsonResponse
    {
        $report = ReportDefinition::findOrFail($reportId);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'query_config' => 'sometimes|array',
            'schedule' => 'nullable|string|max:255',
            'recipients' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        $report->update($validated);

        return response()->json($report);
    }

    public function destroy(int $reportId): JsonResponse
    {
        ReportDefinition::findOrFail($reportId)->delete();

        return response()->json(['message' => 'Report deleted']);
    }

    public function run(int $reportId): JsonResponse
    {
        $report = ReportDefinition::findOrFail($reportId);

        $run = ReportRun::create([
            'definition_id' => $report->id,
            'status' => 'pending',
            'started_at' => now(),
        ]);

        // In production, dispatch a job to generate the report
        // For now, simulate completion
        $run->update([
            'status' => 'completed',
            'completed_at' => now(),
            'row_count' => rand(10, 1000),
            'file_path' => "reports/{$report->id}/run_{$run->id}.csv",
        ]);

        $report->update(['last_run_at' => now()]);

        return response()->json($run);
    }

    public function runs(Request $request, int $reportId): JsonResponse
    {
        $runs = ReportRun::where('definition_id', $reportId)
            ->orderByDesc('created_at')
            ->paginate($request->query('per_page', 20));

        return response()->json($runs);
    }

    public function download(int $runId): JsonResponse
    {
        $run = ReportRun::findOrFail($runId);

        if ($run->status !== 'completed' || !$run->file_path) {
            return response()->json(['message' => 'Report not ready for download'], 422);
        }

        // In production, return file download response
        return response()->json([
            'download_url' => "/storage/{$run->file_path}",
            'file_format' => $run->file_format,
            'row_count' => $run->row_count,
        ]);
    }

    // BI Export endpoints
    public function exportCsv(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entity_type' => 'required|string',
            'filters' => 'nullable|array',
            'columns' => 'nullable|array',
        ]);

        // In production, generate CSV based on entity_type and filters
        return response()->json([
            'message' => 'Export started',
            'format' => 'csv',
            'entity_type' => $validated['entity_type'],
        ]);
    }

    public function exportJson(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entity_type' => 'required|string',
            'filters' => 'nullable|array',
            'columns' => 'nullable|array',
        ]);

        return response()->json([
            'message' => 'Export started',
            'format' => 'json',
            'entity_type' => $validated['entity_type'],
        ]);
    }
}
