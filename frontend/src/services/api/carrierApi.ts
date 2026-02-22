import { api } from './client';
import type { MessageResponse } from './client';

export interface CarrierApiConfig {
  id: number;
  carrier_id: number;
  carrier?: { id: number; name: string };
  api_type: 'rest' | 'soap' | 'xml';
  base_url: string;
  auth_type: 'api_key' | 'oauth2' | 'basic' | 'certificate';
  field_mapping: Record<string, string> | null;
  rate_limit_per_minute: number;
  timeout_seconds: number;
  is_active: boolean;
  last_tested_at: string | null;
  created_at: string;
}

export interface CarrierApiLog {
  id: number;
  carrier_api_config_id: number;
  request_hash: string;
  request_method: string;
  request_url: string;
  response_status: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  created_at: string;
}

export interface TestResult {
  success: boolean;
  response_time_ms: number;
  message: string;
}

export interface LiveRate {
  carrier_id: number;
  carrier_name: string;
  monthly_premium: number;
  annual_premium: number;
  coverage_details: Record<string, string>;
  quote_id: string;
  response_time_ms: number;
}

export interface LiveRatesResponse {
  rates: LiveRate[];
  total_carriers_queried: number;
}

export const carrierApiService = {
  async getConfigs(): Promise<CarrierApiConfig[]> {
    const res = await api.get<{ data: CarrierApiConfig[] }>('/carrier-api/configs');
    return Array.isArray(res) ? res : res.data || [];
  },

  async createConfig(data: Partial<CarrierApiConfig> & { credentials?: Record<string, string> }): Promise<CarrierApiConfig> {
    return api.post<CarrierApiConfig>('/carrier-api/configs', data);
  },

  async updateConfig(id: number, data: Partial<CarrierApiConfig>): Promise<CarrierApiConfig> {
    return api.put<CarrierApiConfig>(`/carrier-api/configs/${id}`, data);
  },

  async deleteConfig(id: number): Promise<MessageResponse> {
    return api.delete<MessageResponse>(`/carrier-api/configs/${id}`);
  },

  async testConnection(id: number): Promise<TestResult> {
    return api.post<TestResult>(`/carrier-api/configs/${id}/test`);
  },

  async getLogs(id: number, page = 1): Promise<{ data: CarrierApiLog[]; last_page: number }> {
    return api.get(`/carrier-api/configs/${id}/logs?page=${page}`);
  },

  async getLiveRates(quoteData: {
    insurance_type: string;
    coverage_amount: number;
    state: string;
    zip_code: string;
    carrier_id?: number;
  }): Promise<LiveRatesResponse> {
    return api.post<LiveRatesResponse>('/carrier-api/live-rates', quoteData);
  },
};
