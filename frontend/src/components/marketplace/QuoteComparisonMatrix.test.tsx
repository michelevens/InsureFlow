import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, makeQuote, resetQuoteId } from '@/test/test-utils';
import { QuoteComparisonMatrix } from './QuoteComparisonMatrix';

beforeEach(() => resetQuoteId());

describe('QuoteComparisonMatrix', () => {
  it('renders nothing when quotes array is empty', () => {
    const { container } = render(<QuoteComparisonMatrix quotes={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders carrier names sorted by recommendation then premium', () => {
    const quotes = [
      makeQuote({ carrier_name: 'Expensive Co', premium_monthly: '300.00', is_recommended: false }),
      makeQuote({ carrier_name: 'Cheap Co', premium_monthly: '100.00', is_recommended: false }),
      makeQuote({ carrier_name: 'Recommended Co', premium_monthly: '200.00', is_recommended: true }),
    ];

    render(<QuoteComparisonMatrix quotes={quotes} />);

    const headers = screen.getAllByRole('columnheader');
    // First column is the label column, then carriers
    const carrierNames = headers.slice(1).map(h => h.textContent);

    // Recommended first, then sorted by premium ascending
    expect(carrierNames![0]).toContain('Recommended Co');
    expect(carrierNames![1]).toContain('Cheap Co');
    expect(carrierNames![2]).toContain('Expensive Co');
  });

  it('shows savings callout when multiple quotes with different premiums', () => {
    const quotes = [
      makeQuote({ carrier_name: 'A', premium_monthly: '100.00' }),
      makeQuote({ carrier_name: 'B', premium_monthly: '150.00' }),
    ];

    render(<QuoteComparisonMatrix quotes={quotes} />);
    expect(screen.getByText(/Save up to/)).toBeInTheDocument();
    expect(screen.getByText('$50/mo')).toBeInTheDocument();
  });

  it('hides savings callout when only one quote', () => {
    const quotes = [makeQuote({ carrier_name: 'Solo' })];

    render(<QuoteComparisonMatrix quotes={quotes} />);
    expect(screen.queryByText(/Save up to/)).not.toBeInTheDocument();
  });

  it('calls onSelect with correct quote id when select button clicked', () => {
    const onSelect = vi.fn();
    const quotes = [
      makeQuote({ id: 42, carrier_name: 'Pick Me' }),
      makeQuote({ id: 99, carrier_name: 'Not Me' }),
    ];

    render(<QuoteComparisonMatrix quotes={quotes} onSelect={onSelect} />);

    const btn = screen.getByRole('button', { name: /Select Pick Me/ });
    btn.click();
    expect(onSelect).toHaveBeenCalledWith(42);
  });

  it('marks lowest premium with Lowest label', () => {
    const quotes = [
      makeQuote({ carrier_name: 'Cheap', premium_monthly: '80.00' }),
      makeQuote({ carrier_name: 'Pricey', premium_monthly: '200.00' }),
    ];

    render(<QuoteComparisonMatrix quotes={quotes} />);
    expect(screen.getByText('Lowest')).toBeInTheDocument();
  });

  it('shows Recommended badge on recommended quote', () => {
    const quotes = [
      makeQuote({ carrier_name: 'Best', is_recommended: true }),
      makeQuote({ carrier_name: 'Other' }),
    ];

    render(<QuoteComparisonMatrix quotes={quotes} />);
    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });
});
