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

  it('renders Twitter/X link', () => {
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
    expect(screen.getByText(/40\+ tamamlanmış/i)).toBeTruthy();
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
    expect(screen.getByRole('columnheader', { name: 'eCyPro' })).toBeTruthy();
  });

  it('comparison matrix shows Big4 column', () => {
    renderFounder();
    expect(screen.getByRole('columnheader', { name: 'Big4' })).toBeTruthy();
  });

  // atom-3-4: Founder letters
  it('renders founder-letters section', () => {
    renderFounder();
    expect(screen.getByTestId('founder-letters')).toBeTruthy();
  });

  it('renders 5 letter cards (articles)', () => {
    renderFounder();
    const articles = screen.getAllByRole('article');
    expect(articles.length).toBeGreaterThanOrEqual(5);
  });

  it('renders letter dates with time element', () => {
    renderFounder();
    const timeElements = screen.getAllByRole('time');
    expect(timeElements.length).toBeGreaterThanOrEqual(5);
  });

  // atom-3-5: Direct contact bar
  it('renders founder-contact-bar section', () => {
    renderFounder();
    expect(screen.getByTestId('founder-contact-bar')).toBeTruthy();
  });

  it('contact bar has email link pointing to info@ecypro.com', () => {
    renderFounder();
    const emailLink = screen.getByTestId('contact-email');
    expect(emailLink.getAttribute('href')).toBe('mailto:info@ecypro.com');
  });

  it('contact bar has WhatsApp link', () => {
    renderFounder();
    expect(screen.getByTestId('contact-whatsapp')).toBeTruthy();
  });

  it('contact bar has Calendly/discovery link', () => {
    renderFounder();
    expect(screen.getByTestId('contact-calendly')).toBeTruthy();
  });
});
