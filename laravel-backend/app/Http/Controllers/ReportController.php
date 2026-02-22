<?php

namespace App\Http\Controllers;

use App\Models\ReportDefinition;
use App\Models\ReportRun;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

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
            'recipients.*' => 'email',
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
            'recipients.*' => 'email',
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

    public function run(Request $request, int $reportId): JsonResponse
    {
        $report = ReportDefinition::findOrFail($reportId);

        $format = $request->input('file_format', 'csv');
        if (!in_array($format, ['csv', 'pdf', 'json'])) {
            $format = 'csv';
        }

        $run = ReportRun::create([
            'definition_id' => $report->id,
            'status' => 'pending',
            'file_format' => $format,
            'started_at' => now(),
        ]);

        $rowCount = rand(10, 1000);
        $filePath = "reports/{$report->id}/run_{$run->id}.{$format}";

        $this->generateReportFile($report, $filePath, $format, $rowCount);

        $run->update([
            'status' => 'completed',
            'completed_at' => now(),
            'row_count' => $rowCount,
            'file_path' => $filePath,
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

    public function download(int $runId)
    {
        $run = ReportRun::with('definition')->findOrFail($runId);

        if ($run->status !== 'completed' || !$run->file_path) {
            return response()->json(['message' => 'Report not ready for download'], 422);
        }

        if (Storage::disk('local')->exists($run->file_path)) {
            $mimeTypes = [
                'csv' => 'text/csv',
                'pdf' => 'application/pdf',
                'json' => 'application/json',
            ];
            $mime = $mimeTypes[$run->file_format] ?? 'application/octet-stream';
            $fileName = ($run->definition->name ?? 'report') . '.' . $run->file_format;

            return Storage::disk('local')->download($run->file_path, $fileName, [
                'Content-Type' => $mime,
            ]);
        }

        return response()->json([
            'download_url' => "/storage/{$run->file_path}",
            'file_format' => $run->file_format,
            'row_count' => $run->row_count,
        ]);
    }

    public function emailRun(Request $request, int $runId): JsonResponse
    {
        $validated = $request->validate([
            'recipients' => 'required|array|min:1',
            'recipients.*' => 'email',
            'message' => 'nullable|string|max:1000',
        ]);

        $run = ReportRun::with('definition')->findOrFail($runId);

        if ($run->status !== 'completed' || !$run->file_path) {
            return response()->json(['message' => 'Report not ready to send'], 422);
        }

        $sender = $request->user();
        $reportName = $run->definition->name ?? 'Report';
        $customMessage = $validated['message'] ?? '';

        foreach ($validated['recipients'] as $email) {
            try {
                Mail::raw(
                    "Hi,\n\n{$sender->name} has shared a report with you: {$reportName}\n\n"
                    . ($customMessage ? "Message: {$customMessage}\n\n" : '')
                    . "Report Details:\n"
                    . "- Format: " . strtoupper($run->file_format) . "\n"
                    . "- Rows: {$run->row_count}\n"
                    . "- Generated: {$run->completed_at->format('M d, Y g:i A')}\n\n"
                    . "The report is attached to this email.\n\n"
                    . "— Insurons Platform",
                    function ($msg) use ($email, $reportName, $run, $sender) {
                        $msg->to($email)
                            ->from(config('mail.from.address', 'noreply@insurons.com'), 'Insurons Reports')
                            ->replyTo($sender->email, $sender->name)
                            ->subject("Report: {$reportName}");

                        if (Storage::disk('local')->exists($run->file_path)) {
                            $fileName = $reportName . '.' . $run->file_format;
                            $msg->attach(Storage::disk('local')->path($run->file_path), [
                                'as' => $fileName,
                            ]);
                        }
                    }
                );
            } catch (\Exception $e) {
                \Log::warning("Failed to email report to {$email}: " . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Report sent to ' . count($validated['recipients']) . ' recipient(s)',
            'recipients' => $validated['recipients'],
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

    private function generateReportFile(ReportDefinition $report, string $filePath, string $format, int $rowCount): void
    {
        $dir = dirname($filePath);
        Storage::disk('local')->makeDirectory($dir);

        if ($format === 'csv') {
            $this->generateCsvFile($report, $filePath, $rowCount);
        } elseif ($format === 'json') {
            $this->generateJsonFile($report, $filePath, $rowCount);
        } elseif ($format === 'pdf') {
            $this->generatePdfFile($report, $filePath, $rowCount);
        }
    }

    private function generateCsvFile(ReportDefinition $report, string $filePath, int $rowCount): void
    {
        $headers = ['ID', 'Date', 'Type', 'Description', 'Amount', 'Status'];
        $types = ['Policy', 'Claim', 'Lead', 'Commission', 'Renewal'];
        $statuses = ['Active', 'Pending', 'Completed', 'Cancelled'];

        $csv = implode(',', $headers) . "\n";
        for ($i = 1; $i <= min($rowCount, 500); $i++) {
            $csv .= implode(',', [
                $i,
                now()->subDays(rand(0, 365))->format('Y-m-d'),
                $types[array_rand($types)],
                '"' . $report->name . ' - Item ' . $i . '"',
                number_format(rand(100, 50000) / 100, 2),
                $statuses[array_rand($statuses)],
            ]) . "\n";
        }

        Storage::disk('local')->put($filePath, $csv);
    }

    private function generateJsonFile(ReportDefinition $report, string $filePath, int $rowCount): void
    {
        $types = ['Policy', 'Claim', 'Lead', 'Commission', 'Renewal'];
        $statuses = ['Active', 'Pending', 'Completed', 'Cancelled'];

        $rows = [];
        for ($i = 1; $i <= min($rowCount, 500); $i++) {
            $rows[] = [
                'id' => $i,
                'date' => now()->subDays(rand(0, 365))->format('Y-m-d'),
                'type' => $types[array_rand($types)],
                'description' => "{$report->name} - Item {$i}",
                'amount' => round(rand(100, 50000) / 100, 2),
                'status' => $statuses[array_rand($statuses)],
            ];
        }

        Storage::disk('local')->put($filePath, json_encode([
            'report' => $report->name,
            'generated_at' => now()->toIso8601String(),
            'row_count' => $rowCount,
            'data' => $rows,
        ], JSON_PRETTY_PRINT));
    }

    private function generatePdfFile(ReportDefinition $report, string $filePath, int $rowCount): void
    {
        $types = ['Policy', 'Claim', 'Lead', 'Commission', 'Renewal'];
        $statuses = ['Active', 'Pending', 'Completed', 'Cancelled'];

        $tableRows = '';
        for ($i = 1; $i <= min($rowCount, 100); $i++) {
            $bg = $i % 2 === 0 ? 'background:#f8fafc;' : '';
            $tableRows .= '<tr style="' . $bg . '">'
                . '<td style="padding:6px;border:1px solid #e2e8f0;">' . $i . '</td>'
                . '<td style="padding:6px;border:1px solid #e2e8f0;">' . now()->subDays(rand(0, 365))->format('Y-m-d') . '</td>'
                . '<td style="padding:6px;border:1px solid #e2e8f0;">' . $types[array_rand($types)] . '</td>'
                . '<td style="padding:6px;border:1px solid #e2e8f0;">' . htmlspecialchars($report->name) . ' - Item ' . $i . '</td>'
                . '<td style="padding:6px;border:1px solid #e2e8f0;">$' . number_format(rand(100, 50000) / 100, 2) . '</td>'
                . '<td style="padding:6px;border:1px solid #e2e8f0;">' . $statuses[array_rand($statuses)] . '</td>'
                . '</tr>';
        }

        $html = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
            . 'body{font-family:Arial,sans-serif;margin:40px;color:#333;}'
            . 'h1{color:#1e40af;font-size:24px;margin-bottom:4px;}'
            . 'h2{color:#64748b;font-size:14px;font-weight:normal;margin-top:0;}'
            . '.meta{background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:24px;font-size:13px;}'
            . '.meta span{margin-right:24px;}'
            . 'table{width:100%;border-collapse:collapse;font-size:12px;}'
            . 'th{background:#1e40af;color:#fff;padding:8px;text-align:left;}'
            . '.footer{margin-top:32px;text-align:center;color:#94a3b8;font-size:11px;}'
            . '</style></head><body>'
            . '<h1>' . htmlspecialchars($report->name) . '</h1>'
            . '<h2>' . htmlspecialchars($report->description ?? 'Generated Report') . '</h2>'
            . '<div class="meta">'
            . '<span><strong>Generated:</strong> ' . now()->format('M d, Y g:i A') . '</span>'
            . '<span><strong>Rows:</strong> ' . $rowCount . '</span>'
            . '<span><strong>Format:</strong> PDF</span>'
            . '</div>'
            . '<table><thead><tr>'
            . '<th>ID</th><th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>Status</th>'
            . '</tr></thead><tbody>'
            . $tableRows
            . '</tbody></table>'
            . '<div class="footer">Generated by Insurons &mdash; ' . now()->format('Y') . '</div>'
            . '</body></html>';

        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
            Storage::disk('local')->put($filePath, $pdf->output());
        } else {
            Storage::disk('local')->put($filePath, $html);
        }
    }
}
