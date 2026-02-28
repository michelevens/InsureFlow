import { api } from './client';
import type { Commission, DashboardStats } from '@/types';

export const analyticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    return api.get<DashboardStats>('/stats/dashboard');
  },

  async getCommissions(params?: { status?: string }): Promise<{ items: Commission[]; total: number }> {
    const query = params?.status ? `?status=${params.status}` : '';
    return api.get<{ items: Commission[]; total: number }>(`/agent/commissions${query}`);
  },

  async getAgencyProduction(): Promise<DashboardStats> {
    return api.get<DashboardStats>('/agency/production');
  },

  async getAdminAnalytics(): Promise<DashboardStats> {
    return api.get<DashboardStats>('/admin/analytics');
  },

  async getConversionFunnel(months = 6): Promise<ConversionFunnelResponse> {
    return api.get<ConversionFunnelResponse>(`/analytics/conversion-funnel?months=${months}`);
  },

  async getRevenueTrends(months = 12): Promise<RevenueTrendsResponse> {
    return api.get<RevenueTrendsResponse>(`/analytics/revenue-trends?months=${months}`);
  },

  async getAgentPerformance(months = 3, limit = 20): Promise<AgentPerformanceResponse> {
    return api.get<AgentPerformanceResponse>(`/analytics/agent-performance?months=${months}&limit=${limit}`);
  },

  async getClaimsAnalytics(months = 6): Promise<ClaimsAnalyticsResponse> {
    return api.get<ClaimsAnalyticsResponse>(`/analytics/claims?months=${months}`);
  },

  async getAgentRoi(): Promise<AgentRoiResponse> {
    return api.get<AgentRoiResponse>('/analytics/agent-roi');
  },
};

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface ConversionFunnelResponse {
  funnel: FunnelStage[];
  conversion_rate: number;
  period_months: number;
}

export interface RevenueTrend {
  month: string;
  policies_count: number;
  premium_volume: string;
}

export interface RevenueTrendsResponse {
  trends: RevenueTrend[];
}

export interface AgentPerformanceEntry {
  id: number;
  name: string;
  email: string;
  lead_count: number;
  policy_count: number;
  total_commission: string | null;
}

export interface AgentPerformanceResponse {
  agents: AgentPerformanceEntry[];
}

export interface ClaimsAnalyticsResponse {
  by_status: { status: string; count: number }[];
  by_type: { type: string; count: number }[];
  total_claims: number;
  settled_claims: number;
  total_settlement: string;
  avg_settlement: number;
}

export interface AgentRoiResponse {
  summary: {
    total_leads: number;
    leads_this_month: number;
    leads_last_month: number;
    total_policies: number;
    policies_this_month: number;
    conversion_rate: number;
    active_premium: number;
  };
  revenue: {
    total_commission: number;
    this_month: number;
    this_quarter: number;
    this_year: number;
  };
  pipeline: Record<string, number>;
  monthly_trend: { month: string; leads: number; policies: number; commission: number }[];
  top_insurance_types: Record<string, number>;
}
