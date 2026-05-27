import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock all heavy Hero dependencies
vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_: unknown, tag: string) =>
        ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
          React.createElement(tag === 'p' ? 'p' : 'div', props, children),
    },
  ),
  useReducedMotion: () => false,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: (_: unknown, __: unknown, range: number[]) => ({ get: () => range[0] }),
  useSpring: (v: unknown) => v,
  useMotionValue: (v: number) => ({ get: () => v, set: vi.fn() }),
  useInView: () => false,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) =>
    React.createElement('a', { href: to, ...props }, children),
  useNavigate: () => vi.fn(),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'tr' },
    t: (k: string) => k,
  }),
}));
vi.mock('@growthbook/growthbook-react', () => ({
  useFeatureValue: (_: string, def: string) => def,
}));
vi.mock('../common/useScrollToSection', () => ({
  useScrollToSection: () => vi.fn(),
}));
vi.mock('../../lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('../../lib/cta/calendly', () => ({
  getCalendlyCta: () => ({
    href: '#',
    target: undefined,
    rel: undefined,
    dataAttrs: {},
  }),
}));
vi.mock('../common/VideoModal', () => ({
  VideoModal: () => null,
}));
vi.mock('../ui/MouseGlow', () => ({ MouseGlow: () => null }));
vi.mock('../ui/MagneticButton', () => ({
  MagneticButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../ui/spotlight', () => ({ Spotlight: () => null }));
vi.mock('../ui/TextReveal', () => ({
  TextReveal: ({ text }: { text: string }) => <span>{text}</span>,
}));
vi.mock('../common/FadeIn', () => ({
  FloatingElement: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ i18n: { language: 'tr' }, t: (k: string) => k }),
}));
vi.mock('../../lib/i18n', () => ({
  useTranslation: () => ({ i18n: { language: 'tr' }, t: (k: string) => k }),
}));

import { Hero } from '../Hero';

describe('Hero — atom-1-1', () => {
  it('renders primary CTA with testid', () => {
    render(<Hero />);
    expect(screen.getByTestId('hero-cta-primary')).toBeTruthy();
  });

  it('renders secondary CTA with testid', () => {
    render(<Hero />);
    expect(screen.getByTestId('hero-cta-secondary')).toBeTruthy();
  });

  it('renders scroll indicator', () => {
    render(<Hero />);
    // Scroll indicator has "Scroll" text
    expect(screen.getByText(/scroll/i)).toBeTruthy();
  });

  it('renders hero section element', () => {
    render(<Hero />);
    const section = document.getElementById('hero');
    expect(section).toBeTruthy();
  });

  it('renders h1 heading', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
  });
});
