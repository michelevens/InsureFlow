/**
 * AdminTestAgent — simulates an admin user:
 * - User management (list, search, view)
 * - Agency management (list, detail, verify)
 * - Plan management (CRUD)
 * - Carrier management (list, detail)
 * - Analytics
 * - Compliance overview
 * - Platform products
 */
import { BaseTestAgent } from '../base-agent.js';

export class AdminTestAgent extends BaseTestAgent {
  readonly role = 'admin';
  readonly email = 'admin@insureflow.com';
  readonly password = 'password';
  readonly agentName = 'Admin Test Agent';

  defineTests(): Array<[string, () => Promise<void>]> {
    return [
      ['Fetch current user profile', async () => {
        const res = await this.get<{ user: { id: number; role: string } }>('/auth/me');
        this.assertEqual(res.user.role, 'admin', 'user.role');
      }],

      ['Get dashboard stats', async () => {
        const res = await this.get<Record<string, unknown>>('/stats/dashboard');
        this.assertExists(res, 'dashboard stats');
      }],

      // ── User Management ──────────────────────────────
      ['List all users', async () => {
        const res = await this.get<{ users: { data: unknown[]; total: number } }>('/admin/users');
        this.assertExists(res.users, 'users');
        this.assertArray(res.users.data, 'users.data', 1);
        this.assertGreaterThan(res.users.total, 0, 'users.total');
      }],

      ['Filter users by role (agent)', async () => {
        const res = await this.get<{ users: { data: unknown[] } }>('/admin/users?role=agent');
        this.assertExists(res.users, 'filtered users');
        this.assertArray(res.users.data, 'agent users');
      }],

      ['Search users by name', async () => {
        const res = await this.get<{ users: { data: unknown[] } }>('/admin/users?search=agent');
        this.assertExists(res.users, 'search results');
      }],

      ['View user detail', async () => {
        const list = await this.get<{ users: { data: Array<{ id: number }> } }>('/admin/users');
        if (list.users.data.length === 0) throw new Error('No users found');
        const userId = list.users.data[0].id;
        const res = await this.get<{ id: number; name: string }>(`/admin/users/${userId}`);
        this.assertExists(res.id, 'user.id');
      }],

      // ── Agency Management ────────────────────────────
      ['List all agencies', async () => {
        const res = await this.get<{ data: Array<{ id: number }> }>('/admin/agencies');
        this.assertExists(res.data, 'agencies data');
        this.assertArray(res.data, 'agencies', 1);
      }],

      ['View agency detail', async () => {
        const list = await this.get<{ data: Array<{ id: number }> }>('/admin/agencies');
        if (list.data.length === 0) throw new Error('No agencies found');
        const agencyId = list.data[0].id;
        const res = await this.get<{ id: number; name: string }>(`/admin/agencies/${agencyId}`);
        this.assertExists(res.id, 'agency.id');
      }],

      // ── Plan Management ──────────────────────────────
      ['List subscription plans', async () => {
        const res = await this.get<Array<{ id: number; name: string }>>('/admin/plans');
        this.assertArray(res, 'plans', 1);
      }],

      // ── Carrier Management ───────────────────────────
      ['List carriers (admin)', async () => {
        const res = await this.get<Array<{ id: number; name: string }>>('/admin/carriers');
        this.assertArray(res, 'admin carriers', 1);
      }],

      ['View carrier detail (admin)', async () => {
        const list = await this.get<Array<{ id: number }>>('/admin/carriers');
        if (list.length === 0) throw new Error('No carriers found');
        const carrierId = list[0].id;
        const res = await this.get<{ id: number; name: string }>(`/admin/carriers/${carrierId}`);
        this.assertExists(res.id, 'carrier.id');
      }],

      // ── Analytics ────────────────────────────────────
      ['Get admin analytics', async () => {
        const res = await this.get<Record<string, unknown>>('/admin/analytics');
        this.assertExists(res, 'admin analytics');
      }],

      // ── Compliance ───────────────────────────────────
      ['Get compliance overview', async () => {
        const res = await this.get<{ total_items: number }>('/admin/compliance/overview');
        this.assertExists(res.total_items, 'total_items');
      }],

      ['List compliance requirements', async () => {
        const res = await this.get<Array<{ id: number; title: string }>>('/admin/compliance/requirements');
        this.assertArray(res, 'compliance requirements', 1);
      }],

      // ── Agent Profiles ───────────────────────────────
      ['Get agent profile stats', async () => {
        const res = await this.get<{ total_unclaimed: number }>('/admin/profiles/stats');
        this.assertExists(res, 'profile stats');
      }],

      // ── Notifications ────────────────────────────────
      ['Check notifications', async () => {
        const res = await this.get<{ notifications: unknown[] }>('/notifications');
        this.assertArray(res.notifications, 'notifications');
      }],
    ];
  }
}
