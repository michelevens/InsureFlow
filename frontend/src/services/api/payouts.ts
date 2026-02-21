import { api } from './client';

export interface ConnectStatus {
  stripe_account_id: string | null;
  stripe_onboarded: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
}

export interface CommissionPayout {
  id: number;
  agent_id: number;
  amount: string;
  platform_fee: string;
  stripe_transfer_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  period_start: string | null;
  period_end: string | null;
  commission_ids: number[] | null;
  failure_reason: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Commission {
  id: number;
  agent_id: number;
  policy_id: number;
  carrier_name: string;
  premium_amount: string;
  commission_rate: string;
  commission_amount: string;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at: string | null;
  created_at: string;
  policy?: {
    id: number;
    policy_number: string;
    type: string;
    user?: { id: number; name: string };
    carrier_product?: {
      carrier?: { name: string };
    };
  };
}

export interface CommissionSummary {
  total_earned: string;
  total_paid: string;
  total_pending: string;
}

export const payoutService = {
  // Stripe Connect
  createConnectAccount(): Promise<{ url: string; account_id: string }> {
    return api.post('/payouts/connect-account');
  },

  getConnectStatus(): Promise<ConnectStatus> {
    return api.get('/payouts/connect-status');
  },

  refreshConnectLink(): Promise<{ url: string }> {
    return api.post('/payouts/connect-refresh');
  },

  // Payouts
  requestPayout(): Promise<{ message: string; payout: CommissionPayout }> {
    return api.post('/payouts/request');
  },

  getPayoutHistory(page = 1): Promise<{ data: CommissionPayout[]; last_page: number; current_page: number; total: number }> {
    return api.get(`/payouts/history?page=${page}`);
  },

  // Commissions (existing endpoint)
  getCommissions(params?: { status?: string }): Promise<{ commissions: Commission[]; summary: CommissionSummary }> {
    const query = params?.status ? `?status=${params.status}` : '';
    return api.get(`/commissions${query}`);
  },
};
