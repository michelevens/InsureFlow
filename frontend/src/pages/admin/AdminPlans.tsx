import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { DollarSign, Plus, Edit, Trash2, CheckCircle2, Users, Loader2, X } from 'lucide-react';
import { adminService } from '@/services/api/admin';
import { toast } from 'sonner';
import type { SubscriptionPlan } from '@/types';

const emptyForm = { name: '', slug: '', role: 'agent', price_monthly: 0, price_yearly: 0, is_active: true, is_popular: false, sort_order: 0 };

export default function AdminPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPlans();
      setPlans(data);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const activePlans = plans.filter(p => p.is_active).length;

  const openModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setForm({ name: plan.name, slug: plan.slug, role: plan.role, price_monthly: plan.price_monthly, price_yearly: plan.price_yearly, is_active: plan.is_active, is_popular: plan.is_popular, sort_order: plan.sort_order });
    } else {
      setEditingPlan(null);
      setForm(emptyForm);
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editingPlan) {
        await adminService.updatePlan(editingPlan.id, form);
        toast.success('Plan updated');
      } else {
        await adminService.createPlan(form);
        toast.success('Plan created');
      }
      setShowModal(false);
      loadPlans();
    } catch {
      toast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      await adminService.updatePlan(plan.id, { is_active: !plan.is_active });
      toast.success(plan.is_active ? 'Plan deactivated' : 'Plan activated');
      loadPlans();
    } catch {
      toast.error('Failed to update plan');
    }
  };

  const handleDelete = async (plan: SubscriptionPlan) => {
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    try {
      await adminService.deletePlan(plan.id);
      toast.success('Plan deleted');
      loadPlans();
    } catch {
      toast.error('Failed to delete plan');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1></div>
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-shield-500 mx-auto" />
          <p className="text-slate-500 mt-2">Loading plans...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1>
          <p className="text-slate-500 mt-1">Manage pricing and subscription tiers</p>
        </div>
        <Button variant="shield" leftIcon={<Plus className="w-4 h-4" />} onClick={() => openModal()}>Create Plan</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-savings-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">{plans.length}</p>
              <p className="text-sm text-slate-500">Total Plans</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-confidence-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">{activePlans}</p>
              <p className="text-sm text-slate-500">Active Plans</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-shield-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">{plans.filter(p => p.role === 'agent' || p.role === 'agency_owner').length}</p>
              <p className="text-sm text-slate-500">Agent/Agency Plans</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className="flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="capitalize">{plan.role.replace('_', ' ')}</Badge>
                <button onClick={() => handleToggleActive(plan)}>
                  <Badge variant={plan.is_active ? 'success' : 'default'} className="cursor-pointer">
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-slate-900">${plan.price_monthly}</span>
                <span className="text-slate-500">/mo</span>
              </div>
              {plan.price_yearly > 0 && (
                <p className="text-sm text-slate-500 mb-4">
                  ${plan.price_yearly}/year
                  {plan.price_monthly > 0 && ` (save ${Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)`}
                </p>
              )}
              {plan.features && typeof plan.features === 'object' && (
                <div className="space-y-2 mb-4">
                  {Object.entries(plan.features).filter(([, v]) => v).slice(0, 6).map(([k]) => (
                    <div key={k} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-savings-500 flex-shrink-0" />
                      {k.replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              )}
              {plan.is_popular && <Badge variant="shield" className="mb-2">Popular</Badge>}
            </div>
            <div className="border-t border-slate-100 p-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" leftIcon={<Edit className="w-4 h-4" />} onClick={() => openModal(plan)}>Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(plan)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{editingPlan ? 'Edit Plan' : 'Create Plan'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Agent Pro" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Slug</label>
                <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="agent-pro" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Target Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500">
                  <option value="agent">Agent</option>
                  <option value="agency_owner">Agency Owner</option>
                  <option value="carrier">Carrier</option>
                  <option value="consumer">Consumer</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Monthly Price</label>
                  <Input type="number" value={form.price_monthly} onChange={e => setForm({ ...form, price_monthly: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Annual Price</label>
                  <Input type="number" value={form.price_yearly} onChange={e => setForm({ ...form, price_yearly: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-shield-600 focus:ring-shield-500" />
                  <span className="text-sm text-slate-700">Active</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={form.is_popular} onChange={e => setForm({ ...form, is_popular: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-shield-600 focus:ring-shield-500" />
                  <span className="text-sm text-slate-700">Popular</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editingPlan ? 'Update' : 'Create'}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
