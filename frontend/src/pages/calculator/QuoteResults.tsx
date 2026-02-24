import { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Badge, Input } from '@/components/ui';
import { Shield, ShieldCheck, ArrowRight, ArrowLeft, Check, Phone, Mail, Award, CheckCircle2, User, Lock, ArrowUpDown, LayoutGrid, Table2, ChevronDown } from 'lucide-react';
import { quoteService, authService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import type { EstimateQuote } from '@/services/api/quotes';

type SortOption = 'recommended' | 'price_asc' | 'price_desc' | 'deductible_asc' | 'rating';

function computeBreakdown(monthly: number, annual: number) {
  const policyFee = 5;
  const multiPolicyDiscount = monthly > 120 ? -Math.round(monthly * 0.05) : 0;
  const baseRate = monthly - policyFee - multiPolicyDiscount;
  return {
    baseRate: Math.max(baseRate, 0),
    policyFee,
    multiPolicyDiscount,
    monthlyTotal: monthly,
    annualTotal: annual,
    annualSavings: Math.round(monthly * 12 - annual),
  };
}

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
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [viewMode, setViewMode] = useState<'cards' | 'compare'>('cards');
  const [expandedQuote, setExpandedQuote] = useState<number | null>(null);

  // Try location.state first, fall back to localStorage (survives page refresh)
  const stateData = useMemo(() => {
    if (location.state?.quotes?.length) return location.state;
    try {
      const raw = localStorage.getItem('insurons_quote_results');
      if (raw) {
        const parsed = JSON.parse(raw);
        // Expire after 24 hours
        if (parsed.savedAt && Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000) return parsed;
        localStorage.removeItem('insurons_quote_results');
      }
    } catch { /* ignore */ }
    return null;
  }, [location.state]);

  const quotes: EstimateQuote[] = stateData?.quotes || [];
  const quoteRequestId: number = stateData?.quoteRequestId;
  const insuranceType: string = stateData?.insuranceType || 'auto';
  const coverageLevel: string = stateData?.coverageLevel || 'standard';
  const zipCode: string = stateData?.zipCode || '';

  const sortedQuotes = useMemo(() => [...quotes].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return parseFloat(a.monthly_premium) - parseFloat(b.monthly_premium);
      case 'price_desc':
        return parseFloat(b.monthly_premium) - parseFloat(a.monthly_premium);
      case 'deductible_asc':
        return parseFloat(a.deductible) - parseFloat(b.deductible);
      case 'rating': {
        const rA = a.carrier_product?.carrier?.am_best_rating || 'Z';
        const rB = b.carrier_product?.carrier?.am_best_rating || 'Z';
        return rA.localeCompare(rB);
      }
      default: // recommended
        if (a.is_recommended && !b.is_recommended) return -1;
        if (!a.is_recommended && b.is_recommended) return 1;
        return parseFloat(a.monthly_premium) - parseFloat(b.monthly_premium);
    }
  }), [quotes, sortBy]);

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
            <img src="/logo.png" alt="Insurons" className="h-12 w-auto" />
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

        {/* Sort controls + view toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">{sortedQuotes.length} quote{sortedQuotes.length !== 1 ? 's' : ''}</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 ${viewMode === 'cards' ? 'bg-shield-100 text-shield-700' : 'text-slate-400 hover:text-slate-600'}`}
                title="Card view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('compare')}
                className={`p-1.5 ${viewMode === 'compare' ? 'bg-shield-100 text-shield-700' : 'text-slate-400 hover:text-slate-600'}`}
                title="Comparison table"
              >
                <Table2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-shield-500"
              >
                <option value="recommended">Best Match</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="deductible_asc">Lowest Deductible</option>
                <option value="rating">Carrier Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Comparison table view */}
        {viewMode === 'compare' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left p-4 font-semibold text-slate-700 sticky left-0 bg-white min-w-[140px]">Carrier</th>
                  {sortedQuotes.map(q => {
                    const c = q.carrier_product?.carrier;
                    return (
                      <th key={q.id} className={`p-4 text-center min-w-[150px] ${q.is_recommended ? 'bg-shield-50/50' : ''}`}>
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold text-slate-900">{c?.name || 'Carrier'}</span>
                          {q.is_recommended && <Badge variant="shield" className="text-xs">Best Value</Badge>}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-50">
                  <td className="p-4 font-medium text-slate-700 sticky left-0 bg-white">Monthly Premium</td>
                  {sortedQuotes.map(q => (
                    <td key={q.id} className={`p-4 text-center font-bold text-lg ${q.is_recommended ? 'bg-shield-50/50 text-shield-700' : 'text-slate-900'}`}>
                      ${parseFloat(q.monthly_premium).toFixed(0)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-50">
                  <td className="p-4 font-medium text-slate-700 sticky left-0 bg-white">Annual Premium</td>
                  {sortedQuotes.map(q => (
                    <td key={q.id} className={`p-4 text-center text-slate-600 ${q.is_recommended ? 'bg-shield-50/50' : ''}`}>
                      ${parseFloat(q.annual_premium).toFixed(0)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-50">
                  <td className="p-4 font-medium text-slate-700 sticky left-0 bg-white">Deductible</td>
                  {sortedQuotes.map(q => (
                    <td key={q.id} className={`p-4 text-center text-slate-600 ${q.is_recommended ? 'bg-shield-50/50' : ''}`}>
                      ${parseFloat(q.deductible).toFixed(0)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-50">
                  <td className="p-4 font-medium text-slate-700 sticky left-0 bg-white">Coverage Limit</td>
                  {sortedQuotes.map(q => (
                    <td key={q.id} className={`p-4 text-center text-slate-600 ${q.is_recommended ? 'bg-shield-50/50' : ''}`}>
                      {q.coverage_limit}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-50">
                  <td className="p-4 font-medium text-slate-700 sticky left-0 bg-white">AM Best Rating</td>
                  {sortedQuotes.map(q => (
                    <td key={q.id} className={`p-4 text-center ${q.is_recommended ? 'bg-shield-50/50' : ''}`}>
                      <div className="flex items-center justify-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-medium text-slate-700">{q.carrier_product?.carrier?.am_best_rating || '—'}</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-50">
                  <td className="p-4 font-medium text-slate-700 sticky left-0 bg-white align-top">Features</td>
                  {sortedQuotes.map(q => (
                    <td key={q.id} className={`p-4 ${q.is_recommended ? 'bg-shield-50/50' : ''}`}>
                      <div className="space-y-1">
                        {(q.features || []).map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Check className="w-3 h-3 text-savings-500 flex-shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 sticky left-0 bg-white" />
                  {sortedQuotes.map(q => (
                    <td key={q.id} className={`p-4 text-center ${q.is_recommended ? 'bg-shield-50/50' : ''}`}>
                      <Button
                        variant={selectedQuote === q.id ? 'shield' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={(e) => handleSelectQuote(q, e)}
                      >
                        Select
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Quote cards (default view) */}
        {viewMode === 'cards' && (
          <div className="space-y-4">
            {sortedQuotes.map(quote => {
              const carrier = quote.carrier_product?.carrier;
              const carrierName = carrier?.name || 'Insurance Carrier';
              const carrierInitials = carrierName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const carrierLogo = carrier?.logo;
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
                        {carrierLogo ? (
                          <img src={carrierLogo} alt={carrierName} className="w-14 h-14 rounded-xl object-contain bg-white border border-slate-100 p-1" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-shield-100 text-shield-700 flex items-center justify-center text-lg font-bold">
                            {carrierInitials}
                          </div>
                        )}
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

                    {/* Premium breakdown toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedQuote(expandedQuote === quote.id ? null : quote.id); }}
                      className="mt-4 flex items-center gap-1 text-xs text-shield-600 hover:text-shield-700 font-medium"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedQuote === quote.id ? 'rotate-180' : ''}`} />
                      Premium Breakdown
                    </button>

                    {/* Expanded breakdown */}
                    {expandedQuote === quote.id && (() => {
                      const bd = computeBreakdown(monthly, annual);
                      return (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500 text-xs">Base Rate</p>
                              <p className="font-semibold text-slate-900">${bd.baseRate.toFixed(0)}/mo</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs">Policy Fee</p>
                              <p className="font-semibold text-slate-900">+${bd.policyFee}/mo</p>
                            </div>
                            {bd.multiPolicyDiscount < 0 && (
                              <div>
                                <p className="text-slate-500 text-xs">Multi-Policy Discount</p>
                                <p className="font-semibold text-savings-600">{bd.multiPolicyDiscount}/mo</p>
                              </div>
                            )}
                            <div>
                              <p className="text-slate-500 text-xs">Monthly Total</p>
                              <p className="font-bold text-slate-900">${bd.monthlyTotal.toFixed(0)}/mo</p>
                            </div>
                          </div>
                          {bd.annualSavings > 0 && (
                            <p className="mt-2 text-xs text-savings-600 font-medium">
                              Pay annually and save ${bd.annualSavings}/yr ({Math.round(bd.annualSavings / (monthly * 12) * 100)}% off)
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

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
