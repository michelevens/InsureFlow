import { Link } from 'react-router-dom';
import { Card, Badge, Button } from '@/components/ui';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ClipboardList, ArrowRight, Clock, Trash2, Calculator } from 'lucide-react';

interface SavedQuote {
  id: string;
  insurance_type: string;
  carrier: string;
  monthly_premium: number;
  coverage: string;
  saved_at: string;
  expires_at: string;
}

const mockQuotes: SavedQuote[] = [
  { id: '1', insurance_type: 'Auto', carrier: 'StateFarm', monthly_premium: 127, coverage: '$300,000', saved_at: '2026-02-18', expires_at: '2026-03-18' },
  { id: '2', insurance_type: 'Home', carrier: 'Allstate', monthly_premium: 195, coverage: '$500,000', saved_at: '2026-02-15', expires_at: '2026-03-15' },
  { id: '3', insurance_type: 'Auto', carrier: 'Progressive', monthly_premium: 142, coverage: '$300,000', saved_at: '2026-02-10', expires_at: '2026-03-10' },
];

export default function MyQuotes() {
  if (mockQuotes.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Quotes</h1>
        <Card>
          <EmptyState
            icon={<ClipboardList className="w-8 h-8" />}
            title="No saved quotes"
            description="Get instant quotes from top carriers and save them here for comparison"
            actionLabel="Get a Quote"
            onAction={() => window.location.href = '/calculator'}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Quotes</h1>
          <p className="text-slate-500 mt-1">{mockQuotes.length} saved quotes</p>
        </div>
        <Link to="/calculator">
          <Button variant="shield" size="sm" leftIcon={<Calculator className="w-4 h-4" />}>Get New Quote</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockQuotes.map(quote => (
          <Card key={quote.id} className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="shield">{quote.insurance_type}</Badge>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  Expires {quote.expires_at}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{quote.carrier}</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold text-shield-600">${quote.monthly_premium}</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">Coverage: {quote.coverage}</p>
              <div className="flex gap-2">
                <Button variant="shield" size="sm" className="flex-1" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Apply Now
                </Button>
                <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-slate-400" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
