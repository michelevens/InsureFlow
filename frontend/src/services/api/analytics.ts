import { api } from './client';
import type { Commission, DashboardStats } from '@/types';

export const analyticsService = {
  async getDashboardStats(role: string): Promise<DashboardStats> {
    return api.get<DashboardStats>(`/stats/${role}`);
  },

  async getCommissions(params?: { status?: string }): Promise<{ items: Commission[]; total: number }> {
    const query = params?.status ? `?status=${params.status}` : '';
    return api.get<{ items: Commission[]; total: number }>(`/agent/commissions${query}`);
  },

  async getAgencyProduction(): Promise<DashboardStats> {
    return api.get<DashboardStats>('/agency/production');
  },

  async getAdminAnalytics(): Promise<DashboardStats> {
    return api.get<DashboardStats>('/admin/analytics');
  },
};
