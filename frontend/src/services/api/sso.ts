import { api } from './client';
import type { MessageResponse } from './client';

export interface SsoLoginResponse {
  redirect_url: string;
}

export interface SsoConfigPayload {
  agency_id: number;
  saml_entity_id: string;
  saml_sso_url: string;
  saml_certificate: string;
  sso_default_role?: 'agent' | 'agency_owner';
}

export const ssoService = {
  async login(agencySlug: string): Promise<SsoLoginResponse> {
    return api.get<SsoLoginResponse>(`/sso/login/${agencySlug}`);
  },

  async configure(data: SsoConfigPayload): Promise<MessageResponse> {
    return api.post<MessageResponse>('/sso/configure', data);
  },

  async disable(agencyId: number): Promise<MessageResponse> {
    return api.post<MessageResponse>(`/sso/disable/${agencyId}`);
  },
};
