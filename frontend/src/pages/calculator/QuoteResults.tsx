import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Badge, Input } from '@/components/ui';
import { Shield, ShieldCheck, ArrowRight, ArrowLeft, Check, Phone, Mail, Award, CheckCircle2, User, Lock } from 'lucide-react';
import { quoteService, authService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import type { EstimateQuote } from '@/services/api/quotes';

export default function QuoteResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedQuote, setSelectedQuote] = useState<number | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [contact, setContact] = useState({ first_name: '', last_name: '', email: '', phone: '' });

  // Account creation state (shown after saving contact)
  const [showSignup, setShowSignup] = useState(false);
  const [signupForm, setSignupForm] = useState({ password: '', password_confirmation: '' });
  const [signingUp, setSigningUp] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const [signupError, setSignupError] = useState('');

  const quotes: EstimateQuote[] = location.state?.quotes || [];
  const quoteRequestId: number = location.state?.quoteRequestId;
  const insuranceType: string = location.state?.insuranceType || 'auto';
  const coverageLevel: string = location.state?.coverageLevel || 'standard';
  const zipCode: string = location.state?.zipCode || '';

  // Sort: recommended first, then by monthly premium ascending
  const sortedQuotes = [...quotes].sort((a, b) => {
    if (a.is_recommended && !b.is_recommended) return -1;
    if (!a.is_recommended && b.is_recommended) return 1;
    return parseFloat(a.monthly_premium) - parseFloat(b.monthly_premium);
  });

  const lowestPremium = quotes.length > 0
    ? Math.min(...quotes.map(q => parseFloat(q.monthly_premium)))
    : 0;

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
      setSaved(true);
    } catch {
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSignup = async () => {
    if (signupForm.password.length < 8) {
      setSignupError('Password must be at least 8 characters');
      return;
    }
    if (signupForm.password !== signupForm.password_confirmation) {
      setSignupError('Passwords do not match');
      return;
    }
    setSigningUp(true);
    setSignupError('');
    try {
      const response = await authService.registerFromQuote({
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        email: contact.email,
        password: signupForm.password,
        password_confirmation: signupForm.password_confirmation,
        phone: contact.phone || undefined,
        quote_request_id: quoteRequestId,
      });
      localStorage.setItem('auth_token', response.token);
      setSignedUp(true);
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSigningUp(false);
    }
  };

  const handleSelectQuote = (quote: EstimateQuote, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAuthenticated || signedUp) {
      navigate('/marketplace', { state: { selectedQuote: quote } });
    } else {
      // Scroll to the save/signup section
      setShowSaveForm(true);
      document.getElementById('save-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (quotes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <div className="p-8 text-center">
            <Shield className="w-12 h-12 text-shield-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Quotes Available</h2>
            <p className="text-slate-500 mb-6">We couldn't find matching quotes for your criteria. Try adjusting your search.</p>
            <Link to="/calculator">
              <Button variant="shield">Try Again</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-shield flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">InsureFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/calculator">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>New Quote</Button>
            </Link>
            {(isAuthenticated || signedUp) ? (
              <Link to="/dashboard">
                <Button variant="outline" size="sm">My Dashboard</Button>
              </Link>
            ) : (
              <Link to="/marketplace">
                <Button variant="outline" size="sm">Find an Agent</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Results header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-savings-50 text-savings-700 text-sm font-medium mb-4">
            <ShieldCheck className="w-4 h-4" />
            {sortedQuotes.length} quotes found — no account needed
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Your Insurance Quotes</h1>
          <p className="text-slate-500 mt-2">Compare rates side-by-side from top-rated carriers</p>
        </div>

        {/* Summary bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Lowest Monthly Premium</p>
            <p className="text-2xl font-bold text-savings-600">${lowestPremium.toFixed(0)}/mo</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Insurance Type</p>
            <p className="text-lg font-semibold text-slate-900 capitalize">{insuranceType}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Coverage Level</p>
            <p className="text-lg font-semibold text-slate-900 capitalize">{coverageLevel}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">ZIP Code</p>
            <p className="text-lg font-semibold text-slate-900">{zipCode}</p>
          </div>
        </div>

        {/* Quote cards */}
        <div className="space-y-4">
          {sortedQuotes.map(quote => {
            const carrier = quote.carrier_product?.carrier;
            const carrierName = carrier?.name || 'Insurance Carrier';
            const carrierInitials = carrierName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const rating = carrier?.am_best_rating;
            const monthly = parseFloat(quote.monthly_premium);
            const annual = parseFloat(quote.annual_premium);
            const deductible = parseFloat(quote.deductible);

            return (
              <Card
                key={quote.id}
                className={`transition-all duration-200 cursor-pointer ${
                  selectedQuote === quote.id ? 'ring-2 ring-shield-500' : ''
                } ${quote.is_recommended ? 'border-shield-200 bg-shield-50/30' : ''}`}
                onClick={() => setSelectedQuote(quote.id)}
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Carrier info */}
                    <div className="flex items-center gap-4 lg:w-56">
                      <div className="w-14 h-14 rounded-xl bg-shield-100 text-shield-700 flex items-center justify-center text-lg font-bold">
                        {carrierInitials}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{carrierName}</h3>
                        {rating && (
                          <div className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-sm text-slate-600">AM Best: {rating}</span>
                          </div>
                        )}
                      </div>
                      {quote.is_recommended && (
                        <Badge variant="shield" className="ml-auto lg:ml-0">Best Value</Badge>
                      )}
                    </div>

                    {/* Coverage details */}
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Monthly</p>
                        <p className="text-xl font-bold text-slate-900">${monthly.toFixed(0)}</p>
                        <p className="text-xs text-slate-400">${annual.toFixed(0)}/yr</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Deductible</p>
                        <p className="text-xl font-bold text-slate-900">${deductible.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Coverage</p>
                        <p className="text-xl font-bold text-slate-900">{quote.coverage_limit}</p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="lg:w-56">
                      {(quote.features || []).slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                          <Check className="w-3.5 h-3.5 text-savings-500 flex-shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>

                    {/* Action */}
                    <div className="lg:w-40">
                      <Button
                        variant={selectedQuote === quote.id ? 'shield' : 'outline'}
                        className="w-full"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                        onClick={(e) => handleSelectQuote(quote, e)}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Save / Signup section */}
        {!isAuthenticated && (
          <div id="save-section">
            <Card className="mt-10 border-shield-200 bg-gradient-to-r from-shield-50/50 to-blue-50/50">
              <div className="p-8">
                {signedUp ? (
                  /* STEP 3: Account created */
                  <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-savings-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-slate-900 mb-1">You're all set!</h3>
                    <p className="text-slate-500 mb-5">Your account is ready. Track your quotes, apply for policies, and connect with agents.</p>
                    <div className="flex items-center justify-center gap-3">
                      <Link to="/dashboard">
                        <Button variant="shield" rightIcon={<ArrowRight className="w-4 h-4" />}>Go to Dashboard</Button>
                      </Link>
                      <Link to="/marketplace">
                        <Button variant="outline">Find an Agent</Button>
                      </Link>
                    </div>
                  </div>
                ) : saved && !showSignup ? (
                  /* STEP 2a: Contact saved — prompt account creation */
                  <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-savings-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Quotes Saved!</h3>
                    <p className="text-slate-500 mb-5">Create a free account to track your quotes, apply for policies, and get matched with agents.</p>
                    <div className="flex items-center justify-center gap-3">
                      <Button variant="shield" onClick={() => setShowSignup(true)} leftIcon={<User className="w-4 h-4" />}>
                        Create Free Account
                      </Button>
                      <Link to="/marketplace">
                        <Button variant="outline">Maybe Later</Button>
                      </Link>
                    </div>
                  </div>
                ) : saved && showSignup ? (
                  /* STEP 2b: Account creation form */
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1 text-center">Create your free account</h3>
                    <p className="text-sm text-slate-500 mb-4 text-center">Just pick a password — we already have your details from saving your quotes.</p>
                    <div className="max-w-sm mx-auto space-y-4">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600">
                        <p><span className="font-medium">Name:</span> {contact.first_name} {contact.last_name}</p>
                        <p><span className="font-medium">Email:</span> {contact.email}</p>
                      </div>
                      {signupError && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{signupError}</div>}
                      <Input
                        label="Password"
                        type="password"
                        placeholder="Create a password (8+ characters)"
                        value={signupForm.password}
                        onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                        leftIcon={<Lock className="w-4 h-4" />}
                      />
                      <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="Confirm your password"
                        value={signupForm.password_confirmation}
                        onChange={e => setSignupForm(f => ({ ...f, password_confirmation: e.target.value }))}
                        leftIcon={<Lock className="w-4 h-4" />}
                      />
                      <Button
                        variant="shield"
                        className="w-full"
                        onClick={handleSignup}
                        isLoading={signingUp}
                        disabled={!signupForm.password || !signupForm.password_confirmation}
                      >
                        Create Account
                      </Button>
                      <p className="text-xs text-slate-400 text-center">Free forever for consumers. No credit card required.</p>
                    </div>
                  </div>
                ) : !showSaveForm ? (
                  /* STEP 1a: Initial CTA */
                  <div className="text-center">
                    <Mail className="w-10 h-10 text-shield-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Want to save these quotes?</h3>
                    <p className="text-slate-500 mb-5">Get your quotes emailed to you — valid for 30 days. No account required.</p>
                    <Button variant="shield" onClick={() => setShowSaveForm(true)} leftIcon={<Mail className="w-4 h-4" />}>
                      Email My Quotes
                    </Button>
                  </div>
                ) : (
                  /* STEP 1b: Contact form */
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">Enter your details to save these quotes</h3>
                    <div className="max-w-lg mx-auto space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="First Name"
                          placeholder="John"
                          value={contact.first_name}
                          onChange={e => setContact(c => ({ ...c, first_name: e.target.value }))}
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
                      />
                      <Input
                        label="Phone (optional)"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={contact.phone}
                        onChange={e => setContact(c => ({ ...c, phone: e.target.value }))}
                      />
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowSaveForm(false)}>Cancel</Button>
                        <Button
                          variant="shield"
                          className="flex-1"
                          onClick={handleSaveContact}
                          isLoading={saving}
                          disabled={!contact.first_name || !contact.email}
                        >
                          Save My Quotes
                        </Button>
                      </div>
                      <p className="text-xs text-slate-400 text-center">We won't spam you. Your info is only used to save and email your quotes.</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <p className="text-slate-500 mb-4">Want help choosing the right policy? Connect with a licensed agent.</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/marketplace">
              <Button variant="shield" rightIcon={<ArrowRight className="w-4 h-4" />}>Find an Agent</Button>
            </Link>
            <Button variant="outline" leftIcon={<Phone className="w-4 h-4" />}>Call 1-800-INSURE</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
