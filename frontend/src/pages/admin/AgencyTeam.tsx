import { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { api } from '@/services/api';
import { Plus, Search, Mail, Phone, Star, X, Loader2, UserX, UserCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AgentMember {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  avatar: string | null;
  joined_at: string | null;
  leads_count: number;
  policies_count: number;
  avg_rating: number;
  specialties: string[];
}

interface PendingInvite {
  id: number;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

interface TeamStats {
  active_agents: number;
  pending_invites: number;
  total_leads: number;
  total_policies: number;
}

interface TeamResponse {
  agents: AgentMember[];
  invites: PendingInvite[];
  stats: TeamStats;
}

export default function AgencyTeam() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await api.get<TeamResponse>('/agency/settings/team');
      setData(res);
    } catch {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.post('/agency/invites', { email: inviteEmail.trim() });
      toast.success('Invitation sent to ' + inviteEmail);
      setInviteEmail('');
      setInviteModalOpen(false);
      fetchTeam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleToggleStatus = async (agent: AgentMember) => {
    setTogglingId(agent.id);
    try {
      await api.post(`/agency/settings/agents/${agent.id}/toggle-status`);
      toast.success(agent.is_active ? `${agent.name} deactivated` : `${agent.name} activated`);
      fetchTeam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCancelInvite = async (invite: PendingInvite) => {
    try {
      await api.delete(`/agency/settings/invites/${invite.id}`);
      toast.success('Invite cancelled');
      fetchTeam();
    } catch {
      toast.error('Failed to cancel invite');
    }
  };

  const agents = data?.agents ?? [];
  const invites = data?.invites ?? [];
  const stats = data?.stats ?? { active_agents: 0, pending_invites: 0, total_leads: 0, total_policies: 0 };

  const filteredAgents = agents.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInvites = invites.filter(inv =>
    !search || inv.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-shield-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Team</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your agency's agents and team members</p>
        </div>
        <Button variant="shield" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setInviteModalOpen(true)}>
          Invite Agent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.active_agents}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Active Agents</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.pending_invites}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Pending Invites</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.total_leads}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Leads</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-savings-600 dark:text-savings-400">{stats.total_policies}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Policies</p>
        </Card>
      </div>

      <Input placeholder="Search team members..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-5 h-5" />} />

      {/* Pending Invites */}
      {filteredInvites.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Pending Invites</h2>
          <div className="space-y-2">
            {filteredInvites.map(invite => (
              <Card key={invite.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{invite.email}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Invited {new Date(invite.created_at).toLocaleDateString()} · Expires {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">Invited</Badge>
                    <button
                      onClick={() => handleCancelInvite(invite)}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:bg-red-900/30 transition-colors"
                      title="Cancel invite"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Team grid */}
      <div>
        {filteredAgents.length > 0 && (
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Team Members</h2>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map(member => (
            <Card key={member.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-shield flex items-center justify-center text-white font-bold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{member.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{member.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={member.is_active ? 'success' : 'danger'}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <button
                      onClick={() => handleToggleStatus(member)}
                      disabled={togglingId === member.id}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors disabled:opacity-50"
                      title={member.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {togglingId === member.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : member.is_active ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    {member.email}
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      {member.phone}
                    </div>
                  )}
                  {member.avg_rating > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      {member.avg_rating.toFixed(1)} rating
                    </div>
                  )}
                </div>

                {member.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {member.specialties.slice(0, 3).map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-full bg-shield-50 dark:bg-shield-900/30 text-shield-700 dark:text-shield-300 text-xs font-medium">{s}</span>
                    ))}
                    {member.specialties.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs">+{member.specialties.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{member.leads_count}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Leads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-savings-600 dark:text-savings-400">{member.policies_count}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Policies</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {filteredAgents.length === 0 && filteredInvites.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">No team members found. Invite agents to grow your team.</p>
        </Card>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setInviteModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700/50">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Invite Agent</h2>
                <button onClick={() => setInviteModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800">
                  <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter the email address of the agent you'd like to invite. They'll receive an email with a link to join your agency.
                </p>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="agent@example.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  leftIcon={<Mail className="w-5 h-5" />}
                  onKeyDown={e => { if (e.key === 'Enter') handleInvite(); }}
                />
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-700/50">
                <Button variant="ghost" onClick={() => setInviteModalOpen(false)}>Cancel</Button>
                <Button variant="shield" onClick={handleInvite} isLoading={inviting} disabled={!inviteEmail.trim()}>
                  Send Invite
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
