import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Select } from '@/components/ui';
import {
  Search, Loader2, UserCheck, UserX, ExternalLink, Database,
  ChevronLeft, ChevronRight, Users,
} from 'lucide-react';
import { adminService, type AgentProfileListItem } from '@/services/api/admin';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'claimed' | 'unclaimed';

export default function AdminProfiles() {
  const [profiles, setProfiles] = useState<AgentProfileListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stateFilter, setStateFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Summary & filter options
  const [summary, setSummary] = useState({ total: 0, claimed: 0, unclaimed: 0 });
  const [availableSources, setAvailableSources] = useState<Record<string, number>>({});
  const [availableStates, setAvailableStates] = useState<Record<string, number>>({});

  const loadProfiles = async (p = page) => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getProfiles({
        search: search || undefined,
        state: stateFilter || undefined,
        source: sourceFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        per_page: 25,
        page: p,
      });
      setProfiles(res.profiles.data);
      setTotal(res.profiles.total);
      setTotalPages(res.profiles.last_page);
      setPage(res.profiles.current_page);
      setSummary(res.summary);
      setAvailableSources(res.filters.sources);
      setAvailableStates(res.filters.states);
    } catch {
      setError('Failed to load profiles');
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfiles(1); }, [statusFilter, stateFilter, sourceFilter]);

  const handleSearch = () => { loadProfiles(1); };

  const sourceLabel = (source: string | null) => {
    if (!source) return 'Manual';
    return source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agent Profiles</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">All profiles — imported from state DOI data and user-created</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center cursor-pointer hover:ring-2 hover:ring-shield-500 transition-all"
          onClick={() => { setStatusFilter('all'); }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Database className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.total}</p>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Profiles</p>
        </Card>
        <Card className="p-4 text-center cursor-pointer hover:ring-2 hover:ring-savings-500 transition-all"
          onClick={() => { setStatusFilter('claimed'); }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-savings-500" />
            <p className="text-2xl font-bold text-savings-600 dark:text-savings-400">{summary.claimed}</p>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Claimed</p>
        </Card>
        <Card className="p-4 text-center cursor-pointer hover:ring-2 hover:ring-amber-500 transition-all"
          onClick={() => { setStatusFilter('unclaimed'); }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <UserX className="w-4 h-4 text-amber-500" />
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.unclaimed}</p>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Unclaimed</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search name, NPN, license #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
        <div className="w-40">
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'claimed', label: 'Claimed' },
              { value: 'unclaimed', label: 'Unclaimed' },
            ]}
          />
        </div>
        <div className="w-36">
          <Select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            options={[
              { value: '', label: 'All States' },
              ...Object.entries(availableStates)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([st, count]) => ({ value: st, label: `${st} (${count})` })),
            ]}
          />
        </div>
        <div className="w-44">
          <Select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            options={[
              { value: '', label: 'All Sources' },
              ...Object.entries(availableSources).map(([src, count]) => ({
                value: src,
                label: `${sourceLabel(src)} (${count})`,
              })),
            ]}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="p-6 text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => loadProfiles()}>Retry</Button>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 mt-2">Loading profiles...</p>
        </Card>
      )}

      {/* Table */}
      {!loading && !error && (
        <Card>
          {profiles.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No profiles found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Name</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">NPN</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">License</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">State</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Source</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Status</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Created</th>
                    <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {profiles.map(profile => (
                    <tr key={profile.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{profile.full_name || '—'}</p>
                          {profile.license_type && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">{profile.license_type}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-slate-700 dark:text-slate-200 font-mono">{profile.npn || '—'}</span>
                          {profile.npn && (
                            <Badge variant={profile.npn_verified === 'verified' ? 'success' : profile.npn_verified === 'pending' ? 'warning' : 'default'} className="text-[10px]">
                              {profile.npn_verified}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-700 dark:text-slate-200 font-mono">{profile.license_number || '—'}</span>
                        {profile.license_status && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{profile.license_status}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{profile.state || '—'}</span>
                        {profile.city && (
                          <p className="text-xs text-slate-400 dark:text-slate-500">{profile.city}{profile.county ? `, ${profile.county}` : ''}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant="info" className="text-[10px]">{sourceLabel(profile.source)}</Badge>
                      </td>
                      <td className="p-4">
                        {profile.is_claimed ? (
                          <Badge variant="success">Claimed</Badge>
                        ) : (
                          <Badge variant="warning">Unclaimed</Badge>
                        )}
                        {profile.claimed_at && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{new Date(profile.claimed_at).toLocaleDateString()}</p>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                        {profile.created_at?.split('T')[0] || '—'}
                      </td>
                      <td className="p-4 text-right">
                        {profile.license_lookup_url && (
                          <a href={profile.license_lookup_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-shield-600 dark:text-shield-400 hover:underline">
                            <ExternalLink className="w-3 h-3" /> Verify
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700/50">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadProfiles(page - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="flex items-center text-sm text-slate-700 dark:text-slate-200 px-2">
                  Page {page} of {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => loadProfiles(page + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
