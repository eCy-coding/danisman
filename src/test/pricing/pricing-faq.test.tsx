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

describe('atom-7-5: Pricing FAQ section', () => {
  it('renders pricing-faq section', async () => {
    renderPricing();
    expect(await screen.findByTestId('pricing-faq')).toBeDefined();
  });

  it('FAQ section has accordion buttons', async () => {
    renderPricing();
    const faq = await screen.findByTestId('pricing-faq');
    const buttons = faq.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('accordion buttons have aria-expanded attribute', async () => {
    renderPricing();
    const faq = await screen.findByTestId('pricing-faq');
    const buttons = faq.querySelectorAll('button[aria-expanded]');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('first FAQ is open by default (aria-expanded=true)', async () => {
    renderPricing();
    const faq = await screen.findByTestId('pricing-faq');
    const firstButton = faq.querySelector('button[aria-expanded="true"]');
    expect(firstButton).toBeTruthy();
  });
});
