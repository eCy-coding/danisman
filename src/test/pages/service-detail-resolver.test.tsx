/**
 * Phase 1 — ServiceDetailPage resolver regression suite.
 *
 * Bug: ServiceDetailPage yalnızca SERVICES kataloğuna bakıyordu; katalogda
 * olmayan ama service-content.ts içinde tam içeriği bulunan slug'lar (navbar
 * mega-menüsünden link verilen strategic-transformation, ai-analytics,
 * digital-strategy, operational-excellence) /404'e düşüyordu.
 *
 * Bu test: content-only slug'lar artık 404 vermez; gerçekten bilinmeyen bir
 * slug ise hâlâ /404'e yönlenir.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { ServiceDetailPage } from '@/pages/ServiceDetailPage';

// Heavy / side-effecting children mocked away — we only exercise the resolver.
vi.mock('@/components/services/ServiceDetailLayout', () => ({
  ServiceDetailLayout: ({ content }: { content: { slug: string; hero: { title: string } } }) => (
    <div data-testid="service-detail-layout" data-slug={content.slug}>
      {content.hero.title}
    </div>
  ),
}));
vi.mock('@/components/seo/JsonLd', () => ({ JsonLd: () => null }));
vi.mock('@/lib/i18n', () => ({ useTranslation: () => ({ language: 'tr' }) }));
vi.mock('@/i18n/canonical', () => ({
  buildCanonical: (p: string) => `https://www.ecypro.com${p}`,
}));

function renderAt(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/services/${slug}`]}>
      <Routes>
        <Route path="/services/:slug" element={<ServiceDetailPage />} />
        <Route path="/404" element={<div data-testid="not-found">NOT_FOUND</div>} />
        <Route path="/services" element={<div data-testid="services-index">INDEX</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

// Content-only slugs that previously 404'd (linked from the services mega-menu).
const CONTENT_ONLY_SLUGS = [
  'strategic-transformation',
  'ai-analytics',
  'digital-strategy',
  'operational-excellence',
  // Phase 2 — yeni SEO/GEO mega-menü hizmet sayfaları
  'organizational-design',
  'cloud-platform-modernization',
  'revenue-growth-strategy',
  'cost-optimization',
  'digital-operations',
];

describe('ServiceDetailPage — resolver', () => {
  it.each(CONTENT_ONLY_SLUGS)('renders content-only slug "%s" (not /404)', (slug) => {
    renderAt(slug);
    const layout = screen.getByTestId('service-detail-layout');
    expect(layout.getAttribute('data-slug')).toBe(slug);
    expect(screen.queryByTestId('not-found')).toBeNull();
  });

  it('still resolves a catalog slug (mergers-acquisitions)', () => {
    renderAt('mergers-acquisitions');
    expect(screen.getByTestId('service-detail-layout')).toBeTruthy();
    expect(screen.queryByTestId('not-found')).toBeNull();
  });

  it('redirects a genuinely unknown slug to /404', () => {
    renderAt('this-slug-does-not-exist-xyz');
    expect(screen.getByTestId('not-found')).toBeTruthy();
    expect(screen.queryByTestId('service-detail-layout')).toBeNull();
  });
});
