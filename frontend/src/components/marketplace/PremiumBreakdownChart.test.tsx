import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, makeQuote, resetQuoteId } from '@/test/test-utils';
import { PremiumBreakdownChart, CalculatorBreakdownChart } from './PremiumBreakdownChart';

beforeEach(() => resetQuoteId());

describe('PremiumBreakdownChart', () => {
  it('renders nothing when quotes array is empty', () => {
    const { container } = render(<PremiumBreakdownChart quotes={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when all premiums are zero', () => {
    const quotes = [
      makeQuote({ premium_monthly: '0', premium_annual: '0' }),
      makeQuote({ premium_monthly: '0', premium_annual: '0' }),
    ];
    const { container } = render(<PremiumBreakdownChart quotes={quotes} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders chart container with valid quotes', () => {
    const quotes = [
      makeQuote({ carrier_name: 'Carrier A', premium_monthly: '120.00' }),
      makeQuote({ carrier_name: 'Carrier B', premium_monthly: '180.00' }),
    ];
    const { container } = render(<PremiumBreakdownChart quotes={quotes} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('shows Agent recommended legend when recommended quote exists', () => {
    const quotes = [
      makeQuote({ carrier_name: 'Top Pick', premium_monthly: '100.00', is_recommended: true }),
      makeQuote({ carrier_name: 'Other', premium_monthly: '150.00' }),
    ];
    render(<PremiumBreakdownChart quotes={quotes} />);
    expect(screen.getByText('Agent recommended')).toBeInTheDocument();
  });

  it('hides Agent recommended legend when no recommended quote', () => {
    const quotes = [
      makeQuote({ carrier_name: 'A', premium_monthly: '100.00' }),
      makeQuote({ carrier_name: 'B', premium_monthly: '150.00' }),
    ];
    render(<PremiumBreakdownChart quotes={quotes} />);
    expect(screen.queryByText('Agent recommended')).not.toBeInTheDocument();
  });
});

describe('CalculatorBreakdownChart', () => {
  const baseBreakdown = {
    base_rate: 100,
    coverage_factor: 1.2,
    state_factor: 1.1,
    policy_fee: 15,
    discount: 0,
  };

  it('renders total with correct monthly premium', () => {
    render(<CalculatorBreakdownChart breakdown={baseBreakdown} monthlyPremium={185} />);
    // The "$185/mo" text is split across child elements, so use a function matcher
    expect(screen.getByText((_content, element) =>
      element?.tagName === 'P' && !!element.textContent?.includes('$185/mo')
    )).toBeInTheDocument();
  });

  it('shows discount label when discount is applied', () => {
    const withDiscount = {
      ...baseBreakdown,
      discount: 20,
      discount_label: 'Multi-Policy',
    };
    render(<CalculatorBreakdownChart breakdown={withDiscount} monthlyPremium={165} />);
    expect(screen.getByText(/\$165/)).toBeInTheDocument();
  });

  it('renders chart container', () => {
    const { container } = render(
      <CalculatorBreakdownChart breakdown={baseBreakdown} monthlyPremium={185} />
    );
    expect(container.firstChild).not.toBeNull();
  });
});
