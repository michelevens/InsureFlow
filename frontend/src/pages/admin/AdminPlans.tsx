import { useState } from 'react';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { DollarSign, Plus, Edit, Trash2, CheckCircle2, Users } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  target_role: string;
  price_monthly: number;
  price_annual: number;
  features: string[];
  subscriber_count: number;
  is_active: boolean;
}

const mockPlans: Plan[] = [
  { id: '1', name: 'Agent Basic', slug: 'agent-basic', target_role: 'agent', price_monthly: 29, price_annual: 290, features: ['Up to 20 leads/month', 'Basic CRM', 'Commission tracking', 'Email support'], subscriber_count: 120, is_active: true },
  { id: '2', name: 'Agent Pro', slug: 'agent-pro', target_role: 'agent', price_monthly: 79, price_annual: 790, features: ['Unlimited leads', 'Advanced CRM', 'Commission tracking', 'Priority support', 'Marketplace listing', 'Analytics dashboard'], subscriber_count: 85, is_active: true },
  { id: '3', name: 'Agency Standard', slug: 'agency-standard', target_role: 'agency_owner', price_monthly: 149, price_annual: 1490, features: ['Up to 5 agents', 'Team management', 'Agency analytics', 'Bulk lead distribution', 'White-label reports'], subscriber_count: 32, is_active: true },
  { id: '4', name: 'Agency Enterprise', slug: 'agency-enterprise', target_role: 'agency_owner', price_monthly: 299, price_annual: 2990, features: ['Unlimited agents', 'All Agency Standard features', 'API access', 'Custom integrations', 'Dedicated support', 'Custom branding'], subscriber_count: 12, is_active: true },
  { id: '5', name: 'Carrier Partner', slug: 'carrier-partner', target_role: 'carrier', price_monthly: 499, price_annual: 4990, features: ['Product listings', 'Agent network access', 'Production analytics', 'API integration', 'Dedicated account manager'], subscriber_count: 8, is_active: true },
];

export default function AdminPlans() {
  const [plans] = useState(mockPlans);

  const totalRevenue = plans.reduce((sum, p) => sum + (p.subscriber_count * p.price_monthly), 0);
  const totalSubscribers = plans.reduce((sum, p) => sum + p.subscriber_count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1>
          <p className="text-slate-500 mt-1">Manage pricing and subscription tiers</p>
        </div>
        <Button variant="shield" leftIcon={<Plus className="w-4 h-4" />}>Create Plan</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-savings-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">${totalRevenue.toLocaleString()}/mo</p>
              <p className="text-sm text-slate-500">Monthly Recurring Revenue</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-shield-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">{totalSubscribers}</p>
              <p className="text-sm text-slate-500">Total Subscribers</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-confidence-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">{plans.filter(p => p.is_active).length}</p>
              <p className="text-sm text-slate-500">Active Plans</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Plans grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className="flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="capitalize">{plan.target_role.replace('_', ' ')}</Badge>
                <Badge variant={plan.is_active ? 'success' : 'default'}>{plan.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-slate-900">${plan.price_monthly}</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">${plan.price_annual}/year (save {Math.round((1 - plan.price_annual / (plan.price_monthly * 12)) * 100)}%)</p>

              <div className="space-y-2 mb-4">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-savings-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <div className="text-sm text-slate-500">
                <Users className="w-4 h-4 inline mr-1" />
                {plan.subscriber_count} subscribers
              </div>
            </div>
            <div className="border-t border-slate-100 p-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" leftIcon={<Edit className="w-4 h-4" />}>Edit</Button>
              <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-red-500" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
