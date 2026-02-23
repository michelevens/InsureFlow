import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { onboardingService } from '@/services/api/onboarding';
import { profileClaimService } from '@/services/api/profileClaim';
import type { UnclaimedProfile } from '@/services/api/profileClaim';
import type { OnboardingFormData, AgencyOnboardingPayload, AgentOnboardingPayload } from '@/services/api/onboarding';
import type { PlatformProduct } from '@/types';
import { toast } from 'sonner';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Building2,
  ShieldCheck,
  MapPin,
  Package,
  Users,
  Briefcase,
  FileText,
  Loader2,
  CheckCircle2,
  Star,
  Search,
  UserCheck,
  ExternalLink,
} from 'lucide-react';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

// ── Step Definitions ──

type StepId =
  | 'welcome'
  | 'claim-profile'
  | 'agency-info'
  | 'agency-location'
  | 'licensing'
  | 'products'
  | 'carriers'
  | 'agent-profile'
  | 'agent-licensing'
  | 'agent-specialties'
  | 'service-area'
  | 'complete';

interface StepDef {
  id: StepId;
  label: string;
  description: string;
  icon: typeof Building2;
}

const agencyOwnerSteps: StepDef[] = [
  { id: 'welcome', label: 'Welcome', description: 'Get started', icon: Star },
  { id: 'agency-info', label: 'Agency Info', description: 'Company details', icon: Building2 },
  { id: 'agency-location', label: 'Location', description: 'Where you operate', icon: MapPin },
  { id: 'licensing', label: 'Licensing', description: 'License & compliance', icon: ShieldCheck },
  { id: 'products', label: 'Products', description: 'What you sell', icon: Package },
  { id: 'carriers', label: 'Carriers', description: 'Your appointments', icon: Briefcase },
  { id: 'agent-profile', label: 'Your Profile', description: 'Personal info', icon: Users },
  { id: 'complete', label: 'All Set!', description: 'Ready to go', icon: CheckCircle2 },
];

const agentSteps: StepDef[] = [
  { id: 'welcome', label: 'Welcome', description: 'Get started', icon: Star },
  { id: 'claim-profile', label: 'Find Profile', description: 'Claim your license', icon: UserCheck },
  { id: 'agent-profile', label: 'Your Profile', description: 'About you', icon: Users },
  { id: 'agent-licensing', label: 'Licensing', description: 'License & compliance', icon: ShieldCheck },
  { id: 'agent-specialties', label: 'Specialties', description: 'What you sell', icon: Package },
  { id: 'service-area', label: 'Service Area', description: 'Where you work', icon: MapPin },
  { id: 'complete', label: 'All Set!', description: 'Ready to go', icon: CheckCircle2 },
];

// ── Form Data Interfaces ──

interface AgencyFormData {
  agency_name: string;
  agency_phone: string;
  agency_email: string;
  agency_website: string;
  agency_description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  license_number: string;
  npn_number: string;
  license_states: string[];
  eo_carrier: string;
  eo_policy_number: string;
  eo_expiration: string;
  product_ids: number[];
  carrier_ids: number[];
}

interface AgentFormData {
  bio: string;
  phone: string;
  license_number: string;
  license_states: string[];
  npn_number: string;
  specialties: string[];
  carriers: string[];
  years_experience: string;
  city: string;
  state: string;
}

// ── Shared Components ──

function StateSelect({ value, onChange, label = 'State' }: { value: string; onChange: (val: string) => void; label?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-shield-500/20 focus:border-shield-500 transition-all"
      >
        <option value="">Select state</option>
        {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}

function MultiStateSelect({ selected, onChange }: { selected: string[]; onChange: (states: string[]) => void }) {
  const toggle = (state: string) => {
    onChange(selected.includes(state) ? selected.filter(s => s !== state) : [...selected, state]);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">Licensed States</label>
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-48 overflow-y-auto p-3 border border-slate-200 rounded-xl bg-white">
        {US_STATES.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
              selected.includes(s)
                ? 'bg-shield-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-slate-500 mt-1">{selected.length} state{selected.length !== 1 ? 's' : ''} selected</p>
      )}
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-shield-500/20 focus:border-shield-500 transition-all"
      />
    </div>
  );
}

function FormTextarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-shield-500/20 focus:border-shield-500 transition-all resize-none"
      />
    </div>
  );
}

// ── Main Component ──

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingFormData, setLoadingFormData] = useState(true);
  const [formData, setFormData] = useState<OnboardingFormData | null>(null);

  // Agency form
  const [agencyForm, setAgencyForm] = useState<AgencyFormData>({
    agency_name: '', agency_phone: '', agency_email: '', agency_website: '',
    agency_description: '', address: '', city: '', state: '', zip_code: '',
    license_number: '', npn_number: '', license_states: [],
    eo_carrier: '', eo_policy_number: '', eo_expiration: '',
    product_ids: [], carrier_ids: [],
  });

  // Agent form
  const [agentForm, setAgentForm] = useState<AgentFormData>({
    bio: '', phone: '', license_number: '', license_states: [],
    npn_number: '', specialties: [], carriers: [],
    years_experience: '', city: '', state: '',
  });

  // Claim profile state
  const [claimSearch, setClaimSearch] = useState({ npn: '', name: '', license_number: '', state: '' });
  const [claimResults, setClaimResults] = useState<UnclaimedProfile[]>([]);
  const [claimSearching, setClaimSearching] = useState(false);
  const [claimSearched, setClaimSearched] = useState(false);
  const [claimedProfile, setClaimedProfile] = useState<UnclaimedProfile | null>(null);
  const [claiming, setClaiming] = useState(false);

  const isAgencyOwner = user?.role === 'agency_owner';
  const steps = isAgencyOwner ? agencyOwnerSteps : agentSteps;
  const step = steps[currentStep];

  // Fetch form data (products, carriers)
  useEffect(() => {
    setLoadingFormData(true);
    onboardingService.getFormData()
      .then(data => setFormData(data))
      .catch(() => { /* fallback */ })
      .finally(() => setLoadingFormData(false));
  }, []);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setAgentForm(prev => ({
        ...prev,
        phone: user.phone || '',
      }));
      if (isAgencyOwner) {
        setAgencyForm(prev => ({
          ...prev,
          agency_email: user.email || '',
        }));
      }
    }
  }, [user, isAgencyOwner]);

  const updateAgency = (field: keyof AgencyFormData, value: AgencyFormData[keyof AgencyFormData]) => {
    setAgencyForm(prev => ({ ...prev, [field]: value }));
  };

  const updateAgent = (field: keyof AgentFormData, value: AgentFormData[keyof AgentFormData]) => {
    setAgentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleSaveAndContinue = async () => {
    // Claim step handles its own logic — just advance
    if (step.id === 'claim-profile') {
      handleNext();
      return;
    }
    setSaving(true);
    try {
      if (isAgencyOwner && step.id !== 'agent-profile') {
        // Save agency data
        const payload: AgencyOnboardingPayload = {
          agency_name: agencyForm.agency_name,
          agency_phone: agencyForm.agency_phone || undefined,
          agency_email: agencyForm.agency_email || undefined,
          agency_website: agencyForm.agency_website || undefined,
          agency_description: agencyForm.agency_description || undefined,
          address: agencyForm.address || undefined,
          city: agencyForm.city || undefined,
          state: agencyForm.state || undefined,
          zip_code: agencyForm.zip_code || undefined,
          license_number: agencyForm.license_number || undefined,
          npn_number: agencyForm.npn_number || undefined,
          license_states: agencyForm.license_states.length > 0 ? agencyForm.license_states : undefined,
          eo_carrier: agencyForm.eo_carrier || undefined,
          eo_policy_number: agencyForm.eo_policy_number || undefined,
          eo_expiration: agencyForm.eo_expiration || undefined,
          product_ids: agencyForm.product_ids.length > 0 ? agencyForm.product_ids : undefined,
          carrier_ids: agencyForm.carrier_ids.length > 0 ? agencyForm.carrier_ids : undefined,
        };
        await onboardingService.saveAgency(payload);
      }

      if (step.id === 'agent-profile' || !isAgencyOwner) {
        // Save agent profile data
        const payload: AgentOnboardingPayload = {
          bio: agentForm.bio || undefined,
          license_number: agentForm.license_number || undefined,
          license_states: agentForm.license_states.length > 0 ? agentForm.license_states : undefined,
          npn_number: agentForm.npn_number || undefined,
          specialties: agentForm.specialties.length > 0 ? agentForm.specialties : undefined,
          carriers: agentForm.carriers.length > 0 ? agentForm.carriers : undefined,
          years_experience: agentForm.years_experience ? parseInt(agentForm.years_experience) : undefined,
          city: agentForm.city || undefined,
          state: agentForm.state || undefined,
          phone: agentForm.phone || undefined,
        };
        await onboardingService.saveAgent(payload);
      }

      handleNext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await onboardingService.complete();
      await refreshUser();
      toast.success('Onboarding complete! Welcome to Insurons.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete onboarding.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle product selection
  const toggleProduct = (id: number) => {
    setAgencyForm(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(id)
        ? prev.product_ids.filter(p => p !== id)
        : [...prev.product_ids, id],
    }));
  };

  const toggleAllCategory = (products: PlatformProduct[], enable: boolean) => {
    const ids = products.map(p => p.id);
    setAgencyForm(prev => ({
      ...prev,
      product_ids: enable
        ? [...new Set([...prev.product_ids, ...ids])]
        : prev.product_ids.filter(id => !ids.includes(id)),
    }));
  };

  // Toggle carrier selection
  const toggleCarrier = (id: number) => {
    setAgencyForm(prev => ({
      ...prev,
      carrier_ids: prev.carrier_ids.includes(id)
        ? prev.carrier_ids.filter(c => c !== id)
        : [...prev.carrier_ids, id],
    }));
  };

  // Toggle agent specialty
  const toggleSpecialty = (slug: string) => {
    setAgentForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(slug)
        ? prev.specialties.filter(s => s !== slug)
        : [...prev.specialties, slug],
    }));
  };

  // ── Claim Profile Handlers ──

  const handleClaimSearch = async () => {
    const { npn, name, license_number, state } = claimSearch;
    if (!npn && !name && !license_number) {
      toast.error('Please enter an NPN, name, or license number to search.');
      return;
    }
    setClaimSearching(true);
    setClaimSearched(false);
    try {
      const data = await profileClaimService.search({ npn: npn || undefined, name: name || undefined, license_number: license_number || undefined, state: state || undefined });
      setClaimResults(data.profiles || []);
      setClaimSearched(true);
    } catch {
      toast.error('Search failed. Please try again.');
    } finally {
      setClaimSearching(false);
    }
  };

  const handleClaimProfile = async (profile: UnclaimedProfile) => {
    setClaiming(true);
    try {
      await profileClaimService.claim(profile.id);
      setClaimedProfile(profile);
      toast.success('Profile claimed successfully! Your license data has been linked.');
      // Pre-fill agent form from claimed profile
      setAgentForm(prev => ({
        ...prev,
        license_number: profile.license_number || prev.license_number,
        npn_number: profile.npn || prev.npn_number,
        license_states: profile.license_states?.length ? profile.license_states : prev.license_states,
        city: profile.city || prev.city,
        state: profile.state || prev.state,
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to claim profile.');
    } finally {
      setClaiming(false);
    }
  };

  // ── Step Renderers ──

  const renderWelcome = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 rounded-2xl gradient-shield flex items-center justify-center mx-auto mb-6">
        <ShieldCheck className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-3">
        Welcome to Insurons{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
      </h2>
      <p className="text-slate-500 max-w-md mx-auto mb-6">
        {isAgencyOwner
          ? "Let's set up your agency. We'll collect your company details, licensing, products you sell, and carrier appointments to get you started."
          : "Let's set up your agent profile. We'll collect your licensing info, specialties, and service area so we can match you with the right leads."
        }
      </p>
      <div className="flex flex-col gap-3 max-w-sm mx-auto text-left">
        {steps.filter(s => s.id !== 'welcome' && s.id !== 'complete').map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 text-sm">
            <div className="w-7 h-7 rounded-full bg-shield-100 text-shield-700 flex items-center justify-center text-xs font-bold">
              {i + 1}
            </div>
            <span className="text-slate-700">{s.label}</span>
            <span className="text-slate-400 text-xs">— {s.description}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderClaimProfile = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <UserCheck className="w-6 h-6 text-shield-600" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Find Your Existing Profile</h2>
          <p className="text-sm text-slate-500">
            We may already have your license on file. Search to claim your profile and skip manual entry.
          </p>
        </div>
      </div>

      {claimedProfile ? (
        <div className="bg-savings-50 border border-savings-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-6 h-6 text-savings-600" />
            <h3 className="text-base font-semibold text-savings-800">Profile Claimed!</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-800">{claimedProfile.full_name}</span></div>
            {claimedProfile.npn && <div><span className="text-slate-500">NPN:</span> <span className="font-medium text-slate-800">{claimedProfile.npn}</span></div>}
            {claimedProfile.license_number && <div><span className="text-slate-500">License:</span> <span className="font-medium text-slate-800">{claimedProfile.license_number}</span></div>}
            {claimedProfile.state && <div><span className="text-slate-500">State:</span> <span className="font-medium text-slate-800">{claimedProfile.state}</span></div>}
          </div>
          <p className="text-xs text-savings-600 mt-3">Your license details have been pre-filled in the next steps.</p>
        </div>
      ) : (
        <>
          {/* Search Form */}
          <div className="bg-slate-50 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="NPN (National Producer Number)" value={claimSearch.npn} onChange={v => setClaimSearch(prev => ({ ...prev, npn: v }))} placeholder="12345678" />
              <FormInput label="License Number" value={claimSearch.license_number} onChange={v => setClaimSearch(prev => ({ ...prev, license_number: v }))} placeholder="W123456" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Full Name" value={claimSearch.name} onChange={v => setClaimSearch(prev => ({ ...prev, name: v }))} placeholder="Jane Doe" />
              <StateSelect value={claimSearch.state} onChange={v => setClaimSearch(prev => ({ ...prev, state: v }))} />
            </div>
            <button
              type="button"
              onClick={handleClaimSearch}
              disabled={claimSearching}
              className="flex items-center gap-2 px-5 py-2.5 gradient-shield text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {claimSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search Profiles
            </button>
          </div>

          {/* Results */}
          {claimSearched && claimResults.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-sm">
              <p>No matching profiles found. You can skip this step and enter your details manually.</p>
            </div>
          )}

          {claimResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">{claimResults.length} profile{claimResults.length !== 1 ? 's' : ''} found:</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {claimResults.map(profile => (
                  <div key={profile.id} className="border border-slate-200 rounded-xl p-4 hover:border-shield-300 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{profile.full_name || 'Unknown'}</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm">
                          {profile.npn && <div><span className="text-slate-400">NPN:</span> <span className="text-slate-700">{profile.npn}</span></div>}
                          {profile.license_number && <div><span className="text-slate-400">License:</span> <span className="text-slate-700">{profile.license_number}</span></div>}
                          {profile.license_type && <div><span className="text-slate-400">Type:</span> <span className="text-slate-700">{profile.license_type}</span></div>}
                          {profile.license_status && <div><span className="text-slate-400">Status:</span> <span className="text-slate-700">{profile.license_status}</span></div>}
                          {profile.city && profile.state && <div><span className="text-slate-400">Location:</span> <span className="text-slate-700">{profile.city}, {profile.state}</span></div>}
                          {profile.county && <div><span className="text-slate-400">County:</span> <span className="text-slate-700">{profile.county}</span></div>}
                        </div>
                        {profile.license_lookup_url && (
                          <a href={profile.license_lookup_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-shield-600 hover:text-shield-700 mt-2">
                            <ExternalLink className="w-3 h-3" /> Verify on state DOI
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleClaimProfile(profile)}
                        disabled={claiming}
                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-shield-600 text-white rounded-lg text-sm font-medium hover:bg-shield-700 disabled:opacity-50 transition-colors"
                      >
                        {claiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                        Claim
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderAgencyInfo = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-shield-600" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Agency Information</h2>
          <p className="text-sm text-slate-500">Tell us about your insurance agency</p>
        </div>
      </div>
      <FormInput label="Agency Name" value={agencyForm.agency_name} onChange={v => updateAgency('agency_name', v)} placeholder="Acme Insurance Group" required />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Phone" value={agencyForm.agency_phone} onChange={v => updateAgency('agency_phone', v)} placeholder="(555) 123-4567" type="tel" />
        <FormInput label="Email" value={agencyForm.agency_email} onChange={v => updateAgency('agency_email', v)} placeholder="info@agency.com" type="email" />
      </div>
      <FormInput label="Website" value={agencyForm.agency_website} onChange={v => updateAgency('agency_website', v)} placeholder="https://www.agency.com" />
      <FormTextarea label="Description" value={agencyForm.agency_description} onChange={v => updateAgency('agency_description', v)} placeholder="Tell potential customers about your agency..." />
    </div>
  );

  const renderAgencyLocation = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-6 h-6 text-shield-600" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Agency Location</h2>
          <p className="text-sm text-slate-500">Where is your agency located?</p>
        </div>
      </div>
      <FormInput label="Street Address" value={agencyForm.address} onChange={v => updateAgency('address', v)} placeholder="123 Main Street, Suite 100" />
      <div className="grid grid-cols-3 gap-4">
        <FormInput label="City" value={agencyForm.city} onChange={v => updateAgency('city', v)} placeholder="Dallas" />
        <StateSelect value={agencyForm.state} onChange={v => updateAgency('state', v)} />
        <FormInput label="ZIP Code" value={agencyForm.zip_code} onChange={v => updateAgency('zip_code', v)} placeholder="75201" />
      </div>
    </div>
  );

  const renderLicensing = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-6 h-6 text-shield-600" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Licensing & Compliance</h2>
          <p className="text-sm text-slate-500">Your agency's licensing and E&O insurance details</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Agency License Number" value={agencyForm.license_number} onChange={v => updateAgency('license_number', v)} placeholder="AG-12345678" />
        <FormInput label="NPN (National Producer Number)" value={agencyForm.npn_number} onChange={v => updateAgency('npn_number', v)} placeholder="12345678" />
      </div>
      <MultiStateSelect selected={agencyForm.license_states} onChange={v => updateAgency('license_states', v)} />
      <div className="border-t border-slate-200 pt-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">E&O Insurance</h3>
        <div className="grid grid-cols-3 gap-4">
          <FormInput label="E&O Carrier" value={agencyForm.eo_carrier} onChange={v => updateAgency('eo_carrier', v)} placeholder="Swiss Re" />
          <FormInput label="Policy Number" value={agencyForm.eo_policy_number} onChange={v => updateAgency('eo_policy_number', v)} placeholder="EO-123456" />
          <FormInput label="Expiration Date" value={agencyForm.eo_expiration} onChange={v => updateAgency('eo_expiration', v)} type="date" />
        </div>
      </div>
    </div>
  );

  const renderProducts = () => {
    if (loadingFormData) {
      return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-shield-500" /></div>;
    }

    const grouped = formData?.products_grouped || {};

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-shield-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Products You Sell</h2>
            <p className="text-sm text-slate-500">Select the insurance products your agency offers</p>
          </div>
        </div>
        <p className="text-sm text-shield-700 bg-shield-50 px-4 py-2 rounded-lg">
          {agencyForm.product_ids.length} product{agencyForm.product_ids.length !== 1 ? 's' : ''} selected
        </p>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          {Object.entries(grouped).map(([category, products]) => {
            const catSelected = products.filter(p => agencyForm.product_ids.includes(p.id)).length;
            const allSelected = catSelected === products.length;
            return (
              <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <span className="text-sm font-semibold text-slate-800">{category}</span>
                  <button
                    type="button"
                    onClick={() => toggleAllCategory(products, !allSelected)}
                    className="text-xs px-2.5 py-1 bg-shield-100 text-shield-700 rounded-full hover:bg-shield-200"
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-0">
                  {products.map(product => {
                    const selected = agencyForm.product_ids.includes(product.id);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => toggleProduct(product.id)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors border-b border-r border-slate-100 ${
                          selected ? 'bg-shield-50/50' : ''
                        }`}
                      >
                        <div className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selected ? 'bg-shield-600 border-shield-600' : 'border-slate-300'
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-slate-800 truncate">{product.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCarriers = () => {
    if (loadingFormData) {
      return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-shield-500" /></div>;
    }

    const carriers = formData?.carriers || [];

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-6">
          <Briefcase className="w-6 h-6 text-shield-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Carrier Appointments</h2>
            <p className="text-sm text-slate-500">Select the carriers your agency is appointed with</p>
          </div>
        </div>
        <p className="text-sm text-shield-700 bg-shield-50 px-4 py-2 rounded-lg">
          {agencyForm.carrier_ids.length} carrier{agencyForm.carrier_ids.length !== 1 ? 's' : ''} selected
        </p>
        {carriers.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No carriers available. You can add carrier appointments later from your dashboard.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
            {carriers.map(carrier => {
              const selected = agencyForm.carrier_ids.includes(carrier.id);
              return (
                <button
                  key={carrier.id}
                  type="button"
                  onClick={() => toggleCarrier(carrier.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    selected
                      ? 'border-shield-500 bg-shield-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selected ? 'bg-shield-600 border-shield-600' : 'border-slate-300'
                  }`}>
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{carrier.name}</p>
                    {carrier.am_best_rating && (
                      <p className="text-xs text-slate-400">AM Best: {carrier.am_best_rating}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderAgentProfile = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-shield-600" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isAgencyOwner ? 'Your Personal Profile' : 'Your Profile'}
          </h2>
          <p className="text-sm text-slate-500">
            {isAgencyOwner ? 'Set up your personal agent profile as the agency principal' : 'Tell us about yourself and your experience'}
          </p>
        </div>
      </div>
      <FormInput label="Phone" value={agentForm.phone} onChange={v => updateAgent('phone', v)} placeholder="(555) 123-4567" type="tel" />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="City" value={agentForm.city} onChange={v => updateAgent('city', v)} placeholder="Dallas" />
        <StateSelect value={agentForm.state} onChange={v => updateAgent('state', v)} />
      </div>
      <FormInput label="Years of Experience" value={agentForm.years_experience} onChange={v => updateAgent('years_experience', v)} placeholder="10" type="number" />
      <FormTextarea label="Bio / About" value={agentForm.bio} onChange={v => updateAgent('bio', v)} placeholder="Tell clients about your background and expertise..." rows={4} />
    </div>
  );

  const renderAgentLicensing = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-shield-600" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Licensing Information</h2>
          <p className="text-sm text-slate-500">Your personal insurance license details</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="License Number" value={agentForm.license_number} onChange={v => updateAgent('license_number', v)} placeholder="AG-12345678" />
        <FormInput label="NPN (National Producer Number)" value={agentForm.npn_number} onChange={v => updateAgent('npn_number', v)} placeholder="12345678" />
      </div>
      <MultiStateSelect selected={agentForm.license_states} onChange={v => updateAgent('license_states', v)} />
    </div>
  );

  const renderAgentSpecialties = () => {
    const products = formData?.products || [];

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-shield-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Specialties</h2>
            <p className="text-sm text-slate-500">What types of insurance do you specialize in?</p>
          </div>
        </div>
        <p className="text-sm text-shield-700 bg-shield-50 px-4 py-2 rounded-lg">
          {agentForm.specialties.length} specialt{agentForm.specialties.length !== 1 ? 'ies' : 'y'} selected
        </p>
        {loadingFormData ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-shield-500" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto pr-1">
            {products.map(product => {
              const selected = agentForm.specialties.includes(product.slug);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggleSpecialty(product.slug)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-left transition-all ${
                    selected
                      ? 'border-shield-500 bg-shield-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    selected ? 'bg-shield-600 border-shield-600' : 'border-slate-300'
                  }`}>
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-slate-800 truncate">{product.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderServiceArea = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-6 h-6 text-shield-600" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Service Area</h2>
          <p className="text-sm text-slate-500">Which states do you serve clients in?</p>
        </div>
      </div>
      <MultiStateSelect selected={agentForm.license_states} onChange={v => updateAgent('license_states', v)} />
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Primary City" value={agentForm.city} onChange={v => updateAgent('city', v)} placeholder="Dallas" />
        <StateSelect value={agentForm.state} onChange={v => updateAgent('state', v)} label="Primary State" />
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 rounded-full bg-savings-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-savings-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-3">You're All Set!</h2>
      <p className="text-slate-500 max-w-md mx-auto mb-8">
        {isAgencyOwner
          ? "Your agency is set up and ready to go. You can always update your settings from the dashboard."
          : "Your profile is set up. You'll start receiving leads and can begin serving clients right away."
        }
      </p>
      <div className="bg-slate-50 rounded-xl p-6 max-w-sm mx-auto text-left space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Setup Summary</h3>
        {isAgencyOwner && agencyForm.agency_name && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-savings-600" />
            <span className="text-slate-700">Agency: {agencyForm.agency_name}</span>
          </div>
        )}
        {isAgencyOwner && agencyForm.product_ids.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-savings-600" />
            <span className="text-slate-700">{agencyForm.product_ids.length} products enabled</span>
          </div>
        )}
        {isAgencyOwner && agencyForm.carrier_ids.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-savings-600" />
            <span className="text-slate-700">{agencyForm.carrier_ids.length} carriers appointed</span>
          </div>
        )}
        {agentForm.license_number && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-savings-600" />
            <span className="text-slate-700">License: {agentForm.license_number}</span>
          </div>
        )}
        {agentForm.license_states.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-savings-600" />
            <span className="text-slate-700">{agentForm.license_states.length} licensed states</span>
          </div>
        )}
        {!isAgencyOwner && agentForm.specialties.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-savings-600" />
            <span className="text-slate-700">{agentForm.specialties.length} specialties</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step.id) {
      case 'welcome': return renderWelcome();
      case 'claim-profile': return renderClaimProfile();
      case 'agency-info': return renderAgencyInfo();
      case 'agency-location': return renderAgencyLocation();
      case 'licensing': return renderLicensing();
      case 'products': return renderProducts();
      case 'carriers': return renderCarriers();
      case 'agent-profile': return renderAgentProfile();
      case 'agent-licensing': return renderAgentLicensing();
      case 'agent-specialties': return renderAgentSpecialties();
      case 'service-area': return renderServiceArea();
      case 'complete': return renderComplete();
      default: return null;
    }
  };

  const canProceed = () => {
    if (step.id === 'welcome') return true;
    if (step.id === 'claim-profile') return true;
    if (step.id === 'complete') return true;
    if (step.id === 'agency-info') return agencyForm.agency_name.trim().length > 0;
    return true; // Other steps are optional
  };

  const isLastContentStep = currentStep === steps.length - 2; // Step before 'complete'
  const isCompleteStep = step.id === 'complete';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Insurons" className="h-10 w-auto" />
          </a>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="w-4 h-4 text-shield-600" />
            Account Setup
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-slate-500">{step.label}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-shield-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            {steps.map((s, i) => {
              const StepIcon = s.icon;
              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    i < currentStep
                      ? 'bg-savings-500 text-white'
                      : i === currentStep
                        ? 'gradient-shield text-white'
                        : 'bg-slate-200 text-slate-400'
                  }`}>
                    {i < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${
                    i <= currentStep ? 'text-slate-700 font-medium' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-8">
            {renderStep()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 py-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {isCompleteStep ? (
              <button
                type="button"
                onClick={handleComplete}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-savings-600 text-white rounded-xl font-medium hover:bg-savings-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Go to Dashboard
              </button>
            ) : step.id === 'welcome' ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 gradient-shield text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Let's Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={isLastContentStep ? handleSaveAndContinue : handleSaveAndContinue}
                disabled={saving || !canProceed()}
                className="flex items-center gap-2 px-6 py-2.5 gradient-shield text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isLastContentStep ? 'Save & Finish' : 'Save & Continue'}
                {!saving && <ArrowRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Skip option */}
        {!isCompleteStep && step.id !== 'welcome' && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleNext}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip this step for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
