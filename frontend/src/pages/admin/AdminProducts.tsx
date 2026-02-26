import { useState, useEffect } from 'react';
import { Search, RefreshCw, ToggleLeft, ToggleRight, Package, ShieldCheck } from 'lucide-react';
import { platformProductService } from '../../services/api/platformProducts';
import type { PlatformProduct } from '../../types';
import { toast } from 'sonner';

export default function AdminProducts() {
  const [products, setProducts] = useState<PlatformProduct[]>([]);
  const [grouped, setGrouped] = useState<Record<string, PlatformProduct[]>>({});
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await platformProductService.adminGetProducts({
        category: selectedCategory || undefined,
        search: search || undefined,
      });
      setProducts(res.products);
      setGrouped(res.grouped);
      setActiveCount(res.active_count ?? 0);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [selectedCategory, search]);

  const handleToggle = async (product: PlatformProduct) => {
    try {
      const res = await platformProductService.adminToggleProduct(product.id);
      setProducts(prev => prev.map(p => p.id === product.id ? res.product : p));
      setGrouped(prev => {
        const updated = { ...prev };
        for (const cat in updated) {
          updated[cat] = updated[cat].map(p => p.id === product.id ? res.product : p);
        }
        return updated;
      });
      setActiveCount(prev => res.product.is_active ? prev + 1 : prev - 1);
    } catch {
      toast.error('Failed to toggle product');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await platformProductService.adminSyncProducts();
      await fetchProducts();
    } catch {
      toast.error('Failed to sync products');
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkToggle = async (category: string, activate: boolean) => {
    const categoryProducts = grouped[category] || [];
    const ids = categoryProducts.map(p => p.id);
    if (ids.length === 0) return;
    try {
      await platformProductService.adminBulkToggle(ids, activate);
      await fetchProducts();
    } catch {
      toast.error('Failed to update products');
    }
  };

  const categories = Object.keys(grouped);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Products</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage which insurance product types are available on the platform</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-shield-600 text-white rounded-lg hover:bg-shield-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          Sync from Registry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Products</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{products.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
          <p className="text-2xl font-bold text-savings-600 dark:text-savings-400">{activeCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Categories</p>
          <p className="text-2xl font-bold text-shield-600 dark:text-shield-400">{categories.length}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700/50 rounded-lg focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400 focus:border-shield-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-slate-200 dark:border-slate-700/50 rounded-lg focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products by Category */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-shield-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {(selectedCategory ? [selectedCategory] : categories).map(category => {
            const categoryProducts = grouped[category] || [];
            const catActive = categoryProducts.filter(p => p.is_active).length;

            return (
              <div key={category} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-shield-600 dark:text-shield-400" />
                    <h2 className="font-semibold text-slate-900 dark:text-white">{category}</h2>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {catActive}/{categoryProducts.length} active
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkToggle(category, true)}
                      className="text-xs px-3 py-1 bg-savings-50 dark:bg-savings-900/30 text-savings-700 dark:text-savings-300 rounded-full hover:bg-savings-100 dark:bg-savings-900/30 dark:hover:bg-savings-900/40"
                    >
                      Enable All
                    </button>
                    <button
                      onClick={() => handleBulkToggle(category, false)}
                      className="text-xs px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/40"
                    >
                      Disable All
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {categoryProducts.map(product => (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors ${
                        !product.is_active ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className={`w-5 h-5 ${product.is_active ? 'text-savings-500' : 'text-slate-300'}`} />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{product.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          product.is_active
                            ? 'bg-savings-50 dark:bg-savings-900/30 text-savings-700 dark:text-savings-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button onClick={() => handleToggle(product)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-800 rounded">
                          {product.is_active
                            ? <ToggleRight className="w-6 h-6 text-savings-500" />
                            : <ToggleLeft className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
