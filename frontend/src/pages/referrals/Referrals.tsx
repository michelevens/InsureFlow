import { useState, useEffect } from 'react';
import { Card, Badge } from '@/components/ui';
import { Users, Gift, DollarSign, Clock, Copy, Check, Trophy, Loader2, Share2, ArrowUpRight } from 'lucide-react';
import { referralService } from '@/services/api/referrals';
import type { ReferralDashboardResponse, LeaderboardEntry } from '@/services/api/referrals';
import { toast } from 'sonner';

export default function Referrals() {
  const [data, setData] = useState<ReferralDashboardResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'code' | 'url' | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [dash, lb] = await Promise.all([
          referralService.dashboard(),
          referralService.leaderboard(),
        ]);
        setData(dash);
        setLeaderboard(lb.leaderboard);
      } catch {
        toast.error('Failed to load referral data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const copyToClipboard = async (text: string, type: 'code' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(type === 'code' ? 'Code copied!' : 'Link copied!');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Referrals</h1>
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 mt-2">Loading referral data...</p>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { code, referral_url, stats, balance, referrals, credits } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Referral Rewards</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Invite others and earn $25 for each qualifying referral</p>
      </div>

      {/* Share Card */}
      <Card className="p-6 bg-gradient-to-r from-shield-50 to-savings-50 dark:from-shield-900/20 dark:to-savings-900/20 border-shield-200 dark:border-shield-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-shield-100 dark:bg-shield-900/40 flex items-center justify-center">
            <Share2 className="w-6 h-6 text-shield-600 dark:text-shield-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Referral Code</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Share your code or link. They get $10, you get $25 when they qualify.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => copyToClipboard(code, 'code')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-shield-400 transition-colors"
          >
            <span className="font-mono font-bold text-shield-600 dark:text-shield-400 text-lg tracking-wider">{code}</span>
            {copied === 'code' ? <Check className="w-4 h-4 text-savings-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
          </button>
          <button
            onClick={() => copyToClipboard(referral_url, 'url')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-shield-600 hover:bg-shield-700 text-white transition-colors text-sm font-medium"
          >
            {copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy Invite Link
          </button>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Users className="w-5 h-5" />}
          iconColor="text-shield-500 bg-shield-50 dark:bg-shield-900/30"
          label="Total Referrals"
          value={stats.total_referrals}
          sub={`${stats.pending} pending`}
        />
        <KpiCard
          icon={<ArrowUpRight className="w-5 h-5" />}
          iconColor="text-savings-500 bg-savings-50 dark:bg-savings-900/30"
          label="Rewarded"
          value={stats.rewarded}
          sub={`${stats.qualified} qualified`}
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5" />}
          iconColor="text-amber-500 bg-amber-50 dark:bg-amber-900/30"
          label="Total Earned"
          value={`$${stats.total_earned.toFixed(2)}`}
          sub="Lifetime earnings"
        />
        <KpiCard
          icon={<Gift className="w-5 h-5" />}
          iconColor="text-purple-500 bg-purple-50 dark:bg-purple-900/30"
          label="Credit Balance"
          value={`$${balance.toFixed(2)}`}
          sub="Available to use"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Referrals List */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-shield-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Referrals</h2>
          </div>
          {referrals.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No referrals yet. Share your code to get started!</p>
          ) : (
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{r.referred_name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Joined {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={r.status === 'rewarded' ? 'success' : r.status === 'pending' ? 'warning' : r.status === 'expired' ? 'danger' : 'info'}>
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Leaderboard */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top Referrers</h2>
          </div>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No leaderboard data yet.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    i === 1 ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                    i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>{i + 1}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">{entry.name}</span>
                  <span className="text-sm font-bold text-shield-600 dark:text-shield-400">{entry.referrals}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Credit History */}
      {credits.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-shield-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Credit History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Date</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Description</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Type</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Amount</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-200">{c.description}</td>
                    <td className="py-2 px-3">
                      <Badge variant={c.type === 'earned' || c.type === 'bonus' ? 'success' : c.type === 'spent' ? 'warning' : 'danger'} className="text-xs">
                        {c.type}
                      </Badge>
                    </td>
                    <td className={`py-2 px-3 text-right font-medium ${
                      c.type === 'spent' || c.type === 'expired' ? 'text-red-600 dark:text-red-400' : 'text-savings-600 dark:text-savings-400'
                    }`}>
                      {c.type === 'spent' || c.type === 'expired' ? '-' : '+'}${Math.abs(c.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* How It Works */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">How Referrals Work</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Share Your Code', desc: 'Send your unique referral code or link to colleagues and friends.' },
            { step: '2', title: 'They Sign Up', desc: 'They register using your code and receive an instant $10 credit.' },
            { step: '3', title: 'You Get Rewarded', desc: 'When they complete their first action, you earn $25 in credits.' },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-shield-100 dark:bg-shield-900/40 flex items-center justify-center mx-auto mb-3">
                <span className="text-sm font-bold text-shield-600 dark:text-shield-400">{s.step}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.desc}</p>
            </div>
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
