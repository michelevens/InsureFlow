import { Card, Badge, Select } from '@/components/ui';
import { useState } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TrendingUp, DollarSign, ShieldCheck, FileText } from 'lucide-react';

const agentProduction = [
  { agent: 'Sarah Johnson', agency: 'Johnson Insurance Group', applications: 18, bound: 14, premium_volume: '$42,000', conversion: 78 },
  { agent: 'Michael Chen', agency: 'Pacific Shield Insurance', applications: 15, bound: 11, premium_volume: '$35,000', conversion: 73 },
  { agent: 'Amanda Rodriguez', agency: 'TrustBridge Insurance', applications: 12, bound: 9, premium_volume: '$28,000', conversion: 75 },
  { agent: 'David Williams', agency: 'Williams & Associates', applications: 10, bound: 7, premium_volume: '$22,000', conversion: 70 },
  { agent: 'Jessica Taylor', agency: 'Secure Future Insurance', applications: 8, bound: 6, premium_volume: '$18,000', conversion: 75 },
];

export default function Production() {
  const [period, setPeriod] = useState('this_month');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production Report</h1>
          <p className="text-slate-500 mt-1">Detailed production metrics and agent performance</p>
        </div>
        <Select
          options={[
            { value: 'this_month', label: 'This Month' },
            { value: 'last_month', label: 'Last Month' },
            { value: 'this_quarter', label: 'This Quarter' },
            { value: 'this_year', label: 'This Year' },
          ]}
          value={period}
          onChange={e => setPeriod(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<FileText className="w-5 h-5" />} label="Total Applications" value="63" change="+12" />
        <StatsCard icon={<ShieldCheck className="w-5 h-5" />} label="Policies Bound" value="47" change="+8" />
        <StatsCard icon={<TrendingUp className="w-5 h-5" />} label="Bind Rate" value="74.6%" change="+2.3%" />
        <StatsCard icon={<DollarSign className="w-5 h-5" />} label="Premium Volume" value="$145K" variant="savings" change="+18%" />
      </div>

      {/* Agent production table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Agent Production Rankings</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">#</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Agent</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Agency</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Applications</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Bound</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Conversion</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Premium Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {agentProduction.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i < 3 ? 'gradient-shield text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="py-3 font-medium text-slate-900">{row.agent}</td>
                    <td className="py-3 text-sm text-slate-500">{row.agency}</td>
                    <td className="py-3 text-right text-sm text-slate-700">{row.applications}</td>
                    <td className="py-3 text-right text-sm text-slate-700">{row.bound}</td>
                    <td className="py-3 text-right">
                      <Badge variant={row.conversion >= 75 ? 'success' : 'warning'}>{row.conversion}%</Badge>
                    </td>
                    <td className="py-3 text-right text-sm font-medium text-savings-600">{row.premium_volume}</td>
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
