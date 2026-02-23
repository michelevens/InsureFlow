import { api } from './client';
import type { Policy } from '@/types';

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  total: number;
  per_page: number;
  last_page: number;
}

export interface PolicyListResponse {
  items: Policy[];
  total: number;
  counts: { active: number; expiring_soon: number; expired: number; total: number };
}

export const policyService = {
  async list(params?: { status?: string }): Promise<PolicyListResponse> {
    const query = params?.status ? `?status=${params.status}` : '';
    const raw = await api.get<PaginatedResponse<Policy>>(`/policies${query}`);
    const items = raw.data || [];
    return {
      items,
      total: raw.total || items.length,
      counts: {
        total: raw.total || items.length,
        active: items.filter(p => p.status === 'active').length,
        expiring_soon: items.filter(p => p.status === 'expiring_soon').length,
        expired: items.filter(p => p.status === 'expired').length,
      },
    };
  },

  async get(id: number): Promise<Policy> {
    return api.get<Policy>(`/policies/${id}`);
  },

  async getExpiring(): Promise<Policy[]> {
    const raw = await api.get<PaginatedResponse<Policy>>('/policies?status=expiring_soon');
    return raw.data || [];
  },

  async renew(id: number): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/policies/${id}/renew`);
  },
};
