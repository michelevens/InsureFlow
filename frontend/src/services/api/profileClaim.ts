import { api } from './client';

export interface UnclaimedProfile {
  id: number;
  full_name: string | null;
  npn: string | null;
  license_number: string | null;
  license_type: string | null;
  license_status: string | null;
  license_states: string[] | null;
  city: string | null;
  state: string | null;
  county: string | null;
  license_lookup_url: string | null;
  npn_verified: string;
  source: string;
  lines_of_authority: string[] | null;
  license_issue_date: string | null;
  license_expiration_date: string | null;
}

export const profileClaimService = {
  async search(params: { npn?: string; name?: string; license_number?: string; state?: string }): Promise<{ profiles: UnclaimedProfile[] }> {
    const query = new URLSearchParams();
    if (params.npn) query.set('npn', params.npn);
    if (params.name) query.set('name', params.name);
    if (params.license_number) query.set('license_number', params.license_number);
    if (params.state) query.set('state', params.state);
    return api.get(`/profiles/search?${query.toString()}`);
  },

  async claim(profileId: number): Promise<{ message: string; profile: UnclaimedProfile }> {
    return api.post(`/profiles/${profileId}/claim`, {});
  },
};
