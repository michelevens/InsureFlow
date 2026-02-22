import { api } from './client';

export interface PartnerListing {
  id: number;
  user_id: number;
  category: string;
  business_name: string;
  description: string | null;
  service_area: string[] | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PartnerReferral {
  id: number;
  listing_id: number;
  listing_name?: string;
  referred_by: number;
  consumer_id: number | null;
  status: 'pending' | 'contacted' | 'converted';
  commission_earned: number;
  created_at: string;
}

function qs(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '';
}

export const partnerMarketplaceService = {
  list: (params?: { category?: string; page?: number }) =>
    api.get<{ data: PartnerListing[]; last_page: number }>(`/partners${qs(params)}`),
  show: (id: number) => api.get<PartnerListing>(`/partners/${id}`),
  create: (data: Partial<PartnerListing>) => api.post<PartnerListing>('/partners', data),
  update: (id: number, data: Partial<PartnerListing>) => api.put<PartnerListing>(`/partners/${id}`, data),
  destroy: (id: number) => api.delete(`/partners/${id}`),
  refer: (listingId: number, data?: { consumer_id?: number }) =>
    api.post<PartnerReferral>(`/partners/${listingId}/refer`, data),
  myReferrals: () => api.get<PartnerReferral[]>('/partners/my-referrals'),
  categories: () => api.get<string[]>('/partners/categories'),
};
