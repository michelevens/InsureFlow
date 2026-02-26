import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card, Select, AddressAutocomplete } from '@/components/ui';
import type { ZipCodeResult } from '@/components/ui';
import { ShieldCheck, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { marketplaceService, type MarketplaceRequest } from '@/services/api';
import { toast } from 'sonner';

const insuranceTypes = [
  { value: '', label: 'Select type...' },
  { value: 'auto', label: 'Auto Insurance' },
  { value: 'homeowners', label: 'Homeowners Insurance' },
  { value: 'renters', label: 'Renters Insurance' },
  { value: 'life_term', label: 'Term Life Insurance' },
  { value: 'life_whole', label: 'Whole Life Insurance' },
  { value: 'health_individual', label: 'Individual Health Insurance' },
  { value: 'medicare_supplement', label: 'Medicare Supplement' },
  { value: 'disability_long_term', label: 'Long-Term Disability' },
  { value: 'long_term_care', label: 'Long-Term Care' },
  { value: 'commercial_gl', label: 'Commercial General Liability' },
  { value: 'bop', label: 'Business Owners Policy (BOP)' },
  { value: 'workers_comp', label: 'Workers Compensation' },
  { value: 'umbrella_personal', label: 'Personal Umbrella' },
];

const coverageLevels = [
  { value: 'basic', label: 'Basic' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
];

const US_STATES = [
  { value: '', label: 'Select state...' },
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' }, { value: 'DC', label: 'Washington DC' },
];

export default function InsuranceRequestForm() {
  const [form, setForm] = useState<MarketplaceRequest>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    insurance_type: '',
    zip_code: '',
    state: '',
    coverage_level: 'standard',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [agentsMatched, setAgentsMatched] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.insurance_type || !form.zip_code || !form.state) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await marketplaceService.submitRequest(form);
      setAgentsMatched(res.agents_matched);
      setSubmitted(true);
    } catch {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: keyof MarketplaceRequest, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-shield-50 via-white to-confidence-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Request Submitted!</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            Your insurance request has been sent to <strong>{agentsMatched} licensed agent{agentsMatched !== 1 ? 's' : ''}</strong> in your area.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            You'll receive quotes via email and can compare them in your dashboard. Agents typically respond within 24 hours.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/auth/register">
              <Button variant="shield">Create Account to Track</Button>
            </Link>
            <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ first_name: '', last_name: '', email: '', phone: '', insurance_type: '', zip_code: '', state: '', coverage_level: 'standard', description: '' }); }}>
              Submit Another
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-shield-50 via-white to-confidence-50">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-shield-600 dark:text-shield-400" />
            <span className="text-xl font-bold text-slate-900 dark:text-white">Insurons</span>
          </Link>
          <Link to="/auth/login">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Get Insurance Quotes from Licensed Agents</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">Tell us what you need and multiple agents will compete for your business.</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Insurance Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Insurance Type *</label>
              <Select
                value={form.insurance_type}
                onChange={(e) => update('insurance_type', e.target.value)}
                options={insuranceTypes}
              />
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">First Name *</label>
                <Input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Last Name *</label>
                <Input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} placeholder="Doe" />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Email *</label>
                <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Phone</label>
                <Input type="tel" value={form.phone ?? ''} onChange={(e) => update('phone', e.target.value)} placeholder="(555) 123-4567" />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">State *</label>
                <Select value={form.state} onChange={(e) => update('state', e.target.value)} options={US_STATES} />
              </div>
              <div>
                <AddressAutocomplete
                  label="Zip Code *"
                  placeholder="Enter ZIP or city"
                  value={form.zip_code}
                  onChange={(zip) => update('zip_code', zip)}
                  onSelect={(result: ZipCodeResult) => {
                    update('zip_code', result.zip);
                    update('state', result.state);
                  }}
                />
              </div>
            </div>

            {/* Coverage Level */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Desired Coverage Level</label>
              <div className="flex gap-3">
                {coverageLevels.map(level => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => update('coverage_level', level.value)}
                    className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                      form.coverage_level === level.value
                        ? 'border-shield-500 bg-shield-50 dark:bg-shield-900/30 text-shield-700 dark:text-shield-300'
                        : 'border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Tell us more (optional)</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400 focus:border-transparent resize-none"
                rows={3}
                placeholder="Any specific needs, current coverage details, or questions for agents..."
                value={form.description ?? ''}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>

            <Button type="submit" variant="shield" className="w-full" disabled={submitting} rightIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}>
              {submitting ? 'Submitting...' : 'Get Quotes from Agents'}
            </Button>

            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
              By submitting, you agree to our <Link to="/terms" className="underline">Terms of Service</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
              Your information will be shared with matched licensed insurance agents.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
