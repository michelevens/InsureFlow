import { api } from './client';

export interface DataSubscription {
  id: number;
  organization_id: number;
  product_type: 'market_intel' | 'competitive_analysis' | 'agent_benchmarking' | 'custom_report';
  tier: 'basic' | 'professional' | 'enterprise';
  price_monthly: number;
  is_active: boolean;
  started_at: string;
  expires_at: string | null;
  created_at: string;
}

export interface DataReport {
  id: number;
  subscription_id: number;
  report_type: string;
  title: string;
  parameters: Record<string, unknown>;
  results: Record<string, unknown> | null;
  file_path: string | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  generated_at: string | null;
  created_at: string;
}

export interface MarketIntelData {
  total_quotes: number;
  avg_premium: number;
  top_carriers: { carrier: string; market_share: number }[];
  trends: { period: string; volume: number; avg_premium: number }[];
  product_mix: { product_type: string; percentage: number }[];
}

export interface CompetitiveAnalysis {
  your_metrics: { conversion_rate: number; avg_response_time: number; avg_premium: number };
  market_avg: { conversion_rate: number; avg_response_time: number; avg_premium: number };
  percentile_rank: number;
  improvement_areas: string[];
}

export interface AgentBenchmark {
  agent_id: number;
  agent_name: string;
  policies_written: number;
  total_premium: number;
  conversion_rate: number;
  avg_response_time_hours: number;
  retention_rate: number;
  rank: number;
}

function qs(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '';
}

export const dataProductService = {
  listSubscriptions: () => api.get<DataSubscription[]>('/data/subscriptions'),
  subscribe: (data: { product_type: string; tier: string }) => api.post<DataSubscription>('/data/subscriptions', data),
  cancelSubscription: (id: number) => api.delete(`/data/subscriptions/${id}`),

  getMarketIntel: (params?: { period?: string; region?: string }) =>
    api.get<MarketIntelData>(`/data/market-intel${qs(params)}`),

  getCompetitiveAnalysis: (params?: { period?: string }) =>
    api.get<CompetitiveAnalysis>(`/data/competitive-analysis${qs(params)}`),

  getAgentBenchmarks: (params?: { period?: string; limit?: number }) =>
    api.get<AgentBenchmark[]>(`/data/agent-benchmarking${qs(params)}`),

  listReports: () => api.get<DataReport[]>('/data/reports'),
  generateReport: (data: { report_type: string; parameters: Record<string, unknown> }) =>
    api.post<DataReport>('/data/reports/generate', data),
  downloadReport: (id: number) => api.get<Blob>(`/data/reports/${id}/download`),
};
