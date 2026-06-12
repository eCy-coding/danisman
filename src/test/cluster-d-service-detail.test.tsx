/**
 * Cluster D — Service Detail test suite
 *
 * Covers atom-11-2: "Bu hizmet kimin için?" 3 persona card
 * (ServiceDetailLayout component)
 *
 * Other atoms (11-1 hero, 11-3 process, 11-4 pricing, 11-5 related) are
 * already covered by the existing layout implementation; these tests
 * specifically validate the new persona section.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import type { ServiceContent } from '../data/service-content';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../components/seo/JsonLd', () => ({ JsonLd: () => null }));

vi.mock('../data/services', () => ({
  SERVICES: [
    {
      id: 'mergers-acquisitions',
      title: 'M&A Danışmanlığı',
      description: 'M&A danışmanlık hizmetleri',
      link: '/services/mergers-acquisitions',
    },
    {
      id: 'esg-strategy',
      title: 'ESG Stratejisi',
      description: 'ESG danışmanlık hizmetleri',
      link: '/services/esg-strategy',
    },
  ],
}));

vi.mock('../components/services/ServiceIllustration', () => ({
  ServiceIllustration: ({ slug }: { slug: string }) => <div data-testid={`illustration-${slug}`} />,
}));

vi.mock('../lib/animations', () => ({
  useInView: () => true,
  useCountUp: (value: number) => value,
}));

vi.mock('../hooks/useServiceOverride', () => ({
  useServiceOverride: () => ({ data: null }),
}));

// Stub all service widgets
const widgetNames = [
  'StrategicMaturityLadder',
  'DealPipelineVisualizer',
  'GenerationalTransitionTimeline',
  'OperationsROICalculator',
  'CustomerSegmentQuiz',
  'OrgDesignMaturity',
  'CrisisReadinessMatrix',
  'AIMaturityRadar',
  'DigitalReadinessScorecard',
  'KVKKComplianceChecker',
  'ESGScoreCard',
  'IncentiveEligibilityChecker',
  'MacroExposureDashboard',
  'MarketConcentrationAnalyzer',
  'UnionEngagementMatrix',
  'EmploymentIncentiveCalculator',
  'EmployerBrandHealth',
  'MarketFeasibilityMatrix',
  'CountryRiskRadar',
  'UrbanReadinessScore',
  'RegulatoryStakeholderMap',
];
widgetNames.forEach((name) => {
  vi.mock(`../components/services/widgets/${name}`, () => ({
    [name]: () => <div data-testid={`widget-${name}`} />,
  }));
});

vi.mock('motion/react', () => ({
  motion: {
    div: React.forwardRef(
      (
        { children, ...props }: React.HTMLAttributes<HTMLDivElement>,
        ref: React.Ref<HTMLDivElement>,
      ) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      ),
    ),
  },
  useReducedMotion: () => false,
}));

// ── Test data ─────────────────────────────────────────────────────────────────

const MINIMAL_CONTENT: ServiceContent = {
  slug: 'mergers-acquisitions',
  hero: {
    title: 'Birleşme ve Satın Alma Danışmanlığı',
    subtitle: 'M&A danışmanlık hizmetleri.',
    valueProp: 'Big4 metodolojisi, boutique çevikliğiyle.',
    primaryCtaText: 'Ücretsiz Strateji Görüşmesi Al',
  },
  problem: { title: '', painPoints: [] },
  outcomes: { title: '', results: [] },
  methodology: { title: '', phases: [] },
  deliverables: { title: '', artifacts: [] },
  timeline: { totalDuration: '', milestones: [] },
  investment: { range: '', model: '', paymentPlan: '' },
  trust: { anonymizedExample: '' },
  faq: { items: [] },
  related: [],
  assessment: { title: '', questions: [], rubric: '' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderRealLayout = async (content: ServiceContent = MINIMAL_CONTENT) => {
  const { ServiceDetailLayout } = await import('../components/services/ServiceDetailLayout');
  return render(
    <MemoryRouter>
      <ServiceDetailLayout
        content={content}
        fallbackTitle={content.hero.title}
        fallbackDescription={content.hero.subtitle}
      />
    </MemoryRouter>,
  );
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ServiceDetailLayout — atom-11-2: Persona cards section', () => {
  it('renders service-personas section', async () => {
    await renderRealLayout();
    expect(screen.getByTestId('service-personas')).toBeTruthy();
  });

  it('renders "Bu hizmet kimin için?" heading', async () => {
    await renderRealLayout();
    expect(screen.getByRole('heading', { name: /Bu hizmet kimin için/i })).toBeTruthy();
  });

  it('renders exactly 3 persona cards', async () => {
    await renderRealLayout();
    expect(screen.getByTestId('persona-ceo')).toBeTruthy();
    expect(screen.getByTestId('persona-cfo')).toBeTruthy();
    expect(screen.getByTestId('persona-board')).toBeTruthy();
  });

  it('renders CEO/Kurucu persona', async () => {
    await renderRealLayout();
    expect(screen.getByText(/CEO \/ Kurucu Ortak/i)).toBeTruthy();
  });

  it('renders CFO/COO persona', async () => {
    await renderRealLayout();
    expect(screen.getByText(/CFO \/ COO/i)).toBeTruthy();
  });

  it('renders Yönetim Kurulu persona', async () => {
    await renderRealLayout();
    expect(screen.getByText(/Yönetim Kurulu \/ Holdingler/i)).toBeTruthy();
  });

  it('each persona card is an article element', async () => {
    await renderRealLayout();
    const ceo = screen.getByTestId('persona-ceo');
    expect(ceo.tagName.toLowerCase()).toBe('article');
  });

  it('persona section has aria-labelledby for a11y', async () => {
    await renderRealLayout();
    const section = screen.getByTestId('service-personas');
    expect(section.getAttribute('aria-labelledby')).toBe('personas-heading');
  });

  it('personas heading has id="personas-heading"', async () => {
    await renderRealLayout();
    const heading = document.getElementById('personas-heading');
    expect(heading).toBeTruthy();
    expect(heading?.textContent).toMatch(/Bu hizmet kimin için/i);
  });

  it('persona descriptions contain strategic consulting context', async () => {
    await renderRealLayout();
    expect(screen.getByText(/stratejik dönüşüm|tarafsız/i)).toBeTruthy();
  });
});

describe('ServiceDetailLayout — atom-11-1: Hero section', () => {
  it('renders service title in h1', async () => {
    await renderRealLayout();
    expect(
      screen.getByRole('heading', { name: /Birleşme ve Satın Alma Danışmanlığı/i }),
    ).toBeTruthy();
  });

  it('renders breadcrumb navigation', async () => {
    await renderRealLayout();
    expect(screen.getByRole('navigation', { name: /Breadcrumb/i })).toBeTruthy();
  });

  it('renders Anasayfa breadcrumb link', async () => {
    await renderRealLayout();
    expect(screen.getByRole('link', { name: /Anasayfa/i })).toBeTruthy();
  });

  it('renders primary CTA link', async () => {
    await renderRealLayout();
    expect(screen.getByText(/Ücretsiz Strateji Görüşmesi Al/i)).toBeTruthy();
  });
});

describe('ServiceDetailLayout — atom-11-5: Related services + Discovery CTA', () => {
  // SVC P7: the footer now renders the per-service 'value' CTA variant
  // (cta-variants.ts) instead of static copy.
  it('renders the per-service CTA variant headline at bottom', async () => {
    const { getCtaVariants } = await import('../data/cta-variants');
    const expected = getCtaVariants(MINIMAL_CONTENT.slug).variants.value;
    await renderRealLayout();
    expect(screen.getByText(expected.headline)).toBeTruthy();
  });

  it('renders the CTA variant button label as the /contact link', async () => {
    const { getCtaVariants } = await import('../data/cta-variants');
    const expected = getCtaVariants(MINIMAL_CONTENT.slug).variants.value;
    await renderRealLayout();
    expect(screen.getByText(new RegExp(expected.buttonLabel))).toBeTruthy();
  });

  it('renders engagement footer with /contact link', async () => {
    await renderRealLayout();
    const links = screen.getAllByRole('link');
    const contactLink = links.find((l) => l.getAttribute('href') === '/contact');
    expect(contactLink).toBeTruthy();
  });
});
