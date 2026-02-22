<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\OrganizationMember;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    /**
     * List organizations the user belongs to.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $orgs = $user->organizations()->with('parent', 'children')->get();
        return response()->json($orgs);
    }

    /**
     * Show org tree from a root organization.
     */
    public function tree(Organization $organization)
    {
        $organization->load('allDescendants.members');
        return response()->json($organization);
    }

    /**
     * Create a new organization (or sub-org under a parent).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:mga,agency,sub_agency',
            'parent_id' => 'nullable|integer|exists:organizations,id',
            'tax_id' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:2',
            'zip' => 'nullable|string|max:10',
            'branding' => 'nullable|array',
            'settings' => 'nullable|array',
        ]);

        $org = Organization::create($data);

        // Creator becomes owner
        $org->members()->attach($request->user()->id, [
            'role' => 'owner',
            'is_primary' => true,
        ]);

        $org->load('members');

        return response()->json($org, 201);
    }

    /**
     * Update an organization.
     */
    public function update(Request $request, Organization $organization)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:mga,agency,sub_agency',
            'tax_id' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:2',
            'zip' => 'nullable|string|max:10',
            'branding' => 'nullable|array',
            'settings' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        $organization->update($data);
        return response()->json($organization);
    }

    /**
     * Delete an organization (and cascade to children).
     */
    public function destroy(Organization $organization)
    {
        $organization->delete();
        return response()->json(['message' => 'Organization deleted']);
    }

    /**
     * List members of an organization.
     */
    public function members(Organization $organization)
    {
        $members = $organization->memberRecords()->with('user')->get();
        return response()->json($members);
    }

    /**
     * Add a member to an organization.
     */
    public function addMember(Request $request, Organization $organization)
    {
        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'role' => 'sometimes|string|in:owner,admin,manager,member',
            'permissions' => 'nullable|array',
        ]);

        // Check not already a member
        $existing = OrganizationMember::where('organization_id', $organization->id)
            ->where('user_id', $data['user_id'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'User is already a member'], 422);
        }

        $member = $organization->memberRecords()->create([
            'user_id' => $data['user_id'],
            'role' => $data['role'] ?? 'member',
            'permissions' => $data['permissions'] ?? null,
        ]);

        $member->load('user');

        return response()->json($member, 201);
    }

    /**
     * Update a member's role/permissions.
     */
    public function updateMember(Request $request, Organization $organization, OrganizationMember $member)
    {
        $data = $request->validate([
            'role' => 'sometimes|string|in:owner,admin,manager,member',
            'permissions' => 'nullable|array',
        ]);

        $member->update($data);
        $member->load('user');

        return response()->json($member);
    }

    /**
     * Remove a member from an organization.
     */
    public function removeMember(Organization $organization, OrganizationMember $member)
    {
        $member->delete();
        return response()->json(['message' => 'Member removed']);
    }
}
