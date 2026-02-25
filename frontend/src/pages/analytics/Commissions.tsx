import { useState, useEffect } from 'react';
import { Card, Badge, Button, Select, useConfirm } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { payoutService, type Commission, type CommissionPayout, type ConnectStatus } from '@/services/api/payouts';
import {
  DollarSign, TrendingUp, Calendar, Download, CreditCard,
  CheckCircle, AlertCircle, ExternalLink, Banknote, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' }> = {
  paid: { label: 'Paid', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  completed: { label: 'Completed', variant: 'success' },
  processing: { label: 'Processing', variant: 'info' },
  failed: { label: 'Failed', variant: 'danger' },
};

export default function Commissions() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<CommissionPayout[]>([]);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'commissions' | 'payouts'>('commissions');
  const [totalEarned, setTotalEarned] = useState('0.00');
  const [totalPaid, setTotalPaid] = useState('0.00');
  const [totalPending, setTotalPending] = useState('0.00');

  const isAgent = user?.role === 'agent' || user?.role === 'agency_owner';

  useEffect(() => {
    const loadData = async () => {
      try {
        const [commRes, payoutRes] = await Promise.all([
          payoutService.getCommissions({ status: statusFilter || undefined }),
          isAgent ? payoutService.getPayoutHistory() : Promise.resolve({ data: [] as CommissionPayout[], last_page: 1, current_page: 1, total: 0 }),
        ]);
        setCommissions(commRes.commissions || []);
        setTotalEarned(commRes.summary?.total_earned || '0.00');
        setTotalPaid(commRes.summary?.total_paid || '0.00');
        setTotalPending(commRes.summary?.total_pending || '0.00');
        setPayouts(payoutRes.data || []);
      } catch {
        toast.error('Failed to load commissions');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [statusFilter, isAgent]);

  // Load Stripe Connect status for agents
  useEffect(() => {
    if (!isAgent) return;
    payoutService.getConnectStatus()
      .then(setConnectStatus)
      .catch(() => { /* non-critical: Stripe status check */ });
  }, [isAgent]);

  const handleConnectStripe = async () => {
    setConnectLoading(true);
    try {
      const res = await payoutService.createConnectAccount();
      window.location.href = res.url;
    } catch {
      setConnectLoading(false);
    }
  };

  const handleRefreshConnect = async () => {
    setConnectLoading(true);
    try {
      const res = await payoutService.refreshConnectLink();
      window.location.href = res.url;
    } catch {
      setConnectLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    const ok = await confirm({ title: 'Request Payout', message: 'Request payout for all pending commissions?', confirmLabel: 'Request Payout', variant: 'info' });
    if (!ok) return;
    setPayoutLoading(true);
    try {
      await payoutService.requestPayout();
      // Reload data
      const [commRes, payoutRes] = await Promise.all([
        payoutService.getCommissions({ status: statusFilter || undefined }),
        payoutService.getPayoutHistory(),
      ]);
      setCommissions(commRes.commissions || []);
      setTotalEarned(commRes.summary?.total_earned || '0.00');
      setTotalPaid(commRes.summary?.total_paid || '0.00');
      setTotalPending(commRes.summary?.total_pending || '0.00');
      setPayouts(payoutRes.data || []);
    } catch {
      // silent
    } finally {
      setPayoutLoading(false);
    }
  };

  const pendingAmount = parseFloat(totalPending);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-teal-600" />
            Commissions
          </h1>
          <p className="text-slate-500 mt-1">Track your earnings and commission payouts</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'paid', label: 'Paid' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          />
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Stripe Connect Banner (agents only) */}
      {isAgent && connectStatus && !connectStatus.stripe_onboarded && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-900">
                  {connectStatus.stripe_account_id ? 'Complete Stripe Onboarding' : 'Connect Your Bank Account'}
                </h3>
                <p className="text-sm text-indigo-700">
                  {connectStatus.stripe_account_id
                    ? 'Finish setting up your Stripe account to receive commission payouts.'
                    : 'Set up Stripe Connect to receive commission payouts directly to your bank account.'}
                </p>
              </div>
            </div>
            <Button
              variant="shield"
              onClick={connectStatus.stripe_account_id ? handleRefreshConnect : handleConnectStripe}
              isLoading={connectLoading}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {connectStatus.stripe_account_id ? 'Continue Setup' : 'Connect Stripe'}
            </Button>
          </div>
        </div>
      )}

      {/* Connected status */}
      {isAgent && connectStatus?.stripe_onboarded && (
        <div className="bg-savings-50 border border-savings-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-savings-600" />
            <div>
              <p className="text-sm font-medium text-savings-900">Stripe Connected</p>
              <p className="text-xs text-savings-700">
                Account {connectStatus.stripe_account_id?.slice(-8)} — Payouts enabled
              </p>
            </div>
          </div>
          {pendingAmount > 0 && (
            <Button variant="shield" onClick={handleRequestPayout} isLoading={payoutLoading}>
              <Banknote className="w-4 h-4 mr-2" />
              Request Payout (${pendingAmount.toFixed(2)})
            </Button>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Earned</p>
              <p className="text-3xl font-bold text-slate-900">
                ${parseFloat(totalEarned).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-shield-100 text-shield-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Paid Out</p>
              <p className="text-3xl font-bold text-savings-600">
                ${parseFloat(totalPaid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-savings-100 text-savings-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-3xl font-bold text-amber-600">
                ${parseFloat(totalPending).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      {isAgent && (
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'commissions'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Commissions
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'payouts'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Payout History
          </button>
        </div>
      )}

      {/* Commission table */}
      {activeTab === 'commissions' && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Commission History</h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
              </div>
            ) : commissions.length === 0 ? (
              <div className="py-12 text-center">
                <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No commissions yet</p>
                <p className="text-sm text-slate-400 mt-1">Commissions will appear here when policies are bound</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Policy</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 hidden sm:table-cell">Client</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 hidden md:table-cell">Carrier</th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Premium</th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Rate</th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Commission</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {commissions.map(c => {
                      const config = statusConfig[c.status] || statusConfig.pending;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-3 font-mono text-sm text-shield-600">
                            {c.policy?.policy_number || `#${c.policy_id}`}
                          </td>
                          <td className="py-3 text-sm font-medium text-slate-900 hidden sm:table-cell">
                            {c.policy?.user?.name || '—'}
                          </td>
                          <td className="py-3 text-sm text-slate-700 hidden md:table-cell">
                            {c.carrier_name}
                          </td>
                          <td className="py-3 text-right text-sm text-slate-700">
                            ${parseFloat(c.premium_amount).toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-sm text-slate-700">
                            {c.commission_rate}%
                          </td>
                          <td className="py-3 text-right text-sm font-medium text-savings-600">
                            ${parseFloat(c.commission_amount).toFixed(2)}
                          </td>
                          <td className="py-3">
                            <Badge variant={config.variant}>{config.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Payout History table */}
      {activeTab === 'payouts' && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Payout History</h2>
            {payouts.length === 0 ? (
              <div className="py-12 text-center">
                <Banknote className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No payouts yet</p>
                <p className="text-sm text-slate-400 mt-1">Request a payout when you have pending commissions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Date</th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Amount</th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 hidden sm:table-cell">Platform Fee</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 hidden md:table-cell">Period</th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payouts.map(p => {
                      const config = statusConfig[p.status] || statusConfig.pending;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3 text-sm text-slate-700">
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-right text-sm font-medium text-savings-600">
                            ${parseFloat(p.amount).toFixed(2)}
                          </td>
                          <td className="py-3 text-right text-sm text-slate-500 hidden sm:table-cell">
                            ${parseFloat(p.platform_fee).toFixed(2)}
                          </td>
                          <td className="py-3 text-sm text-slate-500 hidden md:table-cell">
                            {p.period_start && p.period_end
                              ? `${p.period_start} — ${p.period_end}`
                              : '—'}
                          </td>
                          <td className="py-3">
                            <Badge variant={config.variant}>{config.label}</Badge>
                            {p.status === 'failed' && p.failure_reason && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 text-red-500" />
                                <span className="text-xs text-red-600">{p.failure_reason}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
