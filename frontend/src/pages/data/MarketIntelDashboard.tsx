import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, Badge } from '@/components/ui';
import { dataProductService } from '@/services/api';
import type { MarketIntelData, CompetitiveAnalysis, AgentBenchmark } from '@/services/api/dataProducts';
import {
  BarChart3, TrendingUp, Users, Trophy, ArrowUp, ArrowDown,
} from 'lucide-react';

type Tab = 'market' | 'competitive' | 'benchmarks';

export default function MarketIntelDashboard() {
  const [tab, setTab] = useState<Tab>('market');
  const [period, setPeriod] = useState('30d');
  const [marketData, setMarketData] = useState<MarketIntelData | null>(null);
  const [competitive, setCompetitive] = useState<CompetitiveAnalysis | null>(null);
  const [benchmarks, setBenchmarks] = useState<AgentBenchmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (tab === 'market') {
          const data = await dataProductService.getMarketIntel({ period });
          setMarketData(data);
        } else if (tab === 'competitive') {
          const data = await dataProductService.getCompetitiveAnalysis({ period });
          setCompetitive(data);
        } else {
          const data = await dataProductService.getAgentBenchmarks({ period, limit: 20 });
          setBenchmarks(data);
        }
      } catch {
        toast.error('Failed to load market intelligence data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab, period]);

  const tabs: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
    { key: 'market', label: 'Market Intelligence', icon: BarChart3 },
    { key: 'competitive', label: 'Competitive Analysis', icon: TrendingUp },
    { key: 'benchmarks', label: 'Agent Benchmarks', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data & Analytics Products</h1>
          <p className="text-slate-500 mt-1">Premium market intelligence and performance insights</p>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              tab === t.key ? 'bg-white text-shield-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
        </Card>
      ) : tab === 'market' && marketData ? (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-sm text-slate-500">Total Quotes</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{marketData.total_quotes.toLocaleString()}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-slate-500">Avg Premium</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">${marketData.avg_premium.toLocaleString()}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-slate-500">Top Carrier</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{marketData.top_carriers[0]?.carrier || 'N/A'}</p>
            </Card>
          </div>

          {/* Top Carriers */}
          <Card className="p-5">
            <h3 className="font-bold text-slate-900 mb-4">Carrier Market Share</h3>
            <div className="space-y-3">
              {marketData.top_carriers.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 w-6">{i + 1}.</span>
                  <span className="text-sm font-medium text-slate-900 w-40 truncate">{c.carrier}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                    <div className="bg-shield-500 rounded-full h-2.5" style={{ width: `${c.market_share}%` }} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-16 text-right">{c.market_share.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Product Mix */}
          <Card className="p-5">
            <h3 className="font-bold text-slate-900 mb-4">Product Type Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {marketData.product_mix.map((p, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-shield-600">{p.percentage.toFixed(1)}%</p>
                  <p className="text-xs text-slate-500 mt-1">{p.product_type}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Volume Trends */}
          <Card className="p-5">
            <h3 className="font-bold text-slate-900 mb-4">Volume Trends</h3>
            <div className="space-y-2">
              {marketData.trends.slice(-10).map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-slate-500">{t.period}</span>
                  <div className="flex items-center gap-6">
                    <span className="text-slate-900 font-medium">{t.volume} quotes</span>
                    <span className="text-slate-500">${t.avg_premium.toLocaleString()} avg</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : tab === 'competitive' && competitive ? (
        <div className="space-y-4">
          {/* Percentile Rank */}
          <Card className="p-6 text-center">
            <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-2" />
            <p className="text-4xl font-bold text-slate-900">Top {100 - competitive.percentile_rank}%</p>
            <p className="text-slate-500 mt-1">Your percentile rank in the market</p>
          </Card>

          {/* Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Conversion Rate', yours: `${(competitive.your_metrics.conversion_rate * 100).toFixed(1)}%`, market: `${(competitive.market_avg.conversion_rate * 100).toFixed(1)}%`, better: competitive.your_metrics.conversion_rate > competitive.market_avg.conversion_rate },
              { label: 'Avg Response Time', yours: `${competitive.your_metrics.avg_response_time.toFixed(1)}h`, market: `${competitive.market_avg.avg_response_time.toFixed(1)}h`, better: competitive.your_metrics.avg_response_time < competitive.market_avg.avg_response_time },
              { label: 'Avg Premium', yours: `$${competitive.your_metrics.avg_premium.toLocaleString()}`, market: `$${competitive.market_avg.avg_premium.toLocaleString()}`, better: competitive.your_metrics.avg_premium > competitive.market_avg.avg_premium },
            ].map((m, i) => (
              <Card key={i} className="p-5">
                <p className="text-sm text-slate-500 mb-3">{m.label}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">You</span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-slate-900">{m.yours}</span>
                      {m.better ? <ArrowUp className="w-4 h-4 text-green-500" /> : <ArrowDown className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Market Avg</span>
                    <span className="text-sm text-slate-600">{m.market}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Improvement Areas */}
          {competitive.improvement_areas.length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold text-slate-900 mb-3">Areas for Improvement</h3>
              <div className="space-y-2">
                {competitive.improvement_areas.map((area, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-slate-700">{area}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : tab === 'benchmarks' ? (
        <Card className="p-5">
          <h3 className="font-bold text-slate-900 mb-4">Agent Leaderboard</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-100">
                  <th className="pb-3 pr-4">Rank</th>
                  <th className="pb-3 pr-4">Agent</th>
                  <th className="pb-3 pr-4 text-right">Policies</th>
                  <th className="pb-3 pr-4 text-right">Premium</th>
                  <th className="pb-3 pr-4 text-right">Conversion</th>
                  <th className="pb-3 pr-4 text-right">Response Time</th>
                  <th className="pb-3 text-right">Retention</th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.map(b => (
                  <tr key={b.agent_id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        b.rank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {b.rank}
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-900">{b.agent_name}</td>
                    <td className="py-3 pr-4 text-right text-slate-700">{b.policies_written}</td>
                    <td className="py-3 pr-4 text-right text-slate-700">${b.total_premium.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right">
                      <Badge variant={b.conversion_rate > 0.3 ? 'success' : b.conversion_rate > 0.15 ? 'warning' : 'danger'}>
                        {(b.conversion_rate * 100).toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-700">{b.avg_response_time_hours.toFixed(1)}h</td>
                    <td className="py-3 text-right text-slate-700">{(b.retention_rate * 100).toFixed(0)}%</td>
                  </tr>
                ))}
                {benchmarks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No benchmark data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
