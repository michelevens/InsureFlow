import { api } from './client';

export interface ClaimActivity {
  id: number;
  claim_id: number;
  actor_id: number | null;
  type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor?: { id: number; name: string; role: string };
}

export interface Claim {
  id: number;
  policy_id: number;
  consumer_id: number;
  agent_id: number | null;
  claim_number: string;
  type: string;
  status: string;
  date_of_loss: string;
  description: string;
  location: string | null;
  estimated_amount: string | null;
  approved_amount: string | null;
  deductible_amount: string | null;
  settlement_amount: string | null;
  details: Record<string, unknown> | null;
  settled_at: string | null;
  closed_at: string | null;
  created_at: string;
  policy?: { id: number; policy_number: string; insurance_type: string };
  consumer?: { id: number; name: string; email: string; phone?: string };
  agent?: { id: number; name: string; email?: string };
  activities?: ClaimActivity[];
}

export interface ClaimFilters {
  status?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

export const claimService = {
  async getClaims(filters?: ClaimFilters): Promise<{ data: Claim[]; meta?: { last_page: number; current_page: number; total: number } }> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.per_page) params.set('per_page', String(filters.per_page));
    const qs = params.toString();
    return api.get(`/claims${qs ? `?${qs}` : ''}`);
  },

  async getClaim(id: number): Promise<Claim> {
    return api.get<Claim>(`/claims/${id}`);
  },

  async fileClaim(data: {
    policy_id: number;
    type: string;
    date_of_loss: string;
    description: string;
    location?: string;
    estimated_amount?: number;
    details?: Record<string, unknown>;
  }): Promise<Claim> {
    return api.post<Claim>('/claims', data);
  },

  async updateStatus(id: number, data: {
    status: string;
    approved_amount?: number;
    settlement_amount?: number;
    deductible_amount?: number;
    note?: string;
  }): Promise<Claim> {
    return api.put<Claim>(`/claims/${id}/status`, data);
  },

  async addNote(id: number, description: string): Promise<ClaimActivity> {
    return api.post<ClaimActivity>(`/claims/${id}/notes`, { description });
  },
};
