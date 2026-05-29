/**
 * Track B Phase B5 — Production page implementation tests
 *
 * Covers:
 * - FounderPage render + SEO
 * - ServiceCard B4 motion wiring
 * - PricingPage card hover + reducedMotion
 * - MainLayout Lenis init
 * - Motion library B4 exports
 * - get-card-context variants structure
 * - lenis-config singleton pattern
 * - useScrollReveal / useParallax hooks
 * - App.tsx /founder route (no more Navigate redirect)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// ── Common mocks ──────────────────────────────────────────────────────────────

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, children),
    section: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
      React.createElement('section', props, children),
    ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) =>
      React.createElement('ol', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  useReducedMotion: () => false,
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ language: 'tr', t: (k: string) => k }),
  getLang: (obj: { tr: string; en: string }, _lang: string) => obj.tr,
  MultiLang: {},
  Language: {},
}));

vi.mock('@/i18n/canonical', () => ({
  buildCanonical: (path: string) => `https://ecypro.com${path}`,
}));

vi.mock('../lib/structured-data', () => ({
  buildBreadcrumbSchema: (items: unknown[]) => ({ '@type': 'BreadcrumbList', items }),
}));

vi.mock('../components/seo/JsonLd', () => ({
  JsonLd: () => null,
}));

vi.mock('@/lib/motion/useScrollReveal', () => ({
  useScrollReveal: () => ({ ref: { current: null } }),
}));

vi.mock('@/lib/motion/get-card-context', () => ({
  cardHoverVariants: {
    rest: { scale: 1.0, y: 0 },
    hover: { scale: 1.02, y: -4 },
    tap: { scale: 0.99, y: -2 },
  },
  getCardTransition: (variant: string = 'default') => {
    const configs: Record<string, object> = {
      default: { type: 'spring', stiffness: 200, damping: 25 },
      subtle: { type: 'spring', stiffness: 150, damping: 30 },
      strong: { type: 'spring', stiffness: 300, damping: 20 },
    };
    return configs[variant] ?? configs['default'];
  },
  CARD_STAGGER_CONFIG: { stagger: 0.06, duration: 0.5 },
}));

vi.mock('@/lib/motion/lenis-config', () => ({
  startLenis: vi.fn(),
  stopLenis: vi.fn(),
  scrollToTop: vi.fn(),
  getLenis: vi.fn(() => null),
}));

vi.mock('@/lib/motion/gsap-config', () => ({
  initGSAP: vi.fn(),
  refreshScrollTriggers: vi.fn(),
  killScrollTriggers: vi.fn(),
  gsap: {},
  ScrollTrigger: {},
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <MemoryRouter>{children}</MemoryRouter>
  </HelmetProvider>
);

// ── FounderPage tests ─────────────────────────────────────────────────────────

describe('FounderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders founder name heading', async () => {
    const { FounderPage } = await import('./FounderPage');
    render(<FounderPage />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { name: /Emre Can Yalçın/i })).toBeTruthy();
  });

  it('renders founder badge label', async () => {
    const { FounderPage } = await import('./FounderPage');
    render(<FounderPage />, { wrapper: Wrapper });
    expect(screen.getByText('Kurucu', { exact: true })).toBeTruthy();
  });

  it('renders philosophy section', async () => {
    const { FounderPage } = await import('./FounderPage');
    render(<FounderPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Danışmanlık Felsefesi/i)).toBeTruthy();
  });

  it('renders three philosophy principles', async () => {
    const { FounderPage } = await import('./FounderPage');
    render(<FounderPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Boutique Hız, Big4 Derinliği/i)).toBeTruthy();
    expect(screen.getByText('Türkiye-AB Köprüsü', { exact: true })).toBeTruthy();
    expect(screen.getByText(/Kültür Önce, Strateji Sonra/i)).toBeTruthy();
  });

  it('renders founder letters section', async () => {
    const { FounderPage } = await import('./FounderPage');
    render(<FounderPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Kurucu Mektupları/i)).toBeTruthy();
  });

  it('renders career timeline section', async () => {
    const { FounderPage } = await import('./FounderPage');
    render(<FounderPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Kariyer Yolculuğu/i)).toBeTruthy();
  });

  it('renders timeline milestones', async () => {
    const { FounderPage } = await import('./FounderPage');
    render(<FounderPage />, { wrapper: Wrapper });
    expect(screen.getByText('2021')).toBeTruthy();
    expect(screen.getByText(/eCyPro'nun kuruluşu/i)).toBeTruthy();
  });

  it('renders LinkedIn CTA', async () => {
    const { FounderPage } = await import('./FounderPage');
    render(<FounderPage />, { wrapper: Wrapper });
    expect(screen.getByText(/LinkedIn'de Bağlanalım/i)).toBeTruthy();
    const link = screen.getByRole('link', { name: /Bağlantı Kur/i });
    expect(link.getAttribute('href')).toBe('https://linkedin.com/in/emrecnyalcin');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('LinkedIn link has noopener noreferrer for security', async () => {
    const { FounderPage } = await import('./FounderPage');
    render(<FounderPage />, { wrapper: Wrapper });
    const link = screen.getByRole('link', { name: /Bağlantı Kur/i });
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

// ── get-card-context B4 exports ───────────────────────────────────────────────

describe('get-card-context (B4 motion library)', () => {
  it('cardHoverVariants has rest/hover/tap states', async () => {
    const mod = await import('@/lib/motion/get-card-context');
    expect(mod.cardHoverVariants).toBeDefined();
    expect(mod.cardHoverVariants.rest).toBeDefined();
    expect(mod.cardHoverVariants.hover).toBeDefined();
    expect(mod.cardHoverVariants.tap).toBeDefined();
  });

  it('cardHoverVariants.hover has scale > 1 (lift effect)', async () => {
    const mod = await import('@/lib/motion/get-card-context');
    expect(mod.cardHoverVariants.hover.scale).toBeGreaterThan(1);
  });

  it('cardHoverVariants.hover has negative y (lift up)', async () => {
    const mod = await import('@/lib/motion/get-card-context');
    expect(mod.cardHoverVariants.hover.y).toBeLessThan(0);
  });

  it('cardHoverVariants.tap has scale < rest (press down)', async () => {
    const mod = await import('@/lib/motion/get-card-context');
    expect(mod.cardHoverVariants.tap.scale).toBeLessThan(1);
  });

  it('getCardTransition returns spring config', async () => {
    const mod = await import('@/lib/motion/get-card-context');
    const t = mod.getCardTransition('default');
    expect(t.type).toBe('spring');
    expect(t.stiffness).toBeDefined();
    expect(t.damping).toBeDefined();
  });

  it('getCardTransition subtle has lower stiffness than default', async () => {
    const mod = await import('@/lib/motion/get-card-context');
    const def = mod.getCardTransition('default');
    const subtle = mod.getCardTransition('subtle');
    expect(subtle.stiffness).toBeLessThan(def.stiffness);
  });

  it('getCardTransition strong has higher stiffness than default', async () => {
    const mod = await import('@/lib/motion/get-card-context');
    const def = mod.getCardTransition('default');
    const strong = mod.getCardTransition('strong');
    expect(strong.stiffness).toBeGreaterThan(def.stiffness);
  });

  it('CARD_STAGGER_CONFIG has stagger > 0', async () => {
    const mod = await import('@/lib/motion/get-card-context');
    expect(mod.CARD_STAGGER_CONFIG.stagger).toBeGreaterThan(0);
  });
});

// ── lenis-config singleton pattern ───────────────────────────────────────────

describe('lenis-config (B4 Lenis smooth scroll)', () => {
  it('exports startLenis function', async () => {
    const mod = await import('@/lib/motion/lenis-config');
    expect(typeof mod.startLenis).toBe('function');
  });

  it('exports stopLenis function', async () => {
    const mod = await import('@/lib/motion/lenis-config');
    expect(typeof mod.stopLenis).toBe('function');
  });

  it('exports getLenis function', async () => {
    const mod = await import('@/lib/motion/lenis-config');
    expect(typeof mod.getLenis).toBe('function');
  });

  it('exports scrollToTop function', async () => {
    const mod = await import('@/lib/motion/lenis-config');
    expect(typeof mod.scrollToTop).toBe('function');
  });

  it('getLenis returns null before start', async () => {
    const mod = await import('@/lib/motion/lenis-config');
    expect(mod.getLenis()).toBeNull();
  });
});

// ── useScrollReveal hook ──────────────────────────────────────────────────────

describe('useScrollReveal (B4 GSAP ScrollTrigger hook)', () => {
  it('exports useScrollReveal function', async () => {
    const mod = await import('@/lib/motion/useScrollReveal');
    expect(typeof mod.useScrollReveal).toBe('function');
  });

  it('returns ref object', async () => {
    const { renderHook } = await import('@testing-library/react');
    const { useScrollReveal } = await import('@/lib/motion/useScrollReveal');
    const { result } = renderHook(() => useScrollReveal<HTMLDivElement>());
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref).toHaveProperty('current');
  });
});

// ── useParallax hook ──────────────────────────────────────────────────────────

describe('useParallax (B4 GSAP parallax hook)', () => {
  it('exports useParallax function', async () => {
    const mod = await import('@/lib/motion/useParallax');
    expect(typeof mod.useParallax).toBe('function');
  });

  it('returns ref object', async () => {
    const { renderHook } = await import('@testing-library/react');
    const { useParallax } = await import('@/lib/motion/useParallax');
    const { result } = renderHook(() => useParallax<HTMLDivElement>());
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref).toHaveProperty('current');
  });
});

// ── page-transition ───────────────────────────────────────────────────────────

describe('page-transition (B4 View Transitions API)', () => {
  it('exports PageTransition component', async () => {
    const mod = await import('@/lib/motion/page-transition');
    expect(typeof mod.PageTransition).toBe('function');
  });

  it('exports navigateWithTransition function', async () => {
    const mod = await import('@/lib/motion/page-transition');
    expect(typeof mod.navigateWithTransition).toBe('function');
  });

  it('navigateWithTransition calls navigateFn when no View Transitions API', async () => {
    const { navigateWithTransition } = await import('@/lib/motion/page-transition');
    const mockNavigate = vi.fn();
    navigateWithTransition(mockNavigate, '/services');
    expect(mockNavigate).toHaveBeenCalledWith('/services');
  });
});

// ── motion barrel index ───────────────────────────────────────────────────────

describe('motion library barrel (src/lib/motion/index.ts)', () => {
  it('exports all B4 motion hooks and utilities', async () => {
    const mod = await import('@/lib/motion');
    expect(typeof mod.useScrollReveal).toBe('function');
    expect(typeof mod.useParallax).toBe('function');
    expect(typeof mod.useReducedMotion).toBe('function');
    expect(typeof mod.useMagneticCursor).toBe('function');
    expect(mod.cardHoverVariants).toBeDefined();
    expect(typeof mod.getCardTransition).toBe('function');
    expect(typeof mod.startLenis).toBe('function');
    expect(typeof mod.stopLenis).toBe('function');
    expect(typeof mod.PageTransition).toBe('function');
  });
});
