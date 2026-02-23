import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Building2, FileCheck, X } from 'lucide-react';
import { platformProductService } from '../../services/api/platformProducts';
import { carrierService } from '../../services/api/carriers';
import type { AgencyCarrierAppointment, Carrier, PlatformProduct } from '../../types';

export default function AgencyAppointments() {
  const [appointments, setAppointments] = useState<AgencyCarrierAppointment[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [products, setProducts] = useState<PlatformProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    carrier_id: '',
    platform_product_id: '',
    appointment_number: '',
    effective_date: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appts, carriersRes, productsRes] = await Promise.all([
        platformProductService.getAppointments(),
        carrierService.list(),
        platformProductService.getAgencyProducts(),
      ]);
      setAppointments(appts);
      setCarriers((carriersRes as { items?: Carrier[] }).items || (carriersRes as unknown as Carrier[]));
      setProducts(productsRes.products.filter((p: PlatformProduct & { agency_enabled?: boolean }) => p.agency_enabled));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.carrier_id || !form.platform_product_id) return;
    try {
      await platformProductService.createAppointment({
        carrier_id: parseInt(form.carrier_id),
        platform_product_id: parseInt(form.platform_product_id),
        appointment_number: form.appointment_number || undefined,
        effective_date: form.effective_date || undefined,
      });
      setShowModal(false);
      setForm({ carrier_id: '', platform_product_id: '', appointment_number: '', effective_date: '' });
      await fetchData();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await platformProductService.deleteAppointment(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch {
      // ignore
    }
  };

  // Group by carrier
  const byCarrier = appointments.reduce<Record<string, AgencyCarrierAppointment[]>>((acc, a) => {
    const key = a.carrier?.name || `Carrier #${a.carrier_id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carrier Appointments</h1>
          <p className="text-slate-500 mt-1">Manage which carriers your agency is appointed with for each product</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-shield-600 text-white rounded-lg hover:bg-shield-700"
        >
          <Plus className="w-4 h-4" />
          Add Appointment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Appointments</p>
          <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Carriers</p>
          <p className="text-2xl font-bold text-shield-600">{Object.keys(byCarrier).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Active</p>
          <p className="text-2xl font-bold text-savings-600">{appointments.filter(a => a.is_active).length}</p>
        </div>
      </div>

      {/* Appointments by Carrier */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-shield-500" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No carrier appointments</h3>
          <p className="text-slate-500 mt-1">Add appointments to specify which carriers you can sell for each product type.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byCarrier).map(([carrierName, appts]) => (
            <div key={carrierName} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b border-slate-200">
                <Building2 className="w-5 h-5 text-shield-600" />
                <h2 className="font-semibold text-slate-900">{carrierName}</h2>
                <span className="text-sm text-slate-500">{appts.length} product{appts.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {appts.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-slate-900">{a.platform_product?.name || `Product #${a.platform_product_id}`}</p>
                        <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                          {a.appointment_number && <span>#{a.appointment_number}</span>}
                          {a.effective_date && <span>Effective: {a.effective_date}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        a.is_active ? 'bg-savings-50 text-savings-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button onClick={() => handleDelete(a.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Add Carrier Appointment</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Carrier</label>
                <select
                  value={form.carrier_id}
                  onChange={e => setForm(prev => ({ ...prev, carrier_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-shield-500"
                >
                  <option value="">Select carrier...</option>
                  {carriers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                <select
                  value={form.platform_product_id}
                  onChange={e => setForm(prev => ({ ...prev, platform_product_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-shield-500"
                >
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Number (optional)</label>
                <input
                  type="text"
                  value={form.appointment_number}
                  onChange={e => setForm(prev => ({ ...prev, appointment_number: e.target.value }))}
                  placeholder="e.g. APT-12345"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-shield-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Effective Date (optional)</label>
                <input
                  type="date"
                  value={form.effective_date}
                  onChange={e => setForm(prev => ({ ...prev, effective_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-shield-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.carrier_id || !form.platform_product_id}
                className="flex-1 px-4 py-2 bg-shield-600 text-white rounded-lg hover:bg-shield-700 disabled:opacity-50"
              >
                Add Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
