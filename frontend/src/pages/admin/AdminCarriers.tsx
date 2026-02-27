import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button, Input } from '@/components/ui';
import { Search, ArrowLeft, Loader2, Building, Globe, Edit, X, Package, ArrowRight, Shield, MapPin, Calendar, AlertTriangle, Tag } from 'lucide-react';
import { adminService } from '@/services/api/admin';
import { toast } from 'sonner';
import type { Carrier } from '@/types';

type CarrierWithCounts = Carrier & { products?: unknown[]; agency_appointments_count?: number };

export default function AdminCarriers() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierWithCounts | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', slug: '', description: '', website: '', am_best_rating: '', is_active: true });
  const [editSaving, setEditSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => { loadCarriers(); }, []);

  const loadCarriers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCarriers(search ? { search } : undefined);
      setCarriers(data);
    } catch {
      toast.error('Failed to load carriers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { loadCarriers(); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleViewCarrier = async (id: number) => {
    setDetailLoading(true);
    try {
      const carrier = await adminService.getCarrier(id);
      setSelectedCarrier(carrier);
    } catch {
      toast.error('Failed to load carrier details');
    } finally {
      setDetailLoading(false);
    }
  };

  const openEditModal = (carrier?: Carrier) => {
    if (carrier) {
      setEditingId(carrier.id);
      setEditForm({ name: carrier.name, slug: carrier.slug, description: carrier.description || '', website: carrier.website || '', am_best_rating: carrier.am_best_rating || '', is_active: carrier.is_active });
    } else {
      setEditingId(null);
      setEditForm({ name: '', slug: '', description: '', website: '', am_best_rating: '', is_active: true });
    }
    setShowEditModal(true);
  };

  const handleSaveCarrier = async () => {
    if (!editForm.name.trim()) { toast.error('Name is required'); return; }
    setEditSaving(true);
    try {
      if (editingId) {
        await adminService.updateCarrier(editingId, editForm);
        toast.success('Carrier updated');
        if (selectedCarrier && selectedCarrier.id === editingId) {
          handleViewCarrier(editingId);
        }
      } else {
        await adminService.createCarrier(editForm);
        toast.success('Carrier created');
      }
      setShowEditModal(false);
      loadCarriers();
    } catch {
      toast.error('Failed to save carrier');
    } finally {
      setEditSaving(false);
    }
  };

  const activeCount = carriers.filter(c => c.is_active).length;

  // ========== Detail View ==========
  if (selectedCarrier) {
    const carrier = selectedCarrier;
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setSelectedCarrier(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Carriers
        </Button>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-shield-100 dark:bg-shield-900/30 flex items-center justify-center">
                <Building className="h-7 w-7 text-shield-600 dark:text-shield-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{carrier.name}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{carrier.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {carrier.am_best_rating && <Badge variant="shield">{carrier.am_best_rating}</Badge>}
              <Badge variant={carrier.is_active ? 'success' : 'danger'}>{carrier.is_active ? 'Active' : 'Inactive'}</Badge>
              <Button variant="outline" size="sm" leftIcon={<Edit className="w-4 h-4" />} onClick={() => openEditModal(carrier)}>Edit</Button>
            </div>
          </div>
          {carrier.description && <p className="text-slate-600 dark:text-slate-300 mt-4">{carrier.description}</p>}
          {carrier.website && (
            <div className="flex items-center gap-2 mt-3 text-sm">
              <Globe className="h-4 w-4 text-shield-500" />
              <a href={carrier.website} target="_blank" rel="noopener noreferrer" className="text-shield-600 dark:text-shield-400 hover:underline">{carrier.website}</a>
            </div>
          )}
        </Card>

        {/* Enriched Carrier Profile */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Carrier Profile</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {carrier.naic_code && (
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-shield-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">NAIC Code</p>
                  <p className="font-medium text-slate-900 dark:text-white">{carrier.naic_code}</p>
                </div>
              </div>
            )}
            {carrier.sp_rating && (
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">S&P Rating</p>
                  <p className="font-medium text-slate-900 dark:text-white">{carrier.sp_rating}</p>
                </div>
              </div>
            )}
            {carrier.year_founded && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Founded</p>
                  <p className="font-medium text-slate-900 dark:text-white">{carrier.year_founded}</p>
                </div>
              </div>
            )}
            {(carrier.headquarters_city || carrier.headquarters_state) && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Headquarters</p>
                  <p className="font-medium text-slate-900 dark:text-white">{[carrier.headquarters_city, carrier.headquarters_state].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            )}
            {carrier.naic_complaint_ratio != null && (
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${carrier.naic_complaint_ratio > 1.5 ? 'text-red-500' : carrier.naic_complaint_ratio > 1.0 ? 'text-amber-500' : 'text-green-500'}`} />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Complaint Ratio</p>
                  <p className={`font-medium ${carrier.naic_complaint_ratio > 1.5 ? 'text-red-600 dark:text-red-400' : carrier.naic_complaint_ratio > 1.0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>{carrier.naic_complaint_ratio.toFixed(2)}</p>
                </div>
              </div>
            )}
            {carrier.market_segment && (
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Segment</p>
                  <p className="font-medium text-slate-900 dark:text-white capitalize">{carrier.market_segment.replace(/_/g, ' ')}</p>
                </div>
              </div>
            )}
            {carrier.distribution_model && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Distribution</p>
                <p className="font-medium text-slate-900 dark:text-white capitalize">{carrier.distribution_model}</p>
              </div>
            )}
            {carrier.domicile_state && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Domicile State</p>
                <p className="font-medium text-slate-900 dark:text-white">{carrier.domicile_state}</p>
              </div>
            )}
          </div>
          {carrier.lines_of_business && carrier.lines_of_business.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Lines of Business</p>
              <div className="flex flex-wrap gap-1.5">
                {carrier.lines_of_business.map(line => (
                  <Badge key={line} variant="default">{line.replace(/_/g, ' ')}</Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{carrier.products?.length ?? 0}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Products</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{carrier.agency_appointments_count ?? 0}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Agency Appointments</p>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-shield-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Products</h2>
            </div>
            <Link to="/admin/products">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Manage All Products
              </Button>
            </Link>
          </div>

          {carrier.products && (carrier.products as { id: number; name: string; insurance_type: string; is_active: boolean }[]).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/50">
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider py-2 pr-4">Product</th>
                    <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider py-2 pr-4">Type</th>
                    <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                  {(carrier.products as { id: number; name: string; insurance_type: string; is_active: boolean }[]).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 pr-4">
                        <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{p.insurance_type}</span>
                      </td>
                      <td className="py-3 text-right">
                        <Badge variant={p.is_active ? 'success' : 'default'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm">No products associated with this carrier</p>
              <Link to="/admin/products" className="text-xs text-shield-600 dark:text-shield-400 hover:underline mt-1 inline-block">
                Go to Product Management
              </Link>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ========== List View ==========
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Carrier Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage insurance carriers on the platform</p>
        </div>
        <Button variant="shield" leftIcon={<Building className="w-4 h-4" />} onClick={() => openEditModal()}>Add Carrier</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900 dark:text-white">{carriers.length}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Carriers</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-savings-600 dark:text-savings-400">{activeCount}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xl font-bold text-slate-900 dark:text-white">{carriers.length - activeCount}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Inactive</p>
        </Card>
      </div>

      <Input placeholder="Search carriers..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-5 h-5" />} />

      <Card>
        {loading || detailLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-shield-500" />
          </div>
        ) : carriers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
            <Building className="h-10 w-10 mb-3 text-slate-300" />
            <p className="font-medium">No carriers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Carrier</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">NAIC</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">AM Best</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Segment</th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Status</th>
                  <th className="text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {carriers.map(carrier => (
                  <tr key={carrier.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-shield-100 dark:bg-shield-900/30 text-shield-700 dark:text-shield-300 flex items-center justify-center">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-medium text-slate-900 dark:text-white">{carrier.name}</span>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{carrier.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-600 dark:text-slate-300 font-mono">{carrier.naic_code || '—'}</span>
                    </td>
                    <td className="p-4">
                      {carrier.am_best_rating ? <Badge variant="shield">{carrier.am_best_rating}</Badge> : <span className="text-sm text-slate-400 dark:text-slate-500">—</span>}
                    </td>
                    <td className="p-4">
                      {carrier.market_segment ? <span className="text-sm text-slate-500 dark:text-slate-400 capitalize">{carrier.market_segment.replace(/_/g, ' ')}</span> : <span className="text-sm text-slate-400">—</span>}
                    </td>
                    <td className="p-4">
                      <Badge variant={carrier.is_active ? 'success' : 'danger'}>{carrier.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleViewCarrier(carrier.id)}>View</Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(carrier)}><Edit className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit/Create Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEditModal(false)}>
          <Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{editingId ? 'Edit Carrier' : 'Add Carrier'}</h3>
              <button onClick={() => setShowEditModal(false)}><X className="w-5 h-5 text-slate-400 dark:text-slate-500" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</label>
                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Slug</label>
                <Input value={editForm.slug} onChange={e => setEditForm({ ...editForm, slug: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400 min-h-[60px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Website</label>
                  <Input value={editForm.website} onChange={e => setEditForm({ ...editForm, website: e.target.value })} placeholder="https://" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">AM Best Rating</label>
                  <Input value={editForm.am_best_rating} onChange={e => setEditForm({ ...editForm, am_best_rating: e.target.value })} placeholder="A+" />
                </div>
              </div>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-shield-600 dark:text-shield-400 focus:ring-shield-500 dark:focus:ring-shield-400" />
                <span className="text-sm text-slate-700 dark:text-slate-200">Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button onClick={handleSaveCarrier} disabled={editSaving}>{editSaving ? 'Saving...' : editingId ? 'Update' : 'Create'}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
