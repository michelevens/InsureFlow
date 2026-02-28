import { useState, useEffect } from 'react';
import { Card, Badge } from '@/components/ui';
import { TrendingUp, Package, DollarSign, Clock, BarChart3, Loader2, ArrowUpRight, Percent } from 'lucide-react';
import { marketplaceService } from '@/services/api/marketplace';
import type { SellerAnalyticsResponse } from '@/services/api/marketplace';
import { toast } from 'sonner';

export default function SellerAnalytics() {
  const [data, setData] = useState<SellerAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await marketplaceService.sellerAnalytics();
        setData(res);
      } catch {
        toast.error('Failed to load seller analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Seller Analytics</h1>
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 mt-2">Loading analytics...</p>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { overview, revenue, balance, by_type, monthly_trend } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Seller Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Track your marketplace listing performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Package className="w-5 h-5" />}
          iconColor="text-shield-500 bg-shield-50 dark:bg-shield-900/30"
          label="Total Listings"
          value={overview.total_listings}
          sub={`${overview.active_listings} active`}
        />
        <KpiCard
          icon={<ArrowUpRight className="w-5 h-5" />}
          iconColor="text-savings-500 bg-savings-50 dark:bg-savings-900/30"
          label="Sold"
          value={overview.sold_listings}
          sub={`${overview.expired_listings} expired`}
        />
        <KpiCard
          icon={<Percent className="w-5 h-5" />}
          iconColor="text-amber-500 bg-amber-50 dark:bg-amber-900/30"
          label="Conversion Rate"
          value={`${overview.conversion_rate}%`}
          sub="Listed → Sold"
        />
        <KpiCard
          icon={<Clock className="w-5 h-5" />}
          iconColor="text-purple-500 bg-purple-50 dark:bg-purple-900/30"
          label="Avg Days to Sell"
          value={overview.avg_days_to_sell}
          sub="Time to close"
        />
      </div>

      {/* Revenue + Balance */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-savings-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revenue</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">This Month</span>
              <span className="text-sm font-semibold text-savings-600 dark:text-savings-400">${revenue.this_month.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Avg Sale Price</span>
              <span className="text-sm font-semibold text-savings-600 dark:text-savings-400">${revenue.avg_sale_price.toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">All-Time Revenue</span>
                <span className="text-lg font-bold text-savings-600 dark:text-savings-400">${revenue.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-shield-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Balance</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Available</span>
              <span className="text-sm font-bold text-savings-600 dark:text-savings-400">${balance.available.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Pending</span>
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">${balance.pending.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Lifetime Paid Out</span>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">${balance.lifetime_paid.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue by Type */}
      {by_type.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-shield-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revenue by Insurance Type</h2>
          </div>
          <div className="space-y-3">
            {by_type.map((item) => {
              const maxRevenue = Math.max(...by_type.map(t => t.revenue));
              return (
                <div key={item.type} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-24 capitalize">{item.type.replace(/_/g, ' ')}</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-shield-500"
                      style={{ width: `${maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-right w-28">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">${item.revenue.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 ml-1">({item.sales})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Monthly Trend */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-shield-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">6-Month Trend</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Month</th>
                <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Listed</th>
                <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Sold</th>
                <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {monthly_trend.map((m) => (
                <tr key={m.month} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-200">{m.month}</td>
                  <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300">{m.listed}</td>
                  <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300">{m.sold}</td>
                  <td className="py-2 px-3 text-right font-medium text-savings-600 dark:text-savings-400">${m.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Credit Cost Reference */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Credit Costs by Lead Type</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Buyers pay different credit amounts based on lead type. Higher-value leads cost more credits.</p>
        <div className="flex flex-wrap gap-2">
          {[
            { type: 'Auto', cost: 1 }, { type: 'Home', cost: 1 }, { type: 'Renters', cost: 1 },
            { type: 'Health', cost: 2 }, { type: 'Life', cost: 2 }, { type: 'Disability', cost: 2 }, { type: 'LTC', cost: 2 },
            { type: 'Commercial', cost: 3 }, { type: 'Workers Comp', cost: 3 }, { type: 'Cyber', cost: 3 },
          ].map(({ type, cost }) => (
            <Badge key={type} variant={cost === 1 ? 'success' : cost === 2 ? 'warning' : 'danger'} className="text-xs px-3 py-1.5">
              {type}: {cost} credit{cost > 1 ? 's' : ''}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}

function KpiCard({ icon, iconColor, label, value, sub }: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
    </Card>
  );
}
