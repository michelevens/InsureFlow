import { useState } from 'react';
import { Card, Badge, Button, Select } from '@/components/ui';
import { DollarSign, TrendingUp, Calendar, Download, ArrowUp } from 'lucide-react';

interface CommissionRecord {
  id: string;
  policy_number: string;
  client: string;
  carrier: string;
  type: string;
  premium: number;
  commission_rate: number;
  commission_amount: number;
  status: 'paid' | 'pending' | 'processing';
  date: string;
}

const mockCommissions: CommissionRecord[] = [
  { id: '1', policy_number: 'POL-2026-0412', client: 'John Miller', carrier: 'StateFarm', type: 'Auto', premium: 1524, commission_rate: 12, commission_amount: 182.88, status: 'paid', date: '2026-02-15' },
  { id: '2', policy_number: 'POL-2026-0389', client: 'Emily Davis', carrier: 'Allstate', type: 'Home', premium: 2340, commission_rate: 15, commission_amount: 351.00, status: 'paid', date: '2026-02-12' },
  { id: '3', policy_number: 'POL-2026-0503', client: 'Robert Wilson', carrier: 'MetLife', type: 'Life', premium: 1020, commission_rate: 50, commission_amount: 510.00, status: 'processing', date: '2026-02-18' },
  { id: '4', policy_number: 'POL-2026-0501', client: 'Sarah Brown', carrier: 'Progressive', type: 'Auto+Home', premium: 3720, commission_rate: 13, commission_amount: 483.60, status: 'pending', date: '2026-02-19' },
  { id: '5', policy_number: 'POL-2026-0498', client: 'James Taylor', carrier: 'Hartford', type: 'Business', premium: 5400, commission_rate: 10, commission_amount: 540.00, status: 'paid', date: '2026-02-10' },
  { id: '6', policy_number: 'POL-2026-0487', client: 'Lisa Park', carrier: 'Geico', type: 'Auto', premium: 1176, commission_rate: 12, commission_amount: 141.12, status: 'paid', date: '2026-02-08' },
];

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'info' }> = {
  paid: { label: 'Paid', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  processing: { label: 'Processing', variant: 'info' },
};

export default function Commissions() {
  const [period, setPeriod] = useState('this_month');

  const totalCommissions = mockCommissions.reduce((sum, c) => sum + c.commission_amount, 0);
  const paidCommissions = mockCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0);
  const pendingCommissions = mockCommissions.filter(c => c.status !== 'paid').reduce((sum, c) => sum + c.commission_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commissions</h1>
          <p className="text-slate-500 mt-1">Track your earnings and commission payouts</p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>Export</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Earned</p>
              <p className="text-3xl font-bold text-slate-900">${totalCommissions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-shield-100 text-shield-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-sm text-savings-600">
            <ArrowUp className="w-4 h-4" />
            <span>+18% vs last month</span>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Paid Out</p>
              <p className="text-3xl font-bold text-savings-600">${paidCommissions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-savings-100 text-savings-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-3">{mockCommissions.filter(c => c.status === 'paid').length} transactions</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-3xl font-bold text-amber-600">${pendingCommissions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-3">{mockCommissions.filter(c => c.status !== 'paid').length} pending payouts</p>
        </Card>
      </div>

      {/* Commission table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Commission History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Policy</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Client</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Carrier</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Type</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Premium</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Rate</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Commission</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {mockCommissions.map(c => {
                  const config = statusConfig[c.status];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 font-mono text-sm text-shield-600">{c.policy_number}</td>
                      <td className="py-3 text-sm font-medium text-slate-900">{c.client}</td>
                      <td className="py-3 text-sm text-slate-700">{c.carrier}</td>
                      <td className="py-3 text-sm text-slate-700">{c.type}</td>
                      <td className="py-3 text-right text-sm text-slate-700">${c.premium.toLocaleString()}</td>
                      <td className="py-3 text-right text-sm text-slate-700">{c.commission_rate}%</td>
                      <td className="py-3 text-right text-sm font-medium text-savings-600">${c.commission_amount.toFixed(2)}</td>
                      <td className="py-3"><Badge variant={config.variant}>{config.label}</Badge></td>
                      <td className="py-3 text-sm text-slate-500">{c.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
