import { describe, it, expect } from 'vitest';
import { buildCanonical, buildAlternateLinks, buildArticleAlternates } from './canonical';

describe('buildCanonical', () => {
  it('builds tr canonical with locale prefix', () => {
    expect(buildCanonical('/services', 'tr')).toBe('https://ecypro.com/tr/services');
  });
  it('builds en canonical with locale prefix', () => {
    expect(buildCanonical('/about-us', 'en')).toBe('https://ecypro.com/en/about-us');
  });
  it('handles root path', () => {
    expect(buildCanonical('/', 'tr')).toBe('https://ecypro.com/tr');
  });
  it('strips existing locale prefix', () => {
    expect(buildCanonical('/tr/services', 'en')).toBe('https://ecypro.com/en/services');
  });
});

describe('buildAlternateLinks', () => {
  it('returns 3 alternates (tr-TR, en, x-default)', () => {
    const alts = buildAlternateLinks('/services');
    expect(alts).toHaveLength(3);
    expect(alts.find((a) => a.hrefLang === 'tr-TR')?.href).toBe('https://ecypro.com/tr/services');
    expect(alts.find((a) => a.hrefLang === 'en')?.href).toBe('https://ecypro.com/en/services');
    // x-default → apex (locale-less), deliberate per canonical.ts S13-R4-S7/S8
    // (sitemap apex match + hreflang reciprocity). Test was stale pre-fix.
    expect(alts.find((a) => a.hrefLang === 'x-default')?.href).toBe('https://ecypro.com/services');
  });
});

describe('buildArticleAlternates (EN article-parity — distinct slugs per lang)', () => {
  it('fully paired article: tr + en + x-default (x-default prefers tr)', () => {
    const alts = buildArticleAlternates('kpi-tahminleme', 'kpi-forecasting');
    expect(alts).toEqual([
      { hrefLang: 'tr-TR', href: 'https://ecypro.com/tr/perspektifler/kpi-tahminleme' },
      { hrefLang: 'en', href: 'https://ecypro.com/en/perspektifler/kpi-forecasting' },
      { hrefLang: 'x-default', href: 'https://ecypro.com/tr/perspektifler/kpi-tahminleme' },
    ]);
  });

  it('TR-only article (no EN sibling): only tr-TR + x-default, no en entry', () => {
    const alts = buildArticleAlternates('kpi-tahminleme', null);
    expect(alts).toEqual([
      { hrefLang: 'tr-TR', href: 'https://ecypro.com/tr/perspektifler/kpi-tahminleme' },
      { hrefLang: 'x-default', href: 'https://ecypro.com/tr/perspektifler/kpi-tahminleme' },
    ]);
    expect(alts.find((a) => a.hrefLang === 'en')).toBeUndefined();
  });

  it('EN-only article (no TR sibling): only en + x-default, no tr-TR entry', () => {
    const alts = buildArticleAlternates(null, 'kpi-forecasting');
    expect(alts).toEqual([
      { hrefLang: 'en', href: 'https://ecypro.com/en/perspektifler/kpi-forecasting' },
      { hrefLang: 'x-default', href: 'https://ecypro.com/en/perspektifler/kpi-forecasting' },
    ]);
    expect(alts.find((a) => a.hrefLang === 'tr-TR')).toBeUndefined();
  });

  it('neither slug present: empty array (defensive — should not be called this way)', () => {
    expect(buildArticleAlternates(null, null)).toEqual([]);
  });

  it('slugs differ from each other (the whole reason this exists vs buildAlternateLinks)', () => {
    const alts = buildArticleAlternates('ai-tabanli-kpi-tahminlemesi', 'ai-based-kpi-forecasting');
    const trHref = alts.find((a) => a.hrefLang === 'tr-TR')!.href;
    const enHref = alts.find((a) => a.hrefLang === 'en')!.href;
    expect(trHref).not.toBe(enHref.replace('/en/', '/tr/'));
    expect(trHref).toContain('ai-tabanli-kpi-tahminlemesi');
    expect(enHref).toContain('ai-based-kpi-forecasting');
  });
});
