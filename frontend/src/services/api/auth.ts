import { api } from './client';
import type { User } from '@/types';

interface AuthResponse {
  user: User;
  token: string;
  email_verified: boolean;
}

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: 'consumer' | 'agent' | 'agency_owner' | 'carrier';
  }): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/register', data);
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', { email, password });
  },

  async logout(): Promise<void> {
    return api.post('/auth/logout');
  },

  async me(): Promise<{ user: User }> {
    return api.get<{ user: User }>('/auth/me');
  },
};
