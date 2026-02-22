import { useState, useEffect } from 'react';
import { analyticsService } from '@/services/api/analytics';
import type {
  ConversionFunnelResponse,
  RevenueTrendsResponse,
  AgentPerformanceResponse,
  ClaimsAnalyticsResponse,
} from '@/services/api/analytics';
import {
  TrendingUp, DollarSign, Users, BarChart3, Loader2, AlertTriangle,
} from 'lucide-react';

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string; icon: typeof TrendingUp; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function FunnelChart({ funnel }: { funnel: { stage: string; count: number }[] }) {
  const max = Math.max(...funnel.map(f => f.count), 1);
  return (
    <div className="space-y-3">
      {funnel.map((stage, i) => (
        <div key={stage.stage} className="flex items-center gap-3">
          <div className="w-28 text-sm text-slate-600 text-right shrink-0">{stage.stage}</div>
          <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-shield-500 to-confidence-500 rounded-lg flex items-center justify-end px-2 transition-all duration-500"
              style={{ width: `${Math.max((stage.count / max) * 100, 8)}%` }}
            >
              <span className="text-xs font-bold text-white">{stage.count}</span>
            </div>
          </div>
          {i > 0 && funnel[i - 1].count > 0 && (
            <span className="text-xs text-slate-400 w-12 text-right">
              {Math.round((stage.count / funnel[i - 1].count) * 100)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function RevenueBars({ trends }: { trends: { month: string; policies_count: number; premium_volume: string }[] }) {
  const max = Math.max(...trends.map(t => Number(t.premium_volume)), 1);
  return (
    <div className="flex items-end gap-2 h-40">
      {trends.map(t => (
        <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-slate-500 font-medium">
            ${(Number(t.premium_volume) / 1000).toFixed(0)}k
          </span>
          <div
            className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500"
            style={{ height: `${Math.max((Number(t.premium_volume) / max) * 120, 4)}px` }}
          />
          <span className="text-[10px] text-slate-400">{t.month.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdvancedAnalytics() {
  const [funnel, setFunnel] = useState<ConversionFunnelResponse | null>(null);
  const [revenue, setRevenue] = useState<RevenueTrendsResponse | null>(null);
  const [agents, setAgents] = useState<AgentPerformanceResponse | null>(null);
  const [claims, setClaims] = useState<ClaimsAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(6);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsService.getConversionFunnel(period),
      analyticsService.getRevenueTrends(12),
      analyticsService.getAgentPerformance(period),
      analyticsService.getClaimsAnalytics(period),
    ]).then(([f, r, a, c]) => {
      setFunnel(f);
      setRevenue(r);
      setAgents(a);
      setClaims(c);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">Performance metrics and insights</p>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(Number(e.target.value))}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500"
        >
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
        </select>
      </div>

      {/* Claims summary cards */}
      {claims && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Claims" value={claims.total_claims} icon={AlertTriangle} color="bg-amber-50 text-amber-600" />
          <StatCard label="Settled" value={claims.settled_claims} icon={DollarSign} color="bg-green-50 text-green-600" />
          <StatCard
            label="Avg Settlement"
            value={`$${claims.avg_settlement.toLocaleString()}`}
            icon={DollarSign}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Conversion Rate"
            value={funnel ? `${funnel.conversion_rate}%` : 'N/A'}
            sub="Lead → Policy"
            icon={TrendingUp}
            color="bg-purple-50 text-purple-600"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        {funnel && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-5 h-5 text-shield-600" />
              <h2 className="text-lg font-bold text-slate-900">Conversion Funnel</h2>
            </div>
            <FunnelChart funnel={funnel.funnel} />
          </div>
        )}

        {/* Revenue Trends */}
        {revenue && revenue.trends.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-slate-900">Premium Volume</h2>
            </div>
            <RevenueBars trends={revenue.trends} />
          </div>
        )}
      </div>

      {/* Agent Leaderboard */}
      {agents && agents.agents.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-confidence-600" />
            <h2 className="text-lg font-bold text-slate-900">Agent Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Agent</th>
                  <th className="pb-3 font-medium text-right">Leads</th>
                  <th className="pb-3 font-medium text-right">Policies</th>
                  <th className="pb-3 font-medium text-right">Commission</th>
                  <th className="pb-3 font-medium text-right">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {agents.agents.map((agent, i) => (
                  <tr key={agent.id} className="hover:bg-slate-50">
                    <td className="py-3 text-slate-400">{i + 1}</td>
                    <td className="py-3">
                      <p className="font-medium text-slate-900">{agent.name}</p>
                      <p className="text-xs text-slate-400">{agent.email}</p>
                    </td>
                    <td className="py-3 text-right text-slate-700">{agent.lead_count}</td>
                    <td className="py-3 text-right text-slate-700">{agent.policy_count}</td>
                    <td className="py-3 text-right font-medium text-green-700">
                      ${Number(agent.total_commission || 0).toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-slate-600">
                      {agent.lead_count > 0 ? `${Math.round((agent.policy_count / agent.lead_count) * 100)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Claims by Type */}
      {claims && claims.by_type.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Claims by Type</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {claims.by_type.map(ct => (
              <div key={ct.type} className="p-4 rounded-xl bg-slate-50 text-center">
                <p className="text-2xl font-bold text-slate-900">{ct.count}</p>
                <p className="text-xs text-slate-500 mt-1 capitalize">{ct.type.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
