import { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { Building2, Search, ArrowLeft, ShieldCheck, ShieldOff, CheckCircle2, XCircle, Globe, Phone, Mail, MapPin, Loader2, Hash, UserCircle, ExternalLink, ClipboardCheck, AlertCircle } from 'lucide-react';
import { adminService, type AgencyDetail, type AgentWithProfile } from '@/services/api/admin';
import { toast } from 'sonner';

const NPN_STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  verified: { label: 'NPN Verified', variant: 'success' },
  pending: { label: 'NPN Pending', variant: 'warning' },
  rejected: { label: 'NPN Rejected', variant: 'danger' },
  unverified: { label: 'No NPN', variant: 'default' },
};

// State-specific license lookup URLs
const STATE_LICENSE_URLS: Record<string, string> = {
  FL: 'https://licenseesearch.fldfs.com/',
  TX: 'https://www.tdi.texas.gov/agent/agentsearch.html',
  CA: 'https://interactive.web.insurance.ca.gov/webuser/licw_name_search$.startup',
  NY: 'https://myportal.dfs.ny.gov/common-forms/license-lookup',
  GA: 'https://oci.georgia.gov/consumers/license-verification',
  IL: 'https://online-dfpr.micropact.com/lookup/licenselookup.aspx',
  VA: 'https://scc.virginia.gov/pages/Bureau-of-Insurance-Licensee-Search',
  AZ: 'https://insurance.az.gov/licensee-search',
  PA: 'https://www.insurance.pa.gov/Consumers/LicenseSearch/Pages/default.aspx',
  OH: 'https://gateway.insurance.ohio.gov/LicenseSearch',
  NJ: 'https://www20.state.nj.us/DOBI_LicSearch/lsSearchPage.jsp',
  NC: 'https://www.ncdoi.gov/consumers/consumer-services/company-and-agent-search',
  MI: 'https://difs.state.mi.us/fis/lps',
};

function NpnBadge({ status }: { status: string }) {
  const info = NPN_STATUS_MAP[status] || NPN_STATUS_MAP.unverified;
  return <Badge variant={info.variant}>{info.label}</Badge>;
}

export default function AdminAgencies() {
  const [agencies, setAgencies] = useState<AgencyDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<AgencyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [npnActionLoading, setNpnActionLoading] = useState<number | null>(null);

  const activeCount = agencies.filter(a => a.is_active).length;
  const verifiedCount = agencies.filter(a => a.is_verified).length;
  const totalAgents = agencies.reduce((sum, a) => sum + (a.agents?.length ?? 0), 0);

  const fetchAgencies = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const res = await adminService.getAgencies(query ? { search: query } : undefined);
      setAgencies(res.data);
      setTotal(res.total);
    } catch {
      toast.error('Failed to load agencies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgencies(); }, [fetchAgencies]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchAgencies(search || undefined); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleViewAgency = async (id: number) => {
    setDetailLoading(true);
    try {
      const agency = await adminService.getAgency(id);
      setSelectedAgency(agency);
    } catch {
      toast.error('Failed to load agency details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleVerify = async (agency: AgencyDetail) => {
    setActionLoading(agency.id);
    try {
      const updated = await adminService.updateAgency(agency.id, { is_verified: !agency.is_verified });
      setSelectedAgency(updated);
      setAgencies(prev => prev.map(a => a.id === updated.id ? { ...a, is_verified: updated.is_verified } : a));
      toast.success(updated.is_verified ? 'Agency verified' : 'Agency unverified');
    } catch {
      toast.error('Failed to update verification status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (agency: AgencyDetail) => {
    setActionLoading(agency.id);
    try {
      const updated = await adminService.updateAgency(agency.id, { is_active: !agency.is_active });
      setSelectedAgency(updated);
      setAgencies(prev => prev.map(a => a.id === updated.id ? { ...a, is_active: updated.is_active } : a));
      toast.success(updated.is_active ? 'Agency activated' : 'Agency deactivated');
    } catch {
      toast.error('Failed to update agency status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyAgentNpn = async (agent: AgentWithProfile, status: 'verified' | 'rejected') => {
    const profileId = agent.agent_profile?.id;
    if (!profileId) return;
    setNpnActionLoading(profileId);
    try {
      const lookupUrl = agent.agent_profile?.state ? STATE_LICENSE_URLS[agent.agent_profile.state] : undefined;
      await adminService.verifyAgentNpn(profileId, { status, license_lookup_url: lookupUrl });
      // Refresh agency detail
      if (selectedAgency) {
        const refreshed = await adminService.getAgency(selectedAgency.id);
        setSelectedAgency(refreshed);
      }
      toast.success(`Agent NPN ${status}`);
    } catch {
      toast.error('Failed to update NPN status');
    } finally {
      setNpnActionLoading(null);
    }
  };

  const handleVerifyAgencyNpn = async (agency: AgencyDetail, status: 'verified' | 'rejected') => {
    setNpnActionLoading(agency.id);
    try {
      await adminService.verifyAgencyNpn(agency.id, { status });
      const refreshed = await adminService.getAgency(agency.id);
      setSelectedAgency(refreshed);
      toast.success(`Agency NPN ${status}`);
    } catch {
      toast.error('Failed to update agency NPN status');
    } finally {
      setNpnActionLoading(null);
    }
  };

  // ========== Detail View ==========
  if (selectedAgency) {
    const agency = selectedAgency;
    const agencyState = agency.state;
    const lookupUrl = agencyState ? STATE_LICENSE_URLS[agencyState] : null;

    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setSelectedAgency(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Agencies
        </Button>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-shield-100 dark:bg-shield-900/30 flex items-center justify-center">
                <Building2 className="h-7 w-7 text-shield-600 dark:text-shield-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{agency.name}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="font-mono">{agency.agency_code}</span>
                  {agency.city && agency.state && (
                    <span className="ml-3"><MapPin className="inline h-3.5 w-3.5 mr-0.5" />{agency.city}, {agency.state}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={agency.is_verified ? 'success' : 'default'}>{agency.is_verified ? 'Verified' : 'Unverified'}</Badge>
              <Badge variant={agency.is_active ? 'success' : 'danger'}>{agency.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>
          </div>
          {agency.description && <p className="text-slate-600 dark:text-slate-300 mt-4">{agency.description}</p>}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <Button variant={agency.is_verified ? 'outline' : 'primary'} size="sm" onClick={() => handleToggleVerify(agency)} disabled={actionLoading === agency.id}>
              {actionLoading === agency.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : agency.is_verified ? <ShieldOff className="h-4 w-4 mr-1" /> : <ShieldCheck className="h-4 w-4 mr-1" />}
              {agency.is_verified ? 'Unverify' : 'Verify'}
            </Button>
            <Button variant={agency.is_active ? 'outline' : 'primary'} size="sm" onClick={() => handleToggleActive(agency)} disabled={actionLoading === agency.id}>
              {actionLoading === agency.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : agency.is_active ? <XCircle className="h-4 w-4 mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              {agency.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Contact Information</h2>
            <div className="space-y-3 text-sm">
              {agency.phone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-shield-500" /><span className="text-slate-700 dark:text-slate-200">{agency.phone}</span></div>}
              {agency.email && <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-shield-500" /><span className="text-slate-700 dark:text-slate-200">{agency.email}</span></div>}
              {agency.website && <div className="flex items-center gap-3"><Globe className="h-4 w-4 text-shield-500" /><a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-shield-600 dark:text-shield-400 hover:underline">{agency.website}</a></div>}
              {agency.address && <div className="flex items-start gap-3"><MapPin className="h-4 w-4 text-shield-500 mt-0.5" /><div className="text-slate-700 dark:text-slate-200"><p>{agency.address}</p>{agency.city && agency.state && <p>{agency.city}, {agency.state} {agency.zip_code}</p>}</div></div>}
              <div className="flex items-center gap-3"><Hash className="h-4 w-4 text-shield-500" /><span className="text-slate-700 dark:text-slate-200 font-mono">{agency.agency_code}</span></div>
            </div>
          </Card>

          {/* NPN & Licensing */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">NPN & Licensing</h2>
            {agency.npn ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">National Producer Number</p>
                    <p className="text-lg font-mono font-semibold text-slate-900 dark:text-white">{agency.npn}</p>
                  </div>
                  <NpnBadge status={agency.npn_verified} />
                </div>
                {agency.npn_verified_at && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">Verified on {new Date(agency.npn_verified_at).toLocaleDateString()}</p>
                )}
                {lookupUrl && (
                  <a href={lookupUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-shield-600 dark:text-shield-400 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Verify on {agency.state} Dept. of Insurance
                  </a>
                )}
                {agency.npn_verified === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="primary" size="sm" onClick={() => handleVerifyAgencyNpn(agency, 'verified')} disabled={npnActionLoading === agency.id}>
                      <ClipboardCheck className="h-4 w-4 mr-1" /> Verify NPN
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleVerifyAgencyNpn(agency, 'rejected')} disabled={npnActionLoading === agency.id}>
                      <AlertCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No NPN on file</p>
              </div>
            )}
          </Card>
        </div>

        {/* Agency Owner */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Agency Owner</h2>
          {agency.owner ? (
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-shield-100 dark:bg-shield-900/30 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-shield-600 dark:text-shield-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{agency.owner.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{agency.owner.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No owner assigned</p>
          )}
        </Card>

        {/* Agents Table with NPN */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Agents ({agency.agents?.length ?? 0})</h2>
          {agency.agents && agency.agents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500 dark:text-slate-400">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">NPN</th>
                    <th className="pb-3 pr-4 font-medium">License</th>
                    <th className="pb-3 pr-4 font-medium">State</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {agency.agents.map((agent: AgentWithProfile) => {
                    const profile = agent.agent_profile;
                    const npn = profile?.npn;
                    const npnStatus = profile?.npn_verified || 'unverified';
                    const agentState = profile?.state;
                    const agentLookupUrl = profile?.license_lookup_url || (agentState ? STATE_LICENSE_URLS[agentState] : null);

                    return (
                      <tr key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                        <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">{agent.name}</td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{agent.email}</td>
                        <td className="py-3 pr-4">
                          {npn ? (
                            <span className="font-mono text-slate-900 dark:text-white">{npn}</span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {profile?.license_number ? (
                            <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{profile.license_number}</span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {agentState ? (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-700 dark:text-slate-200">{agentState}</span>
                              {agentLookupUrl && (
                                <a href={agentLookupUrl} target="_blank" rel="noopener noreferrer" title={`Verify on ${agentState} DOI`}>
                                  <ExternalLink className="h-3.5 w-3.5 text-shield-500 hover:text-shield-700 dark:text-shield-300" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <NpnBadge status={npnStatus} />
                        </td>
                        <td className="py-3 text-right">
                          {npn && npnStatus === 'pending' && profile && (
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="primary" size="sm" onClick={() => handleVerifyAgentNpn(agent, 'verified')}
                                disabled={npnActionLoading === profile.id}>
                                {npnActionLoading === profile.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleVerifyAgentNpn(agent, 'rejected')}
                                disabled={npnActionLoading === profile.id}>
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {npnStatus === 'verified' && (
                            <CheckCircle2 className="h-4 w-4 text-savings-500 inline" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No agents found for this agency.</p>
          )}
        </Card>
      </div>
    );
  }

  // ========== List View ==========
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agency Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and monitor all agencies on the platform</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900 dark:text-white">{total}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Agencies</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-savings-600 dark:text-savings-400">{activeCount}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-shield-600 dark:text-shield-400">{verifiedCount}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Verified</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900 dark:text-white">{totalAgents}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Agents</p>
        </Card>
      </div>

      <Input placeholder="Search agencies by name, code, or location..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-5 h-5" />} />

      <Card>
        {loading || detailLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-shield-500" />
          </div>
        ) : agencies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <Building2 className="h-10 w-10 mb-3 text-slate-300" />
            <p className="font-medium">No agencies found</p>
            <p className="text-sm mt-1">{search ? 'Try a different search term.' : 'No agencies have been created yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Agency</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Owner</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">NPN</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Location</th>
                  <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Agents</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Status</th>
                  <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {agencies.map(agency => (
                  <tr key={agency.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-shield-100 dark:bg-shield-900/30 text-shield-700 dark:text-shield-300 flex items-center justify-center">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-medium text-slate-900 dark:text-white">{agency.name}</span>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{agency.agency_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{agency.owner ? agency.owner.name : '—'}</td>
                    <td className="p-4 text-sm">
                      {agency.npn ? (
                        <div>
                          <span className="font-mono text-slate-900 dark:text-white">{agency.npn}</span>
                          <div className="mt-0.5"><NpnBadge status={agency.npn_verified} /></div>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{agency.city && agency.state ? `${agency.city}, ${agency.state}` : '—'}</td>
                    <td className="p-4 text-right text-sm font-medium text-slate-900 dark:text-white">{agency.agents?.length ?? 0}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={agency.is_verified ? 'success' : 'default'}>{agency.is_verified ? 'Verified' : 'Unverified'}</Badge>
                        <Badge variant={agency.is_active ? 'success' : 'danger'}>{agency.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewAgency(agency.id)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
