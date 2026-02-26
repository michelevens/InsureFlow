import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, Badge } from '@/components/ui';
import { CheckCircle2, ArrowRight, Zap, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService } from '@/services/api';
import type { SubscriptionPlan, SubscriptionCurrent } from '@/services/api';

/* ---------- Hardcoded fallback plans (used when API is unavailable) ---------- */
const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: 0, name: 'Consumer', slug: 'consumer-free', description: 'Get quotes and find the right coverage',
    monthly_price: '0.00', annual_price: '0.00', target_role: 'consumer',
    features: ['Instant quotes from 50+ carriers', 'Side-by-side comparison', 'Agent matching', 'Policy tracking', 'Email support'],
    limits: null, is_active: true, sort_order: 0, stripe_price_id_monthly: null, stripe_price_id_annual: null,
  },
  {
    id: 0, name: 'Agent Basic', slug: 'agent-basic', description: 'Essential tools to grow your book',
    monthly_price: '29.00', annual_price: '278.00', target_role: 'agent',
    features: ['Up to 20 leads/month', 'Basic CRM', 'Commission tracking', 'Marketplace listing', 'Email support'],
    limits: null, is_active: true, sort_order: 1, stripe_price_id_monthly: null, stripe_price_id_annual: null,
  },
  {
    id: 0, name: 'Agent Pro', slug: 'agent-pro', description: 'Everything you need to scale',
    monthly_price: '79.00', annual_price: '758.00', target_role: 'agent',
    features: ['Unlimited leads', 'Advanced CRM + pipeline', 'Commission tracking', 'Priority marketplace listing', 'Analytics dashboard', 'Priority support'],
    limits: null, is_active: true, sort_order: 2, stripe_price_id_monthly: null, stripe_price_id_annual: null,
  },
  {
    id: 0, name: 'Agency', slug: 'agency', description: 'Team management and analytics',
    monthly_price: '149.00', annual_price: '1430.00', target_role: 'agency_owner',
    features: ['Up to 5 agents included', 'Team lead distribution', 'Agency analytics', 'White-label reports', 'Bulk lead tools', 'Dedicated support'],
    limits: null, is_active: true, sort_order: 3, stripe_price_id_monthly: null, stripe_price_id_annual: null,
  },
];

/* ---------- Helpers ---------- */
const POPULAR_SLUGS = ['agent-pro'];

function formatPrice(price: string | number): string {
  const n = typeof price === 'string' ? parseFloat(price) : price;
  if (n <= 0) return 'Free';
  return `$${Math.round(n)}`;
}

/* ---------- Component ---------- */
export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSub, setCurrentSub] = useState<SubscriptionCurrent['subscription']>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const canceled = searchParams.get('canceled') === 'true';

  // Fetch plans
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await subscriptionService.getPlans();
        if (mounted && data.length > 0) setPlans(data);
        else if (mounted) setPlans(FALLBACK_PLANS);
      } catch {
        if (mounted) setPlans(FALLBACK_PLANS);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch current subscription if logged in
  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    (async () => {
      try {
        const data = await subscriptionService.current();
        if (mounted) setCurrentSub(data.subscription);
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      window.location.href = '/register';
      return;
    }

    const billingCycle = annual ? 'annual' : 'monthly';
    const priceId = annual ? plan.stripe_price_id_annual : plan.stripe_price_id_monthly;

    if (!priceId) {
      // No Stripe price configured - contact sales
      window.location.href = 'mailto:sales@insurons.com?subject=InsureFlow ' + encodeURIComponent(plan.name) + ' Plan Inquiry';
      return;
    }

    setCheckoutLoading(plan.id);
    try {
      const response = await subscriptionService.checkout(plan.id, billingCycle);
      window.location.href = response.checkout_url;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
      setCheckoutLoading(null);
    }
  };

  const isFree = (plan: SubscriptionPlan) => parseFloat(plan.monthly_price) <= 0 && parseFloat(plan.annual_price) <= 0;
  const isPopular = (plan: SubscriptionPlan) => POPULAR_SLUGS.includes(plan.slug);
  const isCurrentPlan = (plan: SubscriptionPlan) =>
    currentSub && currentSub.status === 'active' && currentSub.subscription_plan_id === plan.id;

  const getPrice = (plan: SubscriptionPlan) => {
    if (isFree(plan)) return 'Free';
    return annual ? formatPrice(plan.annual_price) : formatPrice(plan.monthly_price);
  };

  const getPeriod = (plan: SubscriptionPlan) => {
    if (isFree(plan)) return '';
    return annual ? '/yr' : '/mo';
  };

  const getCta = (plan: SubscriptionPlan) => {
    if (isCurrentPlan(plan)) return 'Current Plan';
    if (isFree(plan)) return 'Get Started Free';
    const priceId = annual ? plan.stripe_price_id_annual : plan.stripe_price_id_monthly;
    if (!priceId) return 'Contact Sales';
    return 'Subscribe';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-100 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Insurons" className="h-16 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard"><Button variant="shield" size="sm">Dashboard</Button></Link>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
                <Link to="/register"><Button variant="shield" size="sm">Get Started</Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Canceled banner */}
        {canceled && (
          <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Checkout was canceled. No charges were made. You can try again below.</p>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">Simple, transparent pricing</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Consumers always use Insurons for free.
          </p>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm ${!annual ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`w-11 h-6 rounded-full relative transition-colors ${annual ? 'bg-shield-500' : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white dark:bg-slate-900 absolute top-0.5 shadow-sm dark:shadow-none transition-all ${annual ? 'right-0.5' : 'left-0.5'}`} />
            </button>
            <span className={`text-sm ${annual ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              Annual <Badge variant="success" className="ml-1">Save 20%</Badge>
            </span>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-shield-500" />
            <span className="ml-3 text-slate-500 dark:text-slate-400">Loading plans...</span>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map(plan => {
              const popular = isPopular(plan);
              const current = isCurrentPlan(plan);
              const free = isFree(plan);
              const cta = getCta(plan);

              return (
                <Card
                  key={plan.slug}
                  className={`flex flex-col ${popular ? 'border-shield-500 ring-1 ring-shield-500 relative' : ''} ${current ? 'bg-shield-50 dark:bg-shield-900/30/50' : ''}`}
                >
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="shield" className="px-3 py-1">
                        <Zap className="w-3.5 h-3.5 mr-1" /> Most Popular
                      </Badge>
                    </div>
                  )}
                  {current && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="success" className="px-3 py-1">Current Plan</Badge>
                    </div>
                  )}
                  <div className="p-6 flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">{getPrice(plan)}</span>
                      {getPeriod(plan) && <span className="text-slate-500 dark:text-slate-400">{getPeriod(plan)}</span>}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{plan.description}</p>

                    <div className="space-y-3">
                      {(plan.features ?? []).map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-savings-500 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    {current ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : free ? (
                      <Link to="/register">
                        <Button
                          variant="outline"
                          className="w-full"
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          {cta}
                        </Button>
                      </Link>
                    ) : cta === 'Contact Sales' ? (
                      <a href={`mailto:sales@insurons.com?subject=InsureFlow ${plan.name} Plan Inquiry`}>
                        <Button
                          variant="outline"
                          className="w-full"
                          rightIcon={<ExternalLink className="w-4 h-4" />}
                        >
                          {cta}
                        </Button>
                      </a>
                    ) : (
                      <Button
                        variant={popular ? 'shield' : 'outline'}
                        className="w-full"
                        rightIcon={checkoutLoading === plan.id ? undefined : <ArrowRight className="w-4 h-4" />}
                        isLoading={checkoutLoading === plan.id}
                        onClick={() => handleSubscribe(plan)}
                      >
                        {cta}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Manage billing link for subscribed users */}
        {isAuthenticated && currentSub && (
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              Need to update payment method, view invoices, or cancel?
            </p>
            <ManageBillingButton />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Manage Billing sub-component ---------- */
function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await subscriptionService.portal();
      window.location.href = response.portal_url;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to open billing portal. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      isLoading={loading}
      rightIcon={<ExternalLink className="w-4 h-4" />}
    >
      Manage Billing
    </Button>
  );
}
