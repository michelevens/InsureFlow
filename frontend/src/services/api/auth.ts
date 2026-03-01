import { api } from './client';
import type { User } from '@/types';

interface AuthResponse {
  user: User;
  token: string;
  email_verified: boolean;
  mfa_required?: boolean;
  mfa_token?: string;
}

interface MfaSetupResponse {
  secret: string;
  qr_uri: string;
}

interface MfaEnableResponse {
  message: string;
  backup_codes: string[];
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

  async changePassword(data: { current_password: string; password: string; password_confirmation: string }): Promise<{ message: string }> {
    return api.put<{ message: string }>('/auth/password', data);
  },

  async mfaSetup(): Promise<MfaSetupResponse> {
    return api.get<MfaSetupResponse>('/auth/mfa/setup');
  },

  async mfaEnable(data: { secret: string; code: string }): Promise<MfaEnableResponse> {
    return api.post<MfaEnableResponse>('/auth/mfa/enable', data);
  },

  async mfaVerify(data: { mfa_token: string; code: string }): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/mfa/verify', data);
  },

  async mfaDisable(password: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/mfa/disable', { password });
  },
};
