import { api } from './client';

// ── Types (aligned with backend model columns) ───

export interface RateTableCounts {
  total: number;
  active: number;
  ltc: number;
  ltd: number;
}

export interface CarrierOption {
  id: number;
  name: string;
  slug: string;
}

export interface AdminRateTable {
  id: number;
  carrier_id: number | null;
  carrier: CarrierOption | null;
  product_type: string;
  version: string;
  name: string;
  description: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  entries_count: number;
  created_at: string;
  updated_at: string;
}

export interface RateTableEntry {
  id: number;
  rate_table_id: number;
  rate_key: string;
  rate_value: number;
  dimensions: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface RateFactor {
  id: number;
  rate_table_id: number;
  factor_code: string;
  factor_label: string;
  option_value: string;
  apply_mode: 'multiply' | 'add' | 'subtract';
  factor_value: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RateRider {
  id: number;
  rate_table_id: number;
  rider_code: string;
  rider_label: string;
  apply_mode: 'add' | 'multiply';
  rider_value: number;
  rate_key_pattern: string | null;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RateFee {
  id: number;
  rate_table_id: number;
  fee_code: string;
  fee_label: string;
  fee_type: 'fee' | 'credit';
  apply_mode: 'add' | 'percent';
  fee_value: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RateModalFactor {
  id: number;
  rate_table_id: number;
  mode: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  factor: number;
  flat_fee: number;
  created_at: string;
  updated_at: string;
}

export interface RateTableDetail extends AdminRateTable {
  entries: RateTableEntry[];
  factors: RateFactor[];
  riders: RateRider[];
  fees: RateFee[];
  modal_factors: RateModalFactor[];
}

// ── Payload types ─────────────────────────────────

export interface RateTablePayload {
  name: string;
  product_type: string;
  version: string;
  carrier_id?: number | null;
  description?: string | null;
  effective_date?: string | null;
  expiration_date?: string | null;
  is_active?: boolean;
}

export interface RateTableEntryPayload {
  rate_key: string;
  rate_value: number;
}

export interface RateFactorPayload {
  factor_code: string;
  factor_label: string;
  option_value: string;
  apply_mode: 'multiply' | 'add' | 'subtract';
  factor_value: number;
  sort_order?: number;
}

export interface RateRiderPayload {
  rider_code: string;
  rider_label: string;
  apply_mode: 'add' | 'multiply';
  rider_value: number;
  is_default?: boolean;
  sort_order?: number;
}

export interface RateFeePayload {
  fee_code: string;
  fee_label: string;
  fee_type: 'fee' | 'credit';
  apply_mode: 'add' | 'percent';
  fee_value: number;
  sort_order?: number;
}

export interface RateModalFactorPayload {
  mode: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  factor: number;
  flat_fee: number;
}

// ── Filter params ─────────────────────────────────

export interface RateTableListParams {
  product_type?: string;
  carrier_id?: number;
  is_active?: boolean;
  search?: string;
}

// ── Service ──────────────────────────────────────

export const rateTableAdminService = {
  async list(params?: RateTableListParams): Promise<{ rate_tables: AdminRateTable[]; counts: RateTableCounts }> {
    const query = new URLSearchParams();
    if (params?.product_type) query.set('product_type', params.product_type);
    if (params?.carrier_id !== undefined) query.set('carrier_id', params.carrier_id.toString());
    if (params?.is_active !== undefined) query.set('is_active', params.is_active ? '1' : '0');
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get<{ rate_tables: AdminRateTable[]; counts: RateTableCounts }>(
      `/admin/rate-tables${qs ? `?${qs}` : ''}`,
    );
  },

  async get(id: number): Promise<RateTableDetail> {
    const res = await api.get<{ rate_table: RateTableDetail }>(`/admin/rate-tables/${id}`);
    return res.rate_table;
  },

  async create(data: RateTablePayload): Promise<AdminRateTable> {
    const res = await api.post<{ rate_table: AdminRateTable }>('/admin/rate-tables', data);
    return res.rate_table;
  },

  async update(id: number, data: Partial<RateTablePayload>): Promise<AdminRateTable> {
    const res = await api.put<{ rate_table: AdminRateTable }>(`/admin/rate-tables/${id}`, data);
    return res.rate_table;
  },

  async delete(id: number): Promise<void> {
    return api.delete(`/admin/rate-tables/${id}`);
  },

  async toggleStatus(id: number): Promise<{ message: string; is_active: boolean }> {
    return api.put<{ message: string; is_active: boolean }>(`/admin/rate-tables/${id}/toggle-status`);
  },

  async clone(id: number): Promise<AdminRateTable> {
    const res = await api.post<{ rate_table: AdminRateTable }>(`/admin/rate-tables/${id}/clone`);
    return res.rate_table;
  },

  async importCsv(id: number, file: File, type: string): Promise<{ message: string; imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post<{ message: string; imported: number; errors: string[] }>(
      `/admin/rate-tables/${id}/import-csv`,
      formData,
    );
  },

  async getCarriers(): Promise<CarrierOption[]> {
    const res = await api.get<{ carriers: CarrierOption[] }>('/admin/rate-tables/carriers');
    return res.carriers;
  },

  // --- Entries ---
  async createEntry(rateTableId: number, data: RateTableEntryPayload): Promise<RateTableEntry> {
    return api.post<RateTableEntry>(`/admin/rate-tables/${rateTableId}/entries`, data);
  },
  async updateEntry(rateTableId: number, entryId: number, data: Partial<RateTableEntryPayload>): Promise<RateTableEntry> {
    return api.put<RateTableEntry>(`/admin/rate-tables/${rateTableId}/entries/${entryId}`, data);
  },
  async deleteEntry(rateTableId: number, entryId: number): Promise<void> {
    return api.delete(`/admin/rate-tables/${rateTableId}/entries/${entryId}`);
  },

  // --- Factors ---
  async createFactor(rateTableId: number, data: RateFactorPayload): Promise<RateFactor> {
    return api.post<RateFactor>(`/admin/rate-tables/${rateTableId}/factors`, data);
  },
  async updateFactor(rateTableId: number, factorId: number, data: Partial<RateFactorPayload>): Promise<RateFactor> {
    return api.put<RateFactor>(`/admin/rate-tables/${rateTableId}/factors/${factorId}`, data);
  },
  async deleteFactor(rateTableId: number, factorId: number): Promise<void> {
    return api.delete(`/admin/rate-tables/${rateTableId}/factors/${factorId}`);
  },

  // --- Riders ---
  async createRider(rateTableId: number, data: RateRiderPayload): Promise<RateRider> {
    return api.post<RateRider>(`/admin/rate-tables/${rateTableId}/riders`, data);
  },
  async updateRider(rateTableId: number, riderId: number, data: Partial<RateRiderPayload>): Promise<RateRider> {
    return api.put<RateRider>(`/admin/rate-tables/${rateTableId}/riders/${riderId}`, data);
  },
  async deleteRider(rateTableId: number, riderId: number): Promise<void> {
    return api.delete(`/admin/rate-tables/${rateTableId}/riders/${riderId}`);
  },

  // --- Fees ---
  async createFee(rateTableId: number, data: RateFeePayload): Promise<RateFee> {
    return api.post<RateFee>(`/admin/rate-tables/${rateTableId}/fees`, data);
  },
  async updateFee(rateTableId: number, feeId: number, data: Partial<RateFeePayload>): Promise<RateFee> {
    return api.put<RateFee>(`/admin/rate-tables/${rateTableId}/fees/${feeId}`, data);
  },
  async deleteFee(rateTableId: number, feeId: number): Promise<void> {
    return api.delete(`/admin/rate-tables/${rateTableId}/fees/${feeId}`);
  },
};
