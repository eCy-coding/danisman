import { describe, it, expect } from 'vitest';
import { buildCanonical, buildAlternateLinks } from './canonical';

describe('buildCanonical', () => {
  it('builds tr canonical with locale prefix', () => {
    expect(buildCanonical('/services', 'tr')).toBe('https://www.ecypro.com/tr/services');
  });
  it('builds en canonical with locale prefix', () => {
    expect(buildCanonical('/about-us', 'en')).toBe('https://www.ecypro.com/en/about-us');
  });
  it('handles root path', () => {
    expect(buildCanonical('/', 'tr')).toBe('https://www.ecypro.com/tr');
  });
  it('strips existing locale prefix', () => {
    expect(buildCanonical('/tr/services', 'en')).toBe('https://www.ecypro.com/en/services');
  });
});

describe('buildAlternateLinks', () => {
  it('returns 3 alternates (tr-TR, en, x-default)', () => {
    const alts = buildAlternateLinks('/services');
    expect(alts).toHaveLength(3);
    expect(alts.find((a) => a.hrefLang === 'tr-TR')?.href).toBe(
      'https://www.ecypro.com/tr/services',
    );
    expect(alts.find((a) => a.hrefLang === 'en')?.href).toBe('https://www.ecypro.com/en/services');
    // S13-R4-S7/S8 — x-default points to apex (locale-less) to match
    // sitemap.xml hreflang reciprocity; see canonical.ts buildAlternateLinks.
    expect(alts.find((a) => a.hrefLang === 'x-default')?.href).toBe(
      'https://www.ecypro.com/services',
    );
  });
});
