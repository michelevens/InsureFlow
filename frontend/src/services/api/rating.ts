import { api } from './client';

// ── Types ─────────────────────────────────────────

export interface RatingFactorOption {
  factor_code: string;
  factor_label: string;
  option_value: string;
  option_label: string;
  factor_value: number;
  apply_mode: 'multiply' | 'add' | 'subtract';
  sort_order: number;
}

export interface RatingRiderOption {
  rider_code: string;
  rider_label: string;
  rider_value: number;
  apply_mode: 'add' | 'multiply';
  is_default: boolean;
  sort_order: number;
}

export interface RatingFee {
  fee_code: string;
  fee_label: string;
  fee_type: 'fee' | 'credit';
  apply_mode: 'add' | 'percent';
  fee_value: number;
  sort_order: number;
}

export interface RatingOptions {
  product_type: string;
  rate_table_version: string;
  factors: Record<string, RatingFactorOption[]>;
  riders: RatingRiderOption[];
  fees: RatingFee[];
  modal_factors: { mode: string; factor: number; flat_fee: number }[];
}

export interface FactorApplied {
  code: string;
  label: string;
  option: string;
  mode: string;
  value: number;
}

export interface RiderApplied {
  code: string;
  label: string;
  mode: string;
  value: number;
  charge: number;
}

export interface FeeApplied {
  code: string;
  label: string;
  type: string;
  mode: string;
  value: number;
  amount: number;
}

export interface RatingResult {
  eligible: boolean;
  ineligible_reason?: string;
  engine_version: string;
  rate_table_version: string;
  exposure: number;
  base_rate_key: string;
  base_rate_value: number;
  base_premium: number;
  factors_applied: FactorApplied[];
  premium_factored: number;
  riders_applied: RiderApplied[];
  premium_with_riders: number;
  fees_applied: FeeApplied[];
  premium_annual: number;
  modal_mode: string;
  modal_factor: number;
  modal_fee: number;
  premium_modal: number;
  // DI-specific
  monthly_benefit_approved?: number;
  income_replacement_ratio?: number;
  occupation_class?: string;
}

export interface RatingRunAudit {
  id: number;
  scenario_id: number;
  user_id: number;
  product_type: string;
  rate_table_version: string;
  engine_version: string;
  input_snapshot: Record<string, unknown>;
  output_snapshot: RatingResult;
  input_hash: string;
  status: 'success' | 'error' | 'ineligible';
  error_message?: string;
  duration_ms: number;
  created_at: string;
}

export interface RateScenarioPayload {
  payment_mode?: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  factor_selections?: Record<string, string>;
  rider_selections?: Record<string, boolean>;
  rate_table_version?: string;
  overrides?: Record<string, unknown>;
}

export interface RegisteredProduct {
  product_type: string;
  plugin: string;
}

// ── Service ─────────────────────────────────────

export const ratingService = {
  /** Rate a scenario using the plugin engine */
  async rateScenario(scenarioId: number, payload?: RateScenarioPayload): Promise<RatingResult> {
    return api.post<RatingResult>(`/rate/scenario/${scenarioId}`, payload);
  },

  /** Get available factors, riders, and fees for a product type (to build the UI) */
  async getOptions(productType: string, version?: string): Promise<RatingOptions> {
    const q = version ? `?version=${encodeURIComponent(version)}` : '';
    return api.get<RatingOptions>(`/rate/options/${encodeURIComponent(productType)}${q}`);
  },

  /** Get the full audit trail for a single rating run */
  async getAudit(runId: number): Promise<RatingRunAudit> {
    return api.get<RatingRunAudit>(`/rate/audit/${runId}`);
  },

  /** Get rating history for a scenario */
  async getHistory(scenarioId: number): Promise<RatingRunAudit[]> {
    return api.get<RatingRunAudit[]>(`/rate/history/${scenarioId}`);
  },

  /** List all registered rateable product types */
  async getProducts(): Promise<RegisteredProduct[]> {
    return api.get<RegisteredProduct[]>('/rate/products');
  },
};
