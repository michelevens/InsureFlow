import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { rateTableAdminService } from '@/services/api/rateTableAdmin';
import type { AdminRateTable, RateTableCounts, CarrierOption } from '@/services/api/rateTableAdmin';
import { toast } from 'sonner';
import { Search, Plus, Table2, ToggleLeft, Copy, Trash2, Eye, Loader2, Database, CheckCircle, XCircle } from 'lucide-react';

const PRODUCT_TYPES = ['All', 'LTC', 'LTD', 'Life', 'P&C', 'Annuity'] as const;
type ProductFilter = typeof PRODUCT_TYPES[number];

const PRODUCT_TYPE_COLORS: Record<string, string> = {
  LTC:     'bg-blue-50 text-blue-700',
  LTD:     'bg-purple-50 text-purple-700',
  Life:    'bg-emerald-50 text-emerald-700',
  'P&C':   'bg-amber-50 text-amber-700',
  Annuity: 'bg-rose-50 text-rose-700',
};

function productTypeBadge(productType: string): string {
  const normalised = PRODUCT_TYPES.find(
    t => t.toLowerCase() === productType.toLowerCase() || productType.toLowerCase().includes(t.toLowerCase()),
  );
  return PRODUCT_TYPE_COLORS[normalised ?? ''] ?? 'bg-slate-100 text-slate-600';
}

function normaliseProductLabel(productType: string): string {
  const match = PRODUCT_TYPES.find(
    t => t.toLowerCase() === productType.toLowerCase() || productType.toLowerCase().includes(t.toLowerCase()),
  );
  return match ?? productType;
}

export default function AdminRateTables() {
  const [rateTables, setRateTables] = useState<AdminRateTable[]>([]);
  const [counts, setCounts] = useState<RateTableCounts>({ total: 0, active: 0, inactive: 0, by_product_type: {} });
  const [carriers, setCarriers] = useState<CarrierOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productFilter, setProductFilter] = useState<ProductFilter>('All');
  const [carrierFilter, setCarrierFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [listRes, carrierRes] = await Promise.all([
        rateTableAdminService.list(),
        rateTableAdminService.getCarriers(),
      ]);
      setRateTables(listRes.rate_tables);
      setCounts(listRes.counts);
      setCarriers(carrierRes);
    } catch {
      toast.error('Failed to load rate tables');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    return rateTables.filter(rt => {
      if (productFilter !== 'All') {
        const norm = normaliseProductLabel(rt.product_type);
        if (norm !== productFilter) return false;
      }
      if (carrierFilter && rt.carrier_id !== Number(carrierFilter)) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const nameMatch = (rt.label ?? rt.product_type).toLowerCase().includes(q);
        const carrierMatch = (rt.carrier_name ?? '').toLowerCase().includes(q);
        const versionMatch = rt.version.toLowerCase().includes(q);
        if (!nameMatch && !carrierMatch && !versionMatch) return false;
      }
      return true;
    });
  }, [rateTables, productFilter, carrierFilter, searchTerm]);

  const handleClone = async (id: number, name: string) => {
    try {
      await rateTableAdminService.clone(id);
      toast.success(`Cloned "${name}" successfully`);
      loadData();
    } catch {
      toast.error('Failed to clone rate table');
    }
  };

  const handleToggle = async (rt: AdminRateTable) => {
    try {
      await rateTableAdminService.toggleStatus(rt.id);
      toast.success(rt.is_active ? 'Rate table deactivated' : 'Rate table activated');
      loadData();
    } catch {
      toast.error('Failed to update rate table status');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await rateTableAdminService.delete(id);
      toast.success('Rate table deleted');
      loadData();
    } catch {
      toast.error('Failed to delete rate table');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rate Tables</h1>
          <p className="text-slate-500 mt-1">Manage carrier rating tables and pricing data</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-shield-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading rate tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rate Tables</h1>
          <p className="text-slate-500 mt-1">Manage carrier rating tables and pricing data</p>
        </div>
        <Link
          to="/admin/rate-tables/new"
          className="flex items-center gap-2 px-4 py-2 bg-shield-600 text-white rounded-lg hover:bg-shield-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Rate Table
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-shield-50 flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5 text-shield-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{counts.total}</p>
            <p className="text-sm text-slate-500">Total Tables</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{counts.active}</p>
            <p className="text-sm text-slate-500">Active</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{counts.inactive}</p>
            <p className="text-sm text-slate-500">Inactive</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Product type tabs */}
        <div className="bg-slate-100 rounded-lg p-1 flex gap-1 flex-wrap">
          {PRODUCT_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setProductFilter(type)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                productFilter === type
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Carrier dropdown */}
        <select
          value={carrierFilter}
          onChange={e => setCarrierFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-shield-500 focus:border-shield-500 bg-white"
        >
          <option value="">All Carriers</option>
          {carriers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-shield-500 focus:border-shield-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Table2 className="w-10 h-10 mb-3 text-slate-300" />
            <p className="font-medium text-slate-700">No rate tables found</p>
            <p className="text-sm mt-1">
              {searchTerm || productFilter !== 'All' || carrierFilter
                ? 'Try adjusting your filters'
                : 'Create your first rate table to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Product Type</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Version</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Entries</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(rt => {
                  const displayName = rt.label ?? rt.product_type;
                  const productLabel = normaliseProductLabel(rt.product_type);
                  return (
                    <tr key={rt.id} className="hover:bg-slate-50 transition-colors">
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-shield-50 flex items-center justify-center flex-shrink-0">
                            <Table2 className="w-4 h-4 text-shield-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{displayName}</p>
                            {rt.carrier_name && (
                              <p className="text-xs text-slate-400">{rt.carrier_name}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Product Type */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${productTypeBadge(rt.product_type)}`}>
                          {productLabel}
                        </span>
                      </td>

                      {/* Version */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {rt.version}
                        </span>
                      </td>

                      {/* Entries count */}
                      <td className="px-4 py-3">
                        <span className="text-slate-700">{rt.entries_count.toLocaleString()}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {rt.is_active ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/rate-tables/${rt.id}`}
                            className="p-1.5 rounded-md text-slate-500 hover:text-shield-600 hover:bg-shield-50 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleClone(rt.id, displayName)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Clone"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggle(rt)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title={rt.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <ToggleLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rt.id, displayName)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer count */}
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500">
                Showing {filtered.length} of {counts.total} rate table{counts.total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
