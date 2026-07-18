/**
 * SeoManager — EN article-parity mechanism: skip generic hreflang on
 * paired-article routes.
 *
 * Paired Perspektifler articles use DISTINCT slugs per language, so
 * SeoManager's generic path-based alternates (same slug, swap /tr↔/en)
 * would be WRONG there — BlogPostPage owns hreflang for its own route via
 * buildArticleAlternates(). This suite verifies SeoManager omits its
 * alternates on article routes (so nothing conflicts/duplicates) while
 * still emitting them normally on the hub + category routes.
 *
 * Uses the REAL Helmet shim (src/lib/seo-helmet.tsx — the actual
 * implementation `react-helmet-async` is aliased to app-wide, see
 * vite.config.ts / vitest.config.ts) so this exercises the real DOM
 * upsert-by-selector behavior, not a test double.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Helmet } from '@/lib/seo-helmet';

let mockLanguage = 'en';
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: mockLanguage },
    t: (key: string) => key,
  }),
}));

import { SeoManager } from './SeoManager';

function alternateHrefs(): Record<string, string[]> {
  const nodes = Array.from(document.head.querySelectorAll('link[rel="alternate"]'));
  const out: Record<string, string[]> = {};
  for (const n of nodes) {
    const hl = n.getAttribute('hreflang') ?? '';
    out[hl] = out[hl] ?? [];
    out[hl].push(n.getAttribute('href') ?? '');
  }
  return out;
}

describe('SeoManager — article-route hreflang skip', () => {
  beforeEach(() => {
    mockLanguage = 'en';
    document.head.innerHTML = '';
  });
  afterEach(() => {
    cleanup();
    document.head.innerHTML = '';
  });

  it('emits generic tr/en/x-default hreflang on the hub route', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/en/perspektifler']}>
          <SeoManager />
        </MemoryRouter>,
      );
    });
    const alts = alternateHrefs();
    expect(alts['tr-TR']).toHaveLength(1);
    expect(alts['en']).toHaveLength(1);
    expect(alts['x-default']).toHaveLength(1);
  });

  it('emits generic hreflang on a category route (identical slug per locale)', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/en/perspektifler/kategori/strateji']}>
          <SeoManager />
        </MemoryRouter>,
      );
    });
    const alts = alternateHrefs();
    expect(alts['tr-TR']).toHaveLength(1);
    expect(alts['en']).toHaveLength(1);
  });

  it('does NOT emit generic hreflang on an article route (/en/perspektifler/:slug)', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/en/perspektifler/some-article-slug']}>
          <SeoManager />
        </MemoryRouter>,
      );
    });
    const alts = alternateHrefs();
    expect(alts['tr-TR']).toBeUndefined();
    expect(alts['en']).toBeUndefined();
    expect(alts['x-default']).toBeUndefined();
  });

  it('does NOT emit generic hreflang on the apex (no-locale-prefix) article route', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/perspektifler/some-article-slug']}>
          <SeoManager />
        </MemoryRouter>,
      );
    });
    const alts = alternateHrefs();
    expect(alts['tr-TR']).toBeUndefined();
  });

  it('no duplicate/conflicting hreflang when SeoManager + an article-specific Helmet both mount on an article route', async () => {
    const ArticleAlternates: React.FC = () => (
      <Helmet>
        <link rel="alternate" hrefLang="tr-TR" href="https://ecypro.com/tr/perspektifler/tr-slug" />
        <link rel="alternate" hrefLang="en" href="https://ecypro.com/en/perspektifler/en-slug" />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://ecypro.com/tr/perspektifler/tr-slug"
        />
      </Helmet>
    );

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/en/perspektifler/en-slug']}>
          <SeoManager />
          <ArticleAlternates />
        </MemoryRouter>,
      );
    });

    const alts = alternateHrefs();
    // Exactly one tag per hreflang value — SeoManager stayed out of the way.
    expect(alts['tr-TR']).toEqual(['https://ecypro.com/tr/perspektifler/tr-slug']);
    expect(alts['en']).toEqual(['https://ecypro.com/en/perspektifler/en-slug']);
    expect(alts['x-default']).toEqual(['https://ecypro.com/tr/perspektifler/tr-slug']);
  });
});
