import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, Select, Card, AddressAutocomplete } from '@/components/ui';
import type { ZipCodeResult } from '@/components/ui';
import { Calculator as CalcIcon, ArrowRight, ShieldCheck, Clock, CheckCircle2, RotateCcw, X } from 'lucide-react';
import { quoteService } from '@/services/api';
import { platformProductService } from '@/services/api/platformProducts';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api/client';
import type { PlatformProduct } from '@/types';

const STORAGE_KEY = 'insurons_calculator_draft';

/* ── Product-category → slug mapping for dynamic field rendering ── */

const VEHICLE_SLUGS = ['auto', 'motorcycle', 'boat_watercraft', 'rv_motorhome', 'commercial_auto', 'classic_car'];
const PROPERTY_SLUGS = ['homeowners', 'renters', 'condo', 'flood', 'landlord', 'mobile_home'];
const LIFE_SLUGS = ['life_term', 'life_whole', 'life_universal', 'life_variable', 'life_final_expense'];
const HEALTH_SLUGS = ['health_individual', 'health_family', 'health_short_term', 'dental', 'vision', 'medicare_supplement', 'medicare_advantage'];
const DISABILITY_SLUGS = ['disability_ltd', 'disability_std', 'long_term_care', 'critical_illness'];
const COMMERCIAL_SLUGS = ['bop', 'general_liability', 'workers_comp', 'commercial_property', 'professional_liability', 'cyber_liability', 'directors_officers', 'epli', 'commercial_umbrella'];

type FieldCategory = 'vehicle' | 'property' | 'life' | 'health' | 'disability' | 'commercial' | 'generic';

function resolveCategory(slug: string, products: PlatformProduct[]): FieldCategory {
  if (VEHICLE_SLUGS.includes(slug)) return 'vehicle';
  if (PROPERTY_SLUGS.includes(slug)) return 'property';
  if (LIFE_SLUGS.includes(slug)) return 'life';
  if (HEALTH_SLUGS.includes(slug)) return 'health';
  if (DISABILITY_SLUGS.includes(slug)) return 'disability';
  if (COMMERCIAL_SLUGS.includes(slug)) return 'commercial';
  // Fallback: check the product's category field
  const p = products.find(pr => pr.slug === slug);
  if (p) {
    const cat = p.category.toLowerCase();
    if (cat.includes('personal')) return 'vehicle'; // personal lines default
    if (cat.includes('life')) return 'life';
    if (cat.includes('health')) return 'health';
    if (cat.includes('disability')) return 'disability';
    if (cat.includes('commercial')) return 'commercial';
  }
  return 'generic';
}

const fallbackGroups = [
  { label: 'Personal Lines', options: [
    { value: 'auto', label: 'Auto Insurance' },
    { value: 'homeowners', label: 'Homeowners Insurance' },
    { value: 'renters', label: 'Renters Insurance' },
  ]},
  { label: 'Life', options: [
    { value: 'life_term', label: 'Term Life' },
  ]},
  { label: 'Health', options: [
    { value: 'health_individual', label: 'Individual Health' },
  ]},
  { label: 'Commercial', options: [
    { value: 'bop', label: 'Business Owners Policy (BOP)' },
    { value: 'umbrella_personal', label: 'Personal Umbrella' },
  ]},
];

const coverageLevels = [
  { value: 'basic', label: 'Basic — Minimum required coverage' },
  { value: 'standard', label: 'Standard — Balanced coverage & cost (most popular)' },
  { value: 'premium', label: 'Premium — Maximum protection & lowest deductibles' },
];

const defaultForm = {
  insurance_type: '',
  zip_code: '',
  coverage_level: 'standard',
  vehicle_year: '',
  vehicle_make: '',
  vehicle_model: '',
  home_value: '',
  year_built: '',
  square_footage: '',
  date_of_birth: '',
  smoker: '',
  coverage_amount: '',
  health_rating: '',
  household_size: '',
  current_coverage: '',
  occupation: '',
  annual_income: '',
  employment_status: '',
  business_type: '',
  annual_revenue: '',
  num_employees: '',
  years_in_business: '',
};

function loadDraft(): { form: typeof defaultForm; step: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.form?.insurance_type && parsed.savedAt) {
      // Expire after 24 hours
      if (Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return { form: { ...defaultForm, ...parsed.form }, step: parsed.step || 1 };
    }
  } catch { /* ignore */ }
  return null;
}

export default function Calculator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agencyId = searchParams.get('agency_id') ? parseInt(searchParams.get('agency_id')!) : undefined;

  const draft = useMemo(() => loadDraft(), []);
  const [showResumeBanner, setShowResumeBanner] = useState(!!draft);
  const [step, setStep] = useState(draft?.step || 1);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [platformProducts, setPlatformProducts] = useState<PlatformProduct[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(draft?.form || defaultForm);
  const [subStep, setSubStep] = useState(0);

  const { user } = useAuth();

  // Load server draft on mount (if logged in)
  useEffect(() => {
    if (!user) return;
    api.get<{ draft: { form_data: typeof defaultForm; step: number; updated_at: string } | null }>('/calculator/draft')
      .then(res => {
        if (res.draft?.form_data) {
          const localDraft = loadDraft();
          // Use server draft if no local draft exists
          if (!localDraft) {
            setForm({ ...defaultForm, ...res.draft.form_data });
            setStep(res.draft.step || 1);
            setShowResumeBanner(true);
          }
        }
      })
      .catch(() => {}); // Ignore errors
  }, [user]);

  // Debounced server save
  const serverSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveToServer = useCallback((updatedForm: typeof defaultForm, currentStep: number) => {
    if (!user) return;
    if (serverSaveTimer.current) clearTimeout(serverSaveTimer.current);
    serverSaveTimer.current = setTimeout(() => {
      api.post('/calculator/draft', {
        insurance_type: updatedForm.insurance_type,
        zip_code: updatedForm.zip_code,
        coverage_level: updatedForm.coverage_level,
        form_data: updatedForm,
        step: currentStep,
      }).catch(() => {}); // Silent fail
    }, 2000);
  }, [user]);

  // Fetch available products from platform
  useEffect(() => {
    setLoadingProducts(true);
    platformProductService.getVisibleProducts(agencyId)
      .then(res => setPlatformProducts(res.products))
      .catch(() => { /* use fallback */ })
      .finally(() => setLoadingProducts(false));
  }, [agencyId]);

  // Build grouped options from platform products
  const productGroups = useMemo(() => {
    if (platformProducts.length > 0) {
      const grouped: Record<string, { value: string; label: string }[]> = {};
      platformProducts.forEach(p => {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push({ value: p.slug, label: p.name });
      });
      return Object.entries(grouped).map(([label, options]) => ({ label, options }));
    }
    return fallbackGroups;
  }, [platformProducts]);

  const fieldCategory = useMemo(
    () => form.insurance_type ? resolveCategory(form.insurance_type, platformProducts) : 'generic',
    [form.insurance_type, platformProducts],
  );

  // Define fields per category for progressive disclosure
  type FieldDef = { field: string; label: string; placeholder?: string; type?: string; options?: { value: string; label: string }[] };
  const step2Fields: FieldDef[] = useMemo(() => {
    switch (fieldCategory) {
      case 'vehicle': return [
        { field: 'vehicle_year', label: 'What year is your vehicle?', placeholder: '2024' },
        { field: 'vehicle_make', label: 'What make?', placeholder: 'Toyota' },
        { field: 'vehicle_model', label: 'What model?', placeholder: 'Camry' },
      ];
      case 'property': return [
        { field: 'home_value', label: 'What is your home\'s estimated value?', placeholder: '$350,000' },
        { field: 'year_built', label: 'What year was it built?', placeholder: '1995' },
        { field: 'square_footage', label: 'How many square feet?', placeholder: '2,000' },
      ];
      case 'life': return [
        { field: 'date_of_birth', label: 'What is your date of birth?', type: 'date' },
        { field: 'smoker', label: 'What is your smoker status?', options: [
          { value: 'non_smoker', label: 'Non-Smoker' }, { value: 'smoker', label: 'Smoker' }, { value: 'former_smoker', label: 'Former Smoker (quit 2+ yrs)' },
        ]},
        { field: 'coverage_amount', label: 'How much coverage do you want?', placeholder: '$500,000' },
        { field: 'health_rating', label: 'How would you rate your general health?', options: [
          { value: 'excellent', label: 'Excellent' }, { value: 'good', label: 'Good' }, { value: 'average', label: 'Average' }, { value: 'below_average', label: 'Below Average' },
        ]},
      ];
      case 'health': return [
        { field: 'date_of_birth', label: 'What is your date of birth?', type: 'date' },
        { field: 'household_size', label: 'How many people need coverage?', options: [
          { value: '1', label: 'Just me' }, { value: '2', label: 'Me + spouse/partner' }, { value: '3', label: 'Me + 1 dependent' }, { value: '4', label: 'Me + spouse + 1 dependent' }, { value: '5+', label: 'Family (5+)' },
        ]},
        { field: 'current_coverage', label: 'Do you have coverage now?', options: [
          { value: 'none', label: 'No current coverage' }, { value: 'employer', label: 'Employer plan (switching)' }, { value: 'marketplace', label: 'Marketplace / ACA plan' }, { value: 'other', label: 'Other' },
        ]},
      ];
      case 'disability': return [
        { field: 'date_of_birth', label: 'What is your date of birth?', type: 'date' },
        { field: 'occupation', label: 'What is your occupation?', placeholder: 'Software Engineer' },
        { field: 'annual_income', label: 'What is your annual income?', placeholder: '$85,000' },
        { field: 'employment_status', label: 'What is your employment status?', options: [
          { value: 'employed', label: 'Employed (W-2)' }, { value: 'self_employed', label: 'Self-Employed' }, { value: 'business_owner', label: 'Business Owner' }, { value: 'part_time', label: 'Part-Time' },
        ]},
      ];
      case 'commercial': return [
        { field: 'business_type', label: 'What type of business?', placeholder: 'Restaurant, Tech Startup, etc.' },
        { field: 'annual_revenue', label: 'What is your annual revenue?', placeholder: '$500,000' },
        { field: 'num_employees', label: 'How many employees?', placeholder: '12' },
        { field: 'years_in_business', label: 'How many years in business?', placeholder: '5' },
      ];
      default: return [];
    }
  }, [fieldCategory]);

  const totalSubSteps = step2Fields.length;
  const currentField = step2Fields[subStep];
  const currentFieldValue = currentField ? (form as Record<string, string>)[currentField.field] || '' : '';
  const isLastSubStep = subStep >= totalSubSteps - 1;

  const advanceSubStep = () => {
    if (isLastSubStep) {
      handleGetQuotes();
    } else {
      setSubStep(s => s + 1);
    }
  };

  // Save draft to localStorage on form changes
  const saveDraft = useCallback((updatedForm: typeof defaultForm, currentStep: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ form: updatedForm, step: currentStep, savedAt: Date.now() }));
    } catch { /* quota exceeded — ignore */ }
    saveToServer(updatedForm, currentStep);
  }, [saveToServer]);

  const update = (field: string, value: string) => setForm(f => {
    const next = { ...f, [field]: value };
    saveDraft(next, step);
    return next;
  });

  const handleClearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowResumeBanner(false);
    setStep(1);
    setForm(defaultForm);
    if (user) api.delete('/calculator/draft').catch(() => {});
  };

  const handleGetQuotes = async () => {
    setLoading(true);
    setError('');

    const details: Record<string, string> = {};
    if (fieldCategory === 'vehicle') {
      if (form.vehicle_year) details.vehicle_year = form.vehicle_year;
      if (form.vehicle_make) details.vehicle_make = form.vehicle_make;
      if (form.vehicle_model) details.vehicle_model = form.vehicle_model;
    } else if (fieldCategory === 'property') {
      if (form.home_value) details.home_value = form.home_value;
      if (form.year_built) details.year_built = form.year_built;
      if (form.square_footage) details.square_footage = form.square_footage;
    } else if (fieldCategory === 'life') {
      if (form.date_of_birth) details.date_of_birth = form.date_of_birth;
      if (form.smoker) details.smoker = form.smoker;
      if (form.coverage_amount) details.coverage_amount = form.coverage_amount;
      if (form.health_rating) details.health_rating = form.health_rating;
    } else if (fieldCategory === 'health') {
      if (form.date_of_birth) details.date_of_birth = form.date_of_birth;
      if (form.household_size) details.household_size = form.household_size;
      if (form.current_coverage) details.current_coverage = form.current_coverage;
    } else if (fieldCategory === 'disability') {
      if (form.date_of_birth) details.date_of_birth = form.date_of_birth;
      if (form.occupation) details.occupation = form.occupation;
      if (form.annual_income) details.annual_income = form.annual_income;
      if (form.employment_status) details.employment_status = form.employment_status;
    } else if (fieldCategory === 'commercial') {
      if (form.business_type) details.business_type = form.business_type;
      if (form.annual_revenue) details.annual_revenue = form.annual_revenue;
      if (form.num_employees) details.num_employees = form.num_employees;
      if (form.years_in_business) details.years_in_business = form.years_in_business;
    }

    try {
      const result = await quoteService.estimate({
        insurance_type: form.insurance_type,
        zip_code: form.zip_code,
        coverage_level: form.coverage_level,
        details: Object.keys(details).length > 0 ? details : undefined,
        agency_id: agencyId,
      });

      // Clear draft on successful quote — results are persisted separately
      localStorage.removeItem(STORAGE_KEY);
      if (user) api.delete('/calculator/draft').catch(() => {});

      // Persist quote results so QuoteResults survives page refresh
      const resultsData = {
        quoteRequestId: result.quote_request_id,
        quotes: result.quotes,
        insuranceType: form.insurance_type,
        coverageLevel: form.coverage_level,
        zipCode: form.zip_code,
        savedAt: Date.now(),
      };
      try { localStorage.setItem('insurons_quote_results', JSON.stringify(resultsData)); } catch { /* ignore */ }

      navigate('/calculator/results', { state: resultsData });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get quotes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedProductName = productGroups.flatMap(g => g.options).find(t => t.value === form.insurance_type)?.label || form.insurance_type;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Insurons" className="h-16 w-auto" />
          </a>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="w-4 h-4 text-shield-600" />
            No login required
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Welcome back banner for resumed drafts */}
        {showResumeBanner && (
          <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-shield-50 border border-shield-200 text-sm">
            <div className="flex items-center gap-2 text-shield-700">
              <RotateCcw className="w-4 h-4" />
              <span>Welcome back! We saved your progress.</span>
            </div>
            <button onClick={handleClearDraft} className="flex items-center gap-1 text-slate-500 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
              Start over
            </button>
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s ? 'gradient-shield text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 2 && <div className={`w-16 h-1 rounded ${step > s ? 'bg-shield-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {step === 1 && 'What type of insurance do you need?'}
            {step === 2 && 'Tell us about what you\'re insuring'}
          </h1>
          <p className="text-slate-500 mt-2">
            {step === 1 && 'Select your coverage type and we\'ll find the best rates — no account needed'}
            {step === 2 && 'This helps us get you accurate quotes from top carriers'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Takes about 60 seconds</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <div className="p-8">
            {step === 1 && (
              <div className="space-y-5">
                {loadingProducts ? (
                  <div className="text-center py-4 text-slate-500 text-sm">Loading available products...</div>
                ) : (
                  <Select
                    label="Insurance Type"
                    options={[]}
                    groups={productGroups}
                    placeholder="Select insurance type"
                    value={form.insurance_type}
                    onChange={e => update('insurance_type', e.target.value)}
                  />
                )}
                <AddressAutocomplete
                  label="ZIP Code"
                  placeholder="Enter ZIP code or city"
                  value={form.zip_code}
                  onChange={(zip) => update('zip_code', zip)}
                  onSelect={(result: ZipCodeResult) => {
                    update('zip_code', result.zip);
                  }}
                />
                <Select
                  label="Coverage Level"
                  options={coverageLevels}
                  value={form.coverage_level}
                  onChange={e => update('coverage_level', e.target.value)}
                />
                <Button
                  variant="shield"
                  size="lg"
                  className="w-full"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  onClick={() => { if (form.insurance_type && form.zip_code) { setStep(2); setSubStep(0); saveDraft(form, 2); } }}
                  disabled={!form.insurance_type || !form.zip_code}
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                {/* Sub-step progress */}
                {totalSubSteps > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Question {subStep + 1} of {totalSubSteps}</span>
                      <span>{Math.round(((subStep + 1) / totalSubSteps) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-shield-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${((subStep + 1) / totalSubSteps) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Progressive disclosure: one field at a time */}
                {currentField ? (
                  <div key={currentField.field} className="animate-fade-in">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">{currentField.label}</h3>
                    {currentField.options ? (
                      <Select
                        label=""
                        options={currentField.options}
                        placeholder="Select one..."
                        value={currentFieldValue}
                        onChange={e => { update(currentField.field, e.target.value); }}
                      />
                    ) : (
                      <Input
                        label=""
                        type={currentField.type || 'text'}
                        placeholder={currentField.placeholder || ''}
                        value={currentFieldValue}
                        onChange={e => update(currentField.field, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && currentFieldValue) advanceSubStep(); }}
                        autoFocus
                      />
                    )}
                  </div>
                ) : (
                  /* Generic fallback (no fields for this category) */
                  <div className="text-center py-8">
                    <CalcIcon className="w-12 h-12 text-shield-400 mx-auto mb-3" />
                    <p className="text-slate-600">Great choice! We'll match you with the best {selectedProductName} rates in your area.</p>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => {
                      if (subStep > 0) { setSubStep(s => s - 1); }
                      else { setStep(1); saveDraft(form, 1); }
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="shield"
                    size="lg"
                    className="flex-1"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                    onClick={advanceSubStep}
                    isLoading={loading}
                  >
                    {isLastSubStep || totalSubSteps === 0 ? 'Get My Quotes' : 'Continue'}
                  </Button>
                </div>

                {/* Skip hint */}
                {!isLastSubStep && totalSubSteps > 0 && (
                  <p className="text-center text-xs text-slate-400">
                    Press Enter to continue or <button type="button" onClick={advanceSubStep} className="text-shield-500 hover:underline">skip</button>
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-8 mt-10 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-shield-500" />
            No login required
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-shield-500" />
            Results in seconds
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-shield-500" />
            No obligation
          </div>
        </div>
      </div>
    </div>
  );
}
