import { useState, useEffect } from 'react';
import { Check, Package, RefreshCw, Save } from 'lucide-react';
import { platformProductService } from '../../services/api/platformProducts';
import type { PlatformProduct } from '../../types';

export default function AgencyProducts() {
  const [products, setProducts] = useState<(PlatformProduct & { agency_enabled?: boolean })[]>([]);
  const [grouped, setGrouped] = useState<Record<string, (PlatformProduct & { agency_enabled?: boolean })[]>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await platformProductService.getAgencyProducts();
      setProducts(res.products);
      setGrouped(res.grouped);
      const enabled = new Set(
        res.products.filter((p: PlatformProduct & { agency_enabled?: boolean }) => p.agency_enabled).map((p: PlatformProduct) => p.id)
      );
      setSelectedIds(enabled);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const toggle = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setDirty(true);
  };

  const toggleCategory = (category: string, enable: boolean) => {
    const catProducts = grouped[category] || [];
    setSelectedIds(prev => {
      const next = new Set(prev);
      catProducts.forEach(p => {
        if (enable) next.add(p.id); else next.delete(p.id);
      });
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await platformProductService.updateAgencyProducts(Array.from(selectedIds));
      setDirty(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const categories = Object.keys(grouped);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agency Products</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Select which insurance products your agency supports</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="flex items-center gap-2 px-4 py-2 bg-shield-600 text-white rounded-lg hover:bg-shield-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-shield-600 dark:text-shield-400">{selectedIds.size}</span> of{' '}
          <span className="font-semibold">{products.length}</span> products enabled
        </p>
        {selectedIds.size === 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            Warning: No products selected — your calculator will not show any products to visitors.
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-shield-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(category => {
            const catProducts = grouped[category] || [];
            const catSelected = catProducts.filter(p => selectedIds.has(p.id)).length;
            const allSelected = catSelected === catProducts.length;

            return (
              <div key={category} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-shield-600 dark:text-shield-400" />
                    <h2 className="font-semibold text-slate-900 dark:text-white">{category}</h2>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {catSelected}/{catProducts.length} selected
                    </span>
                  </div>
                  <button
                    onClick={() => toggleCategory(category, !allSelected)}
                    className="text-xs px-3 py-1 bg-shield-50 dark:bg-shield-900/30 text-shield-700 dark:text-shield-300 rounded-full hover:bg-shield-100 dark:bg-shield-900/30 dark:hover:bg-shield-900/40"
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0">
                  {catProducts.map(product => {
                    const selected = selectedIds.has(product.id);
                    return (
                      <button
                        key={product.id}
                        onClick={() => toggle(product.id)}
                        className={`flex items-center gap-3 px-6 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-700/50 ${
                          selected ? 'bg-shield-50 dark:bg-shield-900/30/50' : ''
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selected
                            ? 'bg-shield-600 border-shield-600'
                            : 'border-slate-300'
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{product.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{product.slug}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
