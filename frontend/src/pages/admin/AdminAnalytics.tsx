import { Card } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import {
  Users, Target, ShieldCheck, DollarSign,
} from 'lucide-react';

const monthlyData = [
  { month: 'Sep', leads: 320, policies: 85, revenue: 12400 },
  { month: 'Oct', leads: 380, policies: 102, revenue: 15200 },
  { month: 'Nov', leads: 410, policies: 115, revenue: 17800 },
  { month: 'Dec', leads: 350, policies: 95, revenue: 14500 },
  { month: 'Jan', leads: 450, policies: 128, revenue: 19200 },
  { month: 'Feb', leads: 520, policies: 145, revenue: 22400 },
];

const topCarriers = [
  { name: 'StateFarm', policies: 312, premium_volume: '$485K', share: 25 },
  { name: 'Progressive', policies: 245, premium_volume: '$380K', share: 20 },
  { name: 'Allstate', policies: 198, premium_volume: '$310K', share: 16 },
  { name: 'Geico', policies: 176, premium_volume: '$265K', share: 14 },
  { name: 'Liberty Mutual', policies: 145, premium_volume: '$225K', share: 12 },
];

export default function AdminAnalytics() {
  const maxLeads = Math.max(...monthlyData.map(d => d.leads));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
        <p className="text-slate-500 mt-1">Comprehensive platform performance metrics</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<Users className="w-5 h-5" />} label="Monthly Active Users" value="1,847" change="+12%" />
        <StatsCard icon={<Target className="w-5 h-5" />} label="Lead Conversion Rate" value="28.4%" change="+2.1%" />
        <StatsCard icon={<ShieldCheck className="w-5 h-5" />} label="Avg. Policy Value" value="$1,840" change="+$120" />
        <StatsCard icon={<DollarSign className="w-5 h-5" />} label="Platform Revenue" value="$22.4K" variant="savings" change="+16.7%" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lead generation chart (simplified bar chart) */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Lead Generation Trend</h2>
            <div className="flex items-end gap-3 h-48">
              {monthlyData.map(d => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-slate-700">{d.leads}</span>
                  <div
                    className="w-full bg-shield-500 rounded-t-lg transition-all"
                    style={{ height: `${(d.leads / maxLeads) * 100}%` }}
                  />
                  <span className="text-xs text-slate-500">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top carriers */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Carriers by Volume</h2>
            <div className="space-y-4">
              {topCarriers.map(carrier => (
                <div key={carrier.name} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium text-slate-700">{carrier.name}</div>
                  <div className="flex-1">
                    <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-shield-500 rounded-full flex items-center pl-3" style={{ width: `${carrier.share * 4}%` }}>
                        <span className="text-xs font-medium text-white">{carrier.share}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right w-20">
                    <p className="text-sm font-medium text-slate-900">{carrier.policies}</p>
                    <p className="text-xs text-slate-500">{carrier.premium_volume}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly breakdown */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Monthly Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Month</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Leads</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Policies Bound</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Conv. Rate</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {monthlyData.map(d => (
                  <tr key={d.month} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900">{d.month} 2026</td>
                    <td className="py-3 text-right text-sm text-slate-700">{d.leads.toLocaleString()}</td>
                    <td className="py-3 text-right text-sm text-slate-700">{d.policies}</td>
                    <td className="py-3 text-right text-sm text-slate-700">{((d.policies / d.leads) * 100).toFixed(1)}%</td>
                    <td className="py-3 text-right text-sm font-medium text-savings-600">${d.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
