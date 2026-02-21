import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Badge } from '@/components/ui';
import { Shield, ShieldCheck, Star, ArrowRight, ArrowLeft, Check, Phone, Globe, DollarSign } from 'lucide-react';

interface QuoteResult {
  id: string;
  carrier: string;
  logo: string;
  monthly_premium: number;
  annual_premium: number;
  deductible: number;
  coverage_limit: string;
  rating: number;
  features: string[];
  recommended?: boolean;
}

const mockQuotes: QuoteResult[] = [
  {
    id: '1',
    carrier: 'StateFarm',
    logo: 'SF',
    monthly_premium: 127,
    annual_premium: 1524,
    deductible: 500,
    coverage_limit: '$300,000',
    rating: 4.8,
    features: ['24/7 Claims', 'Roadside Assistance', 'Multi-Policy Discount'],
    recommended: true,
  },
  {
    id: '2',
    carrier: 'Progressive',
    logo: 'PG',
    monthly_premium: 142,
    annual_premium: 1704,
    deductible: 500,
    coverage_limit: '$300,000',
    rating: 4.6,
    features: ['Name Your Price', 'Snapshot Discount', 'Pet Coverage'],
  },
  {
    id: '3',
    carrier: 'Geico',
    logo: 'GK',
    monthly_premium: 135,
    annual_premium: 1620,
    deductible: 750,
    coverage_limit: '$250,000',
    rating: 4.5,
    features: ['Military Discount', 'Digital ID Cards', 'Emergency Assistance'],
  },
  {
    id: '4',
    carrier: 'Allstate',
    logo: 'AS',
    monthly_premium: 155,
    annual_premium: 1860,
    deductible: 500,
    coverage_limit: '$500,000',
    rating: 4.7,
    features: ['Accident Forgiveness', 'New Car Replacement', 'Safe Driving Bonus'],
  },
  {
    id: '5',
    carrier: 'Liberty Mutual',
    logo: 'LM',
    monthly_premium: 148,
    annual_premium: 1776,
    deductible: 500,
    coverage_limit: '$300,000',
    rating: 4.4,
    features: ['Better Car Replacement', 'Lifetime Repair Guarantee', 'Teacher Discount'],
  },
];

export default function QuoteResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const quoteRequest = location.state?.quoteRequest;

  const lowestPremium = Math.min(...mockQuotes.map(q => q.monthly_premium));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-shield flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">InsureFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/calculator">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>New Quote</Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="outline" size="sm">Find an Agent</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Results header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-savings-50 text-savings-700 text-sm font-medium mb-4">
            <ShieldCheck className="w-4 h-4" />
            {mockQuotes.length} quotes found
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Your Insurance Quotes</h1>
          <p className="text-slate-500 mt-2">Compare rates side-by-side from top-rated carriers</p>
        </div>

        {/* Summary bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Lowest Monthly Premium</p>
            <p className="text-2xl font-bold text-savings-600">${lowestPremium}/mo</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Insurance Type</p>
            <p className="text-lg font-semibold text-slate-900 capitalize">{quoteRequest?.insurance_type || 'Auto'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Coverage Level</p>
            <p className="text-lg font-semibold text-slate-900 capitalize">{quoteRequest?.coverage_level || 'Standard'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">ZIP Code</p>
            <p className="text-lg font-semibold text-slate-900">{quoteRequest?.zip_code || '10001'}</p>
          </div>
        </div>

        {/* Quote cards */}
        <div className="space-y-4">
          {mockQuotes.map(quote => (
            <Card
              key={quote.id}
              className={`transition-all duration-200 cursor-pointer ${
                selectedQuote === quote.id ? 'ring-2 ring-shield-500' : ''
              } ${quote.recommended ? 'border-shield-200 bg-shield-50/30' : ''}`}
              onClick={() => setSelectedQuote(quote.id)}
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Carrier info */}
                  <div className="flex items-center gap-4 lg:w-48">
                    <div className="w-14 h-14 rounded-xl bg-shield-100 text-shield-700 flex items-center justify-center text-lg font-bold">
                      {quote.logo}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{quote.carrier}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm text-slate-600">{quote.rating}</span>
                      </div>
                    </div>
                    {quote.recommended && (
                      <Badge variant="shield" className="ml-auto lg:ml-0">Best Value</Badge>
                    )}
                  </div>

                  {/* Coverage details */}
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Monthly</p>
                      <p className="text-xl font-bold text-slate-900">${quote.monthly_premium}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Deductible</p>
                      <p className="text-xl font-bold text-slate-900">${quote.deductible}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Coverage</p>
                      <p className="text-xl font-bold text-slate-900">{quote.coverage_limit}</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="lg:w-56">
                    {quote.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="w-3.5 h-3.5 text-savings-500 flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  <div className="lg:w-40">
                    <Button
                      variant={selectedQuote === quote.id ? 'shield' : 'outline'}
                      className="w-full"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/marketplace', { state: { selectedQuote: quote } });
                      }}
                    >
                      Select
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <p className="text-slate-500 mb-4">Want help choosing the right policy? Connect with a licensed agent.</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/marketplace">
              <Button variant="shield" rightIcon={<ArrowRight className="w-4 h-4" />}>Find an Agent</Button>
            </Link>
            <Button variant="outline" leftIcon={<Phone className="w-4 h-4" />}>Call 1-800-INSURE</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
