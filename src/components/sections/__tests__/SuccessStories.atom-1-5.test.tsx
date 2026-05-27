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
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: (_: unknown, __: unknown, range: unknown[]) => ({ get: () => range[0] }),
  useSpring: (v: unknown) => v,
  useMotionValue: (v: number) => ({ get: () => v, set: vi.fn() }),
  useInView: () => false,
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) =>
    React.createElement('a', { href: to, ...props }, children),
}));
vi.mock('../../ui/MouseGlow', () => ({ MouseGlow: () => null }));
vi.mock('../../ui/ResponsiveImage', () => ({
  ResponsiveImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
vi.mock('../common/FadeIn', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../constants', () => ({
  CASE_STUDIES: [
    {
      slug: 'tech-scaleup-operational-excellence',
      title: 'Tech Scale-up · Operasyonel Mükemmellik',
      client: 'Anonymized client · Tech Scale-up',
      industry: 'Technology',
      result: 'Süreç netliği',
      duration: '6 ay',
      goLive: '2025',
      image: '/case-studies/tech-scaleup.svg',
      challenge: 'Challenge text',
    },
    {
      slug: 'family-business-governance',
      title: 'Aile Şirketi · Yönetişim & Kuşak Geçişi',
      client: 'Anonymized client · Family Business',
      industry: 'Family Business',
      result: 'Yönetişim modeli kuruldu',
      duration: '9 ay',
      goLive: '2025',
      image: '/case-studies/family-business.svg',
      challenge: 'Challenge text',
    },
    {
      slug: 'manufacturing-lean-six-sigma',
      title: 'Üretim · Lean & Six Sigma Pratiği',
      client: 'Anonymized client · Manufacturing',
      industry: 'Manufacturing',
      result: 'Atık azaltma',
      duration: '12 ay',
      goLive: '2025',
      image: '/case-studies/manufacturing.svg',
      challenge: 'Challenge text',
    },
  ],
}));

import { SuccessStories } from '../SuccessStories';

describe('SuccessStories — atom-1-5', () => {
  it('renders without crashing', () => {
    render(<SuccessStories />);
    expect(document.body).toBeTruthy();
  });

  it('renders all 3 anonymized case studies', () => {
    render(<SuccessStories />);
    expect(screen.getAllByText(/Anonymized client/i).length).toBeGreaterThanOrEqual(3);
  });

  it('renders Tech Scale-up case study title', () => {
    render(<SuccessStories />);
    expect(screen.getAllByText(/Tech Scale-up/i).length).toBeGreaterThan(0);
  });

  it('renders Aile Şirketi case study', () => {
    render(<SuccessStories />);
    expect(screen.getAllByText(/Aile Şirketi/i).length).toBeGreaterThan(0);
  });

  it('renders link to /case-studies', () => {
    render(<SuccessStories />);
    const links = document.querySelectorAll('a[href="/case-studies"]');
    expect(links.length).toBeGreaterThan(0);
  });
});
