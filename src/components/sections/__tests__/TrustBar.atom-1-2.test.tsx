import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'tr' }, t: (k: string) => k }),
}));
vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_: unknown, _tag: string) =>
        ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
          React.createElement('div', props, children),
    },
  ),
  useReducedMotion: () => false,
  useInView: () => true,
}));
vi.mock('../common/FadeIn', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../constants', () => ({
  TRUST_LOGOS: [
    {
      id: '1',
      src: null,
      name: 'Client A',
      alt: { tr: 'Sektör A', en: 'Sector A' },
      sector: { tr: 'Finans', en: 'Finance' },
    },
    {
      id: '2',
      src: null,
      name: 'Client B',
      alt: { tr: 'Sektör B', en: 'Sector B' },
      sector: { tr: 'Teknoloji', en: 'Technology' },
    },
  ],
}));

import { TrustBar } from '../TrustBar';

describe('TrustBar — atom-1-2', () => {
  it('renders section with testid', () => {
    render(<TrustBar />);
    expect(screen.getByTestId('trust-bar')).toBeTruthy();
  });

  it('has KVKK trust signal text', () => {
    render(<TrustBar />);
    expect(screen.getByText(/KVKK/i)).toBeTruthy();
  });

  it('has Founder badge element', () => {
    render(<TrustBar />);
    expect(screen.getByTestId('trust-bar-founder-badge')).toBeTruthy();
  });

  it('Founder badge contains founder name', () => {
    render(<TrustBar />);
    const badge = screen.getByTestId('trust-bar-founder-badge');
    expect(badge.textContent).toMatch(/Emre Can Yalçın/);
  });
});
