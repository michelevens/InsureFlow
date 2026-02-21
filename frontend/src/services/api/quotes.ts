import { api } from './client';
import type { QuoteRequest, Quote } from '@/types';

export interface CalculateQuoteData {
  insurance_type: string;
  zip_code: string;
  state: string;
  details: Record<string, unknown>;
}

export interface QuoteResultsResponse {
  quote_request: QuoteRequest;
  quotes: Quote[];
  count: number;
}

export const quoteService = {
  async calculate(data: CalculateQuoteData): Promise<QuoteResultsResponse> {
    return api.post<QuoteResultsResponse>('/quotes/calculate', data);
  },

  async getResults(requestId: number): Promise<QuoteResultsResponse> {
    return api.get<QuoteResultsResponse>(`/quotes/${requestId}/results`);
  },

  async saveComparison(quoteIds: number[]): Promise<{ id: number }> {
    return api.post<{ id: number }>('/quotes/compare', { quote_ids: quoteIds });
  },

  async selectQuote(quoteId: number): Promise<{ application_id: number }> {
    return api.post<{ application_id: number }>(`/quotes/${quoteId}/select`);
  },
};
