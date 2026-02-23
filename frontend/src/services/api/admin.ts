import { api } from './client';
import type { User, SubscriptionPlan, Carrier } from '@/types';

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

export interface AgencyDetail {
  id: number;
  name: string;
  slug: string;
  agency_code: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  owner?: User;
  agents?: User[];
}

export const adminService = {
  // --- Users ---
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

  async getUser(id: number): Promise<User> {
    return api.get<User>(`/admin/users/${id}`);
  },

  async createUser(data: { name: string; email: string; role: string; password: string; agency_id?: number }): Promise<User> {
    return api.post<User>('/admin/users', data);
  },

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    return api.put<User>(`/admin/users/${id}`, data);
  },

  async toggleUserStatus(id: number, activate: boolean): Promise<{ message: string }> {
    const endpoint = activate ? `/admin/users/${id}/approve` : `/admin/users/${id}/deactivate`;
    return api.put<{ message: string }>(endpoint);
  },

  async resetPassword(id: number): Promise<{ message: string; temporary_password: string }> {
    return api.post<{ message: string; temporary_password: string }>(`/admin/users/${id}/reset-password`);
  },

  // --- Agencies ---
  async getAgencies(params?: { search?: string }): Promise<{ data: AgencyDetail[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get(`/admin/agencies${qs ? `?${qs}` : ''}`);
  },

  async getAgency(id: number): Promise<AgencyDetail> {
    return api.get<AgencyDetail>(`/admin/agencies/${id}`);
  },

  async updateAgency(id: number, data: { is_verified?: boolean; is_active?: boolean }): Promise<AgencyDetail> {
    return api.put<AgencyDetail>(`/admin/agencies/${id}`, data);
  },

  // --- Plans ---
  async getPlans(): Promise<SubscriptionPlan[]> {
    return api.get<SubscriptionPlan[]>('/admin/plans');
  },

  async createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    return api.post<SubscriptionPlan>('/admin/plans', data);
  },

  async updatePlan(id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    return api.put<SubscriptionPlan>(`/admin/plans/${id}`, data);
  },

  async deletePlan(id: number): Promise<void> {
    return api.delete(`/admin/plans/${id}`);
  },

  // --- Carriers ---
  async getCarriers(params?: { search?: string }): Promise<Carrier[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get<Carrier[]>(`/admin/carriers${qs ? `?${qs}` : ''}`);
  },

  async getCarrier(id: number): Promise<Carrier & { products?: unknown[]; agency_appointments_count?: number }> {
    return api.get(`/admin/carriers/${id}`);
  },

  async createCarrier(data: Partial<Carrier>): Promise<Carrier> {
    return api.post<Carrier>('/admin/carriers', data);
  },

  async updateCarrier(id: number, data: Partial<Carrier>): Promise<Carrier> {
    return api.put<Carrier>(`/admin/carriers/${id}`, data);
  },

  // --- Analytics ---
  async getAnalytics(): Promise<{ monthly_users: Array<{ month: string; count: number }>; total_users: number; active_users: number }> {
    return api.get('/admin/analytics');
  },
};
