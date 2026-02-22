<?php

namespace App\Http\Controllers;

use App\Models\JobPosting;
use App\Models\JobApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecruitmentController extends Controller
{
    // --- Job Postings ---

    public function postings(Request $request): JsonResponse
    {
        $postings = JobPosting::withCount('applications')
            ->where('user_id', $request->user()->id)
            ->orWhere('agency_id', $request->user()->agency_id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($postings);
    }

    public function storePosting(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'requirements' => 'nullable|array',
            'compensation' => 'nullable|array',
            'location' => 'nullable|string|max:255',
            'is_remote' => 'sometimes|boolean',
            'employment_type' => 'sometimes|in:full_time,part_time,contract,independent',
            'status' => 'sometimes|in:draft,active',
        ]);

        $data['user_id'] = $request->user()->id;
        $data['agency_id'] = $request->user()->agency_id;

        $posting = JobPosting::create($data);
        return response()->json($posting, 201);
    }

    public function showPosting(JobPosting $posting): JsonResponse
    {
        $posting->load('applications');
        return response()->json($posting);
    }

    public function updatePosting(Request $request, JobPosting $posting): JsonResponse
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'requirements' => 'nullable|array',
            'compensation' => 'nullable|array',
            'location' => 'nullable|string|max:255',
            'is_remote' => 'sometimes|boolean',
            'status' => 'sometimes|in:draft,active,closed,filled',
            'employment_type' => 'sometimes|in:full_time,part_time,contract,independent',
        ]);

        $posting->update($data);
        return response()->json($posting);
    }

    public function destroyPosting(JobPosting $posting): JsonResponse
    {
        $posting->delete();
        return response()->json(['message' => 'Posting deleted']);
    }

    // --- Job Applications ---

    public function applications(JobPosting $posting): JsonResponse
    {
        return response()->json($posting->applications()->orderByDesc('created_at')->get());
    }

    public function applyToJob(Request $request, JobPosting $posting): JsonResponse
    {
        $data = $request->validate([
            'applicant_name' => 'required|string|max:255',
            'applicant_email' => 'required|email|max:255',
            'applicant_phone' => 'nullable|string|max:20',
            'resume_url' => 'nullable|url|max:500',
            'cover_letter' => 'nullable|string',
            'experience' => 'nullable|array',
        ]);

        $app = $posting->applications()->create($data);
        return response()->json($app, 201);
    }

    public function updateApplicationStatus(Request $request, JobApplication $application): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:submitted,reviewing,interview,offered,hired,rejected',
            'notes' => 'nullable|string',
        ]);

        $application->update($data);
        return response()->json($application);
    }
}
