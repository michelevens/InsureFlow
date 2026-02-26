import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import type { QuoteComparison } from '@/services/api/marketplace';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
export { customRender as render };

let _quoteId = 1;

export function makeQuote(overrides: Partial<QuoteComparison> = {}): QuoteComparison {
  return {
    id: _quoteId++,
    carrier_name: 'Test Carrier',
    product_name: 'Standard Policy',
    premium_monthly: '150.00',
    premium_annual: '1740.00',
    am_best_rating: 'A',
    financial_strength_score: 8,
    coverage_details: null,
    endorsements: null,
    exclusions: null,
    discounts_applied: null,
    agent_notes: null,
    is_recommended: false,
    ...overrides,
  };
}

export function resetQuoteId() {
  _quoteId = 1;
}
