/**
 * CarrierTestAgent — simulates a carrier user:
 * - Dashboard stats
 * - Product management
 * - View applications / claims on their products
 * - Browse marketplace
 * - Notifications
 */
import { BaseTestAgent } from '../base-agent.js';

export class CarrierTestAgent extends BaseTestAgent {
  readonly role = 'carrier';
  readonly email = 'carrier@insureflow.com';
  readonly password = 'password';
  readonly agentName = 'Carrier Test Agent';

  defineTests(): Array<[string, () => Promise<void>]> {
    return [
      ['Fetch current user profile', async () => {
        const res = await this.get<{ user: { id: number; role: string } }>('/auth/me');
        this.assertEqual(res.user.role, 'carrier', 'user.role');
      }],

      ['Get dashboard stats', async () => {
        const res = await this.get<Record<string, unknown>>('/stats/dashboard');
        this.assertExists(res, 'dashboard stats');
      }],

      // ── Marketplace / Carriers ───────────────────────
      ['Browse carriers list', async () => {
        const res = await this.get<{ items: Array<{ id: number; name: string }> }>('/marketplace/carriers');
        this.assertArray(res.items, 'carriers', 1);
      }],

      ['View carrier detail', async () => {
        // Get first carrier to look up
        const list = await this.get<{ items: Array<{ id: number }> }>('/marketplace/carriers');
        if (list.items.length === 0) throw new Error('No carriers found');
        const carrierId = list.items[0].id;
        const res = await this.get<{ item: { id: number; name: string } }>(`/marketplace/carriers/${carrierId}`);
        this.assertExists(res.item, 'carrier detail');
        this.assertEqual(res.item.id, carrierId, 'carrier.id');
      }],

      // ── Applications ─────────────────────────────────
      ['List applications', async () => {
        const res = await this.get<{ data: unknown[] }>('/applications');
        this.assertExists(res.data, 'applications data');
      }],

      // ── Policies ─────────────────────────────────────
      ['List policies', async () => {
        const res = await this.get<{ data: unknown[] }>('/policies');
        this.assertExists(res.data, 'policies data');
      }],

      // ── Claims ───────────────────────────────────────
      ['List claims', async () => {
        const res = await this.get<{ data: unknown[] }>('/claims');
        this.assertExists(res.data, 'claims data');
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

      // ── Conversations ────────────────────────────────
      ['List conversations', async () => {
        const res = await this.get<{ conversations: unknown[] }>('/conversations');
        this.assertArray(res.conversations, 'conversations');
      }],
    ];
  }
}
