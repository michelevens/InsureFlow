import { useState, useEffect } from 'react';
import { Card, Badge } from '@/components/ui';
import { TrendingUp, Users, FileText, DollarSign, Target, BarChart3, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { analyticsService } from '@/services/api';
import type { AgentRoiResponse } from '@/services/api/analytics';
import { toast } from 'sonner';

const PIPELINE_COLORS: Record<string, string> = {
  new: 'bg-shield-500',
  contacted: 'bg-blue-500',
  quoted: 'bg-amber-500',
  applied: 'bg-purple-500',
  won: 'bg-savings-500',
  lost: 'bg-red-400',
};

export default function AgentRoi() {
  const [data, setData] = useState<AgentRoiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await analyticsService.getAgentRoi();
        setData(res);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Performance & ROI</h1>
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 mt-2">Loading analytics...</p>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { summary, revenue, pipeline, monthly_trend, top_insurance_types } = data;
  const leadGrowth = summary.leads_last_month > 0
    ? Math.round(((summary.leads_this_month - summary.leads_last_month) / summary.leads_last_month) * 100)
    : 0;

  const pipelineTotal = Object.values(pipeline).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Performance & ROI</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Track your success and prove your platform ROI</p>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Users className="w-5 h-5" />}
          iconColor="text-shield-500 bg-shield-50 dark:bg-shield-900/30"
          label="Total Leads"
          value={summary.total_leads}
          sub={`${summary.leads_this_month} this month`}
          trend={leadGrowth}
        />
        <KpiCard
          icon={<FileText className="w-5 h-5" />}
          iconColor="text-purple-500 bg-purple-50 dark:bg-purple-900/30"
          label="Policies Bound"
          value={summary.total_policies}
          sub={`${summary.policies_this_month} this month`}
        />
        <KpiCard
          icon={<Target className="w-5 h-5" />}
          iconColor="text-amber-500 bg-amber-50 dark:bg-amber-900/30"
          label="Conversion Rate"
          value={`${summary.conversion_rate}%`}
          sub="Leads → Policies"
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5" />}
          iconColor="text-savings-600 bg-savings-50 dark:bg-savings-900/30"
          label="Total Commission"
          value={`$${revenue.total_commission.toLocaleString()}`}
          sub={`$${revenue.this_month.toLocaleString()} this month`}
        />
      </div>

      {/* Revenue Breakdown + Pipeline */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-savings-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Breakdown</h2>
          </div>
          <div className="space-y-4">
            <RevenueRow label="This Month" value={revenue.this_month} />
            <RevenueRow label="This Quarter" value={revenue.this_quarter} />
            <RevenueRow label="This Year" value={revenue.this_year} />
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <RevenueRow label="All-Time Total" value={revenue.total_commission} bold />
            </div>
            <div className="pt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">Active Premium Under Management</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">${summary.active_premium.toLocaleString()}/yr</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-shield-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pipeline</h2>
            <span className="text-sm text-slate-400 ml-auto">{pipelineTotal} total</span>
          </div>
          <div className="space-y-3">
            {Object.entries(pipeline).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-20 capitalize">{status}</span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full ${PIPELINE_COLORS[status] || 'bg-slate-400'}`}
                    style={{ width: `${pipelineTotal > 0 ? (count / pipelineTotal) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 w-8 text-right">{count}</span>
              </div>
            ))}
            {Object.keys(pipeline).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No leads in pipeline</p>
            )}
          </div>
        </Card>
      </div>

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
                <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Leads</th>
                <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Policies</th>
                <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Commission</th>
              </tr>
            </thead>
            <tbody>
              {monthly_trend.map((m) => (
                <tr key={m.month} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-200">{m.month}</td>
                  <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300">{m.leads}</td>
                  <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300">{m.policies}</td>
                  <td className="py-2 px-3 text-right font-medium text-savings-600 dark:text-savings-400">${m.commission.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top Insurance Types */}
      {Object.keys(top_insurance_types).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Top Insurance Types</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(top_insurance_types).map(([type, count]) => (
              <Badge key={type} variant="outline" className="text-sm px-3 py-1.5">
                {type.replace(/_/g, ' ')} <span className="ml-1 font-bold">{count}</span>
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function KpiCard({ icon, iconColor, label, value, sub, trend }: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string | number;
  sub: string;
  trend?: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>{icon}</div>
        {trend !== undefined && trend !== 0 && (
          <Badge variant={trend > 0 ? 'success' : 'danger'} className="text-xs">
            {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {Math.abs(trend)}%
          </Badge>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
    </Card>
  );
}

function RevenueRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{label}</span>
      <span className={`${bold ? 'text-lg font-bold' : 'text-sm font-semibold'} text-savings-600 dark:text-savings-400`}>${value.toLocaleString()}</span>
    </div>
  );
}
