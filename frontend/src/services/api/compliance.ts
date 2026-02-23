import { api } from './client';

export interface AgentLicense {
  id: number;
  user_id: number;
  state: string;
  license_number: string;
  license_type: string;
  lines_of_authority: string[] | null;
  status: 'active' | 'expired' | 'suspended' | 'revoked' | 'pending';
  issue_date: string | null;
  expiration_date: string;
  npn: string | null;
  created_at: string;
  updated_at: string;
}

export interface CeCredit {
  id: number;
  user_id: number;
  course_name: string;
  provider: string | null;
  hours: number;
  category: string | null;
  state: string | null;
  completion_date: string;
  certificate_url: string | null;
  course_number: string | null;
  created_at: string;
}

export interface EoPolicy {
  id: number;
  user_id: number;
  carrier: string;
  policy_number: string;
  coverage_amount: number;
  deductible: number | null;
  effective_date: string;
  expiration_date: string;
  status: 'active' | 'expired' | 'cancelled';
  certificate_url: string | null;
  created_at: string;
}

export interface ExpiringItem {
  type: 'license' | 'eo_policy';
  label: string;
  expires: string;
  days_left: number;
  id: number;
}

export interface ComplianceDashboard {
  licenses: {
    total: number;
    active: number;
    expiring_soon: number;
    items: AgentLicense[];
  };
  ce_credits: {
    total_hours: number;
    this_year: number;
    items: CeCredit[];
  };
  eo_insurance: {
    active: boolean;
    policy: EoPolicy | null;
  };
  expiring: ExpiringItem[];
}

export interface ComplianceRequirement {
  id: number;
  state: string;
  insurance_type: string;
  requirement_type: string;
  title: string;
  description: string | null;
  details: Record<string, unknown> | null;
  category: string;
  is_required: boolean;
  frequency: string;
  authority: string | null;
  reference_url: string | null;
}

export interface CompliancePackItem {
  id: number;
  user_id: number;
  agency_id: number | null;
  compliance_requirement_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'waived' | 'expired';
  due_date: string | null;
  completed_date: string | null;
  evidence_url: string | null;
  notes: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  requirement?: ComplianceRequirement;
}

export interface CompliancePack {
  items: CompliancePackItem[];
  summary: {
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
    waived: number;
    overdue: number;
  };
}

export interface ComplianceOverview {
  total_items: number;
  completed: number;
  overdue: number;
  compliance_rate: number;
  users_with_packs: number;
  by_category: Array<{ category: string; total: number; completed_count: number }>;
}

export const complianceService = {
  async dashboard(userId?: number): Promise<ComplianceDashboard> {
    const query = userId ? `?user_id=${userId}` : '';
    return api.get<ComplianceDashboard>(`/compliance/dashboard${query}`);
  },

  // Licenses
  async licenses(): Promise<AgentLicense[]> {
    return api.get<AgentLicense[]>('/compliance/licenses');
  },

  async createLicense(data: {
    state: string;
    license_number: string;
    license_type?: string;
    lines_of_authority?: string[];
    status?: string;
    issue_date?: string;
    expiration_date: string;
    npn?: string;
  }): Promise<AgentLicense> {
    return api.post<AgentLicense>('/compliance/licenses', data);
  },

  async updateLicense(id: number, data: Partial<AgentLicense>): Promise<AgentLicense> {
    return api.put<AgentLicense>(`/compliance/licenses/${id}`, data);
  },

  async removeLicense(id: number): Promise<void> {
    return api.delete(`/compliance/licenses/${id}`);
  },

  // CE Credits
  async ceCredits(): Promise<CeCredit[]> {
    return api.get<CeCredit[]>('/compliance/ce-credits');
  },

  async createCeCredit(data: {
    course_name: string;
    provider?: string;
    hours: number;
    category?: string;
    state?: string;
    completion_date: string;
    certificate_url?: string;
    course_number?: string;
  }): Promise<CeCredit> {
    return api.post<CeCredit>('/compliance/ce-credits', data);
  },

  async updateCeCredit(id: number, data: Partial<CeCredit>): Promise<CeCredit> {
    return api.put<CeCredit>(`/compliance/ce-credits/${id}`, data);
  },

  async removeCeCredit(id: number): Promise<void> {
    return api.delete(`/compliance/ce-credits/${id}`);
  },

  // E&O Insurance
  async eoPolicies(): Promise<EoPolicy[]> {
    return api.get<EoPolicy[]>('/compliance/eo-policies');
  },

  async createEoPolicy(data: {
    carrier: string;
    policy_number: string;
    coverage_amount: number;
    deductible?: number;
    effective_date: string;
    expiration_date: string;
    certificate_url?: string;
  }): Promise<EoPolicy> {
    return api.post<EoPolicy>('/compliance/eo-policies', data);
  },

  async updateEoPolicy(id: number, data: Partial<EoPolicy>): Promise<EoPolicy> {
    return api.put<EoPolicy>(`/compliance/eo-policies/${id}`, data);
  },

  async removeEoPolicy(id: number): Promise<void> {
    return api.delete(`/compliance/eo-policies/${id}`);
  },

  // Admin
  async expiring(days?: number): Promise<ExpiringItem[]> {
    const query = days ? `?days=${days}` : '';
    return api.get<ExpiringItem[]>(`/compliance/expiring${query}`);
  },

  // Compliance Pack
  async getPack(): Promise<CompliancePack> {
    return api.get<CompliancePack>('/compliance/pack');
  },

  async generatePack(): Promise<CompliancePack> {
    return api.post<CompliancePack>('/compliance/pack/generate');
  },

  async updatePackItem(id: number, data: { status?: string; evidence_url?: string; notes?: string }): Promise<CompliancePackItem> {
    return api.put<CompliancePackItem>(`/compliance/pack/${id}`, data);
  },

  // Admin: Compliance Requirements
  async getRequirements(params?: { state?: string; insurance_type?: string; category?: string }): Promise<ComplianceRequirement[]> {
    const query = new URLSearchParams();
    if (params?.state) query.set('state', params.state);
    if (params?.insurance_type) query.set('insurance_type', params.insurance_type);
    if (params?.category) query.set('category', params.category);
    const qs = query.toString();
    return api.get<ComplianceRequirement[]>(`/admin/compliance/requirements${qs ? `?${qs}` : ''}`);
  },

  async createRequirement(data: Partial<ComplianceRequirement>): Promise<ComplianceRequirement> {
    return api.post<ComplianceRequirement>('/admin/compliance/requirements', data);
  },

  async updateRequirement(id: number, data: Partial<ComplianceRequirement>): Promise<ComplianceRequirement> {
    return api.put<ComplianceRequirement>(`/admin/compliance/requirements/${id}`, data);
  },

  async deleteRequirement(id: number): Promise<void> {
    return api.delete(`/admin/compliance/requirements/${id}`);
  },

  async getComplianceOverview(): Promise<ComplianceOverview> {
    return api.get<ComplianceOverview>('/admin/compliance/overview');
  },
};
