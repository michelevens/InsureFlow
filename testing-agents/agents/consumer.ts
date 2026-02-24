/**
 * ConsumerTestAgent — simulates a consumer user journey:
 * - Browse marketplace (carriers, agents)
 * - Get insurance quotes
 * - View applications, policies, claims
 * - Send messages, check notifications
 * - View dashboard stats
 */
import { BaseTestAgent } from '../base-agent.js';

export class ConsumerTestAgent extends BaseTestAgent {
  readonly role = 'consumer';
  readonly email = 'consumer@insureflow.com';
  readonly password = 'password';
  readonly agentName = 'Consumer Test Agent';

  defineTests(): Array<[string, () => Promise<void>]> {
    return [
      ['Fetch current user profile', async () => {
        const res = await this.get<{ user: { id: number; role: string; email: string } }>('/auth/me');
        this.assertExists(res.user, 'user');
        this.assertEqual(res.user.role, 'consumer', 'user.role');
        this.assertEqual(res.user.email, this.email, 'user.email');
      }],

      ['Get dashboard stats', async () => {
        const res = await this.get<Record<string, unknown>>('/stats/dashboard');
        this.assertExists(res, 'dashboard stats');
      }],

      ['Browse carriers list', async () => {
        const res = await this.get<{ items: Array<{ id: number; name: string }> }>('/marketplace/carriers');
        this.assertExists(res.items, 'carriers items');
        this.assertArray(res.items, 'carriers', 1);
      }],

      ['Browse agents marketplace', async () => {
        const res = await this.get<{ items: Array<{ id: number }> }>('/marketplace/agents');
        this.assertExists(res.items, 'agents items');
        this.assertArray(res.items, 'agents');
      }],

      ['Get quote estimate (auto insurance)', async () => {
        const res = await this.post<{ quote_request_id: number; quotes: unknown[] }>(
          '/calculator/estimate',
          {
            insurance_type: 'auto',
            zip_code: '33601',
            coverage_level: 'standard',
            details: {
              vehicle_year: '2022',
              vehicle_make: 'Toyota',
              vehicle_model: 'Camry',
            },
            first_name: 'Test',
            last_name: 'Consumer',
            email: 'consumer@insureflow.com',
          }
        );
        this.assertExists(res.quote_request_id, 'quote_request_id');
        this.assertArray(res.quotes, 'quotes', 1);
      }],

      ['Get quote estimate (home insurance)', async () => {
        const res = await this.post<{ quote_request_id: number; quotes: unknown[] }>(
          '/calculator/estimate',
          {
            insurance_type: 'home',
            zip_code: '33601',
            coverage_level: 'standard',
            details: {
              property_type: 'single_family',
              year_built: '2005',
              square_feet: '2000',
            },
          }
        );
        this.assertExists(res.quote_request_id, 'quote_request_id');
        this.assertArray(res.quotes, 'quotes', 1);
      }],

      ['List my applications', async () => {
        const res = await this.get<{ data: unknown[] }>('/applications');
        this.assertExists(res.data, 'applications data');
        this.assertArray(res.data, 'applications');
      }],

      ['List my policies', async () => {
        const res = await this.get<{ data: unknown[] }>('/policies');
        this.assertExists(res.data, 'policies data');
        this.assertArray(res.data, 'policies');
      }],

      ['List my claims', async () => {
        const res = await this.get<{ data: unknown[] }>('/claims');
        this.assertExists(res.data, 'claims data');
        this.assertArray(res.data, 'claims');
      }],

      ['Check notifications', async () => {
        const res = await this.get<{ notifications: unknown[] }>('/notifications');
        this.assertExists(res.notifications, 'notifications');
        this.assertArray(res.notifications, 'notifications');
      }],

      ['Get unread notification count', async () => {
        const res = await this.get<{ count: number }>('/notifications/unread-count');
        this.assertExists(res.count, 'unread count');
      }],

      ['List conversations', async () => {
        const res = await this.get<{ conversations: unknown[] }>('/conversations');
        this.assertExists(res.conversations, 'conversations');
        this.assertArray(res.conversations, 'conversations');
      }],
    ];
  }
}
