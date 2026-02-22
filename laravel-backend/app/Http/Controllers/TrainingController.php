<?php

namespace App\Http\Controllers;

use App\Models\TrainingModule;
use App\Models\TrainingCompletion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrainingController extends Controller
{
    public function modules(Request $request): JsonResponse
    {
        $modules = TrainingModule::where('is_published', true)
            ->withCount('completions')
            ->orderBy('sort_order')
            ->get()
            ->map(function ($module) use ($request) {
                $completion = TrainingCompletion::where('training_module_id', $module->id)
                    ->where('user_id', $request->user()->id)
                    ->first();
                $module->my_completion = $completion;
                return $module;
            });

        return response()->json($modules);
    }

    public function storeModule(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content_type' => 'sometimes|in:video,article,quiz,interactive,document',
            'content_url' => 'nullable|url|max:500',
            'content_body' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'duration_minutes' => 'nullable|integer|min:1',
            'is_required' => 'sometimes|boolean',
        ]);

        $data['organization_id'] = $request->user()->agency_id;
        $module = TrainingModule::create($data);

        return response()->json($module, 201);
    }

    public function showModule(TrainingModule $module): JsonResponse
    {
        $module->load('completions.user:id,name');
        return response()->json($module);
    }

    public function updateModule(Request $request, TrainingModule $module): JsonResponse
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'content_type' => 'sometimes|in:video,article,quiz,interactive,document',
            'content_url' => 'nullable|url|max:500',
            'content_body' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'duration_minutes' => 'nullable|integer|min:1',
            'is_required' => 'sometimes|boolean',
            'is_published' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
        ]);

        $module->update($data);
        return response()->json($module);
    }

    public function destroyModule(TrainingModule $module): JsonResponse
    {
        $module->delete();
        return response()->json(['message' => 'Module deleted']);
    }

    public function startModule(Request $request, TrainingModule $module): JsonResponse
    {
        $completion = TrainingCompletion::updateOrCreate(
            ['training_module_id' => $module->id, 'user_id' => $request->user()->id],
            ['started_at' => now()]
        );

        return response()->json($completion);
    }

    public function completeModule(Request $request, TrainingModule $module): JsonResponse
    {
        $data = $request->validate([
            'score' => 'nullable|integer|min:0|max:100',
            'time_spent_minutes' => 'nullable|integer|min:1',
        ]);

        $completion = TrainingCompletion::updateOrCreate(
            ['training_module_id' => $module->id, 'user_id' => $request->user()->id],
            [
                'completed_at' => now(),
                'score' => $data['score'] ?? null,
                'time_spent_minutes' => $data['time_spent_minutes'] ?? null,
            ]
        );

        return response()->json($completion);
    }

    public function myProgress(Request $request): JsonResponse
    {
        $total = TrainingModule::where('is_published', true)->count();
        $completed = TrainingCompletion::where('user_id', $request->user()->id)
            ->whereNotNull('completed_at')
            ->count();
        $required = TrainingModule::where('is_published', true)->where('is_required', true)->count();
        $requiredCompleted = TrainingCompletion::where('user_id', $request->user()->id)
            ->whereNotNull('completed_at')
            ->whereHas('module', fn($q) => $q->where('is_required', true))
            ->count();

        return response()->json([
            'total_modules' => $total,
            'completed' => $completed,
            'completion_rate' => $total > 0 ? round(($completed / $total) * 100) : 0,
            'required_total' => $required,
            'required_completed' => $requiredCompleted,
        ]);
    }
}
