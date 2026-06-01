/**
 * Sprint 9 P44-T02 — localized-slugs unit tests.
 *
 * Architect CONVERGENT spec (Sprint 9): bidirectional O(1) lookups,
 * no-op cases (root, brand-shared slugs, same-locale), nested paths.
 */
import { describe, it, expect } from 'vitest';

import {
  listLocalizedRoutes,
  LOCALIZED_SLUG_PAIRS,
  translateSlug,
} from './localized-slugs';

describe('translateSlug', () => {
  it('translates services → hizmetler (en → tr)', () => {
    expect(translateSlug('/services', 'en', 'tr')).toBe('/hizmetler');
  });

  it('translates hizmetler → services (tr → en)', () => {
    expect(translateSlug('/hizmetler', 'tr', 'en')).toBe('/services');
  });

  it('translates contact → iletisim (en → tr)', () => {
    expect(translateSlug('/contact', 'en', 'tr')).toBe('/iletisim');
  });

  it('translates pricing → fiyatlandirma (en → tr)', () => {
    expect(translateSlug('/pricing', 'en', 'tr')).toBe('/fiyatlandirma');
  });

  it('translates about → hakkimizda (en → tr)', () => {
    expect(translateSlug('/about', 'en', 'tr')).toBe('/hakkimizda');
  });

  it('translates quick-check → hizli-kontrol (en → tr)', () => {
    expect(translateSlug('/quick-check', 'en', 'tr')).toBe('/hizli-kontrol');
  });

  it('preserves nested path segments after translation', () => {
    expect(translateSlug('/services/audit', 'en', 'tr')).toBe('/hizmetler/audit');
    expect(translateSlug('/hizmetler/audit/details', 'tr', 'en')).toBe('/services/audit/details');
  });

  it('returns pathname unchanged when source and target locales match', () => {
    expect(translateSlug('/services', 'en', 'en')).toBe('/services');
    expect(translateSlug('/hizmetler', 'tr', 'tr')).toBe('/hizmetler');
  });

  it('returns "/" unchanged (root has no slug)', () => {
    expect(translateSlug('/', 'en', 'tr')).toBe('/');
  });

  it('returns empty string unchanged', () => {
    expect(translateSlug('', 'en', 'tr')).toBe('');
  });

  it('returns pathname unchanged when the top-level slug is brand-shared (/blog)', () => {
    expect(translateSlug('/blog', 'en', 'tr')).toBe('/blog');
    expect(translateSlug('/blog/foo', 'en', 'tr')).toBe('/blog/foo');
  });

  it('returns pathname unchanged when the top-level slug is /insights/*', () => {
    expect(translateSlug('/insights/m-a', 'en', 'tr')).toBe('/insights/m-a');
  });

  it('returns pathname unchanged when the top-level slug is unknown', () => {
    expect(translateSlug('/unknown-page', 'en', 'tr')).toBe('/unknown-page');
  });

  it('handles paths without a leading slash defensively', () => {
    expect(translateSlug('services', 'en', 'tr')).toBe('/hizmetler');
  });

  it('translates every pair bidirectionally (round-trip)', () => {
    for (const pair of LOCALIZED_SLUG_PAIRS) {
      expect(translateSlug(`/${pair.en}`, 'en', 'tr')).toBe(`/${pair.tr}`);
      expect(translateSlug(`/${pair.tr}`, 'tr', 'en')).toBe(`/${pair.en}`);
    }
  });
});

describe('listLocalizedRoutes', () => {
  it('returns one entry per slug pair', () => {
    const entries = listLocalizedRoutes();
    expect(entries).toHaveLength(LOCALIZED_SLUG_PAIRS.length);
  });

  it('builds locale-prefixed paths for both locales', () => {
    const entries = listLocalizedRoutes();
    const services = entries.find((e) => e.en === 'services');
    expect(services?.enPath).toBe('/en/services');
    expect(services?.trPath).toBe('/tr/hizmetler');
  });

  it('emits unique TR + EN slugs across all pairs (no collisions)', () => {
    const enSlugs = new Set(LOCALIZED_SLUG_PAIRS.map((p) => p.en));
    const trSlugs = new Set(LOCALIZED_SLUG_PAIRS.map((p) => p.tr));
    expect(enSlugs.size).toBe(LOCALIZED_SLUG_PAIRS.length);
    expect(trSlugs.size).toBe(LOCALIZED_SLUG_PAIRS.length);
  });
});
