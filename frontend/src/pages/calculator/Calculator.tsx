import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, Select, Card } from '@/components/ui';
import { Calculator as CalcIcon, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { quoteService } from '@/services/api';
import { platformProductService } from '@/services/api/platformProducts';
import type { PlatformProduct } from '@/types';

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
  { value: 'basic', label: 'Basic Coverage' },
  { value: 'standard', label: 'Standard Coverage' },
  { value: 'premium', label: 'Premium Coverage' },
];

export default function Calculator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agencyId = searchParams.get('agency_id') ? parseInt(searchParams.get('agency_id')!) : undefined;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [platformProducts, setPlatformProducts] = useState<PlatformProduct[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    insurance_type: '',
    zip_code: '',
    coverage_level: 'standard',
    // Vehicle
    vehicle_year: '',
    vehicle_make: '',
    vehicle_model: '',
    // Property
    home_value: '',
    year_built: '',
    square_footage: '',
    // Life
    date_of_birth: '',
    smoker: '',
    coverage_amount: '',
    health_rating: '',
    // Health
    household_size: '',
    current_coverage: '',
    // Disability
    occupation: '',
    annual_income: '',
    employment_status: '',
    // Commercial
    business_type: '',
    annual_revenue: '',
    num_employees: '',
    years_in_business: '',
  });

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

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

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

      navigate('/calculator/results', {
        state: {
          quoteRequestId: result.quote_request_id,
          quotes: result.quotes,
          insuranceType: form.insurance_type,
          coverageLevel: form.coverage_level,
          zipCode: form.zip_code,
        },
      });
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
            <img src="/logo.png" alt="Insurons" className="h-12 w-auto" />
          </a>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="w-4 h-4 text-shield-600" />
            No login required
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
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
                <Input
                  label="ZIP Code"
                  placeholder="Enter your ZIP code"
                  value={form.zip_code}
                  onChange={e => update('zip_code', e.target.value)}
                  maxLength={5}
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
                  onClick={() => form.insurance_type && form.zip_code ? setStep(2) : null}
                  disabled={!form.insurance_type || !form.zip_code}
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                {/* Vehicle fields */}
                {fieldCategory === 'vehicle' && (
                  <>
                    <Input label="Vehicle Year" placeholder="2024" value={form.vehicle_year} onChange={e => update('vehicle_year', e.target.value)} />
                    <Input label="Vehicle Make" placeholder="Toyota" value={form.vehicle_make} onChange={e => update('vehicle_make', e.target.value)} />
                    <Input label="Vehicle Model" placeholder="Camry" value={form.vehicle_model} onChange={e => update('vehicle_model', e.target.value)} />
                  </>
                )}

                {/* Property fields */}
                {fieldCategory === 'property' && (
                  <>
                    <Input label="Home Value" placeholder="$350,000" value={form.home_value} onChange={e => update('home_value', e.target.value)} />
                    <Input label="Year Built" placeholder="1995" value={form.year_built} onChange={e => update('year_built', e.target.value)} />
                    <Input label="Square Footage" placeholder="2,000" value={form.square_footage} onChange={e => update('square_footage', e.target.value)} />
                  </>
                )}

                {/* Life insurance fields */}
                {fieldCategory === 'life' && (
                  <>
                    <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
                    <Select label="Smoker Status" options={[
                      { value: 'non_smoker', label: 'Non-Smoker' },
                      { value: 'smoker', label: 'Smoker' },
                      { value: 'former_smoker', label: 'Former Smoker (quit 2+ yrs)' },
                    ]} placeholder="Select status" value={form.smoker} onChange={e => update('smoker', e.target.value)} />
                    <Input label="Desired Coverage Amount" placeholder="$500,000" value={form.coverage_amount} onChange={e => update('coverage_amount', e.target.value)} />
                    <Select label="General Health" options={[
                      { value: 'excellent', label: 'Excellent' },
                      { value: 'good', label: 'Good' },
                      { value: 'average', label: 'Average' },
                      { value: 'below_average', label: 'Below Average' },
                    ]} placeholder="Select health rating" value={form.health_rating} onChange={e => update('health_rating', e.target.value)} />
                  </>
                )}

                {/* Health insurance fields */}
                {fieldCategory === 'health' && (
                  <>
                    <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
                    <Select label="Household Size" options={[
                      { value: '1', label: 'Just me' },
                      { value: '2', label: 'Me + spouse/partner' },
                      { value: '3', label: 'Me + 1 dependent' },
                      { value: '4', label: 'Me + spouse + 1 dependent' },
                      { value: '5+', label: 'Family (5+)' },
                    ]} placeholder="Select household size" value={form.household_size} onChange={e => update('household_size', e.target.value)} />
                    <Select label="Current Coverage" options={[
                      { value: 'none', label: 'No current coverage' },
                      { value: 'employer', label: 'Employer plan (switching)' },
                      { value: 'marketplace', label: 'Marketplace / ACA plan' },
                      { value: 'other', label: 'Other' },
                    ]} placeholder="Select current coverage" value={form.current_coverage} onChange={e => update('current_coverage', e.target.value)} />
                  </>
                )}

                {/* Disability / LTC fields */}
                {fieldCategory === 'disability' && (
                  <>
                    <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
                    <Input label="Occupation" placeholder="Software Engineer" value={form.occupation} onChange={e => update('occupation', e.target.value)} />
                    <Input label="Annual Income" placeholder="$85,000" value={form.annual_income} onChange={e => update('annual_income', e.target.value)} />
                    <Select label="Employment Status" options={[
                      { value: 'employed', label: 'Employed (W-2)' },
                      { value: 'self_employed', label: 'Self-Employed' },
                      { value: 'business_owner', label: 'Business Owner' },
                      { value: 'part_time', label: 'Part-Time' },
                    ]} placeholder="Select status" value={form.employment_status} onChange={e => update('employment_status', e.target.value)} />
                  </>
                )}

                {/* Commercial fields */}
                {fieldCategory === 'commercial' && (
                  <>
                    <Input label="Business Type / Industry" placeholder="Restaurant, Tech Startup, etc." value={form.business_type} onChange={e => update('business_type', e.target.value)} />
                    <Input label="Annual Revenue" placeholder="$500,000" value={form.annual_revenue} onChange={e => update('annual_revenue', e.target.value)} />
                    <Input label="Number of Employees" placeholder="12" value={form.num_employees} onChange={e => update('num_employees', e.target.value)} />
                    <Input label="Years in Business" placeholder="5" value={form.years_in_business} onChange={e => update('years_in_business', e.target.value)} />
                  </>
                )}

                {/* Generic fallback */}
                {fieldCategory === 'generic' && (
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
                  <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button
                    variant="shield"
                    size="lg"
                    className="flex-1"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                    onClick={handleGetQuotes}
                    isLoading={loading}
                  >
                    Get My Quotes
                  </Button>
                </div>
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
