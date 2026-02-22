export type UserRole = 'consumer' | 'agent' | 'agency_owner' | 'carrier' | 'admin' | 'superadmin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatar: string | null;
  agency_id: number | null;
  email_verified_at: string | null;
  created_at: string;
}

export interface Agency {
  id: number;
  owner_id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string | null;
  logo: string | null;
  license_number: string;
  license_state: string;
  description: string | null;
  is_verified: boolean;
}

export interface AgentProfile {
  id: number;
  user_id: number;
  agency_id: number | null;
  first_name: string;
  last_name: string;
  license_number: string;
  license_state: string;
  license_type: 'life_health' | 'property_casualty' | 'both';
  license_expiration: string;
  npn_number: string;
  photo: string | null;
  bio: string | null;
  specialties: string[];
  carriers_appointed: number[];
  years_experience: number;
  languages: string[];
  service_areas: string[];
  response_time_hours: number;
  rating: number;
  review_count: number;
  total_policies_bound: number;
  is_verified: boolean;
  is_active: boolean;
}

export interface Carrier {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  type: InsuranceType;
  am_best_rating: string;
  description: string | null;
  website: string | null;
  is_active: boolean;
}

export interface CarrierProduct {
  id: number;
  carrier_id: number;
  carrier?: Carrier;
  name: string;
  type: InsuranceProductType;
  description: string | null;
  min_premium: number;
  max_premium: number;
  states_available: string[];
  features: Record<string, boolean>;
  is_active: boolean;
}

export type InsuranceType = 'auto' | 'home' | 'life' | 'health' | 'commercial' | 'specialty';

export type InsuranceProductType =
  | 'auto' | 'home' | 'renters' | 'life_term' | 'life_whole'
  | 'health_individual' | 'health_group' | 'commercial_gl'
  | 'commercial_property' | 'umbrella' | 'other';

export interface QuoteRequest {
  id: number;
  consumer_id: number | null;
  session_id: string;
  insurance_type: InsuranceType;
  status: 'calculating' | 'quoted' | 'agent_matched' | 'applied' | 'expired';
  zip_code: string;
  state: string;
  created_at: string;
}

export interface Quote {
  id: number;
  quote_request_id: number;
  carrier_product_id: number;
  carrier_id: number;
  carrier?: Carrier;
  carrier_product?: CarrierProduct;
  monthly_premium: number;
  annual_premium: number;
  coverage_details: Record<string, string>;
  deductible: number;
  coverage_limits: Record<string, string>;
  discounts_applied: Record<string, number>;
  is_recommended: boolean;
  expires_at: string;
}

export type ApplicationStatus = 'draft' | 'submitted' | 'underwriting' | 'approved' | 'declined' | 'bound' | 'withdrawn';

export interface Application {
  id: number;
  quote_id: number;
  consumer_id: number;
  agent_id: number | null;
  carrier_id: number;
  carrier_product_id: number;
  application_number: string;
  status: ApplicationStatus;
  personal_info: Record<string, string>;
  coverage_details: Record<string, string>;
  submitted_at: string | null;
  decision_at: string | null;
  bound_at: string | null;
  effective_date: string | null;
  quote?: Quote;
  carrier?: Carrier;
  agent?: AgentProfile;
  created_at: string;
}

export type PolicyStatus = 'active' | 'cancelled' | 'expired' | 'lapsed' | 'pending_renewal';

export interface Policy {
  id: number;
  application_id: number;
  consumer_id: number;
  agent_id: number;
  carrier_id: number;
  policy_number: string;
  type: InsuranceProductType;
  status: PolicyStatus;
  effective_date: string;
  expiration_date: string;
  premium_monthly: number;
  premium_annual: number;
  coverage_summary: Record<string, string>;
  carrier?: Carrier;
  agent?: AgentProfile;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'applied' | 'won' | 'lost';

export interface Lead {
  id: number;
  agency_id: number | null;
  agent_id: number | null;
  quote_request_id: number | null;
  consumer_id: number | null;
  source: 'marketplace' | 'calculator' | 'referral' | 'website' | 'manual';
  name: string;
  email: string;
  phone: string;
  insurance_type: InsuranceType;
  status: LeadStatus;
  follow_up_date: string | null;
  created_at: string;
}

export interface AgentReview {
  id: number;
  agent_profile_id: number;
  consumer_id: number;
  rating: number;
  title: string;
  comment: string;
  response: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface Commission {
  id: number;
  agent_id: number;
  policy_id: number;
  carrier_id: number;
  type: 'new_business' | 'renewal';
  premium_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'earned' | 'paid';
  earned_at: string | null;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  role: string;
  price_monthly: number;
  price_yearly: number;
  features: Record<string, boolean | string | number>;
  limits: Record<string, number>;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
}

export interface DashboardStats {
  [key: string]: number | string;
}
