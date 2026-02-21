import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, Card } from '@/components/ui';
import { Shield, Calculator as CalcIcon, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

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
    // Personal info
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
  });

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      navigate('/calculator/results', { state: { quoteRequest: form } });
    }, 1500);
  };

  const isAutoOrHome = form.insurance_type === 'auto' || form.insurance_type === 'home';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-shield flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">InsureFlow</span>
          </a>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="w-4 h-4 text-shield-600" />
            Your info is secure & encrypted
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s ? 'gradient-shield text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`w-16 h-1 rounded ${step > s ? 'bg-shield-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {step === 1 && 'What type of insurance do you need?'}
            {step === 2 && 'Tell us about what you\'re insuring'}
            {step === 3 && 'Almost done! Just a few details'}
          </h1>
          <p className="text-slate-500 mt-2">
            {step === 1 && 'Select your coverage type and we\'ll find the best rates'}
            {step === 2 && 'This helps us get you accurate quotes from top carriers'}
            {step === 3 && 'We need this to generate your personalized quotes'}
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
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button variant="shield" size="lg" className="flex-1" rightIcon={<ArrowRight className="w-5 h-5" />} onClick={() => setStep(3)}>Continue</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" placeholder="John" value={form.first_name} onChange={e => update('first_name', e.target.value)} required />
                  <Input label="Last Name" placeholder="Smith" value={form.last_name} onChange={e => update('last_name', e.target.value)} required />
                </div>
                <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
                <Input label="Phone" type="tel" placeholder="(555) 123-4567" value={form.phone} onChange={e => update('phone', e.target.value)} />
                <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} required />
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                  <Button
                    variant="shield"
                    size="lg"
                    className="flex-1"
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                    onClick={handleSubmit}
                    isLoading={loading}
                    disabled={!form.first_name || !form.last_name || !form.email}
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
            256-bit encryption
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-shield-500" />
            Results in 30 seconds
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
