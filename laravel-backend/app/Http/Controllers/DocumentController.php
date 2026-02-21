<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    /**
     * List documents for a given entity.
     * GET /documents?entity_type=application&entity_id=5
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'entity_type' => 'required|in:application,policy,quote_request,insurance_profile',
            'entity_id' => 'required|integer',
        ]);

        $morphType = $this->resolveMorphType($request->entity_type);

        $documents = Document::where('documentable_type', $morphType)
            ->where('documentable_id', $request->entity_id)
            ->with('uploader:id,name')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['documents' => $documents]);
    }

    /**
     * Upload a document.
     * POST /documents
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'entity_type' => 'required|in:application,policy,quote_request,insurance_profile',
            'entity_id' => 'required|integer',
            'type' => 'required|in:application_form,dec_page,binder,coi,endorsement,id_document,proof_of_loss,other',
            'title' => 'nullable|string|max:255',
        ]);

        $file = $request->file('file');
        $morphType = $this->resolveMorphType($request->entity_type);

        $path = $file->store(
            "documents/{$request->entity_type}/{$request->entity_id}",
            'local'
        );

        $document = Document::create([
            'documentable_type' => $morphType,
            'documentable_id' => $request->entity_id,
            'uploaded_by' => $request->user()->id,
            'type' => $request->type,
            'title' => $request->title ?? $file->getClientOriginalName(),
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);

        return response()->json([
            'message' => 'Document uploaded',
            'document' => $document->load('uploader:id,name'),
        ], 201);
    }

    /**
     * Download a document.
     * GET /documents/{document}/download
     */
    public function download(Request $request, Document $document)
    {
        if (!Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('local')->download(
            $document->file_path,
            $document->file_name,
        );
    }

    /**
     * Delete a document.
     * DELETE /documents/{document}
     */
    public function destroy(Request $request, Document $document): JsonResponse
    {
        $user = $request->user();

        // Only uploader or admin can delete
        if ($document->uploaded_by !== $user->id && !in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return response()->json(['message' => 'Document deleted']);
    }

    private function resolveMorphType(string $type): string
    {
        return match ($type) {
            'application' => \App\Models\Application::class,
            'policy' => \App\Models\Policy::class,
            'quote_request' => \App\Models\QuoteRequest::class,
            'insurance_profile' => \App\Models\InsuranceProfile::class,
            default => $type,
        };
    }
}
