import { api } from './client';
import type { User, SubscriptionPlan } from '@/types';

interface UserListResponse {
  items: User[];
  counts: { total: number; consumers: number; agents: number; carriers: number };
}

export const adminService = {
  async getUsers(params?: { role?: string; search?: string }): Promise<UserListResponse> {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.search) query.set('search', params.search);
    return api.get<UserListResponse>(`/admin/users?${query}`);
  },

  async toggleUserStatus(id: number): Promise<{ message: string }> {
    return api.put<{ message: string }>(`/admin/users/${id}/toggle-status`);
  },

  async getPlans(): Promise<{ items: SubscriptionPlan[] }> {
    return api.get<{ items: SubscriptionPlan[] }>('/admin/subscription-plans');
  },

  async createPlan(data: Partial<SubscriptionPlan>): Promise<{ message: string; item: SubscriptionPlan }> {
    return api.post<{ message: string; item: SubscriptionPlan }>('/admin/subscription-plans', data);
  },

  async updatePlan(id: number, data: Partial<SubscriptionPlan>): Promise<{ message: string; item: SubscriptionPlan }> {
    return api.put<{ message: string; item: SubscriptionPlan }>(`/admin/subscription-plans/${id}`, data);
  },

  async getAgencies(): Promise<{ data: Array<{ id: number; name: string; agency_code: string; sso_enabled?: boolean; saml_entity_id?: string; saml_sso_url?: string; saml_certificate?: string; sso_default_role?: string }> }> {
    return api.get('/admin/agencies');
  },

  async getAnalytics(): Promise<Record<string, number>> {
    return api.get<Record<string, number>>('/admin/analytics');
  },
};
