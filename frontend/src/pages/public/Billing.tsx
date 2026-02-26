import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, Badge, Button } from '@/components/ui';
import { CreditCard, ShoppingCart, ExternalLink, CheckCircle2, AlertCircle, Loader2, ArrowRight, XCircle } from 'lucide-react';
import { subscriptionService } from '@/services/api';
import type { BillingOverview } from '@/services/api';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui';

export default function Billing() {
  const [data, setData] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const confirm = useConfirm();

  const success = searchParams.get('success') === 'true';

  useEffect(() => {
    loadBilling();
  }, []);

  const loadBilling = async () => {
    setLoading(true);
    try {
      const res = await subscriptionService.billingOverview();
      setData(res);
    } catch {
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setActionLoading('portal');
    try {
      const res = await subscriptionService.portal();
      window.location.href = res.portal_url;
    } catch {
      toast.error('Unable to open billing portal. You may not have an active subscription.');
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    const ok = await confirm({
      title: 'Cancel Subscription',
      message: 'Your plan will remain active until the end of your current billing period. After that, you\'ll revert to free-tier access.',
      confirmLabel: 'Cancel Subscription',
      variant: 'danger',
    });
    if (!ok) return;

    setActionLoading('cancel');
    try {
      await subscriptionService.cancel();
      toast.success('Subscription will cancel at end of billing period');
      loadBilling();
    } catch {
      toast.error('Failed to cancel subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async () => {
    setActionLoading('resume');
    try {
      await subscriptionService.resume();
      toast.success('Subscription resumed');
      loadBilling();
    } catch {
      toast.error('Failed to resume subscription');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Billing</h1>
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 mt-2">Loading billing information...</p>
        </Card>
      </div>
    );
  }

  const sub = data?.subscription;
  const plan = data?.plan;
  const credits = data?.credits;
  const hasSub = sub && sub.status !== 'incomplete';
  const isCanceled = sub?.status === 'canceled';
  const isPastDue = sub?.status === 'past_due';

  const creditPercent = credits && credits.plan_allowance > 0
    ? Math.round((credits.balance / credits.plan_allowance) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Billing</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your subscription and billing</p>
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div className="p-4 bg-savings-50 dark:bg-savings-900/20 border border-savings-200 dark:border-savings-800 rounded-xl flex items-center gap-3 text-savings-800 dark:text-savings-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Payment successful! Your subscription is now active.</p>
        </div>
      )}

      {/* Past due warning */}
      {isPastDue && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-800 dark:text-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Payment past due</p>
            <p className="text-sm">Please update your payment method to keep your subscription active.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handlePortal} isLoading={actionLoading === 'portal'}>
            Update Payment
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-shield-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Current Plan</h2>
          </div>

          {hasSub && plan ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</span>
                <Badge variant={isCanceled ? 'default' : isPastDue ? 'danger' : 'success'}>
                  {isCanceled ? 'Canceling' : isPastDue ? 'Past Due' : 'Active'}
                </Badge>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  ${sub.billing_cycle === 'annual' ? Math.round(parseFloat(plan.annual_price)) : Math.round(parseFloat(plan.monthly_price))}
                </span>
                <span className="text-slate-500 dark:text-slate-400">/{sub.billing_cycle === 'annual' ? 'yr' : 'mo'}</span>
                {sub.billing_cycle === 'annual' && (
                  <Badge variant="success" className="ml-2">Annual (20% off)</Badge>
                )}
              </div>

              {sub.current_period_end && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  {isCanceled ? 'Access until' : 'Next payment'}:{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </p>
              )}

              {isCanceled && sub.canceled_at && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
                  Canceled on {new Date(sub.canceled_at).toLocaleDateString()}. Your access continues until the end of the billing period.
                </p>
              )}

              <div className="flex items-center gap-3 mt-6">
                <Link to="/pricing">
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Change Plan
                  </Button>
                </Link>
                {isCanceled ? (
                  <Button variant="shield" size="sm" onClick={handleResume} isLoading={actionLoading === 'resume'}>
                    Resume Subscription
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={handleCancel} isLoading={actionLoading === 'cancel'}>
                    <XCircle className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Free Plan</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                You're on the free tier. Upgrade for unlimited leads, CRM tools, marketplace access, and more.
              </p>
              <Link to="/pricing">
                <Button variant="shield" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  View Plans
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Marketplace Credits */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Marketplace Credits</h2>
          </div>

          {credits && plan && plan.lead_credits_per_month !== 0 ? (
            <div>
              {plan.lead_credits_per_month === -1 ? (
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-amber-500">∞</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Unlimited credits</p>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{credits.balance}</span>
                    <span className="text-slate-500 dark:text-slate-400">/ {credits.plan_allowance}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-3">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        creditPercent > 50 ? 'bg-savings-500' : creditPercent > 20 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(creditPercent, 100)}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {credits.used} used this period
                  </p>
                </>
              )}

              <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                Credits reset monthly with your billing cycle.
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {plan ? 'Your plan doesn\'t include marketplace credits.' : 'Upgrade to access the lead marketplace.'}
              </p>
              <Link to="/pricing" className="text-xs text-shield-600 dark:text-shield-400 hover:underline mt-2 inline-block">
                Upgrade for marketplace access
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      {hasSub && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Payment & Invoices</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <button
              onClick={handlePortal}
              disabled={actionLoading === 'portal'}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
            >
              <CreditCard className="w-5 h-5 text-shield-500 mb-2" />
              <p className="font-medium text-slate-900 dark:text-white text-sm">Update Payment Method</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Change your card or payment details</p>
            </button>
            <button
              onClick={handlePortal}
              disabled={actionLoading === 'portal'}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
            >
              <ExternalLink className="w-5 h-5 text-shield-500 mb-2" />
              <p className="font-medium text-slate-900 dark:text-white text-sm">View Invoices</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Download receipts and invoices</p>
            </button>
            <button
              onClick={handlePortal}
              disabled={actionLoading === 'portal'}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
            >
              <ExternalLink className="w-5 h-5 text-shield-500 mb-2" />
              <p className="font-medium text-slate-900 dark:text-white text-sm">Billing Portal</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Full billing management via Stripe</p>
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
