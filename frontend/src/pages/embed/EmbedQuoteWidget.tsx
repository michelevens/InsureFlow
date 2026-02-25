import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Input, Select, Card, Badge } from '@/components/ui';
import {
  ArrowRight, ShieldCheck, Clock, CheckCircle2, Award, Check, ArrowLeft,
  User, Mail, Phone, ExternalLink,
} from 'lucide-react';
import { quoteService } from '@/services/api';
import { platformProductService } from '@/services/api/platformProducts';
import { api } from '@/services/api/client';
import type { PlatformProduct } from '@/types';
import type { EstimateQuote } from '@/services/api/quotes';

/* ── Category slug sets (same as Calculator) ── */
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
  const p = products.find(pr => pr.slug === slug);
  if (p) {
    const cat = p.category.toLowerCase();
    if (cat.includes('personal')) return 'vehicle';
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
  { label: 'Life', options: [{ value: 'life_term', label: 'Term Life' }] },
  { label: 'Health', options: [{ value: 'health_individual', label: 'Individual Health' }] },
  { label: 'Commercial', options: [
    { value: 'bop', label: 'Business Owners Policy (BOP)' },
    { value: 'umbrella_personal', label: 'Personal Umbrella' },
  ]},
];

const coverageLevels = [
  { value: 'basic', label: 'Basic' },
  { value: 'standard', label: 'Standard (most popular)' },
  { value: 'premium', label: 'Premium' },
];

const defaultForm = {
  insurance_type: '', zip_code: '', coverage_level: 'standard',
  vehicle_year: '', vehicle_make: '', vehicle_model: '',
  home_value: '', year_built: '', square_footage: '',
  date_of_birth: '', smoker: '', coverage_amount: '', health_rating: '',
  household_size: '', current_coverage: '',
  occupation: '', annual_income: '', employment_status: '',
  business_type: '', annual_revenue: '', num_employees: '', years_in_business: '',
};

type FieldDef = { field: string; label: string; placeholder?: string; type?: string; options?: { value: string; label: string }[] };

/* ── PostMessage helper ── */
function postToParent(event: string, data?: Record<string, unknown>) {
  try { window.parent.postMessage({ source: 'insurons-widget', event, ...data }, '*'); } catch { /* ignore */ }
}

export default function EmbedQuoteWidget() {
  const [searchParams] = useSearchParams();
  const apiKey = searchParams.get('key') || '';
  const preselectedType = searchParams.get('type') || '';

  // Partner config
  const [partnerName, setPartnerName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [validKey, setValidKey] = useState<boolean | null>(null);
  const [sessionToken, setSessionToken] = useState('');

  // Form state
  const [step, setStep] = useState(1); // 1=form-step1, 2=form-step2, 3=results, 4=contact, 5=success
  const [form, setForm] = useState({ ...defaultForm, insurance_type: preselectedType });
  const [subStep, setSubStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Products
  const [platformProducts, setPlatformProducts] = useState<PlatformProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Quote results
  const [quotes, setQuotes] = useState<EstimateQuote[]>([]);
  const [quoteRequestId, setQuoteRequestId] = useState<number>(0);

  // Contact
  const [contact, setContact] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);

  /* ── Validate API key + create session on mount ── */
  useEffect(() => {
    if (!apiKey) { setValidKey(false); return; }
    api.get<{ partner_name: string; widget_config: Record<string, unknown> | null }>(`/embed/config/${apiKey}`)
      .then(res => {
        setPartnerName(res.partner_name);
        const cfg = res.widget_config;
        if (cfg?.primary_color && typeof cfg.primary_color === 'string') setPrimaryColor(cfg.primary_color);
        setValidKey(true);
      })
      .catch(() => setValidKey(false));

    // Create embed session
    api.post<{ session_token: string }>('/embed/quote', {
      api_key: apiKey,
      insurance_type: preselectedType || undefined,
    }).then(res => {
      setSessionToken(res.session_token);
    }).catch(() => { /* non-critical */ });
  }, [apiKey, preselectedType]);

  /* ── Fetch products ── */
  useEffect(() => {
    setLoadingProducts(true);
    platformProductService.getVisibleProducts()
      .then(res => setPlatformProducts(res.products))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

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

  const step2Fields: FieldDef[] = useMemo(() => {
    switch (fieldCategory) {
      case 'vehicle': return [
        { field: 'vehicle_year', label: 'Vehicle year?', placeholder: '2024' },
        { field: 'vehicle_make', label: 'Vehicle make?', placeholder: 'Toyota' },
        { field: 'vehicle_model', label: 'Vehicle model?', placeholder: 'Camry' },
      ];
      case 'property': return [
        { field: 'home_value', label: 'Estimated home value?', placeholder: '$350,000' },
        { field: 'year_built', label: 'Year built?', placeholder: '1995' },
        { field: 'square_footage', label: 'Square feet?', placeholder: '2,000' },
      ];
      case 'life': return [
        { field: 'date_of_birth', label: 'Date of birth?', type: 'date' },
        { field: 'smoker', label: 'Smoker status?', options: [
          { value: 'non_smoker', label: 'Non-Smoker' }, { value: 'smoker', label: 'Smoker' }, { value: 'former_smoker', label: 'Former Smoker' },
        ]},
        { field: 'coverage_amount', label: 'Coverage amount?', placeholder: '$500,000' },
      ];
      case 'health': return [
        { field: 'date_of_birth', label: 'Date of birth?', type: 'date' },
        { field: 'household_size', label: 'How many need coverage?', options: [
          { value: '1', label: 'Just me' }, { value: '2', label: 'Me + spouse' }, { value: '3', label: 'Me + 1 dependent' }, { value: '4+', label: 'Family (4+)' },
        ]},
      ];
      case 'disability': return [
        { field: 'date_of_birth', label: 'Date of birth?', type: 'date' },
        { field: 'occupation', label: 'Occupation?', placeholder: 'Software Engineer' },
        { field: 'annual_income', label: 'Annual income?', placeholder: '$85,000' },
      ];
      case 'commercial': return [
        { field: 'business_type', label: 'Business type?', placeholder: 'Restaurant, Tech Startup' },
        { field: 'annual_revenue', label: 'Annual revenue?', placeholder: '$500,000' },
        { field: 'num_employees', label: 'Number of employees?', placeholder: '12' },
      ];
      default: return [];
    }
  }, [fieldCategory]);

  const totalSubSteps = step2Fields.length;
  const currentField = step2Fields[subStep];
  const currentFieldValue = currentField ? (form as Record<string, string>)[currentField.field] || '' : '';
  const isLastSubStep = subStep >= totalSubSteps - 1;

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  /* ── Get quotes ── */
  const handleGetQuotes = useCallback(async () => {
    setLoading(true);
    setError('');
    postToParent('insurons:quote-started', { insurance_type: form.insurance_type });

    const details: Record<string, string> = {};
    const catFields: Record<FieldCategory, string[]> = {
      vehicle: ['vehicle_year', 'vehicle_make', 'vehicle_model'],
      property: ['home_value', 'year_built', 'square_footage'],
      life: ['date_of_birth', 'smoker', 'coverage_amount', 'health_rating'],
      health: ['date_of_birth', 'household_size', 'current_coverage'],
      disability: ['date_of_birth', 'occupation', 'annual_income', 'employment_status'],
      commercial: ['business_type', 'annual_revenue', 'num_employees', 'years_in_business'],
      generic: [],
    };
    (catFields[fieldCategory] || []).forEach(f => {
      const v = (form as Record<string, string>)[f];
      if (v) details[f] = v;
    });

    try {
      const result = await quoteService.estimate({
        insurance_type: form.insurance_type,
        zip_code: form.zip_code,
        coverage_level: form.coverage_level,
        details: Object.keys(details).length > 0 ? details : undefined,
      });
      setQuotes(result.quotes);
      setQuoteRequestId(result.quote_request_id);
      setStep(3);
      postToParent('insurons:quotes-received', { count: result.quotes.length });
      // Notify parent for auto-resize
      requestAnimationFrame(() => postToParent('insurons:resize', { height: document.body.scrollHeight }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get quotes');
    } finally {
      setLoading(false);
    }
  }, [form, fieldCategory]);

  const advanceSubStep = () => {
    if (isLastSubStep || totalSubSteps === 0) handleGetQuotes();
    else setSubStep(s => s + 1);
  };

  /* ── Save contact ── */
  const handleSaveContact = async () => {
    if (!contact.first_name || !contact.email) return;
    setSaving(true);
    try {
      await quoteService.saveContact(quoteRequestId, {
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone || undefined,
      });
      // Mark session as converted
      if (sessionToken) {
        api.post('/embed/convert', { session_token: sessionToken }).catch(() => {});
      }
      postToParent('insurons:contact-saved', { email: contact.email });
      setStep(5);
    } catch {
      // Still show success to user
      setStep(5);
    } finally {
      setSaving(false);
    }
  };

  /* ── Send resize events on step change ── */
  useEffect(() => {
    requestAnimationFrame(() => postToParent('insurons:resize', { height: document.body.scrollHeight }));
  }, [step, subStep, quotes.length]);

  /* ── Custom primary color as CSS variable ── */
  const colorStyle = primaryColor ? { '--embed-primary': primaryColor } as React.CSSProperties : {};

  /* ── Invalid key state ── */
  if (validKey === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={colorStyle}>
        <Card className="max-w-sm w-full">
          <div className="p-6 text-center">
            <ShieldCheck className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900 mb-1">Invalid Widget Key</h2>
            <p className="text-sm text-slate-500">This widget is not configured correctly. Please contact support.</p>
          </div>
        </Card>
      </div>
    );
  }

  /* ── Loading key validation ── */
  if (validKey === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
      </div>
    );
  }

  const lowestPremium = quotes.length > 0 ? Math.min(...quotes.map(q => parseFloat(q.monthly_premium))) : 0;

  return (
    <div className="min-h-full bg-transparent" style={colorStyle}>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-shield-600" />
            <span className="text-sm font-semibold text-slate-700">
              {partnerName ? `${partnerName} + Insurons` : 'Insurons'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            60 seconds
          </div>
        </div>

        {/* ── STEP 1: Insurance type + ZIP ── */}
        {step === 1 && (
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Get an Instant Quote</h2>
              <p className="text-sm text-slate-500 mb-5">Compare rates from top carriers. No account required.</p>

              <div className="space-y-4">
                {loadingProducts ? (
                  <div className="text-center py-3 text-slate-400 text-sm">Loading...</div>
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
                  onClick={() => {
                    if (form.insurance_type && form.zip_code) {
                      if (step2Fields.length === 0) handleGetQuotes();
                      else { setStep(2); setSubStep(0); }
                    }
                  }}
                  disabled={!form.insurance_type || !form.zip_code}
                >
                  Continue
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ── STEP 2: Progressive disclosure fields ── */}
        {step === 2 && (
          <Card>
            <div className="p-6">
              {totalSubSteps > 0 && (
                <div className="space-y-1.5 mb-5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{subStep + 1} of {totalSubSteps}</span>
                    <span>{Math.round(((subStep + 1) / totalSubSteps) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-shield-500 rounded-full transition-all duration-500" style={{ width: `${((subStep + 1) / totalSubSteps) * 100}%` }} />
                  </div>
                </div>
              )}

              {currentField && (
                <div key={currentField.field} className="animate-fade-in">
                  <h3 className="text-base font-semibold text-slate-800 mb-3">{currentField.label}</h3>
                  {currentField.options ? (
                    <Select
                      label=""
                      options={currentField.options}
                      placeholder="Select..."
                      value={currentFieldValue}
                      onChange={e => update(currentField.field, e.target.value)}
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
              )}

              {error && <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

              <div className="flex gap-3 mt-5">
                <Button variant="outline" className="flex-1" onClick={() => { if (subStep > 0) setSubStep(s => s - 1); else setStep(1); }}>
                  Back
                </Button>
                <Button
                  variant="shield"
                  className="flex-1"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={advanceSubStep}
                  isLoading={loading}
                >
                  {isLastSubStep || totalSubSteps === 0 ? 'Get Quotes' : 'Next'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ── STEP 3: Quote results ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-savings-50 text-savings-700 text-xs font-medium mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {quotes.length} quote{quotes.length !== 1 ? 's' : ''} found
              </div>
              <h2 className="text-lg font-bold text-slate-900">Your Insurance Quotes</h2>
              {lowestPremium > 0 && (
                <p className="text-sm text-slate-500 mt-1">Starting at <span className="font-semibold text-savings-600">${lowestPremium.toFixed(0)}/mo</span></p>
              )}
            </div>

            {quotes.map(quote => {
              const carrier = quote.carrier_product?.carrier;
              const carrierName = carrier?.name || 'Carrier';
              const initials = carrierName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const monthly = parseFloat(quote.monthly_premium);
              const deductible = parseFloat(quote.deductible);

              return (
                <Card key={quote.id} className={`transition-all ${quote.is_recommended ? 'border-shield-200 bg-shield-50/30' : ''}`}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-shield-100 text-shield-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 text-sm truncate">{carrierName}</h3>
                          {quote.is_recommended && <Badge variant="shield" className="text-xs">Best</Badge>}
                          {carrier?.am_best_rating && (
                            <div className="flex items-center gap-0.5 text-xs text-slate-500">
                              <Award className="w-3 h-3 text-amber-500" />
                              {carrier.am_best_rating}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-lg font-bold text-slate-900">${monthly.toFixed(0)}</span>
                            <span className="text-slate-400">/mo</span>
                          </div>
                          <div className="text-slate-500">
                            ${deductible.toFixed(0)} deductible
                          </div>
                        </div>
                        {(quote.features || []).length > 0 && (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
                            {quote.features.slice(0, 3).map((f, i) => (
                              <span key={i} className="flex items-center gap-1 text-xs text-slate-500">
                                <Check className="w-3 h-3 text-savings-500" />{f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            <div className="pt-2 space-y-3">
              <Button variant="shield" className="w-full" onClick={() => setStep(4)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Save My Quotes
              </Button>
              <button className="w-full text-center text-xs text-slate-400 hover:text-slate-600" onClick={() => { setStep(1); setQuotes([]); }}>
                <ArrowLeft className="w-3 h-3 inline mr-1" />Start over
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Contact form ── */}
        {step === 4 && (
          <Card>
            <div className="p-6">
              <div className="text-center mb-5">
                <Mail className="w-8 h-8 text-shield-500 mx-auto mb-2" />
                <h2 className="text-lg font-bold text-slate-900">Save Your Quotes</h2>
                <p className="text-sm text-slate-500">We'll email your quotes so you can review them anytime.</p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    placeholder="John"
                    value={contact.first_name}
                    onChange={e => setContact(c => ({ ...c, first_name: e.target.value }))}
                    leftIcon={<User className="w-4 h-4" />}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Smith"
                    value={contact.last_name}
                    onChange={e => setContact(c => ({ ...c, last_name: e.target.value }))}
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={contact.email}
                  onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                <Input
                  label="Phone (optional)"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={contact.phone}
                  onChange={e => setContact(c => ({ ...c, phone: e.target.value }))}
                  leftIcon={<Phone className="w-4 h-4" />}
                />

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Back</Button>
                  <Button
                    variant="shield"
                    className="flex-1"
                    onClick={handleSaveContact}
                    isLoading={saving}
                    disabled={!contact.first_name || !contact.email}
                  >
                    Save Quotes
                  </Button>
                </div>
                <p className="text-xs text-slate-400 text-center">No spam. Your info is only used to save and email your quotes.</p>
              </div>
            </div>
          </Card>
        )}

        {/* ── STEP 5: Success ── */}
        {step === 5 && (
          <Card>
            <div className="p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-savings-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900 mb-1">Quotes Saved!</h2>
              <p className="text-sm text-slate-500 mb-5">We've sent your {quotes.length} quote{quotes.length !== 1 ? 's' : ''} to <span className="font-medium text-slate-700">{contact.email}</span></p>

              <div className="space-y-3">
                <a
                  href={`${window.location.origin.replace('/embed', '')}/register?email=${encodeURIComponent(contact.email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="shield" className="w-full" rightIcon={<ExternalLink className="w-4 h-4" />}>
                    Create Free Account
                  </Button>
                </a>
                <p className="text-xs text-slate-400">Track quotes, apply for policies, and connect with agents.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Trust footer */}
        <div className="flex items-center justify-center gap-4 mt-5 text-xs text-slate-400">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> No login</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> No obligation</span>
        </div>
      </div>
    </div>
  );
}
