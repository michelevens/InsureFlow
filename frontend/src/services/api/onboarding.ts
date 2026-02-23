import { api } from './client';
import type { User, PlatformProduct, Carrier } from '@/types';

export interface OnboardingFormData {
  products: PlatformProduct[];
  products_grouped: Record<string, PlatformProduct[]>;
  carriers: Pick<Carrier, 'id' | 'name' | 'slug' | 'am_best_rating'>[];
}

export interface AgencyOnboardingPayload {
  agency_name: string;
  agency_phone?: string;
  agency_email?: string;
  agency_website?: string;
  agency_description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  license_number?: string;
  npn_number?: string;
  license_states?: string[];
  eo_carrier?: string;
  eo_policy_number?: string;
  eo_expiration?: string;
  product_ids?: number[];
  carrier_ids?: number[];
}

export interface AgentOnboardingPayload {
  bio?: string;
  license_number?: string;
  license_states?: string[];
  npn_number?: string;
  specialties?: string[];
  carriers?: string[];
  years_experience?: number;
  city?: string;
  state?: string;
  phone?: string;
}

export const onboardingService = {
  async getStatus(): Promise<{
    onboarding_completed: boolean;
    onboarding_data: Record<string, unknown> | null;
    role: string;
    user: User;
  }> {
    return api.get('/onboarding/status');
  },

  async getFormData(): Promise<OnboardingFormData> {
    return api.get('/onboarding/form-data');
  },

  async saveAgency(data: AgencyOnboardingPayload): Promise<{ message: string; agency: unknown }> {
    return api.post('/onboarding/agency', data);
  },

  async saveAgent(data: AgentOnboardingPayload): Promise<{ message: string; profile: unknown }> {
    return api.post('/onboarding/agent', data);
  },

  async complete(): Promise<{ message: string; user: User }> {
    return api.post('/onboarding/complete');
  },
};
