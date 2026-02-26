import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { claimService } from '@/services/api/claims';
import type { Claim } from '@/services/api/claims';
import { Badge } from '@/components/ui';
import {
  AlertTriangle, Plus, ChevronRight, FileText, Calendar, DollarSign,
  Search, Filter, X, Clock, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const claimStatuses = [
  { value: '', label: 'All Statuses' },
  { value: 'reported', label: 'Reported' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'settled', label: 'Settled' },
  { value: 'closed', label: 'Closed' },
];

const claimTypes = [
  { value: '', label: 'All Types' },
  { value: 'property_damage', label: 'Property Damage' },
  { value: 'liability', label: 'Liability' },
  { value: 'auto_collision', label: 'Auto Collision' },
  { value: 'auto_comprehensive', label: 'Auto Comprehensive' },
  { value: 'health', label: 'Health' },
  { value: 'life', label: 'Life' },
  { value: 'other', label: 'Other' },
];

const statusConfig: Record<string, { variant: 'default' | 'shield' | 'success' | 'warning' | 'danger' | 'info' | 'outline'; icon: typeof Clock }> = {
  reported: { variant: 'info', icon: Clock },
  under_review: { variant: 'warning', icon: Search },
  investigating: { variant: 'shield', icon: Search },
  approved: { variant: 'success', icon: CheckCircle },
  denied: { variant: 'danger', icon: XCircle },
  settled: { variant: 'success', icon: DollarSign },
  closed: { variant: 'outline', icon: CheckCircle },
};

function FileClaimModal({ onClose, onFiled }: { onClose: () => void; onFiled: () => void }) {
  const [form, setForm] = useState({
    policy_id: '',
    type: '',
    date_of_loss: '',
    description: '',
    location: '',
    estimated_amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await claimService.fileClaim({
        policy_id: Number(form.policy_id),
        type: form.type,
        date_of_loss: form.date_of_loss,
        description: form.description,
        location: form.location || undefined,
        estimated_amount: form.estimated_amount ? Number(form.estimated_amount) : undefined,
      });
      onFiled();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to file claim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">File a Claim</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg">
            <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Policy ID</label>
            <input
              type="number"
              value={form.policy_id}
              onChange={e => setForm(f => ({ ...f, policy_id: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400"
              placeholder="Enter policy ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Claim Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400"
              required
            >
              <option value="">Select type...</option>
              {claimTypes.filter(t => t.value).map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Date of Loss</label>
            <input
              type="date"
              value={form.date_of_loss}
              onChange={e => setForm(f => ({ ...f, date_of_loss: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400"
              rows={3}
              placeholder="Describe what happened..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Location (optional)</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400"
              placeholder="Where did the incident occur?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Estimated Amount (optional)</label>
            <input
              type="number"
              step="0.01"
              value={form.estimated_amount}
              onChange={e => setForm(f => ({ ...f, estimated_amount: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400"
              placeholder="$0.00"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-shield-600 to-confidence-600 text-white text-sm font-semibold hover:shadow-lg disabled:opacity-50"
            >
              {loading ? 'Filing...' : 'File Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClaimDetail({ claim, onClose, onUpdated }: { claim: Claim; onClose: () => void; onUpdated: () => void }) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    claimService.getClaim(claim.id).then(c => { setDetail(c); setLoading(false); }).catch(() => { toast.error('Failed to load claim details'); setLoading(false); });
  }, [claim.id]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setAddingNote(true);
    try {
      await claimService.addNote(claim.id, note);
      setNote('');
      const updated = await claimService.getClaim(claim.id);
      setDetail(updated);
    } catch { toast.error('Failed to add note'); }
    setAddingNote(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await claimService.updateStatus(claim.id, { status: newStatus });
      const updated = await claimService.getClaim(claim.id);
      setDetail(updated);
      onUpdated();
    } catch { toast.error('Failed to update claim status'); }
  };

  const isAgent = user && ['agent', 'agency_owner', 'admin', 'superadmin'].includes(user.role);
  const cfg = statusConfig[detail?.status || 'reported'] || statusConfig.reported;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{detail?.claim_number || claim.claim_number}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{detail?.policy?.policy_number} &middot; {detail?.type?.replace(/_/g, ' ')}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-lg">
            <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400 dark:text-slate-500" /></div>
        ) : detail ? (
          <div className="p-6 space-y-6">
            {/* Status + amounts */}
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Status</p>
                <Badge variant={cfg.variant}>{detail.status.replace(/_/g, ' ')}</Badge>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Date of Loss</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{new Date(detail.date_of_loss).toLocaleDateString()}</p>
              </div>
              {detail.estimated_amount && (
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Estimated</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">${Number(detail.estimated_amount).toLocaleString()}</p>
                </div>
              )}
              {detail.approved_amount && (
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Approved</p>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">${Number(detail.approved_amount).toLocaleString()}</p>
                </div>
              )}
              {detail.settlement_amount && (
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Settlement</p>
                  <p className="text-sm font-bold text-green-700 dark:text-green-300">${Number(detail.settlement_amount).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Description</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{detail.description}</p>
            </div>

            {/* Status actions for agents */}
            {isAgent && !['closed', 'denied'].includes(detail.status) && (
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {['under_review', 'investigating', 'approved', 'denied', 'settled', 'closed']
                    .filter(s => s !== detail.status)
                    .map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 capitalize"
                      >
                        {s.replace(/_/g, ' ')}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Activity Timeline</p>
              <div className="space-y-3">
                {(detail.activities || []).map(a => (
                  <div key={a.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-shield-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-200">{a.description}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {a.actor?.name || 'System'} &middot; {new Date(a.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add note */}
            <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4">
              <div className="flex gap-2">
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400"
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!note.trim() || addingNote}
                  className="px-4 py-2 rounded-xl bg-shield-600 text-white text-sm font-medium hover:bg-shield-700 disabled:opacity-50"
                >
                  {addingNote ? '...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Claims() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFile, setShowFile] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const res = await claimService.getClaims({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setClaims(res.data);
    } catch { toast.error('Failed to load claims'); }
    setLoading(false);
  };

  useEffect(() => { loadClaims(); }, [statusFilter, typeFilter]);

  const isConsumer = user?.role === 'consumer';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{isConsumer ? 'My Claims' : 'Claims Queue'}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isConsumer ? 'Track your insurance claims' : 'Manage and review claims'}
          </p>
        </div>
        <button
          onClick={() => setShowFile(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-shield-600 to-confidence-600 text-white text-sm font-semibold hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> File Claim
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400"
          >
            {claimStatuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-700/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400"
        >
          {claimTypes.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Claims list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 dark:text-slate-500" />
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No claims found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            {isConsumer ? 'File a claim when you need to report an incident' : 'No claims match your filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map(claim => {
            const cfg = statusConfig[claim.status] || statusConfig.reported;
            const StatusIcon = cfg.icon;
            return (
              <div
                key={claim.id}
                onClick={() => setSelectedClaim(claim)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5 hover:shadow-md hover:border-shield-200 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-white">{claim.claim_number}</p>
                        <Badge variant={cfg.variant}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {claim.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {claim.type.replace(/_/g, ' ')} &middot; {claim.policy?.policy_number || `Policy #${claim.policy_id}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(claim.date_of_loss).toLocaleDateString()}
                      </div>
                      {claim.estimated_amount && (
                        <div className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">
                          <DollarSign className="w-3.5 h-3.5" />
                          {Number(claim.estimated_amount).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showFile && (
        <FileClaimModal
          onClose={() => setShowFile(false)}
          onFiled={() => { setShowFile(false); loadClaims(); }}
        />
      )}
      {selectedClaim && (
        <ClaimDetail
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onUpdated={loadClaims}
        />
      )}
    </div>
  );
}
