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
    agency_code?: string;
  }): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/register', data);
  },

  async checkEmail(email: string): Promise<{ exists: boolean }> {
    return api.post<{ exists: boolean }>('/auth/check-email', { email });
  },

  async registerFromQuote(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    quote_request_id: number;
  }): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/register-from-quote', data);
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', { email, password });
  },

  async demoLogin(email: string): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/demo-login', { email });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/forgot-password', { email });
  },

  async resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/reset-password', data);
  },

  async logout(): Promise<void> {
    return api.post('/auth/logout');
  },

  async me(): Promise<{ user: User }> {
    return api.get<{ user: User }>('/auth/me');
  },
};
