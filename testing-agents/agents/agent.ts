/**
 * AgentTestAgent — simulates a licensed insurance agent:
 * - View dashboard / pipeline stats
 * - Manage CRM leads (list, create, update status)
 * - View / manage applications
 * - View policies & commissions
 * - Manage claims
 * - Compliance dashboard & pack
 * - Renewals
 * - Messages & notifications
 * - Video meetings
 */
import { BaseTestAgent } from '../base-agent.js';

export class AgentTestAgent extends BaseTestAgent {
  readonly role = 'agent';
  readonly email = 'agent@insureflow.com';
  readonly password = 'password';
  readonly agentName = 'Agent Test Agent';

  private createdLeadId: number | null = null;

  defineTests(): Array<[string, () => Promise<void>]> {
    return [
      ['Fetch current user profile', async () => {
        const res = await this.get<{ user: { id: number; role: string } }>('/auth/me');
        this.assertEqual(res.user.role, 'agent', 'user.role');
      }],

      ['Get dashboard stats', async () => {
        const res = await this.get<Record<string, unknown>>('/stats/dashboard');
        this.assertExists(res, 'dashboard stats');
      }],

      // ── CRM / Leads ──────────────────────────────────
      ['List CRM leads', async () => {
        const res = await this.get<{ leads: { data: unknown[] }; counts: Record<string, number> }>('/crm/leads');
        this.assertExists(res.leads, 'leads');
        this.assertArray(res.leads.data, 'leads.data');
        this.assertExists(res.counts, 'counts');
      }],

      ['Create a new lead', async () => {
        const res = await this.post<{ id: number; first_name: string }>('/crm/leads', {
          first_name: 'TestBot',
          last_name: 'Lead',
          email: `testbot-${Date.now()}@example.com`,
          phone: '555-0199',
          insurance_type: 'auto',
          source: 'testing_agent',
          estimated_value: 1200,
          notes: 'Created by automated testing agent',
        });
        this.assertExists(res.id, 'lead.id');
        this.createdLeadId = res.id;
      }],

      ['Update lead status to contacted', async () => {
        if (!this.createdLeadId) throw new Error('No lead to update');
        const res = await this.put<{ id: number; status: string }>(
          `/crm/leads/${this.createdLeadId}`,
          { status: 'contacted' }
        );
        this.assertEqual(res.status, 'contacted', 'lead.status');
      }],

      ['Log activity on lead', async () => {
        if (!this.createdLeadId) throw new Error('No lead to log activity');
        const res = await this.post<{ id: number; type: string }>(
          `/crm/leads/${this.createdLeadId}/activity`,
          { type: 'call', description: 'Automated test call logged by testing agent' }
        );
        this.assertExists(res.id, 'activity.id');
      }],

      ['Filter leads by status', async () => {
        const res = await this.get<{ leads: { data: unknown[] } }>('/crm/leads?status=new');
        this.assertExists(res.leads, 'filtered leads');
      }],

      // ── Applications ─────────────────────────────────
      ['List applications', async () => {
        const res = await this.get<{ data: unknown[] }>('/applications');
        this.assertExists(res.data, 'applications data');
        this.assertArray(res.data, 'applications');
      }],

      // ── Policies ─────────────────────────────────────
      ['List policies', async () => {
        const res = await this.get<{ data: unknown[] }>('/policies');
        this.assertExists(res.data, 'policies data');
        this.assertArray(res.data, 'policies');
      }],

      // ── Commissions ──────────────────────────────────
      ['List commissions', async () => {
        const res = await this.get<{ items: unknown[] }>('/agent/commissions');
        this.assertExists(res.items, 'commissions items');
        this.assertArray(res.items, 'commissions');
      }],

      // ── Claims ───────────────────────────────────────
      ['List claims', async () => {
        const res = await this.get<{ data: unknown[] }>('/claims');
        this.assertExists(res.data, 'claims data');
        this.assertArray(res.data, 'claims');
      }],

      // ── Renewals ─────────────────────────────────────
      ['List renewals', async () => {
        const res = await this.get<{ data: unknown[] }>('/renewals');
        this.assertExists(res.data, 'renewals data');
      }],

      ['Get renewal dashboard', async () => {
        const res = await this.get<{ upcoming_30: number }>('/renewals/dashboard');
        this.assertExists(res, 'renewal dashboard');
      }],

      // ── Compliance ───────────────────────────────────
      ['Get compliance dashboard', async () => {
        const res = await this.get<{ licenses: unknown }>('/compliance/dashboard');
        this.assertExists(res.licenses, 'compliance licenses');
      }],

      ['Get compliance pack', async () => {
        const res = await this.get<{ items: unknown[]; summary: unknown }>('/compliance/pack');
        this.assertExists(res.items, 'pack items');
        this.assertExists(res.summary, 'pack summary');
      }],

      // ── Notifications ────────────────────────────────
      ['Check notifications', async () => {
        const res = await this.get<{ notifications: unknown[] }>('/notifications');
        this.assertArray(res.notifications, 'notifications');
      }],

      // ── Conversations ────────────────────────────────
      ['List conversations', async () => {
        const res = await this.get<{ conversations: unknown[] }>('/conversations');
        this.assertArray(res.conversations, 'conversations');
      }],

      // ── Video Meetings ───────────────────────────────
      ['List meetings', async () => {
        const res = await this.get<unknown[]>('/meetings');
        this.assertArray(res, 'meetings');
      }],
    ];
  }
}
