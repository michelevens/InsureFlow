import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Card, Button, Input, AddressAutocomplete } from '@/components/ui';
import type { ZipCodeResult } from '@/components/ui';
import { Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { api } from '@/services/api/client';

const FALLBACK_INSURANCE_TYPES = [
  'Auto', 'Home', 'Renters', 'Life - Term', 'Life - Whole', 'Health - Individual',
  'Health - Group', 'Commercial GL', 'Workers Comp', 'Disability - STD', 'Disability - LTD',
  'Long Term Care', 'Medicare', 'Dental', 'Vision', 'Umbrella', 'Other',
];

const URGENCY_OPTIONS = [
  { value: 'asap', label: 'As soon as possible' },
  { value: 'this_month', label: 'Within the next month' },
  { value: 'exploring', label: 'Just exploring options' },
];

export default function LeadIntake() {
  const { agencyCode } = useParams();
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('agent');
  const utmSource = searchParams.get('utm_source');
  const utmMedium = searchParams.get('utm_medium');
  const utmCampaign = searchParams.get('utm_campaign');

  const [agencyName, setAgencyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [insuranceTypes, setInsuranceTypes] = useState<string[]>(FALLBACK_INSURANCE_TYPES);

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', zip_code: '', insurance_type: '', urgency: '', notes: '',
  });

  useEffect(() => {
    if (!agencyCode) return;
    api.get(`/intake/${agencyCode}`).then((res: unknown) => {
      const data = res as { agency_name: string };
      setAgencyName(data.agency_name);
    }).catch(() => {
      setNotFound(true);
    }).finally(() => {
      setLoading(false);
    });

    // Load dynamic product catalog
    api.get('/products/visible').then((res: unknown) => {
      const data = res as { products: { name: string }[] };
      if (data.products?.length > 0) {
        setInsuranceTypes(data.products.map(p => p.name));
      }
    }).catch(() => { /* use fallback */ });
  }, [agencyCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.insurance_type) {
      setError('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/intake/${agencyCode}`, {
        ...form,
        agent_id: agentId ? Number(agentId) : undefined,
        utm_source: utmSource || undefined,
        utm_medium: utmMedium || undefined,
        utm_campaign: utmCampaign || undefined,
      });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-shield-500" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid Link</h1>
          <p className="text-slate-500 mb-4">This intake link is no longer active or does not exist.</p>
          <Link to="/" className="text-shield-600 hover:underline text-sm">Go to InsureFlow</Link>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-savings-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h1>
          <p className="text-slate-600 mb-1">Your information has been submitted successfully.</p>
          <p className="text-slate-500 text-sm">A licensed agent from <span className="font-semibold">{agencyName}</span> will contact you shortly.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="text-center mb-6">
          <ShieldCheck className="w-10 h-10 text-shield-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-slate-900">{agencyName}</h1>
          <p className="text-slate-500 mt-1">Tell us about your insurance needs and we'll be in touch.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">First Name *</label>
              <Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="John" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Last Name *</label>
              <Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Doe" required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email *</label>
            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-1">
              <AddressAutocomplete
                label="ZIP Code"
                placeholder="Enter ZIP or city"
                value={form.zip_code}
                onChange={(zip) => setForm({ ...form, zip_code: zip })}
                onSelect={(result: ZipCodeResult) => {
                  setForm(f => ({ ...f, zip_code: result.zip }));
                }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Insurance Type *</label>
            <select value={form.insurance_type} onChange={e => setForm({ ...form, insurance_type: e.target.value })} required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500">
              <option value="">Select type...</option>
              {insuranceTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">When do you need coverage?</label>
            <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500">
              <option value="">Select timeline...</option>
              {URGENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Additional Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Tell us about your specific needs..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 min-h-[80px]" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Request a Quote'}
          </Button>

          <p className="text-xs text-slate-400 text-center">
            Powered by <a href="/" className="text-shield-600 hover:underline">InsureFlow</a>
          </p>
        </form>
      </Card>
    </div>
  );
}
