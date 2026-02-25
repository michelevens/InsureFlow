import { api, API_URL } from './client';

// ── Types ─────────────────────────────────────────

export type ObjectType = 'person' | 'vehicle' | 'property' | 'business' | 'other';
export type CoverageCategory = 'liability' | 'property' | 'medical' | 'life' | 'disability' | 'specialty';

export type ScenarioStatus =
  | 'draft' | 'quoting' | 'quoted' | 'comparing'
  | 'selected' | 'applied' | 'bound' | 'declined' | 'expired';

export interface InsuredObject {
  id: number;
  insurable_type: string;
  insurable_id: number;
  object_type: ObjectType;
  name: string;
  sort_order: number;
  relationship?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  // Vehicle
  vehicle_year?: number | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vin?: string | null;
  // Property
  year_built?: number | null;
  square_footage?: number | null;
  construction_type?: string | null;
  // Business
  fein?: string | null;
  naics_code?: string | null;
  annual_revenue?: number | null;
  employee_count?: number | null;
  // Person extras
  height_inches?: number | null;
  weight_lbs?: number | null;
  tobacco_use?: boolean | null;
  occupation?: string | null;
  annual_income?: number | null;
  details_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Coverage {
  id: number;
  coverable_type: string;
  coverable_id: number;
  coverage_type: string;
  coverage_category: CoverageCategory;
  sort_order: number;
  limit_amount?: number | null;
  per_occurrence_limit?: number | null;
  aggregate_limit?: number | null;
  deductible_amount?: number | null;
  benefit_amount?: number | null;
  benefit_period?: string | null;
  elimination_period_days?: number | null;
  coinsurance_pct?: number | null;
  copay_amount?: number | null;
  is_included: boolean;
  premium_allocated?: number | null;
  details_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ScenarioQuote {
  id: number;
  scenario_id: number;
  carrier_id: number | null;
  carrier_product_id: number | null;
  carrier_name: string;
  product_name: string | null;
  premium_monthly: number | null;
  premium_annual: number | null;
  premium_semi_annual: number | null;
  premium_quarterly: number | null;
  status: 'pending' | 'quoted' | 'declined' | 'expired' | 'selected';
  quoted_at: string | null;
  expires_at: string | null;
  decline_reason: string | null;
  am_best_rating: string | null;
  financial_strength_score: number | null;
  coverage_details: Record<string, unknown> | null;
  endorsements: string[] | null;
  exclusions: string[] | null;
  discounts_applied: string[] | null;
  agent_notes: string | null;
  is_recommended: boolean;
  carrier?: { id: number; name: string; am_best_rating?: string } | null;
  created_at: string;
  updated_at: string;
}

export type ScenarioQuotePayload = {
  carrier_id?: number | null;
  carrier_product_id?: number | null;
  carrier_name: string;
  product_name?: string | null;
  premium_monthly?: number | null;
  premium_annual?: number | null;
  premium_semi_annual?: number | null;
  premium_quarterly?: number | null;
  status?: ScenarioQuote['status'];
  am_best_rating?: string | null;
  financial_strength_score?: number | null;
  coverage_details?: Record<string, unknown> | null;
  endorsements?: string[] | null;
  exclusions?: string[] | null;
  discounts_applied?: string[] | null;
  agent_notes?: string | null;
  is_recommended?: boolean;
};

export interface LeadScenario {
  id: number;
  lead_id: number;
  agent_id: number;
  scenario_name: string;
  product_type: string;
  priority: number;
  status: ScenarioStatus;
  selected_carrier_id?: number | null;
  effective_date_desired?: string | null;
  current_carrier?: string | null;
  current_premium_monthly?: number | null;
  current_policy_number?: string | null;
  current_policy_expiration?: string | null;
  target_premium_monthly?: number | null;
  best_quoted_premium?: number | null;
  total_applications: number;
  total_quotes_received: number;
  risk_factors?: string[] | null;
  metadata_json?: Record<string, unknown> | null;
  notes?: string | null;
  insured_objects: InsuredObject[];
  coverages: Coverage[];
  quotes?: ScenarioQuote[];
  selected_carrier?: { id: number; name: string } | null;
  applications?: { id: number; reference: string; status: string; carrier_name: string }[];
  created_at: string;
  updated_at: string;
}

export interface ProductTypeMap {
  [category: string]: Record<string, string>;
}

export interface SuggestedCoverageInfo {
  product_type: string;
  primary_object_type: ObjectType;
  coverages: Partial<Coverage>[];
  coverage_types: Record<string, string[]>;
}

// ── Payloads ─────────────────────────────────────

export type CreateScenarioPayload = {
  scenario_name: string;
  product_type: string;
  priority?: number;
  effective_date_desired?: string | null;
  current_carrier?: string | null;
  current_premium_monthly?: number | null;
  current_policy_number?: string | null;
  current_policy_expiration?: string | null;
  target_premium_monthly?: number | null;
  risk_factors?: string[] | null;
  metadata_json?: Record<string, unknown> | null;
  notes?: string | null;
};

export type UpdateScenarioPayload = Partial<CreateScenarioPayload> & {
  status?: ScenarioStatus;
  selected_carrier_id?: number | null;
  best_quoted_premium?: number | null;
};

export type InsuredObjectPayload = Omit<InsuredObject, 'id' | 'insurable_type' | 'insurable_id' | 'sort_order' | 'created_at' | 'updated_at'>;
export type CoveragePayload = Omit<Coverage, 'id' | 'coverable_type' | 'coverable_id' | 'sort_order' | 'created_at' | 'updated_at'>;

export type ConvertPayload = {
  carrier_name: string;
  carrier_product_id?: number | null;
};

// ── Service ─────────────────────────────────────

export const scenarioService = {
  // Scenarios
  async list(leadId: number): Promise<LeadScenario[]> {
    return api.get<LeadScenario[]>(`/crm/leads/${leadId}/scenarios`);
  },

  async get(leadId: number, scenarioId: number): Promise<LeadScenario> {
    return api.get<LeadScenario>(`/crm/leads/${leadId}/scenarios/${scenarioId}`);
  },

  async create(leadId: number, data: CreateScenarioPayload): Promise<LeadScenario> {
    return api.post<LeadScenario>(`/crm/leads/${leadId}/scenarios`, data);
  },

  async update(leadId: number, scenarioId: number, data: UpdateScenarioPayload): Promise<LeadScenario> {
    return api.put<LeadScenario>(`/crm/leads/${leadId}/scenarios/${scenarioId}`, data);
  },

  async remove(leadId: number, scenarioId: number): Promise<void> {
    return api.delete(`/crm/leads/${leadId}/scenarios/${scenarioId}`);
  },

  // Insured Objects
  async addObject(leadId: number, scenarioId: number, data: InsuredObjectPayload): Promise<InsuredObject> {
    return api.post<InsuredObject>(`/crm/leads/${leadId}/scenarios/${scenarioId}/objects`, data);
  },

  async updateObject(leadId: number, scenarioId: number, objectId: number, data: Partial<InsuredObjectPayload>): Promise<InsuredObject> {
    return api.put<InsuredObject>(`/crm/leads/${leadId}/scenarios/${scenarioId}/objects/${objectId}`, data);
  },

  async removeObject(leadId: number, scenarioId: number, objectId: number): Promise<void> {
    return api.delete(`/crm/leads/${leadId}/scenarios/${scenarioId}/objects/${objectId}`);
  },

  // Coverages
  async addCoverage(leadId: number, scenarioId: number, data: CoveragePayload): Promise<Coverage> {
    return api.post<Coverage>(`/crm/leads/${leadId}/scenarios/${scenarioId}/coverages`, data);
  },

  async updateCoverage(leadId: number, scenarioId: number, coverageId: number, data: Partial<CoveragePayload>): Promise<Coverage> {
    return api.put<Coverage>(`/crm/leads/${leadId}/scenarios/${scenarioId}/coverages/${coverageId}`, data);
  },

  async removeCoverage(leadId: number, scenarioId: number, coverageId: number): Promise<void> {
    return api.delete(`/crm/leads/${leadId}/scenarios/${scenarioId}/coverages/${coverageId}`);
  },

  // Carrier Quotes (multi-carrier comparison)
  async addQuote(leadId: number, scenarioId: number, data: ScenarioQuotePayload): Promise<ScenarioQuote> {
    return api.post<ScenarioQuote>(`/crm/leads/${leadId}/scenarios/${scenarioId}/quotes`, data);
  },

  async updateQuote(leadId: number, scenarioId: number, quoteId: number, data: Partial<ScenarioQuotePayload>): Promise<ScenarioQuote> {
    return api.put<ScenarioQuote>(`/crm/leads/${leadId}/scenarios/${scenarioId}/quotes/${quoteId}`, data);
  },

  async removeQuote(leadId: number, scenarioId: number, quoteId: number): Promise<void> {
    return api.delete(`/crm/leads/${leadId}/scenarios/${scenarioId}/quotes/${quoteId}`);
  },

  async selectQuote(leadId: number, scenarioId: number, quoteId: number): Promise<{ message: string; quote: ScenarioQuote }> {
    return api.post(`/crm/leads/${leadId}/scenarios/${scenarioId}/quotes/${quoteId}/select`);
  },

  // Convert to application
  async convert(leadId: number, scenarioId: number, data: ConvertPayload): Promise<unknown> {
    return api.post(`/crm/leads/${leadId}/scenarios/${scenarioId}/convert`, data);
  },

  // Reference data
  async productTypes(): Promise<ProductTypeMap> {
    return api.get<ProductTypeMap>('/insurance/product-types');
  },

  async suggestedCoverages(productType: string): Promise<SuggestedCoverageInfo> {
    return api.get<SuggestedCoverageInfo>(`/insurance/suggested-coverages/${productType}`);
  },

  // Proposal PDF
  async generateProposal(leadId: number, scenarioId: number): Promise<void> {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${API_URL}/crm/leads/${leadId}/scenarios/${scenarioId}/proposal`, {
      method: 'POST',
      headers: {
        'Accept': 'application/pdf',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'PDF generation failed' }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.headers.get('content-disposition')?.match(/filename="?(.+?)"?$/)?.[1]
      ?? `proposal-${scenarioId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
