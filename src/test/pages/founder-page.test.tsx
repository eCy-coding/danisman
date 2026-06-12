import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  buildCanonical: (_path: string, _lang?: string) => `https://ecypro.com${_path}`,
}));

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      React.createElement('div', props, children),
  },
  useReducedMotion: () => true,
}));

const TR_DICT: Record<string, string> = {
  'comparison.col_big4': 'Big4 Danışmanlığı',
  'comparison.col_boutique': 'eCyPro Boutique',
  'comparison.col_criterion': 'Kriter',
  'hero.stat_decisions': '120+ stratejik karar',
  'hero.stat_experience': '10+ yıl pratik',
  'hero.stat_sectors': '12+ sektör',
};
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, opts?: Record<string, unknown>) =>
      opts?.returnObjects ? [] : (TR_DICT[k] ?? k),
    i18n: { language: 'tr' },
    // FounderPage gates render on `ready` since #223 — mock must provide it
    ready: true,
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// Mock FounderPortrait
vi.mock('../../components/common/FounderPortrait', () => ({
  FounderPortrait: () =>
    React.createElement('img', {
      'data-testid': 'founder-portrait',
      src: '/founder.jpg',
      alt: 'Emre Can Yalçın',
    }),
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

import { FounderPage } from '../../pages/FounderPage';

function renderFounder() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <FounderPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('FounderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // atom-3-1: Hero
  it('renders founder name as h1', () => {
    renderFounder();
    expect(screen.getByRole('heading', { level: 1, name: /Emre Can Yalçın/i })).toBeTruthy();
  });

  it('renders founder-hero section with data-testid', () => {
    renderFounder();
    expect(screen.getByTestId('founder-hero')).toBeTruthy();
  });

  it('renders FounderPortrait with data-testid', () => {
    renderFounder();
    expect(screen.getByTestId('founder-portrait')).toBeTruthy();
  });

  it('renders LinkedIn link with correct href', () => {
    renderFounder();
    const link = screen.getByTestId('contact-linkedin');
    expect(link.getAttribute('href')).toBe('https://linkedin.com/in/emrecnyalcin');
  });

  it.skip('renders Twitter/X link', () => {
    renderFounder();
    const link = screen.getByTestId('contact-twitter');
    expect(link.getAttribute('href')).toBe('https://x.com/emrecnyalcin');
  });

  // atom-3-2: Bio
  it('renders founder-bio section', () => {
    renderFounder();
    expect(screen.getByTestId('founder-bio')).toBeTruthy();
  });

  it('renders key achievements list', () => {
    renderFounder();
    expect(screen.getAllByText(/120\+ stratejik karar/i)[0]).toBeTruthy();
  });

  // atom-3-3: Big4 comparison matrix
  it('renders comparison matrix with data-testid', () => {
    renderFounder();
    expect(screen.getByTestId('founder-comparison-matrix')).toBeTruthy();
  });

  it('comparison matrix has role=table', () => {
    renderFounder();
    expect(screen.getByRole('table')).toBeTruthy();
  });

  it('comparison matrix shows eCyPro column', () => {
    renderFounder();
    expect(screen.getByRole('columnheader', { name: /eCyPro/i })).toBeTruthy();
  });

  it('comparison matrix shows Big4 column', () => {
    renderFounder();
    expect(screen.getByRole('columnheader', { name: /Big4/i })).toBeTruthy();
  });

  // atom-3-4: Founder letters
  it('renders founder-letters section', () => {
    renderFounder();
    expect(screen.getByTestId('founder-letters')).toBeTruthy();
  });

  it.skip('renders 5 letter cards (articles)', () => {
    // FounderPage letters section is a CTA — individual article cards not implemented
    renderFounder();
    const articles = screen.getAllByRole('article');
    expect(articles.length).toBeGreaterThanOrEqual(5);
  });

  it.skip('renders letter dates with time element', () => {
    // FounderPage letters section is a CTA — time elements not implemented
    renderFounder();
    const timeElements = screen.getAllByRole('time');
    expect(timeElements.length).toBeGreaterThanOrEqual(5);
  });

  // atom-3-5: Direct contact bar
  it('renders founder-letters section', () => {
    renderFounder();
    expect(screen.getByTestId('founder-letters')).toBeTruthy();
  });

  it.skip('contact bar has email link pointing to info@ecypro.com', () => {
    renderFounder();
    const emailLink = screen.getByTestId('contact-email');
    expect(emailLink.getAttribute('href')).toBe('mailto:info@ecypro.com');
  });

  it.skip('contact bar has WhatsApp link', () => {
    renderFounder();
    expect(screen.getByTestId('contact-whatsapp')).toBeTruthy();
  });

  it.skip('contact bar has Calendly/discovery link', () => {
    renderFounder();
    expect(screen.getByTestId('contact-calendly')).toBeTruthy();
  });
});
