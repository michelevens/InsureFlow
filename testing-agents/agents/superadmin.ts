/**
 * SuperadminTestAgent — simulates a superadmin user:
 * - Everything admin can do, plus:
 * - Platform settings
 * - Compliance requirement CRUD
 * - Advanced analytics
 * - Full user/agency/carrier management
 * - Audit log access
 */
import { BaseTestAgent } from '../base-agent.js';

export class SuperadminTestAgent extends BaseTestAgent {
  readonly role = 'superadmin';
  readonly email = 'superadmin@insureflow.com';
  readonly password = 'password';
  readonly agentName = 'Superadmin Test Agent';

  private createdRequirementId: number | null = null;

  defineTests(): Array<[string, () => Promise<void>]> {
    return [
      ['Fetch current user profile', async () => {
        const res = await this.get<{ user: { id: number; role: string } }>('/auth/me');
        this.assertEqual(res.user.role, 'superadmin', 'user.role');
      }],

      ['Get dashboard stats', async () => {
        const res = await this.get<Record<string, unknown>>('/stats/dashboard');
        this.assertExists(res, 'dashboard stats');
      }],

      // ── User Management ──────────────────────────────
      ['List all users', async () => {
        const res = await this.get<{ users: { data: unknown[]; total: number } }>('/admin/users');
        this.assertArray(res.users.data, 'users', 1);
      }],

      ['Filter users by role', async () => {
        for (const role of ['consumer', 'agent', 'agency_owner', 'carrier', 'admin']) {
          const res = await this.get<{ users: { data: unknown[] } }>(`/admin/users?role=${role}`);
          this.assertExists(res.users, `users filtered by ${role}`);
        }
      }],

      // ── Agency Management ────────────────────────────
      ['List all agencies', async () => {
        const res = await this.get<{ data: Array<{ id: number }> }>('/admin/agencies');
        this.assertArray(res.data, 'agencies', 1);
      }],

      ['View and inspect agency detail', async () => {
        const list = await this.get<{ data: Array<{ id: number }> }>('/admin/agencies');
        const agency = list.data[0];
        const detail = await this.get<{ id: number; name: string; is_verified: boolean }>(`/admin/agencies/${agency.id}`);
        this.assertExists(detail.id, 'agency.id');
        this.assertExists(detail.name, 'agency.name');
      }],

      // ── Plan Management ──────────────────────────────
      ['List subscription plans', async () => {
        const res = await this.get<Array<{ id: number; name: string }>>('/admin/plans');
        this.assertArray(res, 'plans', 1);
      }],

      // ── Carrier Management ───────────────────────────
      ['List and inspect carriers', async () => {
        const list = await this.get<Array<{ id: number; name: string }>>('/admin/carriers');
        this.assertArray(list, 'carriers', 1);
        const detail = await this.get<{ id: number }>(`/admin/carriers/${list[0].id}`);
        this.assertExists(detail.id, 'carrier.id');
      }],

      // ── Compliance Requirements CRUD ──────────────────
      ['List compliance requirements', async () => {
        const res = await this.get<Array<{ id: number }>>('/admin/compliance/requirements');
        this.assertArray(res, 'requirements', 1);
      }],

      ['Create a compliance requirement', async () => {
        const res = await this.post<{ id: number; title: string }>('/admin/compliance/requirements', {
          state: 'FL',
          insurance_type: 'all',
          requirement_type: 'test_requirement',
          title: 'Test Requirement (automated)',
          description: 'Created by superadmin testing agent',
          category: 'licensing',
          is_required: true,
          frequency: 'one_time',
          authority: 'FL DOI',
        });
        this.assertExists(res.id, 'requirement.id');
        this.createdRequirementId = res.id;
      }],

      ['Update the compliance requirement', async () => {
        if (!this.createdRequirementId) throw new Error('No requirement to update');
        const res = await this.put<{ id: number; title: string }>(
          `/admin/compliance/requirements/${this.createdRequirementId}`,
          { title: 'Test Requirement (updated by bot)' }
        );
        this.assertIncludes(res.title, 'updated by bot', 'requirement.title');
      }],

      ['Delete the compliance requirement', async () => {
        if (!this.createdRequirementId) throw new Error('No requirement to delete');
        await this.del(`/admin/compliance/requirements/${this.createdRequirementId}`);
        this.createdRequirementId = null;
      }],

      ['Get compliance overview', async () => {
        const res = await this.get<{ total_items: number; compliance_rate: number }>('/admin/compliance/overview');
        this.assertExists(res.total_items, 'total_items');
      }],

      // ── Admin Analytics ──────────────────────────────
      ['Get admin analytics', async () => {
        const res = await this.get<Record<string, unknown>>('/admin/analytics');
        this.assertExists(res, 'admin analytics');
      }],

      // ── Advanced Analytics ───────────────────────────
      ['Get conversion funnel', async () => {
        const res = await this.get<{ funnel: unknown[]; conversion_rate: number }>('/analytics/conversion-funnel?months=6');
        this.assertExists(res.funnel, 'funnel');
        this.assertExists(res.conversion_rate, 'conversion_rate');
      }],

      ['Get revenue trends', async () => {
        const res = await this.get<{ trends: unknown[] }>('/analytics/revenue-trends?months=12');
        this.assertExists(res.trends, 'trends');
      }],

      ['Get agent performance', async () => {
        const res = await this.get<{ agents: unknown[] }>('/analytics/agent-performance?months=3&limit=10');
        this.assertExists(res.agents, 'agent performance');
      }],

      ['Get claims analytics', async () => {
        const res = await this.get<{ total_claims: number }>('/analytics/claims?months=6');
        this.assertExists(res.total_claims, 'total_claims');
      }],

      // ── Agent Profiles ───────────────────────────────
      ['Get agent profile stats', async () => {
        const res = await this.get<{ total_unclaimed: number }>('/admin/profiles/stats');
        this.assertExists(res, 'profile stats');
      }],

      ['List agent profiles', async () => {
        const res = await this.get<{ profiles: { data: unknown[] } }>('/admin/profiles/list');
        this.assertExists(res.profiles, 'profiles');
      }],

      // ── Rating Engine ────────────────────────────────
      ['List rateable products', async () => {
        const res = await this.get<Array<{ product_type: string }>>('/rate/products');
        this.assertArray(res, 'rateable products', 1);
      }],

      // ── Notifications ────────────────────────────────
      ['Check notifications', async () => {
        const res = await this.get<{ notifications: unknown[] }>('/notifications');
        this.assertArray(res.notifications, 'notifications');
      }],
    ];
  }
}
