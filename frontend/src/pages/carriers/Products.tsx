import { useState } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { Briefcase, Plus, Edit, ToggleLeft, ToggleRight, Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  type: string;
  description: string;
  min_premium: number;
  max_premium: number;
  states_available: number;
  is_active: boolean;
  applications_mtd: number;
}

const mockProducts: Product[] = [
  { id: '1', name: 'Auto Standard', type: 'Auto', description: 'Comprehensive auto coverage with competitive rates', min_premium: 80, max_premium: 300, states_available: 48, is_active: true, applications_mtd: 45 },
  { id: '2', name: 'Home Premium', type: 'Home', description: 'Full home coverage including natural disaster protection', min_premium: 120, max_premium: 500, states_available: 50, is_active: true, applications_mtd: 28 },
  { id: '3', name: 'Life Term 20', type: 'Life', description: '20-year term life insurance with level premiums', min_premium: 30, max_premium: 200, states_available: 50, is_active: true, applications_mtd: 15 },
  { id: '4', name: 'Business General', type: 'Business', description: 'General liability coverage for small businesses', min_premium: 200, max_premium: 1000, states_available: 45, is_active: true, applications_mtd: 12 },
  { id: '5', name: 'Umbrella Plus', type: 'Umbrella', description: 'Extended liability coverage beyond primary policies', min_premium: 150, max_premium: 400, states_available: 40, is_active: false, applications_mtd: 0 },
];

export default function Products() {
  const [search, setSearch] = useState('');

  const filtered = mockProducts.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Insurance Products</h1>
          <p className="text-slate-500 mt-1">Manage your insurance product offerings</p>
        </div>
        <Button variant="shield" leftIcon={<Plus className="w-4 h-4" />}>Add Product</Button>
      </div>

      <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search className="w-5 h-5" />} />

      <div className="grid md:grid-cols-2 gap-6">
        {filtered.map(product => (
          <Card key={product.id}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-shield-100 text-shield-600 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{product.name}</h3>
                    <Badge variant="outline" className="mt-1">{product.type}</Badge>
                  </div>
                </div>
                <Badge variant={product.is_active ? 'success' : 'default'}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <p className="text-sm text-slate-600 mb-4">{product.description}</p>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500">Premium Range</p>
                  <p className="text-sm font-medium text-slate-900">${product.min_premium}-${product.max_premium}/mo</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">States</p>
                  <p className="text-sm font-medium text-slate-900">{product.states_available}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">MTD Apps</p>
                  <p className="text-sm font-medium text-slate-900">{product.applications_mtd}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" leftIcon={<Edit className="w-4 h-4" />}>Edit</Button>
                <Button variant="ghost" size="sm">
                  {product.is_active ? <ToggleRight className="w-5 h-5 text-savings-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
