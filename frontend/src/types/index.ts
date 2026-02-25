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
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
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
  phone: string | null;
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

export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'underwriting' | 'approved' | 'declined' | 'bound' | 'withdrawn';

export interface Application {
  id: number;
  reference: string;
  user_id: number;
  agent_id: number | null;
  agency_id: number | null;
  carrier_product_id: number;
  quote_id: number | null;
  lead_id: number | null;
  insurance_type: string;
  carrier_name: string;
  monthly_premium: number;
  status: ApplicationStatus;
  applicant_data: Record<string, string> | null;
  submitted_at: string | null;
  decision_at: string | null;
  bound_at: string | null;
  effective_date: string | null;
  carrierProduct?: CarrierProduct;
  carrier?: Carrier;
  agent?: AgentProfile;
  user?: User;
  created_at: string;
}

export type PolicyStatus = 'active' | 'expiring_soon' | 'cancelled' | 'expired' | 'lapsed' | 'pending_renewal';

export interface Policy {
  id: number;
  policy_number: string;
  application_id: number | null;
  user_id: number;
  agent_id: number | null;
  agency_id: number | null;
  carrier_product_id: number | null;
  type: string;
  carrier_name: string;
  status: PolicyStatus;
  effective_date: string;
  expiration_date: string;
  monthly_premium: number;
  annual_premium: number;
  deductible: number | null;
  coverage_limit: string | null;
  coverage_details: Record<string, string> | null;
  carrierProduct?: CarrierProduct;
  carrier?: Carrier;
  agent?: AgentProfile;
  user?: User;
}

export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'applied' | 'won' | 'lost';

export interface Lead {
  id: number;
  agency_id: number | null;
  agent_id: number | null;
  quote_request_id: number | null;
  consumer_id: number | null;
  source: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  insurance_type: string;
  status: LeadStatus;
  estimated_value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
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
  carrier_name: string;
  premium_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'earned' | 'paid';
  paid_at: string | null;
  created_at: string;
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

export interface PlatformProduct {
  id: number;
  slug: string;
  name: string;
  category: string;
  icon: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  agency_enabled?: boolean;
}

export interface PlatformProductResponse {
  products: PlatformProduct[];
  grouped: Record<string, PlatformProduct[]>;
  categories?: string[];
  active_count?: number;
  total_count?: number;
}

export interface AgencyCarrierAppointment {
  id: number;
  agency_id: number;
  carrier_id: number;
  platform_product_id: number;
  appointment_number: string | null;
  effective_date: string | null;
  termination_date: string | null;
  is_active: boolean;
  carrier?: Carrier;
  platform_product?: PlatformProduct;
}
