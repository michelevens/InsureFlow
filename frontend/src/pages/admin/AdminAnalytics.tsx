import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Users, Target, ShieldCheck, DollarSign, Loader2, BarChart3 } from 'lucide-react';
import { analyticsService, type RevenueTrend, type AgentPerformanceEntry, type ConversionFunnelResponse } from '@/services/api/analytics';

export default function AdminAnalytics() {
  const [stats, setStats] = useState<Record<string, number | string>>({});
  const [trends, setTrends] = useState<RevenueTrend[]>([]);
  const [agents, setAgents] = useState<AgentPerformanceEntry[]>([]);
  const [funnel, setFunnel] = useState<ConversionFunnelResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [dashRes, trendRes, agentRes, funnelRes] = await Promise.allSettled([
        analyticsService.getDashboardStats(),
        analyticsService.getRevenueTrends(6),
        analyticsService.getAgentPerformance(3, 10),
        analyticsService.getConversionFunnel(6),
      ]);

      if (dashRes.status === 'fulfilled') setStats(dashRes.value);
      if (trendRes.status === 'fulfilled') setTrends(trendRes.value.trends || []);
      if (agentRes.status === 'fulfilled') setAgents(agentRes.value.agents || []);
      if (funnelRes.status === 'fulfilled') setFunnel(funnelRes.value);
    } catch {
      // Individual errors handled by allSettled
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Comprehensive platform performance metrics</p>
        </div>
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 mt-2">Loading analytics...</p>
        </Card>
      </div>
    );
  }

  const maxLeads = trends.length > 0 ? Math.max(...trends.map(d => d.policies_count || 0), 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Comprehensive platform performance metrics</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<Users className="w-5 h-5" />} label="Total Users" value={String(stats.total_users || 0)} />
        <StatsCard icon={<Target className="w-5 h-5" />} label="Lead Conversion" value={funnel ? `${funnel.conversion_rate}%` : '-'} />
        <StatsCard icon={<ShieldCheck className="w-5 h-5" />} label="Total Policies" value={String(stats.total_policies || 0)} />
        <StatsCard icon={<DollarSign className="w-5 h-5" />} label="Platform Revenue" value={`$${Number(stats.platform_revenue || 0).toLocaleString()}`} variant="savings" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Policy volume chart */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Policy Volume by Month</h2>
            {trends.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-500">
                <div className="text-center">
                  <BarChart3 className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">No data yet</p>
                </div>
              </div>
            ) : (
              <div className="flex items-end gap-3 h-48">
                {trends.map(d => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{d.policies_count}</span>
                    <div
                      className="w-full bg-shield-500 rounded-t-lg transition-all"
                      style={{ height: `${(d.policies_count / maxLeads) * 100}%`, minHeight: d.policies_count > 0 ? '8px' : '2px' }}
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{d.month.split('-')[1] || d.month}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Top agents */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top Agents by Commission</h2>
            {agents.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-500">
                <div className="text-center">
                  <Users className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">No agent data yet</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {agents.map(agent => {
                  const maxCommission = Math.max(...agents.map(a => Number(a.total_commission || 0)), 1);
                  const share = Math.round((Number(agent.total_commission || 0) / maxCommission) * 100);
                  return (
                    <div key={agent.id} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{agent.name}</div>
                      <div className="flex-1">
                        <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-shield-500 rounded-full flex items-center pl-3" style={{ width: `${Math.max(share, 5)}%` }}>
                            {share > 20 && <span className="text-xs font-medium text-white">{agent.policy_count} policies</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right w-20">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">${Number(agent.total_commission || 0).toLocaleString()}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{agent.lead_count} leads</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Conversion funnel */}
      {funnel && funnel.funnel.length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Conversion Funnel (Last {funnel.period_months} Months)</h2>
            <div className="space-y-3">
              {funnel.funnel.map((stage, i) => {
                const maxCount = Math.max(...funnel.funnel.map(s => s.count), 1);
                const width = Math.max((stage.count / maxCount) * 100, 3);
                return (
                  <div key={stage.stage} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-slate-700 dark:text-slate-200">{stage.stage}</div>
                    <div className="flex-1">
                      <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                        <div
                          className={`h-full rounded-lg flex items-center pl-3 ${i < 3 ? 'bg-shield-500' : 'bg-savings-500'}`}
                          style={{ width: `${width}%` }}
                        >
                          <span className="text-xs font-medium text-white">{stage.count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Overall conversion rate: <span className="font-semibold text-shield-600 dark:text-shield-400">{funnel.conversion_rate}%</span></p>
          </div>
        </Card>
      )}

      {/* Revenue breakdown table */}
      {trends.length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Monthly Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Month</th>
                    <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Policies</th>
                    <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-3">Premium Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {trends.map(d => (
                    <tr key={d.month} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">{d.month}</td>
                      <td className="py-3 text-right text-sm text-slate-700 dark:text-slate-200">{d.policies_count}</td>
                      <td className="py-3 text-right text-sm font-medium text-savings-600 dark:text-savings-400">${Number(d.premium_volume || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
