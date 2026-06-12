/**
 * SVC P7 — /services/:slug detail v2 units (test-first).
 *
 * New surface: lifecycle prev/next navigation, sticky section nav,
 * CTA-variant wiring (63 authored variants were never consumed), and a
 * fallback illustration for slugs without dedicated art.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { getCtaVariants } from '@/data/cta-variants';
import { LifecycleNav } from '@/components/services/LifecycleNav';
import { DetailSectionNav } from '@/components/services/DetailSectionNav';
import { ServiceIllustration } from '@/components/services/ServiceIllustration';

describe('getCtaVariants — graceful for every canonical slug', () => {
  it('returns authored variants for a covered slug', () => {
    const v = getCtaVariants('mergers-acquisitions');
    expect(v.isDefault).toBe(false);
    expect(v.variants.value.headline.length).toBeGreaterThan(5);
  });

  it('falls back to default copy for slugs without authored variants', () => {
    const v = getCtaVariants('company-valuation');
    expect(v.isDefault).toBe(true);
    expect(v.variants.value.headline.length).toBeGreaterThan(5);
    expect(v.variants.urgency.buttonLabel.length).toBeGreaterThan(2);
  });
});

describe('LifecycleNav — workflow position + prev/next', () => {
  const renderNav = (slug: string) =>
    render(
      <MemoryRouter>
        <LifecycleNav slug={slug} />
      </MemoryRouter>,
    );

  it('first step shows position, department and only a next link', () => {
    renderNav('company-valuation');
    expect(screen.getByTestId('lifecycle-position').textContent).toMatch(/1\/5/);
    expect(screen.getByTestId('lifecycle-next').getAttribute('href')).toBe(
      '/services/negotiation-loi',
    );
    expect(screen.queryByTestId('lifecycle-prev')).toBeNull();
  });

  it('last step shows only a prev link', () => {
    renderNav('post-merger-integration');
    expect(screen.getByTestId('lifecycle-position').textContent).toMatch(/5\/5/);
    expect(screen.getByTestId('lifecycle-prev').getAttribute('href')).toBe(
      '/services/deal-structuring',
    );
    expect(screen.queryByTestId('lifecycle-next')).toBeNull();
  });

  it('renders nothing for pillar pages (not lifecycle members)', () => {
    const { container } = renderNav('mergers-acquisitions');
    expect(container.firstChild).toBeNull();
  });
});

describe('DetailSectionNav — sticky in-page anchors', () => {
  it('renders one anchor per provided section', () => {
    render(
      <DetailSectionNav
        sections={[
          { id: 'problem', label: 'Problemler' },
          { id: 'methodology', label: 'Metodoloji' },
          { id: 'faq', label: 'SSS' },
        ]}
      />,
    );
    const nav = screen.getByTestId('detail-section-nav');
    const links = Array.from(nav.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(links).toEqual(['#problem', '#methodology', '#faq']);
  });
});

describe('ServiceIllustration — coverage for every canonical slug', () => {
  it('renders dedicated art when available', () => {
    render(<ServiceIllustration slug="strategic-transformation" />);
    expect(screen.getByTestId('service-illustration-strategic-transformation')).toBeTruthy();
  });

  it('renders the fallback glyph instead of nothing for unknown slugs', () => {
    render(<ServiceIllustration slug="company-valuation" />);
    expect(screen.getByTestId('service-illustration-company-valuation')).toBeTruthy();
    expect(screen.getByTestId('service-illustration-fallback-art')).toBeTruthy();
  });
});
