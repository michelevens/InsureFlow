import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import type { QuoteComparison } from '@/services/api/marketplace';

interface Props {
  quotes: QuoteComparison[];
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
];

const RECOMMENDED_COLOR = '#0d9488'; // teal-600

export function PremiumBreakdownChart({ quotes }: Props) {
  if (quotes.length === 0) return null;

  const data = quotes
    .filter(q => Number(q.premium_monthly) > 0)
    .sort((a, b) => Number(a.premium_monthly) - Number(b.premium_monthly))
    .map(q => ({
      name: q.carrier_name,
      monthly: Number(q.premium_monthly),
      annual: Number(q.premium_annual),
      recommended: q.is_recommended,
      rating: q.am_best_rating || 'N/A',
    }));

  if (data.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <XAxis
              type="number"
              tickFormatter={(v: number) => `$${v.toLocaleString()}`}
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 12, fill: '#334155', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`$${Number(value).toLocaleString()}/mo`, 'Monthly Premium']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '13px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend
              formatter={() => 'Monthly Premium'}
              iconType="square"
              wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
            />
            <Bar dataKey="monthly" radius={[0, 6, 6, 0]} barSize={28}>
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.recommended ? RECOMMENDED_COLOR : COLORS[index % COLORS.length]}
                  opacity={entry.recommended ? 1 : 0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mini legend for recommended */}
      {data.some(d => d.recommended) && (
        <p className="text-xs text-center text-slate-500">
          <span className="inline-block w-3 h-3 rounded-sm mr-1 align-middle" style={{ backgroundColor: RECOMMENDED_COLOR }} />
          Agent recommended
        </p>
      )}
    </div>
  );
}

/* ── Calculator Breakdown (for QuoteResults page) ── */

interface BreakdownData {
  base_rate: number;
  coverage_factor: number;
  state_factor: number;
  policy_fee: number;
  discount: number;
  discount_label?: string | null;
}

interface CalculatorBreakdownProps {
  breakdown: BreakdownData;
  monthlyPremium: number;
}

const BREAKDOWN_COLORS: Record<string, string> = {
  'Base Rate': '#3b82f6',
  'Coverage': '#10b981',
  'State Factor': '#f59e0b',
  'Policy Fee': '#8b5cf6',
  'Discount': '#ef4444',
};

export function CalculatorBreakdownChart({ breakdown, monthlyPremium }: CalculatorBreakdownProps) {
  const items = [
    { name: 'Base Rate', value: breakdown.base_rate },
    { name: 'Coverage', value: breakdown.base_rate * (breakdown.coverage_factor - 1) },
    { name: 'State Factor', value: breakdown.base_rate * breakdown.coverage_factor * (breakdown.state_factor - 1) },
    { name: 'Policy Fee', value: breakdown.policy_fee },
  ];

  if (breakdown.discount > 0) {
    items.push({ name: breakdown.discount_label || 'Discount', value: -breakdown.discount });
  }

  // Filter out zero/negligible items
  const data = items.filter(i => Math.abs(i.value) >= 0.5).map(i => ({
    ...i,
    value: Math.round(i.value * 100) / 100,
  }));

  return (
    <div className="space-y-3">
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `$${Math.abs(v)}`}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
              {data.map(entry => (
                <Cell
                  key={entry.name}
                  fill={BREAKDOWN_COLORS[entry.name] || '#94a3b8'}
                  opacity={entry.value < 0 ? 0.6 : 0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-sm font-semibold text-slate-700">
        Total: <span className="text-shield-600">${monthlyPremium.toLocaleString()}/mo</span>
      </p>
    </div>
  );
}
