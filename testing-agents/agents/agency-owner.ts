/**
 * AgencyOwnerTestAgent — simulates an agency owner:
 * - Dashboard & production stats
 * - CRM leads management
 * - Applications & policies
 * - Team management (list agents, create agent)
 * - Agency settings (code, general)
 * - Compliance pack
 * - Lead intake URLs
 * - Commissions / analytics
 * - Renewals
 */
import { BaseTestAgent } from '../base-agent.js';

export class AgencyOwnerTestAgent extends BaseTestAgent {
  readonly role = 'agency_owner';
  readonly email = 'agency@insureflow.com';
  readonly password = 'password';
  readonly agentName = 'Agency Owner Test Agent';

  defineTests(): Array<[string, () => Promise<void>]> {
    return [
      ['Fetch current user profile', async () => {
        const res = await this.get<{ user: { id: number; role: string } }>('/auth/me');
        this.assertEqual(res.user.role, 'agency_owner', 'user.role');
      }],

      ['Get dashboard stats', async () => {
        const res = await this.get<Record<string, unknown>>('/stats/dashboard');
        this.assertExists(res, 'dashboard stats');
      }],

      // ── Agency Production ─────────────────────────────
      ['Get agency production stats', async () => {
        const res = await this.get<Record<string, unknown>>('/agency/production');
        this.assertExists(res, 'agency production');
      }],

      // ── CRM Leads ─────────────────────────────────────
      ['List CRM leads', async () => {
        const res = await this.get<{ leads: { data: unknown[] }; counts: Record<string, number> }>('/crm/leads');
        this.assertExists(res.leads, 'leads');
        this.assertArray(res.leads.data, 'leads.data');
      }],

      ['Create a lead for the agency', async () => {
        const res = await this.post<{ id: number }>('/crm/leads', {
          first_name: 'AgencyBot',
          last_name: 'Lead',
          email: `agencybot-${Date.now()}@example.com`,
          phone: '555-0200',
          insurance_type: 'home',
          source: 'testing_agent',
          estimated_value: 2500,
          notes: 'Created by agency owner testing agent',
        });
        this.assertExists(res.id, 'lead.id');
      }],

      // ── Applications ──────────────────────────────────
      ['List applications', async () => {
        const res = await this.get<{ data: unknown[] }>('/applications');
        this.assertExists(res.data, 'applications data');
      }],

      // ── Policies ──────────────────────────────────────
      ['List policies', async () => {
        const res = await this.get<{ data: unknown[] }>('/policies');
        this.assertExists(res.data, 'policies data');
      }],

      // ── Claims ────────────────────────────────────────
      ['List claims', async () => {
        const res = await this.get<{ data: unknown[] }>('/claims');
        this.assertExists(res.data, 'claims data');
      }],

      // ── Commissions ───────────────────────────────────
      ['List commissions', async () => {
        const res = await this.get<{ items: unknown[] }>('/agent/commissions');
        this.assertExists(res.items, 'commissions items');
      }],

      // ── Renewals ──────────────────────────────────────
      ['List renewals', async () => {
        const res = await this.get<{ data: unknown[] }>('/renewals');
        this.assertExists(res.data, 'renewals');
      }],

      ['Get renewal dashboard', async () => {
        const res = await this.get<Record<string, unknown>>('/renewals/dashboard');
        this.assertExists(res, 'renewal dashboard');
      }],

      // ── Team / Agency Settings ─────────────────────────
      ['Get agency settings (general)', async () => {
        const res = await this.get<Record<string, unknown>>('/agency/settings');
        this.assertExists(res, 'agency settings');
      }],

      ['Get lead intake URLs', async () => {
        const res = await this.get<Record<string, unknown>>('/agency/settings/lead-intake');
        this.assertExists(res, 'lead intake settings');
      }],

      ['List agency team members', async () => {
        const res = await this.get<Record<string, unknown>>('/agency/settings/agents');
        this.assertExists(res, 'agency team');
      }],

      // ── Compliance ────────────────────────────────────
      ['Get compliance dashboard', async () => {
        const res = await this.get<{ licenses: unknown }>('/compliance/dashboard');
        this.assertExists(res.licenses, 'compliance licenses');
      }],

      ['Get compliance pack', async () => {
        const res = await this.get<{ items: unknown[] }>('/compliance/pack');
        this.assertExists(res.items, 'compliance pack items');
      }],

      // ── Notifications ─────────────────────────────────
      ['Check notifications', async () => {
        const res = await this.get<{ notifications: unknown[] }>('/notifications');
        this.assertArray(res.notifications, 'notifications');
      }],

      // ── Conversations ─────────────────────────────────
      ['List conversations', async () => {
        const res = await this.get<{ conversations: unknown[] }>('/conversations');
        this.assertArray(res.conversations, 'conversations');
      }],

      // ── Video Meetings ────────────────────────────────
      ['List meetings', async () => {
        const res = await this.get<unknown[]>('/meetings');
        this.assertArray(res, 'meetings');
      }],
    ];
  }
}
