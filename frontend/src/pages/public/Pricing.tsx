import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, Badge } from '@/components/ui';
import { CheckCircle2, ArrowRight, Zap, Loader2, AlertCircle, ExternalLink, X, ChevronDown, ShoppingCart, Shield, Users, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService } from '@/services/api';
import type { SubscriptionPlan, SubscriptionCurrent } from '@/services/api';

/* ---------- Hardcoded fallback plans ---------- */
const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: 0, name: 'Consumer Free', slug: 'consumer-free', description: 'Get quotes and find the right coverage — always free.',
    monthly_price: '0.00', annual_price: '0.00', target_role: 'consumer',
    features: ['Instant quotes from 50+ carriers', 'Side-by-side comparison', 'Smart agent matching', 'Policy tracking dashboard', 'Email support'],
    limits: null, is_active: true, sort_order: 1, stripe_price_id_monthly: null, stripe_price_id_annual: null,
    lead_credits_per_month: 0, can_access_marketplace: false,
  },
  {
    id: 0, name: 'Agent Starter', slug: 'agent-starter', description: 'Essential tools for independent agents.',
    monthly_price: '29.00', annual_price: '278.40', target_role: 'agent',
    features: ['Up to 50 leads/month', 'Basic CRM & pipeline', 'Commission tracking', 'Profile listing on marketplace', 'Quote comparison tools', 'Email support'],
    limits: null, is_active: true, sort_order: 2, stripe_price_id_monthly: null, stripe_price_id_annual: null,
    lead_credits_per_month: 0, can_access_marketplace: false,
  },
  {
    id: 0, name: 'Agent Pro', slug: 'agent-pro', description: 'Full-featured toolkit for high-volume agents.',
    monthly_price: '79.00', annual_price: '758.40', target_role: 'agent',
    features: ['Unlimited leads', 'Advanced CRM & pipeline', 'Commission tracking & analytics', 'Priority marketplace listing', 'Analytics dashboard', 'Lead marketplace (10 credits/mo)', 'Review management', 'Email & chat support'],
    limits: null, is_active: true, sort_order: 3, stripe_price_id_monthly: null, stripe_price_id_annual: null,
    lead_credits_per_month: 10, can_access_marketplace: true,
  },
  {
    id: 0, name: 'Agent Pro Plus', slug: 'agent-pro-plus', description: 'Premium agent tools with API access and white-label.',
    monthly_price: '129.00', annual_price: '1238.40', target_role: 'agent',
    features: ['Everything in Agent Pro', 'API access & integrations', 'Priority support (4hr SLA)', 'White-label proposals', 'Lead marketplace (25 credits/mo)', 'Custom workflow automations', 'Advanced analytics & reports', 'Dedicated onboarding'],
    limits: null, is_active: true, sort_order: 4, stripe_price_id_monthly: null, stripe_price_id_annual: null,
    lead_credits_per_month: 25, can_access_marketplace: true,
  },
  {
    id: 0, name: 'Agency Standard', slug: 'agency-standard', description: 'Team management for growing agencies.',
    monthly_price: '149.00', annual_price: '1430.40', target_role: 'agency_owner',
    features: ['5 agent seats included', 'Team lead distribution', 'Agency-wide analytics', 'Commission reports', 'CRM for all agents', 'Lead marketplace (50 credits/mo)', 'Branded intake links', 'Email & chat support'],
    limits: null, is_active: true, sort_order: 5, stripe_price_id_monthly: null, stripe_price_id_annual: null,
    lead_credits_per_month: 50, can_access_marketplace: true,
  },
  {
    id: 0, name: 'Agency Enterprise', slug: 'agency-enterprise', description: 'Unlimited seats, SSO, and enterprise controls.',
    monthly_price: '299.00', annual_price: '2870.40', target_role: 'agency_owner',
    features: ['Unlimited agent seats', 'Everything in Agency Standard', 'SSO / SAML integration', 'Dedicated account manager', 'Priority support (2hr SLA)', 'Lead marketplace (200 credits/mo)', 'Custom workflow automations', 'White-label proposals', 'API access & webhooks', 'SLA guarantee (99.9% uptime)'],
    limits: null, is_active: true, sort_order: 6, stripe_price_id_monthly: null, stripe_price_id_annual: null,
    lead_credits_per_month: 200, can_access_marketplace: true,
  },
  {
    id: 0, name: 'Carrier Partner', slug: 'carrier-partner', description: 'Product distribution and agent network.',
    monthly_price: '499.00', annual_price: '4790.40', target_role: 'carrier',
    features: ['Unlimited product listings', 'Agent network access', 'Production reports & analytics', 'Application management', 'API access & webhooks', 'Lead marketplace (unlimited)', 'Dedicated account manager', 'Priority support (2hr SLA)', 'Custom integrations'],
    limits: null, is_active: true, sort_order: 7, stripe_price_id_monthly: null, stripe_price_id_annual: null,
    lead_credits_per_month: -1, can_access_marketplace: true,
  },
];

/* ---------- Helpers ---------- */
const POPULAR_SLUGS = ['agent-pro'];

type RoleTab = 'all' | 'agent' | 'agency_owner' | 'carrier';

const ROLE_TABS: { key: RoleTab; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All Plans', icon: null },
  { key: 'agent', label: 'Agents', icon: <Shield className="w-4 h-4" /> },
  { key: 'agency_owner', label: 'Agencies', icon: <Users className="w-4 h-4" /> },
  { key: 'carrier', label: 'Carriers', icon: <Building2 className="w-4 h-4" /> },
];

function formatPrice(price: string | number): string {
  const n = typeof price === 'string' ? parseFloat(price) : price;
  if (n <= 0) return 'Free';
  return `$${Math.round(n)}`;
}

const COMPARISON_FEATURES = [
  { label: 'Lead pipeline', slugs: ['agent-starter', 'agent-pro', 'agent-pro-plus', 'agency-standard', 'agency-enterprise'] },
  { label: 'CRM & pipeline', slugs: ['agent-starter', 'agent-pro', 'agent-pro-plus', 'agency-standard', 'agency-enterprise'] },
  { label: 'Commission tracking', slugs: ['agent-starter', 'agent-pro', 'agent-pro-plus', 'agency-standard', 'agency-enterprise'] },
  { label: 'Analytics dashboard', slugs: ['agent-pro', 'agent-pro-plus', 'agency-standard', 'agency-enterprise', 'carrier-partner'] },
  { label: 'Lead marketplace', slugs: ['agent-pro', 'agent-pro-plus', 'agency-standard', 'agency-enterprise', 'carrier-partner'] },
  { label: 'API access', slugs: ['agent-pro-plus', 'agency-enterprise', 'carrier-partner'] },
  { label: 'Priority support', slugs: ['agent-pro-plus', 'agency-enterprise', 'carrier-partner'] },
  { label: 'White-label proposals', slugs: ['agent-pro-plus', 'agency-enterprise'] },
  { label: 'Team management', slugs: ['agency-standard', 'agency-enterprise'] },
  { label: 'SSO / SAML', slugs: ['agency-enterprise'] },
  { label: 'Custom workflows', slugs: ['agent-pro-plus', 'agency-enterprise'] },
  { label: 'SLA guarantee', slugs: ['agency-enterprise', 'carrier-partner'] },
];

const FAQ_ITEMS = [
  { q: 'Can I switch plans at any time?', a: 'Yes. Upgrade instantly and your billing is prorated. Downgrade takes effect at the end of your current billing cycle.' },
  { q: 'How do marketplace credits work?', a: 'Each plan includes monthly credits for purchasing leads on the marketplace. Credits reset at the start of each billing cycle. Unused credits do not roll over.' },
  { q: 'What happens when I cancel?', a: 'Your plan remains active until the end of your billing period. After that, you\'ll revert to free-tier access. Your data is preserved for 90 days.' },
  { q: 'Can I add extra team members?', a: 'Agency plans include seats. Need more? Contact our sales team for custom seat pricing at $19/seat/month.' },
  { q: 'Is there a free trial?', a: 'Consumers always use Insurons for free. Agent and Agency plans can start with a 14-day free trial — no credit card required.' },
  { q: 'Do you offer discounts for annual billing?', a: 'Yes! Annual plans save you 20% compared to monthly billing.' },
];

/* ---------- Component ---------- */
export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSub, setCurrentSub] = useState<SubscriptionCurrent['subscription']>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);
  const [roleTab, setRoleTab] = useState<RoleTab>('all');
  const [showComparison, setShowComparison] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const canceled = searchParams.get('canceled') === 'true';

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

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    (async () => {
      try {
        const data = await subscriptionService.current();
        if (mounted) setCurrentSub(data.subscription);
      } catch { /* ignore */ }
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

  // Filter plans by role tab (consumer shown as banner, not in grid)
  const paidPlans = plans.filter(p => !isFree(p));
  const consumerPlan = plans.find(p => p.target_role === 'consumer');
  const filteredPlans = roleTab === 'all' ? paidPlans : paidPlans.filter(p => p.target_role === roleTab);
  const comparisonPlans = paidPlans.filter(p => p.target_role !== 'carrier');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Insurons" className="h-16 w-auto" />
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

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Canceled banner */}
        {canceled && (
          <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Checkout was canceled. No charges were made. You can try again below.</p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">Simple, transparent pricing</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Scale as you grow — no hidden fees.
          </p>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm ${!annual ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`w-11 h-6 rounded-full relative transition-colors ${annual ? 'bg-shield-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm transition-all ${annual ? 'right-0.5' : 'left-0.5'}`} />
            </button>
            <span className={`text-sm ${annual ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              Annual <Badge variant="success" className="ml-1">Save 20%</Badge>
            </span>
          </div>
        </div>

        {/* Consumer free callout */}
        {consumerPlan && (
          <div className="mb-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Consumers — Always Free</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Get instant quotes from 50+ carriers, compare side-by-side, and find the right agent — no account needed.
              </p>
            </div>
            {isCurrentPlan(consumerPlan) ? (
              <Button variant="outline" disabled>Current Plan</Button>
            ) : (
              <Link to="/register"><Button variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>Get Started Free</Button></Link>
            )}
          </div>
        )}

        {/* Role filter tabs */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {ROLE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setRoleTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                roleTab === tab.key
                  ? 'bg-shield-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-shield-500" />
            <span className="ml-3 text-slate-500 dark:text-slate-400">Loading plans...</span>
          </div>
        ) : (
          <div className={`grid gap-6 ${filteredPlans.length <= 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
            {filteredPlans.map(plan => {
              const popular = isPopular(plan);
              const current = isCurrentPlan(plan);
              const cta = getCta(plan);

              return (
                <Card
                  key={plan.slug}
                  className={`flex flex-col ${popular ? 'border-shield-500 ring-1 ring-shield-500 relative' : ''} ${current ? 'bg-shield-50/50 dark:bg-shield-900/20' : ''}`}
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
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize text-xs">{plan.target_role.replace('_', ' ')}</Badge>
                      {plan.can_access_marketplace && (
                        <Badge variant="default" className="text-xs"><ShoppingCart className="w-3 h-3 mr-1" />Marketplace</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">{getPrice(plan)}</span>
                      {getPeriod(plan) && <span className="text-slate-500 dark:text-slate-400">{getPeriod(plan)}</span>}
                    </div>
                    {!isFree(plan) && annual && (
                      <p className="text-xs text-savings-600 dark:text-savings-400 mb-3">
                        Save ${Math.round(parseFloat(plan.monthly_price) * 12 - parseFloat(plan.annual_price))}/yr
                      </p>
                    )}
                    {!isFree(plan) && !annual && parseFloat(plan.annual_price) > 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                        or {formatPrice(plan.annual_price)}/yr (save 20%)
                      </p>
                    )}
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{plan.description}</p>

                    {plan.lead_credits_per_month !== 0 && (
                      <div className="mb-4 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-300 font-medium">
                        <ShoppingCart className="w-3 h-3 inline mr-1" />
                        {plan.lead_credits_per_month === -1 ? 'Unlimited' : plan.lead_credits_per_month} marketplace credit{plan.lead_credits_per_month !== 1 ? 's' : ''}/mo
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {(plan.features ?? []).map((feature, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-savings-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    {current ? (
                      <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                    ) : cta === 'Contact Sales' ? (
                      <a href={`mailto:sales@insurons.com?subject=Insurons ${plan.name} Plan Inquiry`}>
                        <Button variant="outline" className="w-full" rightIcon={<ExternalLink className="w-4 h-4" />}>{cta}</Button>
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

        {/* Manage billing link */}
        {isAuthenticated && currentSub && (
          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Need to update payment method, view invoices, or cancel?</p>
            <ManageBillingButton />
          </div>
        )}

        {/* Feature Comparison Table */}
        <div className="mt-20">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Compare Features</h2>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showComparison ? 'rotate-180' : ''}`} />
          </button>

          {showComparison && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Feature</th>
                    {comparisonPlans.map(p => (
                      <th key={p.slug} className="text-center p-3 font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        {p.name.replace('Agent ', '').replace('Agency ', '')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">Price</td>
                    {comparisonPlans.map(p => (
                      <td key={p.slug} className="text-center p-3 font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800">
                        {formatPrice(p.monthly_price)}/mo
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">Marketplace credits</td>
                    {comparisonPlans.map(p => (
                      <td key={p.slug} className="text-center p-3 border-b border-slate-100 dark:border-slate-800">
                        {p.lead_credits_per_month === -1 ? '∞' : p.lead_credits_per_month === 0 ? <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /> : p.lead_credits_per_month}
                      </td>
                    ))}
                  </tr>
                  {COMPARISON_FEATURES.map(feat => (
                    <tr key={feat.label}>
                      <td className="p-3 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">{feat.label}</td>
                      {comparisonPlans.map(p => (
                        <td key={p.slug} className="text-center p-3 border-b border-slate-100 dark:border-slate-800">
                          {feat.slugs.includes(p.slug) ? (
                            <CheckCircle2 className="w-4 h-4 text-savings-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add-ons */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">Add-ons</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Extra Seats', price: '$19/seat/mo', desc: 'Add team members beyond your plan\'s included seats.' },
              { name: 'API Access', price: '$49/mo', desc: 'Build custom integrations with the Insurons API. Included in Pro Plus and Enterprise.' },
              { name: 'Priority Support', price: '$29/mo', desc: 'Get 4-hour SLA response times from our support team. Included in Pro Plus and Enterprise.' },
            ].map(addon => (
              <Card key={addon.name} className="p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{addon.name}</h3>
                <p className="text-lg font-bold text-shield-600 dark:text-shield-400 mb-2">{addon.price}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{addon.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="font-medium text-slate-900 dark:text-white">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-slate-500 dark:text-slate-400">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">Need a custom plan? We'd love to help.</p>
          <a href="mailto:sales@insurons.com?subject=Custom Plan Inquiry">
            <Button variant="outline" rightIcon={<ExternalLink className="w-4 h-4" />}>Contact Sales</Button>
          </a>
        </div>
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
    <Button variant="ghost" size="sm" onClick={handleClick} isLoading={loading} rightIcon={<ExternalLink className="w-4 h-4" />}>
      Manage Billing
    </Button>
  );
}
