import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useTranslation: () => ({ language: 'tr' }),
  getLang: (obj: { tr?: string; en?: string }, lang?: string) =>
    lang?.startsWith('tr') ? (obj?.tr ?? '') : (obj?.en ?? ''),
  MultiLang: {},
}));

// Mock canonical
vi.mock('../../i18n/canonical', () => ({
  buildCanonical: (_p: string, _l?: string) => `https://ecypro.com${_p}`,
}));

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      React.createElement('div', rest, children),
  },
  useReducedMotion: () => true,
}));

// Mock FadeIn
vi.mock('../../components/common/FadeIn', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
}));

// Mock PageWrapper
vi.mock('../../components/layout/PageWrapper', () => ({
  PageWrapper: ({ children }: { children: React.ReactNode }) =>
    React.createElement('main', null, children),
}));

// Mock CalendlyEmbed
vi.mock('../../components/booking/CalendlyEmbed', () => ({
  CalendlyEmbed: ({ source }: { source?: string }) =>
    React.createElement(
      'div',
      { 'data-testid': 'calendly-embed', 'data-source': source },
      'Calendly',
    ),
}));

// Mock analytics
vi.mock('../../lib/integrations/analytics', () => ({
  trackDiscoveryCallBook: vi.fn(),
}));

import { DiscoveryPage } from '../../pages/DiscoveryPage';

function renderDiscovery() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <DiscoveryPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('DiscoveryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response),
    );
  });

  // atom-5-1: Hero
  it('renders hero h1 with correct text', () => {
    renderDiscovery();
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.getByText(/30 Dakikada İhtiyacınızı Anlayalım/i)).toBeTruthy();
  });

  it('renders discovery-hero section', () => {
    renderDiscovery();
    expect(screen.getByTestId('discovery-hero')).toBeTruthy();
  });

  // atom-5-2: Form
  it('renders discovery-form', () => {
    renderDiscovery();
    expect(screen.getByTestId('discovery-form')).toBeTruthy();
  });

  it('form has name input', () => {
    renderDiscovery();
    expect(screen.getByTestId('discovery-name-input')).toBeTruthy();
  });

  it('form has email input with type=email', () => {
    renderDiscovery();
    const emailInput = screen.getByTestId('discovery-email-input');
    expect(emailInput.getAttribute('type')).toBe('email');
  });

  it('form has KVKK checkbox', () => {
    renderDiscovery();
    expect(screen.getByTestId('discovery-kvkk-checkbox')).toBeTruthy();
  });

  it('submit button is disabled when KVKK not checked', () => {
    renderDiscovery();
    const submitBtn = screen.getByTestId('discovery-submit');
    expect(submitBtn.hasAttribute('disabled')).toBe(true);
  });

  it('submit button enables after KVKK checked', () => {
    renderDiscovery();
    const checkbox = screen.getByTestId('discovery-kvkk-checkbox');
    fireEvent.click(checkbox);
    const submitBtn = screen.getByTestId('discovery-submit');
    expect(submitBtn.hasAttribute('disabled')).toBe(false);
  });

  it('form submits and shows success state', async () => {
    renderDiscovery();

    // Fill required fields
    fireEvent.change(screen.getByTestId('discovery-name-input'), {
      target: { value: 'Test Kullanıcı' },
    });
    fireEvent.change(screen.getByTestId('discovery-email-input'), {
      target: { value: 'test@example.com' },
    });

    // Check KVKK
    fireEvent.click(screen.getByTestId('discovery-kvkk-checkbox'));

    // Submit
    fireEvent.click(screen.getByTestId('discovery-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('discovery-success')).toBeTruthy();
    });
  });

  // atom-5-3: KVKK Badge
  it('renders kvkk-badge', () => {
    renderDiscovery();
    expect(screen.getByTestId('kvkk-badge')).toBeTruthy();
  });

  it('KVKK badge shows ROPA SAT-01', () => {
    renderDiscovery();
    expect(screen.getByText(/ROPA SAT-01/i)).toBeTruthy();
  });

  it('KVKK badge shows 3 yıl saklama', () => {
    renderDiscovery();
    expect(screen.getByText(/3 yıl saklama/i)).toBeTruthy();
  });

  // atom-5-4: Calendly
  it('renders discovery-calendly section', () => {
    renderDiscovery();
    expect(screen.getByTestId('discovery-calendly')).toBeTruthy();
  });

  it('Calendly section has heading about time', () => {
    renderDiscovery();
    expect(screen.getByText(/Zaman Bulmakta Güçlük/i)).toBeTruthy();
  });

  // atom-5-5: Trust signals
  it('renders discovery-trust-signals section', () => {
    renderDiscovery();
    expect(screen.getByTestId('discovery-trust-signals')).toBeTruthy();
  });

  it('trust signals contain Kurucu Profili', () => {
    renderDiscovery();
    expect(screen.getByText(/Kurucu Profili/i)).toBeTruthy();
  });

  it('trust signals contain Vaka Çalışmaları', () => {
    renderDiscovery();
    expect(screen.getByText(/Vaka Çalışmaları/i)).toBeTruthy();
  });

  it('trust signals contain KVKK Uzmanı', () => {
    renderDiscovery();
    expect(screen.getByText(/KVKK Uzmanı/i)).toBeTruthy();
  });
});
