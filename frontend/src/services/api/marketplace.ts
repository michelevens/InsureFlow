import { api } from './client';

export interface MarketplaceRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  insurance_type: string;
  zip_code: string;
  state: string;
  coverage_level?: string;
  description?: string;
  details?: Record<string, unknown>;
  date_of_birth?: string;
}

export interface MarketplaceSubmitResponse {
  message: string;
  quote_request_id: number;
  agents_matched: number;
}

export interface MarketplaceQuoteRequest {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  insurance_type: string;
  zip_code: string;
  state: string;
  coverage_level: string;
  description: string | null;
  status: string;
  is_marketplace: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface ConsumerScenario {
  id: number;
  scenario_name: string;
  product_type: string;
  status: string;
  consumer_status: string;
  consumer_visible: boolean;
  sent_to_consumer_at: string | null;
  consumer_viewed_at: string | null;
  consumer_token: string | null;
  best_quoted_premium: string | null;
  target_premium_monthly: string | null;
  agent: { id: number; name: string } | null;
  lead: { agency: { id: number; name: string } | null } | null;
  coverages: Array<{
    id: number;
    coverage_type: string;
    coverage_category: string;
    limit_amount: string | null;
    deductible_amount: string | null;
    benefit_amount: string | null;
  }>;
}

export interface ConsumerDashboardResponse {
  quote_requests: MarketplaceQuoteRequest[];
  scenarios_received: ConsumerScenario[];
  applications: Array<{
    id: number;
    reference: string;
    insurance_type: string;
    carrier_name: string;
    monthly_premium: string;
    status: string;
    signing_token: string | null;
    signed_at: string | null;
    created_at: string;
    agent: { id: number; name: string } | null;
  }>;
  summary: {
    total_requests: number;
    total_scenarios: number;
    total_applications: number;
    agents_responding: number;
  };
}

export interface PublicScenarioView {
  id: number;
  scenario_name: string;
  product_type: string;
  status: string;
  consumer_status: string;
  best_quoted_premium: string | null;
  target_premium_monthly: string | null;
  notes: string | null;
  agent: { id: number; name: string } | null;
  lead: { agency: { id: number; name: string; city: string | null; state: string | null } | null } | null;
  coverages: Array<{
    id: number;
    coverage_type: string;
    coverage_category: string;
    limit_amount: string | null;
    deductible_amount: string | null;
    benefit_amount: string | null;
    is_included: boolean;
  }>;
  insured_objects: Array<{
    id: number;
    object_type: string;
    name: string;
    relationship: string | null;
  }>;
}

export interface PublicApplicationView {
  application: {
    id: number;
    reference: string;
    insurance_type: string;
    carrier_name: string;
    monthly_premium: string;
    status: string;
    signed_at: string | null;
    agent: { id: number; name: string } | null;
    agency: { id: number; name: string } | null;
    insured_objects: Array<{
      id: number;
      object_type: string;
      name: string;
    }>;
    coverages: Array<{
      id: number;
      coverage_type: string;
      coverage_category: string;
      limit_amount: string | null;
      deductible_amount: string | null;
    }>;
  };
  is_signed: boolean;
}

export interface CreditBalance {
  credits_balance: number;
  credits_used: number;
  last_replenished_at: string | null;
}

export const marketplaceService = {
  // Public: Submit insurance request
  async submitRequest(data: MarketplaceRequest): Promise<MarketplaceSubmitResponse> {
    return api.post<MarketplaceSubmitResponse>('/marketplace/insurance/request', data);
  },

  // Public: View scenario by token
  async viewScenario(token: string): Promise<PublicScenarioView> {
    return api.get<PublicScenarioView>(`/scenarios/${token}/view`);
  },

  // Public: Respond to scenario
  async respondToScenario(token: string, action: 'accept' | 'decline'): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/scenarios/${token}/respond`, { action });
  },

  // Public: View application for signing
  async viewApplication(token: string): Promise<PublicApplicationView> {
    return api.get<PublicApplicationView>(`/applications/${token}/view`);
  },

  // Public: Sign application
  async signApplication(token: string, data: { signer_name: string; signature_data: string }): Promise<{ message: string; reference: string }> {
    return api.post<{ message: string; reference: string }>(`/applications/${token}/sign`, data);
  },

  // Protected: Consumer dashboard
  async consumerDashboard(): Promise<ConsumerDashboardResponse> {
    return api.get<ConsumerDashboardResponse>('/consumer/dashboard');
  },

  // Protected: Agent list marketplace requests
  async listOpenRequests(page = 1): Promise<{ data: MarketplaceQuoteRequest[]; last_page: number; total: number }> {
    return api.get(`/marketplace/insurance/requests?page=${page}`);
  },

  // Protected: Agent unlock/claim request
  async unlockRequest(quoteRequestId: number): Promise<{ message: string; lead_id: number }> {
    return api.post<{ message: string; lead_id: number }>(`/marketplace/insurance/requests/${quoteRequestId}/unlock`);
  },

  // Protected: Send scenario to consumer
  async sendToConsumer(leadId: number, scenarioId: number): Promise<{ message: string; consumer_token: string; view_url: string }> {
    return api.post(`/crm/leads/${leadId}/scenarios/${scenarioId}/send-to-consumer`);
  },

  // Protected: Create application from scenario
  async createApplicationFromScenario(scenarioId: number, data: { carrier_product_id?: number; carrier_name: string }): Promise<{ application: unknown; signing_token: string; sign_url: string }> {
    return api.post(`/applications/create-from-scenario/${scenarioId}`, data);
  },

  // Credits
  async creditBalance(): Promise<CreditBalance> {
    return api.get<CreditBalance>('/credits/balance');
  },

  async creditHistory(page = 1): Promise<{ transactions: unknown; balance: number }> {
    return api.get(`/credits/history?page=${page}`);
  },
};
