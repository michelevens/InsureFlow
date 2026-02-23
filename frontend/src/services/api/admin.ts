import { api } from './client';
import type { User, SubscriptionPlan } from '@/types';

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  total: number;
  per_page: number;
  last_page: number;
}

export interface UserListResponse {
  items: User[];
  total: number;
  counts: Record<string, number>;
}

export const adminService = {
  async getUsers(params?: { role?: string; search?: string }): Promise<UserListResponse> {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    const raw = await api.get<{ users: PaginatedResponse<User>; counts: Record<string, number> }>(`/admin/users${qs ? `?${qs}` : ''}`);
    const items = raw.users?.data || [];
    return {
      items,
      total: raw.users?.total || items.length,
      counts: raw.counts || {},
    };
  },

  async toggleUserStatus(id: number, activate: boolean): Promise<{ message: string }> {
    const endpoint = activate ? `/admin/users/${id}/approve` : `/admin/users/${id}/deactivate`;
    return api.put<{ message: string }>(endpoint);
  },

  async getPlans(): Promise<SubscriptionPlan[]> {
    return api.get<SubscriptionPlan[]>('/admin/plans');
  },

  async createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    return api.post<SubscriptionPlan>('/admin/plans', data);
  },

  async updatePlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    return api.put<SubscriptionPlan>(`/admin/plans/${id}`, data);
  },

  async getAgencies(): Promise<{ data: Array<{ id: number; name: string; agency_code: string; is_verified?: boolean; is_active?: boolean; owner?: User }> }> {
    return api.get('/admin/agencies');
  },

  async getAnalytics(): Promise<{ monthly_users: Array<{ month: string; count: number }>; total_users: number; active_users: number }> {
    return api.get('/admin/analytics');
  },
};
