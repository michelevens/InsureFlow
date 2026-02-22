<?php

namespace App\Http\Controllers;

use App\Models\GeneratedDocument;
use App\Services\DocumentGenerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentGenerationController extends Controller
{
    public function __construct(
        protected DocumentGenerationService $docService
    ) {}

    public function templates(): JsonResponse
    {
        return response()->json($this->docService->availableTemplates());
    }

    public function generate(Request $request, string $type): JsonResponse
    {
        $data = $request->validate([
            'entity_type' => 'required|string|in:quote,application,policy,claim',
            'entity_id' => 'required|integer',
            'extra_data' => 'nullable|array',
        ]);

        $modelMap = [
            'quote' => \App\Models\QuoteRequest::class,
            'application' => \App\Models\Application::class,
            'policy' => \App\Models\Policy::class,
            'claim' => \App\Models\Claim::class,
        ];

        $modelClass = $modelMap[$data['entity_type']] ?? null;
        if (!$modelClass) {
            return response()->json(['error' => 'Invalid entity type'], 422);
        }

        $entity = $modelClass::findOrFail($data['entity_id']);

        $doc = $this->docService->generate(
            $type,
            $entity,
            $data['extra_data'] ?? [],
            $request->user()->id
        );

        return response()->json($doc, 201);
    }

    public function download(GeneratedDocument $document): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        if (!Storage::disk('local')->exists($document->file_path)) {
            abort(404, 'File not found');
        }

        return Storage::disk('local')->download($document->file_path, $document->file_name);
    }

    public function index(Request $request): JsonResponse
    {
        $query = GeneratedDocument::with('generatedBy')
            ->orderByDesc('created_at');

        if ($request->has('entity_type') && $request->has('entity_id')) {
            $query->where('documentable_type', 'LIKE', '%' . $request->entity_type)
                  ->where('documentable_id', $request->entity_id);
        }

        if ($request->has('template_type')) {
            $query->where('template_type', $request->template_type);
        }

        $documents = $query->limit(50)->get();

        return response()->json($documents);
    }

    public function destroy(GeneratedDocument $document): JsonResponse
    {
        Storage::disk('local')->delete($document->file_path);
        $document->delete();
        return response()->json(['message' => 'Document deleted']);
    }
}
