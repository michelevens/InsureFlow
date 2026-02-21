import { api } from './client';
import type { Policy } from '@/types';

interface PolicyListResponse {
  items: Policy[];
  counts: { total: number; active: number; expiring: number; expired: number };
}

export const policyService = {
  async list(params?: { status?: string }): Promise<PolicyListResponse> {
    const query = params?.status ? `?status=${params.status}` : '';
    return api.get<PolicyListResponse>(`/policies${query}`);
  },

  async get(id: number): Promise<{ item: Policy }> {
    return api.get<{ item: Policy }>(`/policies/${id}`);
  },

  async getExpiring(): Promise<{ items: Policy[] }> {
    return api.get<{ items: Policy[] }>('/policies/expiring');
  },

  async renew(id: number): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/policies/${id}/renew`);
  },
};
