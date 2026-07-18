import { describe, it, expect } from 'vitest';
import {
  groupArticlesForSitemap,
  apexArticleUrls,
  localeArticleUrls,
  type SitemapArticleEntry,
} from './sitemap-article-urls';

const TR_ONLY: SitemapArticleEntry = { slug: 'tr-yalniz', lang: 'tr' };
const TR_PAIRED: SitemapArticleEntry = { slug: 'kpi-tahminleme', lang: 'tr', pairId: 'p1' };
const EN_PAIRED: SitemapArticleEntry = { slug: 'kpi-forecasting', lang: 'en', pairId: 'p1' };
const EN_ONLY: SitemapArticleEntry = { slug: 'en-solo', lang: 'en' };

describe('groupArticlesForSitemap', () => {
  it('TR-only corpus (todays reality): one group per post, enSlug always null', () => {
    const groups = groupArticlesForSitemap([TR_ONLY, { slug: 'ikinci', lang: 'tr' }]);
    expect(groups).toEqual([
      { trSlug: 'tr-yalniz', enSlug: null },
      { trSlug: 'ikinci', enSlug: null },
    ]);
  });

  it('reciprocal pair collapses into ONE group carrying both slugs', () => {
    const groups = groupArticlesForSitemap([TR_PAIRED, EN_PAIRED]);
    expect(groups).toEqual([{ trSlug: 'kpi-tahminleme', enSlug: 'kpi-forecasting' }]);
  });

  it('unpaired EN post becomes a singleton group with trSlug null', () => {
    const groups = groupArticlesForSitemap([EN_ONLY]);
    expect(groups).toEqual([{ trSlug: null, enSlug: 'en-solo' }]);
  });

  it('mixed corpus: pairs merge, singletons stay separate', () => {
    const groups = groupArticlesForSitemap([TR_ONLY, TR_PAIRED, EN_PAIRED, EN_ONLY]);
    expect(groups).toHaveLength(3);
    expect(groups).toContainEqual({ trSlug: 'tr-yalniz', enSlug: null });
    expect(groups).toContainEqual({ trSlug: 'kpi-tahminleme', enSlug: 'kpi-forecasting' });
    expect(groups).toContainEqual({ trSlug: null, enSlug: 'en-solo' });
  });

  it('defensive: duplicate same-lang pair member does not overwrite the first', () => {
    const groups = groupArticlesForSitemap([
      TR_PAIRED,
      { slug: 'sahte-kopya', lang: 'tr', pairId: 'p1' },
      EN_PAIRED,
    ]);
    expect(groups).toEqual([{ trSlug: 'kpi-tahminleme', enSlug: 'kpi-forecasting' }]);
  });
});

describe('apexArticleUrls', () => {
  it('TR-only post: loc + trPath, NO enPath (no phantom /en mirror)', () => {
    const urls = apexArticleUrls(groupArticlesForSitemap([TR_ONLY]));
    expect(urls).toEqual([
      {
        loc: 'perspektifler/tr-yalniz',
        trPath: 'tr/perspektifler/tr-yalniz',
        enPath: null,
      },
    ]);
  });

  it('paired article: ONE entry, loc prefers the TR slug, both hreflang paths use own slugs', () => {
    const urls = apexArticleUrls(groupArticlesForSitemap([TR_PAIRED, EN_PAIRED]));
    expect(urls).toEqual([
      {
        loc: 'perspektifler/kpi-tahminleme',
        trPath: 'tr/perspektifler/kpi-tahminleme',
        enPath: 'en/perspektifler/kpi-forecasting',
      },
    ]);
  });

  it('EN-only post: loc falls back to the EN slug, NO trPath', () => {
    const urls = apexArticleUrls(groupArticlesForSitemap([EN_ONLY]));
    expect(urls).toEqual([
      {
        loc: 'perspektifler/en-solo',
        trPath: null,
        enPath: 'en/perspektifler/en-solo',
      },
    ]);
  });
});

describe('localeArticleUrls', () => {
  const groups = groupArticlesForSitemap([TR_ONLY, TR_PAIRED, EN_PAIRED, EN_ONLY]);

  it('en list contains ONLY real EN posts — the TR-only slug is kept OUT of sitemap-en', () => {
    const en = localeArticleUrls(groups, 'en');
    expect(en.map((u) => u.selfPath).sort()).toEqual([
      'en/perspektifler/en-solo',
      'en/perspektifler/kpi-forecasting',
    ]);
    expect(en.some((u) => u.selfPath.includes('tr-yalniz'))).toBe(false);
  });

  it('en entry for a paired post links its TR sibling by the SIBLING slug', () => {
    const en = localeArticleUrls(groups, 'en');
    const paired = en.find((u) => u.selfPath.endsWith('kpi-forecasting'))!;
    expect(paired.otherPath).toBe('tr/perspektifler/kpi-tahminleme');
    expect(paired.defaultPath).toBe('perspektifler/kpi-tahminleme');
  });

  it('en entry for an unpaired EN post has NO otherPath and x-defaults to its own apex', () => {
    const en = localeArticleUrls(groups, 'en');
    const solo = en.find((u) => u.selfPath.endsWith('en-solo'))!;
    expect(solo.otherPath).toBeNull();
    expect(solo.defaultPath).toBe('perspektifler/en-solo');
  });

  it('tr list contains all TR posts; unpaired ones carry no /en otherPath', () => {
    const tr = localeArticleUrls(groups, 'tr');
    expect(tr.map((u) => u.selfPath).sort()).toEqual([
      'tr/perspektifler/kpi-tahminleme',
      'tr/perspektifler/tr-yalniz',
    ]);
    const only = tr.find((u) => u.selfPath.endsWith('tr-yalniz'))!;
    expect(only.otherPath).toBeNull();
    const paired = tr.find((u) => u.selfPath.endsWith('kpi-tahminleme'))!;
    expect(paired.otherPath).toBe('en/perspektifler/kpi-forecasting');
  });

  it('TR-only corpus → en locale list is EMPTY (zero article URLs in sitemap-en.xml)', () => {
    const trOnlyGroups = groupArticlesForSitemap([TR_ONLY, { slug: 'b', lang: 'tr' }]);
    expect(localeArticleUrls(trOnlyGroups, 'en')).toEqual([]);
    expect(localeArticleUrls(trOnlyGroups, 'tr')).toHaveLength(2);
  });
});
