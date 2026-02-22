import { api } from './client';

export interface RenewalOpportunity {
  id: number;
  policy_id: number;
  agent_id: number | null;
  consumer_id: number;
  status: string;
  renewal_date: string;
  current_premium: string;
  best_new_premium: string | null;
  retention_score: number;
  retention_factors: Record<string, unknown> | null;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  policy?: { id: number; policy_number: string; insurance_type: string; premium?: string; start_date?: string; end_date?: string };
  consumer?: { id: number; name: string; email: string; phone?: string };
  agent?: { id: number; name: string };
}

export interface RenewalDashboard {
  upcoming_30: number;
  upcoming_60: number;
  upcoming_90: number;
  at_risk: number;
  renewed_this_month: number;
  lost_this_month: number;
  retention_rate: number | null;
}

export const renewalService = {
  async getRenewals(params?: {
    status?: string;
    days?: number;
    upcoming_only?: boolean;
    sort?: string;
    dir?: string;
    page?: number;
  }): Promise<{ data: RenewalOpportunity[] }> {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.days) sp.set('days', String(params.days));
    if (params?.upcoming_only !== undefined) sp.set('upcoming_only', String(params.upcoming_only));
    if (params?.sort) sp.set('sort', params.sort);
    if (params?.dir) sp.set('dir', params.dir);
    if (params?.page) sp.set('page', String(params.page));
    const qs = sp.toString();
    return api.get(`/renewals${qs ? `?${qs}` : ''}`);
  },

  async getDashboard(): Promise<RenewalDashboard> {
    return api.get<RenewalDashboard>('/renewals/dashboard');
  },

  async getRenewal(id: number): Promise<RenewalOpportunity> {
    return api.get<RenewalOpportunity>(`/renewals/${id}`);
  },

  async updateStatus(id: number, data: {
    status: string;
    best_new_premium?: number;
    notes?: string;
  }): Promise<RenewalOpportunity> {
    return api.put<RenewalOpportunity>(`/renewals/${id}/status`, data);
  },
};
