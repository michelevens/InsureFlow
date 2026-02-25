import { api } from './client';

export interface EstimatePayload {
  insurance_type: string;
  zip_code: string;
  coverage_level: string;
  details?: Record<string, string>;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  agency_id?: number;
}

export interface QuoteBreakdown {
  base_rate: number;
  coverage_factor: number;
  state_factor: number;
  policy_fee: number;
  discount: number;
  discount_label: string | null;
}

export interface EstimateQuote {
  id: number;
  quote_request_id: number;
  carrier_product_id: number;
  monthly_premium: string;
  annual_premium: string;
  deductible: string;
  coverage_limit: string;
  features: string[];
  is_recommended: boolean;
  expires_at: string;
  breakdown?: QuoteBreakdown;
  carrier_product: {
    id: number;
    carrier_id: number;
    name: string;
    insurance_type: string;
    carrier: {
      id: number;
      name: string;
      slug: string;
      logo: string | null;
      am_best_rating: string | null;
    };
  };
}

export interface EstimateResponse {
  quote_request_id: number;
  quotes: EstimateQuote[];
}

export const quoteService = {
  async estimate(data: EstimatePayload): Promise<EstimateResponse> {
    return api.post<EstimateResponse>('/calculator/estimate', data);
  },

  async saveContact(quoteRequestId: number, data: { first_name: string; last_name: string; email: string; phone?: string }): Promise<{ message: string }> {
    return api.put<{ message: string }>(`/calculator/${quoteRequestId}/contact`, data);
  },
};
