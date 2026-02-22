import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, Card } from '@/components/ui';
import { Calculator as CalcIcon, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { quoteService } from '@/services/api';

const insuranceTypes = [
  { value: 'auto', label: 'Auto Insurance' },
  { value: 'home', label: 'Home Insurance' },
  { value: 'life', label: 'Life Insurance' },
  { value: 'health', label: 'Health Insurance' },
  { value: 'renters', label: 'Renters Insurance' },
  { value: 'business', label: 'Business Insurance' },
  { value: 'umbrella', label: 'Umbrella Insurance' },
];

const coverageLevels = [
  { value: 'basic', label: 'Basic Coverage' },
  { value: 'standard', label: 'Standard Coverage' },
  { value: 'premium', label: 'Premium Coverage' },
];

export default function Calculator() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    insurance_type: '',
    zip_code: '',
    coverage_level: 'standard',
    // Auto-specific
    vehicle_year: '',
    vehicle_make: '',
    vehicle_model: '',
    // Home-specific
    home_value: '',
    year_built: '',
    square_footage: '',
  });

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleGetQuotes = async () => {
    setLoading(true);
    setError('');

    const details: Record<string, string> = {};
    if (form.insurance_type === 'auto') {
      if (form.vehicle_year) details.vehicle_year = form.vehicle_year;
      if (form.vehicle_make) details.vehicle_make = form.vehicle_make;
      if (form.vehicle_model) details.vehicle_model = form.vehicle_model;
    } else if (form.insurance_type === 'home') {
      if (form.home_value) details.home_value = form.home_value;
      if (form.year_built) details.year_built = form.year_built;
      if (form.square_footage) details.square_footage = form.square_footage;
    }

    try {
      const result = await quoteService.estimate({
        insurance_type: form.insurance_type,
        zip_code: form.zip_code,
        coverage_level: form.coverage_level,
        details: Object.keys(details).length > 0 ? details : undefined,
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

  const isAutoOrHome = form.insurance_type === 'auto' || form.insurance_type === 'home';

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
                <Select
                  label="Insurance Type"
                  options={insuranceTypes}
                  placeholder="Select insurance type"
                  value={form.insurance_type}
                  onChange={e => update('insurance_type', e.target.value)}
                />
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
                {form.insurance_type === 'auto' && (
                  <>
                    <Input label="Vehicle Year" placeholder="2024" value={form.vehicle_year} onChange={e => update('vehicle_year', e.target.value)} />
                    <Input label="Vehicle Make" placeholder="Toyota" value={form.vehicle_make} onChange={e => update('vehicle_make', e.target.value)} />
                    <Input label="Vehicle Model" placeholder="Camry" value={form.vehicle_model} onChange={e => update('vehicle_model', e.target.value)} />
                  </>
                )}
                {form.insurance_type === 'home' && (
                  <>
                    <Input label="Home Value" placeholder="$350,000" value={form.home_value} onChange={e => update('home_value', e.target.value)} />
                    <Input label="Year Built" placeholder="1995" value={form.year_built} onChange={e => update('year_built', e.target.value)} />
                    <Input label="Square Footage" placeholder="2,000" value={form.square_footage} onChange={e => update('square_footage', e.target.value)} />
                  </>
                )}
                {!isAutoOrHome && (
                  <div className="text-center py-8">
                    <CalcIcon className="w-12 h-12 text-shield-400 mx-auto mb-3" />
                    <p className="text-slate-600">Great choice! We'll match you with the best {form.insurance_type} insurance rates in your area.</p>
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
