/**
 * Sprint 9 P44-T02 — Localized TR slug canonical map.
 *
 * NotebookLM Architect CONVERGENT spec (Sprint 9):
 *   • Shape: `SLUG_MAP: { tr: Record<EnSlug, TrSlug>, en: Record<TrSlug, EnSlug> }`
 *     — O(1) bidirectional lookup; per-render array scan yok.
 *   • Canonical path: `src/i18n/localized-slugs.ts` (data layer, ayrı
 *     `helpers.ts` mantığından).
 *   • Translations (Türkçe SEO authority için yüksek-niyetli anahtar
 *     kelimeler): services→hizmetler, contact→iletisim,
 *     pricing→fiyatlandirma, about→hakkimizda, quick-check→hizli-kontrol.
 *     `/blog` slug iki dilde aynı kalır (marka/SEO).
 *   • Cross-language swap için `translateSlug()` helper.
 *
 * Risk register (Architect):
 *   • Eski İngilizce slug'lar için 301 yönlendirme yapılmalı (App.tsx
 *     hem `/tr/services` hem `/tr/hizmetler` yakalamalı veya 301).
 *   • Sitemap + hreflang güncellenmeli (`scripts/generate-sitemap.ts`).
 *   • Bu PR sadece DATA + HELPER; App.tsx route additions + sitemap
 *     update ayrı atomic PR'da landed olur.
 */
import type { Locale } from './helpers';

/**
 * Top-level pathname segment (without leading slash) for each translatable
 * page. `/blog`, `/insights`, `/pillar/*` and similar SEO/brand slugs are
 * NOT in this map — they share the same identifier across both locales.
 */
export interface LocalizedSlugPair {
  readonly en: string;
  readonly tr: string;
}

/**
 * Single source of truth. To add a translation:
 *   1. Append a `LocalizedSlugPair` here.
 *   2. Add the matching route entries in `App.tsx`.
 *   3. Add both entries to `scripts/generate-sitemap.ts STATIC_ROUTES`.
 */
export const LOCALIZED_SLUG_PAIRS: readonly LocalizedSlugPair[] = [
  { en: 'services', tr: 'hizmetler' },
  { en: 'contact', tr: 'iletisim' },
  { en: 'pricing', tr: 'fiyatlandirma' },
  { en: 'about', tr: 'hakkimizda' },
  { en: 'quick-check', tr: 'hizli-kontrol' },
  { en: 'pricing-calculator', tr: 'fiyatlandirma-hesabi' },
  { en: 'careers', tr: 'kariyer' },
  { en: 'case-studies', tr: 'vaka-calismalari' },
  { en: 'methodology', tr: 'metodoloji' },
  { en: 'team', tr: 'ekip' },
  { en: 'industries', tr: 'sektorler' },
  { en: 'partners', tr: 'is-ortaklari' },
  { en: 'press', tr: 'basin' },
  { en: 'events', tr: 'etkinlikler' },
  { en: 'locations', tr: 'lokasyonlar' },
  { en: 'privacy', tr: 'gizlilik' },
  { en: 'terms', tr: 'kosullar' },
  { en: 'cookies', tr: 'cerezler' },
  { en: 'faq', tr: 'sss' },
  { en: 'speaking', tr: 'konusmalar' },
];

/** Pre-computed O(1) reverse lookups built once at module load. */
const SLUG_LOOKUP = {
  /** Translate EN slug → TR slug. */
  enToTr: new Map<string, string>(LOCALIZED_SLUG_PAIRS.map((p) => [p.en, p.tr])),
  /** Translate TR slug → EN slug. */
  trToEn: new Map<string, string>(LOCALIZED_SLUG_PAIRS.map((p) => [p.tr, p.en])),
} as const;

/**
 * Translate a path's top-level slug between locales. Returns the original
 * pathname unchanged when:
 *   • Source and target locales match.
 *   • Top-level slug is not in the map (e.g. `/blog/*`, `/insights/*`,
 *     `/pillar/*`).
 *   • Pathname is empty / root / locale-only.
 *
 * Examples:
 *   translateSlug('/services',         'en', 'tr') → '/hizmetler'
 *   translateSlug('/services/audit',   'en', 'tr') → '/hizmetler/audit'
 *   translateSlug('/blog/foo',         'en', 'tr') → '/blog/foo'      (no-op)
 *   translateSlug('/hakkimizda',       'tr', 'en') → '/about'
 *   translateSlug('/',                 'en', 'tr') → '/'              (no-op)
 *
 * Note: callers that need the locale prefix should wrap with
 * `localizedHref(translateSlug(path, from, to), to)` from `helpers.ts`.
 */
export function translateSlug(pathname: string, from: Locale, to: Locale): string {
  if (from === to) return pathname;
  if (!pathname || pathname === '/') return pathname;

  // Strip leading slash, split into top-level slug + rest.
  const withoutLeading = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const firstSlash = withoutLeading.indexOf('/');
  const topSlug = firstSlash === -1 ? withoutLeading : withoutLeading.slice(0, firstSlash);
  const rest = firstSlash === -1 ? '' : withoutLeading.slice(firstSlash);

  const dictionary = from === 'en' ? SLUG_LOOKUP.enToTr : SLUG_LOOKUP.trToEn;
  const translated = dictionary.get(topSlug);
  if (!translated) return pathname;

  return `/${translated}${rest}`;
}

/**
 * Helper to enumerate every (en, tr) pair plus their TR/EN locale-prefixed
 * URLs — used by the sitemap generator + hreflang builder so they don't
 * have to know the slug map shape.
 */
export interface LocalizedRouteEntry {
  readonly en: string;
  readonly tr: string;
  /** Locale-prefixed paths (`/en/services` + `/tr/hizmetler`). */
  readonly enPath: string;
  readonly trPath: string;
}

export function listLocalizedRoutes(): readonly LocalizedRouteEntry[] {
  return LOCALIZED_SLUG_PAIRS.map((pair) => ({
    en: pair.en,
    tr: pair.tr,
    enPath: `/en/${pair.en}`,
    trPath: `/tr/${pair.tr}`,
  }));
}
