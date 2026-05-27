import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

vi.mock('../../lib/i18n', () => ({
  useTranslation: () => ({ i18n: { language: 'tr' }, t: (k: string) => k }),
}));
vi.mock('../../stores/currencyStore', () => ({
  useCurrencyStore: () => ({ formatPrice: (n: number) => `₺${n}` }),
}));
vi.mock('../../components/common/FadeIn', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../components/layout/PageWrapper', () => ({
  PageWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../components/ui/CurrencySwitcher', () => ({
  CurrencySwitcher: () => <div />,
}));
vi.mock('../../components/seo/JsonLd', () => ({ JsonLd: () => null }));
vi.mock('../../lib/structured-data', () => ({
  buildFaqSchema: () => ({}),
  buildBreadcrumbSchema: () => ({}),
}));
vi.mock('../../i18n/canonical', () => ({ buildCanonical: () => '/pricing' }));
vi.mock('../../lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('../../lib/cta/calendly', () => ({
  getCalendlyCta: () => ({ href: '/discovery', target: '_self', rel: '', dataAttrs: {} }),
  hasExternalCalendly: () => false,
}));
vi.mock('../../components/common/LazyMount', () => ({
  LazyMount: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../components/features/roi/ROICalculator', () => ({
  ROICalculator: () => <div />,
}));
vi.mock('../../components/booking/CalendlyEmbed', () => ({
  CalendlyEmbed: () => <div />,
}));
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', rest, children),
  },
}));

import PricingPage from '../../pages/PricingPage';

function renderPricing() {
  return render(
    <React.Suspense fallback={<div />}>
      <HelmetProvider>
        <MemoryRouter>
          <PricingPage />
        </MemoryRouter>
      </HelmetProvider>
    </React.Suspense>,
  );
}

describe('atom-7-2: Pricing Tiers section', () => {
  it('renders pricing-tiers section', async () => {
    renderPricing();
    expect(await screen.findByTestId('pricing-tiers')).toBeDefined();
  });

  it('renders starter tier card', async () => {
    renderPricing();
    expect(await screen.findByTestId('pricing-tier-starter')).toBeDefined();
  });

  it('renders growth tier card', async () => {
    renderPricing();
    expect(await screen.findByTestId('pricing-tier-growth')).toBeDefined();
  });

  it('renders enterprise tier card', async () => {
    renderPricing();
    expect(await screen.findByTestId('pricing-tier-enterprise')).toBeDefined();
  });

  it('highlighted tier has data-highlight=true', async () => {
    renderPricing();
    const highlighted = document.querySelector('[data-highlight="true"]');
    expect(highlighted).toBeTruthy();
  });
});
