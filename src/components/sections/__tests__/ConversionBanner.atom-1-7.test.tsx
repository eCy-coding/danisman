import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

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
  useReducedMotion: () => true,
}));
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) =>
    React.createElement('a', { href: to, ...props }, children),
}));
vi.mock('../../lib/i18n', () => ({
  useTranslation: () => ({ i18n: { language: 'tr' }, t: (k: string) => k }),
}));
vi.mock('../../lib/analytics', () => ({ trackEvent: vi.fn() }));

import { ConversionBanner } from '../ConversionBanner';

describe('ConversionBanner — atom-1-7', () => {
  it('renders section with testid', () => {
    render(<ConversionBanner />);
    expect(screen.getByTestId('conversion-banner')).toBeTruthy();
  });

  it('renders primary CTA link to /contact', () => {
    render(<ConversionBanner />);
    const links = document.querySelectorAll('a[href="/contact"]');
    expect(links.length).toBeGreaterThan(0);
  });

  it('renders secondary CTA link to /pricing', () => {
    render(<ConversionBanner />);
    const links = document.querySelectorAll('a[href="/pricing"]');
    expect(links.length).toBeGreaterThan(0);
  });

  it('renders discovery call headline text', () => {
    render(<ConversionBanner />);
    const banner = screen.getByTestId('conversion-banner');
    expect(banner.textContent).toMatch(/görüşme|session|stratejik/i);
  });

  it('renders with accent variant by default', () => {
    render(<ConversionBanner />);
    const banner = screen.getByTestId('conversion-banner');
    expect(banner.getAttribute('data-variant')).toBe('accent');
  });
});
