import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

vi.mock('../../lib/i18n', () => ({
  useTranslation: () => ({ i18n: { language: 'tr' }, t: (k: string) => k }),
}));
vi.mock('../../stores/currencyStore', () => ({
  useCurrencyStore: () => ({ formatPrice: (n: number) => `₺${n.toLocaleString()}` }),
}));
vi.mock('../../components/common/FadeIn', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../components/layout/PageWrapper', () => ({
  PageWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../components/ui/CurrencySwitcher', () => ({
  CurrencySwitcher: () => <div data-testid="currency-switcher" />,
}));
vi.mock('../../components/seo/JsonLd', () => ({ JsonLd: () => null }));
vi.mock('../../lib/structured-data', () => ({
  buildFaqSchema: () => ({}),
  buildBreadcrumbSchema: () => ({}),
}));
vi.mock('../../i18n/canonical', () => ({ buildCanonical: (_p: string) => `/pricing` }));
vi.mock('../../lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('../../lib/cta/calendly', () => ({
  getCalendlyCta: () => ({ href: '/discovery', target: '_self', rel: '', dataAttrs: {} }),
  hasExternalCalendly: () => false,
}));
vi.mock('../../components/common/LazyMount', () => ({
  LazyMount: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../components/features/roi/ROICalculator', () => ({
  ROICalculator: () => <div data-testid="roi-calculator" />,
}));
vi.mock('../../components/booking/CalendlyEmbed', () => ({
  CalendlyEmbed: () => <div data-testid="mock-calendly" />,
}));
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', rest, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

describe('atom-7-1: Pricing Hero', () => {
  it('renders pricing-hero section', async () => {
    renderPricing();
    expect(await screen.findByTestId('pricing-hero')).toBeDefined();
  });

  it('pricing hero contains title with Şeffaf or Fiyat text', async () => {
    renderPricing();
    const hero = await screen.findByTestId('pricing-hero');
    expect(hero.textContent).toMatch(/Şeffaf|Fiyat/i);
  });

  it('pricing hero contains h1', async () => {
    renderPricing();
    const hero = await screen.findByTestId('pricing-hero');
    expect(hero.querySelector('h1')).toBeTruthy();
  });

  it('pricing hero contains a subtitle paragraph', async () => {
    renderPricing();
    const hero = await screen.findByTestId('pricing-hero');
    expect(hero.querySelector('p')).toBeTruthy();
  });
});
