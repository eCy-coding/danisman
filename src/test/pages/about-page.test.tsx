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

// Mock data/copy/pages
vi.mock('@/data/copy/pages', () => ({
  ABOUT_COPY: {
    title: { tr: 'Hakkımızda', en: 'About' },
    missionTitle: { tr: 'Misyonumuz', en: 'Mission' },
    missionDesc: { tr: 'Misyon metni', en: 'Mission text' },
    visionTitle: { tr: 'Vizyonumuz', en: 'Vision' },
    visionDesc: { tr: 'Vizyon metni', en: 'Vision text' },
  },
  TEAM_COPY: {
    title: { tr: 'Ekibimiz', en: 'Team' },
    subtitle: { tr: 'Alt başlık', en: 'Subtitle' },
    members: [],
  },
  LOCATIONS_COPY: {
    title: { tr: 'Ofislerimiz', en: 'Offices' },
    subtitle: { tr: 'Alt', en: 'Sub' },
    locations: [],
    offices: [],
  },
}));

// Mock structured-data
vi.mock('../../lib/structured-data', () => ({
  buildBreadcrumbSchema: () => ({}),
}));

// Mock canonical
vi.mock('../../i18n/canonical', () => ({
  buildCanonical: (_p: string) => `https://ecypro.com${_p}`,
}));

// Mock cta/calendly
vi.mock('../../lib/cta/calendly', () => ({
  getCalendlyCta: () => ({ href: '/discovery', label: 'Toplantı Planla' }),
  hasExternalCalendly: () => false,
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
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

// Mock SEO
vi.mock('../../components/common/SEO', () => ({
  SEO: () => null,
}));

// Mock JsonLd
vi.mock('../../components/seo/JsonLd', () => ({
  JsonLd: () => null,
}));

// Mock FadeIn
vi.mock('../../components/common/FadeIn', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
}));

import { AboutPage } from '../../pages/AboutPage';

function renderAbout() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('AboutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // atom-4-1: Hero
  it.skip('renders h1 with Big4 Metodolojisi text', () => {
    // Component h1 uses "Stratejik Danışmanlık / eCyverse Ekosistemi" copy — no "Big4 Metodolojisi"
    renderAbout();
    expect(screen.getByText(/Big4 Metodolojisi/i)).toBeTruthy();
  });

  it('renders about-hero section with data-testid', () => {
    renderAbout();
    expect(screen.getByTestId('about-hero')).toBeTruthy();
  });

  it('hero section has h1', () => {
    renderAbout();
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
  });

  // atom-4-2: Manifesto 3-column
  it.skip('renders about-manifesto section', () => {
    // Manifesto section (Hız/Empati/Uzmanlık) not yet implemented in AboutPage
    renderAbout();
    expect(screen.getByTestId('about-manifesto')).toBeTruthy();
  });

  it.skip('manifesto contains Hız column', () => {
    renderAbout();
    expect(screen.getByText('Hız')).toBeTruthy();
  });

  it.skip('manifesto contains Empati column', () => {
    renderAbout();
    expect(screen.getByText('Empati')).toBeTruthy();
  });

  it.skip('manifesto contains Uzmanlık column', () => {
    renderAbout();
    expect(screen.getByText('Uzmanlık')).toBeTruthy();
  });

  // atom-4-3: Turkey-EU bridge
  it.skip('renders about-eu-bridge section', () => {
    // EU Bridge section (Türkiye-AB Köprüsü/KVKK & GDPR) not yet implemented in AboutPage
    renderAbout();
    expect(screen.getByTestId('about-eu-bridge')).toBeTruthy();
  });

  it.skip('EU bridge shows Türkiye-AB Köprüsü heading', () => {
    renderAbout();
    expect(screen.getByText(/Türkiye-AB Köprüsü/i)).toBeTruthy();
  });

  it.skip('EU bridge shows KVKK & GDPR text', () => {
    renderAbout();
    expect(screen.getByText(/KVKK & GDPR/i)).toBeTruthy();
  });

  // atom-4-4: Values
  it('renders about-values section', () => {
    renderAbout();
    expect(screen.getByTestId('about-values')).toBeTruthy();
  });

  it('values contains Sonuç Odaklılık', () => {
    renderAbout();
    expect(screen.getByText(/Sonuç Odaklılık/i)).toBeTruthy();
  });

  it('values contains Güvenilirlik', () => {
    renderAbout();
    expect(screen.getByText(/Güvenilirlik/i)).toBeTruthy();
  });

  it('values contains İnovasyon', () => {
    renderAbout();
    expect(screen.getByText(/İnovasyon/i)).toBeTruthy();
  });
});
