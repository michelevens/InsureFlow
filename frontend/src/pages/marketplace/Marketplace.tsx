import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card, Badge, Select } from '@/components/ui';
import { Search, MapPin, Star, Shield, ShieldCheck, Phone, ArrowRight, Filter, Users } from 'lucide-react';

const insuranceTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'auto', label: 'Auto' },
  { value: 'home', label: 'Home' },
  { value: 'life', label: 'Life' },
  { value: 'health', label: 'Health' },
  { value: 'business', label: 'Business' },
];

interface AgentCard {
  id: string;
  name: string;
  agency: string;
  specialties: string[];
  rating: number;
  review_count: number;
  years_experience: number;
  city: string;
  state: string;
  verified: boolean;
  carriers: number;
}

const mockAgents: AgentCard[] = [
  { id: '1', name: 'Sarah Johnson', agency: 'Johnson Insurance Group', specialties: ['Auto', 'Home', 'Life'], rating: 4.9, review_count: 127, years_experience: 12, city: 'Dallas', state: 'TX', verified: true, carriers: 15 },
  { id: '2', name: 'Michael Chen', agency: 'Pacific Shield Insurance', specialties: ['Health', 'Life', 'Business'], rating: 4.8, review_count: 89, years_experience: 8, city: 'San Francisco', state: 'CA', verified: true, carriers: 12 },
  { id: '3', name: 'Amanda Rodriguez', agency: 'TrustBridge Insurance', specialties: ['Auto', 'Home', 'Umbrella'], rating: 4.7, review_count: 64, years_experience: 15, city: 'Miami', state: 'FL', verified: true, carriers: 20 },
  { id: '4', name: 'David Williams', agency: 'Williams & Associates', specialties: ['Business', 'Auto', 'Home'], rating: 4.6, review_count: 52, years_experience: 10, city: 'Chicago', state: 'IL', verified: true, carriers: 18 },
  { id: '5', name: 'Jessica Taylor', agency: 'Secure Future Insurance', specialties: ['Life', 'Health'], rating: 4.9, review_count: 143, years_experience: 20, city: 'New York', state: 'NY', verified: true, carriers: 10 },
  { id: '6', name: 'Robert Martinez', agency: 'Lone Star Insurance', specialties: ['Auto', 'Home', 'Business'], rating: 4.5, review_count: 38, years_experience: 6, city: 'Austin', state: 'TX', verified: false, carriers: 8 },
];

export default function Marketplace() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [zipCode, setZipCode] = useState('');

  const filtered = mockAgents.filter(agent => {
    if (search && !agent.name.toLowerCase().includes(search.toLowerCase()) && !agent.agency.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && !agent.specialties.some(s => s.toLowerCase() === typeFilter)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800">
      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-shield-50 dark:bg-shield-900/30 text-shield-700 dark:text-shield-300 text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            500+ Licensed Agents Nationwide
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">Find Your Perfect Insurance Agent</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Browse verified agents, read reviews, and get matched with the right expert for your coverage needs.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or agency..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                options={insuranceTypeOptions}
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                placeholder="Insurance Type"
              />
            </div>
            <div className="w-full md:w-40">
              <Input
                placeholder="ZIP Code"
                value={zipCode}
                onChange={e => setZipCode(e.target.value)}
                leftIcon={<MapPin className="w-5 h-5" />}
                maxLength={5}
              />
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">{filtered.length} agents found</p>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Filter className="w-4 h-4" />
            Sort by: <span className="font-medium text-slate-700 dark:text-slate-200">Highest Rated</span>
          </div>
        </div>

        {/* Agent cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(agent => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                {/* Agent header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full gradient-shield flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {agent.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">{agent.name}</h3>
                      {agent.verified && <ShieldCheck className="w-4 h-4 text-shield-600 dark:text-shield-400 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{agent.agency}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{agent.rating}</span>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">({agent.review_count} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    {agent.city}, {agent.state}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Shield className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    {agent.years_experience} years experience · {agent.carriers} carriers
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {agent.specialties.map(s => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link to={`/marketplace/${agent.id}`} className="flex-1">
                    <Button variant="shield" className="w-full" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      View Profile
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
