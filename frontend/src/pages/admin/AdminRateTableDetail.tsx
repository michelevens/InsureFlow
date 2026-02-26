import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { rateTableAdminService } from '@/services/api/rateTableAdmin';
import type { RateTableDetail, RateTableEntry, RateFactor, RateRider, RateFee, RateModalFactor } from '@/services/api/rateTableAdmin';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui';
import { ArrowLeft, Edit, Copy, ToggleLeft, Trash2, Loader2, Plus, Save, X } from 'lucide-react';

type TabId = 'entries' | 'factors' | 'riders' | 'fees' | 'modal_factors';

const TABS: { id: TabId; label: string }[] = [
  { id: 'entries', label: 'Base Rates' },
  { id: 'factors', label: 'Factors' },
  { id: 'riders', label: 'Riders' },
  { id: 'fees', label: 'Fees' },
  { id: 'modal_factors', label: 'Modal Factors' },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  inactive: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  draft: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  archived: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

// ── Inline input helper ───────────────────────────────────────────────────────

function InlineInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  className = '',
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400 w-full ${className}`}
    />
  );
}

function InlineSelect({
  value,
  onChange,
  options,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400 w-full bg-white dark:bg-slate-900 ${className}`}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── Row action buttons ────────────────────────────────────────────────────────

function RowActions({
  onEdit,
  onDelete,
  editing,
  onSave,
  onCancel,
  saving,
}: {
  onEdit: () => void;
  onDelete: () => void;
  editing: boolean;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  if (editing) {
    return (
      <div className="flex items-center gap-1 justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="p-1.5 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:bg-green-900/30 disabled:opacity-50"
          title="Save"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </button>
        <button onClick={onCancel} className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800" title="Cancel">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 justify-end">
      <button onClick={onEdit} className="p-1.5 rounded text-shield-600 dark:text-shield-400 hover:bg-shield-50 dark:bg-shield-900/30" title="Edit">
        <Edit className="w-4 h-4" />
      </button>
      <button onClick={onDelete} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:bg-red-900/30" title="Delete">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Tab: Base Rates ───────────────────────────────────────────────────────────

function EntriesTab({ tableId, entries, onReload }: { tableId: number; entries: RateTableEntry[]; onReload: () => void }) {
  const confirm = useConfirm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ rate_key: '', rate_value: '' });
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState({ rate_key: '', rate_value: '' });
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const startEdit = (entry: RateTableEntry) => {
    setEditingId(entry.id);
    setEditForm({ rate_key: entry.rate_key, rate_value: String(entry.rate_value) });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({ rate_key: '', rate_value: '' }); };

  const handleSave = async () => {
    if (!editForm.rate_key.trim()) { toast.error('Rate key is required'); return; }
    setSaving(true);
    try {
      await rateTableAdminService.updateEntry(tableId, editingId!, { rate_key: editForm.rate_key, rate_value: parseFloat(editForm.rate_value) || 0 });
      toast.success('Entry updated');
      setEditingId(null);
      onReload();
    } catch { toast.error('Failed to update entry'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Delete Entry', message: 'Delete this base rate entry?', confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    try {
      await rateTableAdminService.deleteEntry(tableId, id);
      toast.success('Entry deleted');
      onReload();
    } catch { toast.error('Failed to delete entry'); }
  };

  const handleAdd = async () => {
    if (!addForm.rate_key.trim()) { toast.error('Rate key is required'); return; }
    setAdding(true);
    try {
      await rateTableAdminService.createEntry(tableId, { rate_key: addForm.rate_key, rate_value: parseFloat(addForm.rate_value) || 0 });
      toast.success('Entry added');
      setAddForm({ rate_key: '', rate_value: '' });
      setShowAdd(false);
      onReload();
    } catch { toast.error('Failed to add entry'); }
    finally { setAdding(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
        <span className="text-sm text-slate-500 dark:text-slate-400">{entries.length} entries</span>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-shield-600 dark:text-shield-400 hover:text-shield-700 dark:text-shield-300"
        >
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800">
              <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Rate Key</th>
              <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Rate Value</th>
              <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {entries.map(entry => (
              <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                <td className="p-3 font-mono text-slate-700 dark:text-slate-200">
                  {editingId === entry.id
                    ? <InlineInput value={editForm.rate_key} onChange={v => setEditForm(f => ({ ...f, rate_key: v }))} placeholder="rate_key" />
                    : entry.rate_key}
                </td>
                <td className="p-3 text-slate-700 dark:text-slate-200">
                  {editingId === entry.id
                    ? <InlineInput value={editForm.rate_value} onChange={v => setEditForm(f => ({ ...f, rate_value: v }))} type="number" placeholder="0.00" className="max-w-[120px]" />
                    : entry.rate_value.toFixed(4)}
                </td>
                <td className="p-3">
                  <RowActions
                    onEdit={() => startEdit(entry)} onDelete={() => handleDelete(entry.id)}
                    editing={editingId === entry.id} onSave={handleSave} onCancel={cancelEdit} saving={saving}
                  />
                </td>
              </tr>
            ))}
            {entries.length === 0 && !showAdd && (
              <tr><td colSpan={3} className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No base rates defined.</td></tr>
            )}
            {showAdd && (
              <tr className="bg-shield-50 dark:bg-shield-900/30/40">
                <td className="p-3">
                  <InlineInput value={addForm.rate_key} onChange={v => setAddForm(f => ({ ...f, rate_key: v }))} placeholder="e.g. age_25_male" />
                </td>
                <td className="p-3">
                  <InlineInput value={addForm.rate_value} onChange={v => setAddForm(f => ({ ...f, rate_value: v }))} type="number" placeholder="0.00" className="max-w-[120px]" />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={handleAdd} disabled={adding} className="p-1.5 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:bg-green-900/30 disabled:opacity-50" title="Save">
                      {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setShowAdd(false); setAddForm({ rate_key: '', rate_value: '' }); }} className="p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800" title="Cancel">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Factors ──────────────────────────────────────────────────────────────

const APPLY_MODE_OPTIONS = [
  { value: 'multiply', label: 'Multiply' },
  { value: 'add', label: 'Add' },
  { value: 'subtract', label: 'Subtract' },
];

function FactorsTab({ tableId, factors, onReload }: { tableId: number; factors: RateFactor[]; onReload: () => void }) {
  const confirm = useConfirm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ factor_code: '', factor_label: '', option_value: '', apply_mode: 'multiply', factor_value: '' });
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ factor_code: '', factor_label: '', option_value: '', apply_mode: 'multiply', factor_value: '' });
  const [adding, setAdding] = useState(false);

  const groups = Array.from(new Set(factors.map(f => f.factor_code)));

  const startEdit = (f: RateFactor) => {
    setEditingId(f.id);
    setEditForm({ factor_code: f.factor_code, factor_label: f.factor_label, option_value: f.option_value, apply_mode: f.apply_mode, factor_value: String(f.factor_value) });
  };

  const cancelEdit = () => setEditingId(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await rateTableAdminService.updateFactor(tableId, editingId!, {
        factor_code: editForm.factor_code, factor_label: editForm.factor_label,
        option_value: editForm.option_value,
        apply_mode: editForm.apply_mode as RateFactor['apply_mode'],
        factor_value: parseFloat(editForm.factor_value) || 0,
      });
      toast.success('Factor updated');
      setEditingId(null);
      onReload();
    } catch { toast.error('Failed to update factor'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Delete Factor', message: 'Delete this factor?', confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    try {
      await rateTableAdminService.deleteFactor(tableId, id);
      toast.success('Factor deleted');
      onReload();
    } catch { toast.error('Failed to delete factor'); }
  };

  const handleAdd = async () => {
    if (!addForm.factor_code.trim() || !addForm.option_value.trim()) { toast.error('Factor code and option value are required'); return; }
    setAdding(true);
    try {
      await rateTableAdminService.createFactor(tableId, {
        factor_code: addForm.factor_code, factor_label: addForm.factor_label,
        option_value: addForm.option_value,
        apply_mode: addForm.apply_mode as RateFactor['apply_mode'],
        factor_value: parseFloat(addForm.factor_value) || 0,
      });
      toast.success('Factor added');
      setAddForm({ factor_code: '', factor_label: '', option_value: '', apply_mode: 'multiply', factor_value: '' });
      setShowAdd(false);
      onReload();
    } catch { toast.error('Failed to add factor'); }
    finally { setAdding(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
        <span className="text-sm text-slate-500 dark:text-slate-400">{factors.length} factors across {groups.length} group{groups.length !== 1 ? 's' : ''}</span>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-1.5 text-sm font-medium text-shield-600 dark:text-shield-400 hover:text-shield-700 dark:text-shield-300">
          <Plus className="w-4 h-4" /> Add Factor
        </button>
      </div>

      {groups.map(group => {
        const groupFactors = factors.filter(f => f.factor_code === group);
        const groupLabel = groupFactors[0]?.factor_label || group;
        return (
          <div key={group}>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 px-3 py-2 border-y border-slate-100 dark:border-slate-700/50">
              {groupLabel} <span className="font-normal text-slate-400 dark:text-slate-500 ml-1">({group})</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 py-2">Option Value</th>
                  <th className="text-left text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 py-2">Apply Mode</th>
                  <th className="text-left text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 py-2">Factor Value</th>
                  <th className="text-right text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {groupFactors.map(factor => (
                  <tr key={factor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                    <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-200">
                      {editingId === factor.id
                        ? <InlineInput value={editForm.option_value} onChange={v => setEditForm(f => ({ ...f, option_value: v }))} placeholder="option_value" />
                        : factor.option_value}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === factor.id
                        ? <InlineSelect value={editForm.apply_mode} onChange={v => setEditForm(f => ({ ...f, apply_mode: v }))} options={APPLY_MODE_OPTIONS} />
                        : <span className="capitalize text-slate-600 dark:text-slate-300">{factor.apply_mode}</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                      {editingId === factor.id
                        ? <InlineInput value={editForm.factor_value} onChange={v => setEditForm(f => ({ ...f, factor_value: v }))} type="number" className="max-w-[100px]" />
                        : factor.factor_value.toFixed(4)}
                    </td>
                    <td className="px-3 py-2">
                      <RowActions
                        onEdit={() => startEdit(factor)} onDelete={() => handleDelete(factor.id)}
                        editing={editingId === factor.id} onSave={handleSave} onCancel={cancelEdit} saving={saving}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {factors.length === 0 && !showAdd && (
        <p className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No factors defined.</p>
      )}

      {showAdd && (
        <div className="border-t border-slate-100 dark:border-slate-700/50 p-4 bg-shield-50 dark:bg-shield-900/30/30">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">New Factor</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Factor Code</label>
              <InlineInput value={addForm.factor_code} onChange={v => setAddForm(f => ({ ...f, factor_code: v }))} placeholder="e.g. smoker" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Factor Label</label>
              <InlineInput value={addForm.factor_label} onChange={v => setAddForm(f => ({ ...f, factor_label: v }))} placeholder="e.g. Tobacco Use" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Option Value</label>
              <InlineInput value={addForm.option_value} onChange={v => setAddForm(f => ({ ...f, option_value: v }))} placeholder="e.g. yes" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Apply Mode</label>
              <InlineSelect value={addForm.apply_mode} onChange={v => setAddForm(f => ({ ...f, apply_mode: v }))} options={APPLY_MODE_OPTIONS} />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Factor Value</label>
              <InlineInput value={addForm.factor_value} onChange={v => setAddForm(f => ({ ...f, factor_value: v }))} type="number" placeholder="1.25" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => { setShowAdd(false); }} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button onClick={handleAdd} disabled={adding} className="flex items-center gap-1 text-sm text-white bg-shield-600 hover:bg-shield-700 px-3 py-1.5 rounded disabled:opacity-50">
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Add Factor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Riders ───────────────────────────────────────────────────────────────

const RIDER_APPLY_OPTIONS = [
  { value: 'add', label: 'Add' },
  { value: 'multiply', label: 'Multiply' },
];

function RidersTab({ tableId, riders, onReload }: { tableId: number; riders: RateRider[]; onReload: () => void }) {
  const confirm = useConfirm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ rider_code: '', rider_label: '', apply_mode: 'add', rider_value: '' });
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ rider_code: '', rider_label: '', apply_mode: 'add', rider_value: '' });
  const [adding, setAdding] = useState(false);

  const startEdit = (r: RateRider) => {
    setEditingId(r.id);
    setEditForm({ rider_code: r.rider_code, rider_label: r.rider_label, apply_mode: r.apply_mode, rider_value: String(r.rider_value) });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await rateTableAdminService.updateRider(tableId, editingId!, {
        rider_code: editForm.rider_code, rider_label: editForm.rider_label,
        apply_mode: editForm.apply_mode as RateRider['apply_mode'],
        rider_value: parseFloat(editForm.rider_value) || 0,
      });
      toast.success('Rider updated');
      setEditingId(null);
      onReload();
    } catch { toast.error('Failed to update rider'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Delete Rider', message: 'Delete this rider?', confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    try {
      await rateTableAdminService.deleteRider(tableId, id);
      toast.success('Rider deleted');
      onReload();
    } catch { toast.error('Failed to delete rider'); }
  };

  const handleAdd = async () => {
    if (!addForm.rider_code.trim()) { toast.error('Rider code is required'); return; }
    setAdding(true);
    try {
      await rateTableAdminService.createRider(tableId, {
        rider_code: addForm.rider_code, rider_label: addForm.rider_label,
        apply_mode: addForm.apply_mode as RateRider['apply_mode'],
        rider_value: parseFloat(addForm.rider_value) || 0,
      });
      toast.success('Rider added');
      setAddForm({ rider_code: '', rider_label: '', apply_mode: 'add', rider_value: '' });
      setShowAdd(false);
      onReload();
    } catch { toast.error('Failed to add rider'); }
    finally { setAdding(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
        <span className="text-sm text-slate-500 dark:text-slate-400">{riders.length} riders</span>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-1.5 text-sm font-medium text-shield-600 dark:text-shield-400 hover:text-shield-700 dark:text-shield-300">
          <Plus className="w-4 h-4" /> Add Rider
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800">
              <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Rider Code</th>
              <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Rider Name</th>
              <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Apply Mode</th>
              <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Value</th>
              <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {riders.map(rider => (
              <tr key={rider.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                <td className="p-3 font-mono text-slate-700 dark:text-slate-200">
                  {editingId === rider.id
                    ? <InlineInput value={editForm.rider_code} onChange={v => setEditForm(f => ({ ...f, rider_code: v }))} />
                    : rider.rider_code}
                </td>
                <td className="p-3 text-slate-700 dark:text-slate-200">
                  {editingId === rider.id
                    ? <InlineInput value={editForm.rider_label} onChange={v => setEditForm(f => ({ ...f, rider_label: v }))} />
                    : rider.rider_label}
                </td>
                <td className="p-3">
                  {editingId === rider.id
                    ? <InlineSelect value={editForm.apply_mode} onChange={v => setEditForm(f => ({ ...f, apply_mode: v }))} options={RIDER_APPLY_OPTIONS} />
                    : <span className="capitalize text-slate-600 dark:text-slate-300">{rider.apply_mode}</span>}
                </td>
                <td className="p-3 text-slate-700 dark:text-slate-200">
                  {editingId === rider.id
                    ? <InlineInput value={editForm.rider_value} onChange={v => setEditForm(f => ({ ...f, rider_value: v }))} type="number" className="max-w-[100px]" />
                    : rider.rider_value.toFixed(4)}
                </td>
                <td className="p-3">
                  <RowActions
                    onEdit={() => startEdit(rider)} onDelete={() => handleDelete(rider.id)}
                    editing={editingId === rider.id} onSave={handleSave} onCancel={() => setEditingId(null)} saving={saving}
                  />
                </td>
              </tr>
            ))}
            {riders.length === 0 && !showAdd && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No riders defined.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {showAdd && (
        <div className="border-t border-slate-100 dark:border-slate-700/50 p-4 bg-shield-50 dark:bg-shield-900/30/30">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">New Rider</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Code</label>
              <InlineInput value={addForm.rider_code} onChange={v => setAddForm(f => ({ ...f, rider_code: v }))} placeholder="e.g. WOP" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Name</label>
              <InlineInput value={addForm.rider_label} onChange={v => setAddForm(f => ({ ...f, rider_label: v }))} placeholder="e.g. Waiver of Premium" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Apply Mode</label>
              <InlineSelect value={addForm.apply_mode} onChange={v => setAddForm(f => ({ ...f, apply_mode: v }))} options={RIDER_APPLY_OPTIONS} />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Value</label>
              <InlineInput value={addForm.rider_value} onChange={v => setAddForm(f => ({ ...f, rider_value: v }))} type="number" placeholder="0.00" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setShowAdd(false)} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button onClick={handleAdd} disabled={adding} className="flex items-center gap-1 text-sm text-white bg-shield-600 hover:bg-shield-700 px-3 py-1.5 rounded disabled:opacity-50">
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Add Rider
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Fees ─────────────────────────────────────────────────────────────────

const FEE_TYPE_OPTIONS = [
  { value: 'fee', label: 'Fee' },
  { value: 'credit', label: 'Credit' },
];

const FEE_APPLY_OPTIONS = [
  { value: 'add', label: 'Add (Flat)' },
  { value: 'percent', label: 'Percent' },
];

function FeesTab({ tableId, fees, onReload }: { tableId: number; fees: RateFee[]; onReload: () => void }) {
  const confirm = useConfirm();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ fee_code: '', fee_label: '', fee_type: 'fee', apply_mode: 'add', fee_value: '' });
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ fee_code: '', fee_label: '', fee_type: 'fee', apply_mode: 'add', fee_value: '' });
  const [adding, setAdding] = useState(false);

  const startEdit = (f: RateFee) => {
    setEditingId(f.id);
    setEditForm({ fee_code: f.fee_code, fee_label: f.fee_label, fee_type: f.fee_type, apply_mode: f.apply_mode, fee_value: String(f.fee_value) });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await rateTableAdminService.updateFee(tableId, editingId!, {
        fee_code: editForm.fee_code, fee_label: editForm.fee_label,
        fee_type: editForm.fee_type as RateFee['fee_type'],
        apply_mode: editForm.apply_mode as RateFee['apply_mode'],
        fee_value: parseFloat(editForm.fee_value) || 0,
      });
      toast.success('Fee updated');
      setEditingId(null);
      onReload();
    } catch { toast.error('Failed to update fee'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Delete Fee', message: 'Delete this fee?', confirmLabel: 'Delete', variant: 'danger' });
    if (!ok) return;
    try {
      await rateTableAdminService.deleteFee(tableId, id);
      toast.success('Fee deleted');
      onReload();
    } catch { toast.error('Failed to delete fee'); }
  };

  const handleAdd = async () => {
    if (!addForm.fee_code.trim()) { toast.error('Fee code is required'); return; }
    setAdding(true);
    try {
      await rateTableAdminService.createFee(tableId, {
        fee_code: addForm.fee_code, fee_label: addForm.fee_label,
        fee_type: addForm.fee_type as RateFee['fee_type'],
        apply_mode: addForm.apply_mode as RateFee['apply_mode'],
        fee_value: parseFloat(addForm.fee_value) || 0,
      });
      toast.success('Fee added');
      setAddForm({ fee_code: '', fee_label: '', fee_type: 'fee', apply_mode: 'add', fee_value: '' });
      setShowAdd(false);
      onReload();
    } catch { toast.error('Failed to add fee'); }
    finally { setAdding(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
        <span className="text-sm text-slate-500 dark:text-slate-400">{fees.length} fees</span>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-1.5 text-sm font-medium text-shield-600 dark:text-shield-400 hover:text-shield-700 dark:text-shield-300">
          <Plus className="w-4 h-4" /> Add Fee
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800">
              <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Fee Code</th>
              <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Fee Name</th>
              <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Type</th>
              <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Apply Mode</th>
              <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Value</th>
              <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {fees.map(fee => (
              <tr key={fee.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                <td className="p-3 font-mono text-slate-700 dark:text-slate-200">
                  {editingId === fee.id
                    ? <InlineInput value={editForm.fee_code} onChange={v => setEditForm(f => ({ ...f, fee_code: v }))} />
                    : fee.fee_code}
                </td>
                <td className="p-3 text-slate-700 dark:text-slate-200">
                  {editingId === fee.id
                    ? <InlineInput value={editForm.fee_label} onChange={v => setEditForm(f => ({ ...f, fee_label: v }))} />
                    : fee.fee_label}
                </td>
                <td className="p-3">
                  {editingId === fee.id
                    ? <InlineSelect value={editForm.fee_type} onChange={v => setEditForm(f => ({ ...f, fee_type: v }))} options={FEE_TYPE_OPTIONS} />
                    : <Badge className={fee.fee_type === 'credit' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}>{fee.fee_type}</Badge>}
                </td>
                <td className="p-3">
                  {editingId === fee.id
                    ? <InlineSelect value={editForm.apply_mode} onChange={v => setEditForm(f => ({ ...f, apply_mode: v }))} options={FEE_APPLY_OPTIONS} />
                    : <span className="capitalize text-slate-600 dark:text-slate-300">{fee.apply_mode}</span>}
                </td>
                <td className="p-3 text-slate-700 dark:text-slate-200">
                  {editingId === fee.id
                    ? <InlineInput value={editForm.fee_value} onChange={v => setEditForm(f => ({ ...f, fee_value: v }))} type="number" className="max-w-[100px]" />
                    : fee.fee_value.toFixed(4)}
                </td>
                <td className="p-3">
                  <RowActions
                    onEdit={() => startEdit(fee)} onDelete={() => handleDelete(fee.id)}
                    editing={editingId === fee.id} onSave={handleSave} onCancel={() => setEditingId(null)} saving={saving}
                  />
                </td>
              </tr>
            ))}
            {fees.length === 0 && !showAdd && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No fees defined.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {showAdd && (
        <div className="border-t border-slate-100 dark:border-slate-700/50 p-4 bg-shield-50 dark:bg-shield-900/30/30">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">New Fee</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Code</label>
              <InlineInput value={addForm.fee_code} onChange={v => setAddForm(f => ({ ...f, fee_code: v }))} placeholder="e.g. POLICY_FEE" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Name</label>
              <InlineInput value={addForm.fee_label} onChange={v => setAddForm(f => ({ ...f, fee_label: v }))} placeholder="e.g. Policy Fee" />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Type</label>
              <InlineSelect value={addForm.fee_type} onChange={v => setAddForm(f => ({ ...f, fee_type: v }))} options={FEE_TYPE_OPTIONS} />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Apply Mode</label>
              <InlineSelect value={addForm.apply_mode} onChange={v => setAddForm(f => ({ ...f, apply_mode: v }))} options={FEE_APPLY_OPTIONS} />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Value</label>
              <InlineInput value={addForm.fee_value} onChange={v => setAddForm(f => ({ ...f, fee_value: v }))} type="number" placeholder="0.00" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setShowAdd(false)} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button onClick={handleAdd} disabled={adding} className="flex items-center gap-1 text-sm text-white bg-shield-600 hover:bg-shield-700 px-3 py-1.5 rounded disabled:opacity-50">
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Add Fee
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Modal Factors ────────────────────────────────────────────────────────

const MODE_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semiannual: 'Semi-Annual',
  annual: 'Annual',
};

function ModalFactorsTab({ modalFactors }: { tableId: number; modalFactors: RateModalFactor[]; onReload: () => void }) {
  const orderedModes = ['annual', 'semiannual', 'quarterly', 'monthly'];
  const sorted = [...modalFactors].sort((a, b) => orderedModes.indexOf(a.mode) - orderedModes.indexOf(b.mode));

  return (
    <div className="overflow-x-auto">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
        <span className="text-xs text-slate-400 dark:text-slate-500">Modal factors are read-only. Manage them via the API.</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800">
            <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Payment Mode</th>
            <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Factor Value</th>
            <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-3">Flat Fee</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sorted.map(m => (
            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
              <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{MODE_LABELS[m.mode] ?? m.mode}</td>
              <td className="p-3 text-slate-700 dark:text-slate-200">{m.factor.toFixed(4)}</td>
              <td className="p-3 text-slate-700 dark:text-slate-200">{`$${m.flat_fee.toFixed(2)}`}</td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={3} className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No modal factors defined.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminRateTableDetailPage() {
  const confirm = useConfirm();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [table, setTable] = useState<RateTableDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('entries');
  const [toggling, setToggling] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await rateTableAdminService.get(Number(id));
      setTable(data);
    } catch {
      toast.error('Failed to load rate table');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleToggle = async () => {
    if (!table) return;
    setToggling(true);
    try {
      const result = await rateTableAdminService.toggleStatus(table.id);
      toast.success(result.message || (result.is_active ? 'Rate table activated' : 'Rate table deactivated'));
      await load();
    } catch {
      toast.error('Failed to toggle status');
    } finally {
      setToggling(false);
    }
  };

  const handleClone = async () => {
    if (!table) return;
    const okClone = await confirm({ title: 'Clone Rate Table', message: `Clone "${table.name || table.version}"? A new draft copy will be created.`, confirmLabel: 'Clone', variant: 'info' });
    if (!okClone) return;
    setCloning(true);
    try {
      const cloned = await rateTableAdminService.clone(table.id);
      toast.success('Rate table cloned successfully');
      navigate(`/admin/rate-tables/${cloned.id}`);
    } catch {
      toast.error('Failed to clone rate table');
    } finally {
      setCloning(false);
    }
  };

  const handleDelete = async () => {
    if (!table) return;
    const okDel = await confirm({ title: 'Delete Rate Table', message: `Permanently delete "${table.name || table.version}"? This cannot be undone.`, confirmLabel: 'Delete', variant: 'danger' });
    if (!okDel) return;
    setDeleting(true);
    try {
      await rateTableAdminService.delete(table.id);
      toast.success('Rate table deleted');
      navigate('/admin/rate-tables');
    } catch {
      toast.error('Failed to delete rate table');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-shield-500" />
      </div>
    );
  }

  if (!table) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-500 dark:text-slate-400 gap-4">
        <p className="font-medium">Rate table not found.</p>
        <Link to="/admin/rate-tables" className="text-shield-600 dark:text-shield-400 hover:underline text-sm">Back to Rate Tables</Link>
      </div>
    );
  }

  const statusClass = STATUS_COLORS[table.is_active ? 'active' : 'inactive'] ?? STATUS_COLORS.inactive;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/admin/rate-tables" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200">
        <ArrowLeft className="w-4 h-4" /> Back to Rate Tables
      </Link>

      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 shadow-sm dark:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{table.name || `${table.carrier?.name ?? 'Unknown Carrier'} – v${table.version}`}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-shield-100 dark:bg-shield-900/30 text-shield-700 dark:text-shield-300 px-2.5 py-0.5 text-xs font-medium">
                {table.carrier?.name ?? 'No Carrier'}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 text-xs font-medium capitalize">
                {table.product_type}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 text-xs font-mono">
                v{table.version}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass}`}>
                {table.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {table.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-prose">{table.description}</p>
            )}
            {(table.effective_date || table.expiration_date) && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {table.effective_date && <>Effective: {table.effective_date}</>}
                {table.effective_date && table.expiration_date && ' · '}
                {table.expiration_date && <>Expires: {table.expiration_date}</>}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to={`/admin/rate-tables/${table.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
            >
              <Edit className="w-4 h-4" /> Edit
            </Link>
            <button
              onClick={handleClone}
              disabled={cloning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {cloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />} Clone
            </button>
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ToggleLeft className="w-4 h-4" />}
              {table.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/30 transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabbed content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm dark:shadow-none overflow-hidden">
        {/* Tab bar */}
        <div className="border-b border-slate-200 dark:border-slate-700/50 flex overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-shield-600 text-shield-700 dark:text-shield-300 bg-white dark:bg-slate-900'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800'
              }`}
            >
              {tab.label}
              {tab.id === 'entries' && table.entries.length > 0 && (
                <span className="ml-1.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5">{table.entries.length}</span>
              )}
              {tab.id === 'factors' && table.factors.length > 0 && (
                <span className="ml-1.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5">{table.factors.length}</span>
              )}
              {tab.id === 'riders' && table.riders.length > 0 && (
                <span className="ml-1.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5">{table.riders.length}</span>
              )}
              {tab.id === 'fees' && table.fees.length > 0 && (
                <span className="ml-1.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5">{table.fees.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'entries' && (
          <EntriesTab tableId={table.id} entries={table.entries} onReload={load} />
        )}
        {activeTab === 'factors' && (
          <FactorsTab tableId={table.id} factors={table.factors} onReload={load} />
        )}
        {activeTab === 'riders' && (
          <RidersTab tableId={table.id} riders={table.riders} onReload={load} />
        )}
        {activeTab === 'fees' && (
          <FeesTab tableId={table.id} fees={table.fees} onReload={load} />
        )}
        {activeTab === 'modal_factors' && (
          <ModalFactorsTab tableId={table.id} modalFactors={table.modal_factors} onReload={load} />
        )}
      </div>
    </div>
  );
}
