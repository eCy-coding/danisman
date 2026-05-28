/**
 * react-i18next bootstrap — Phase 20 B2.
 *
 * Previously the app used `useTranslation('ns')` from react-i18next without
 * actually initializing the framework. Calls would silently fall back to
 * returning the raw key. This module fixes that by:
 *   - registering all currently shipped namespaces;
 *   - using HTTP backend so `public/locales/{lng}/{ns}.json` is loaded on demand;
 *   - persisting the selected language in localStorage (`i18nextLng`) — the
 *     existing e2e suite already asserts on this key.
 *
 * Side-effect-only import: pull this in once from `src/main.tsx`.
 */
/**
 * P39-T07: i18next ICU MessageFormat Plugin
 *
 * ICU syntax enables:
 *   - Plural forms:  "{count, plural, one {# item} other {# items}}"
 *   - Gender:        "{gender, select, male {He} female {She} other {They}}"
 *   - Number format: "{amount, number, currency}" (locale-aware)
 *   - Date format:   "{date, date, long}"
 *
 * TR plural note: Turkish has no grammatical plural for count nouns,
 * so most TR strings use "other" only. ICU still normalizes the API.
 *
 * Usage in locale JSON:
 *   { "bookingDuration": "{count, plural, one {# saat} other {# saat}}" }
 *   { "items": "{count, plural, one {# item} other {# items}}" }
 * Usage in component:
 *   t('bookingDuration', { count: 2 }) → "2 saat" (TR) / "2 hours" (EN)
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import ICU from 'i18next-icu';
import { Logger } from './logger';

export const SUPPORTED_LANGS = ['tr', 'en'] as const;
export const DEFAULT_LANG = 'tr';

/**
 * Full namespace registry — kept exported for type safety and tooling
 * (e.g. content-qa-auditor manifest validation). NOT all namespaces ship
 * on first paint; see `INITIAL_NAMESPACES` below.
 */
export const NAMESPACES = [
  'translation', // legacy default — always loaded
  'blog',
  'contact',
  'services',
  // Phase 20 additions:
  'pricing',
  'caseStudies',
  'newsletter',
  'liveChat',
  'common',
  'legal',
  // P16 — Form validation + zod errorMap i18n keys.
  'forms',
  // Phase 5 — Admin panel strings (lazy-loaded when admin routes mount).
  'admin',
  // Wave-3A — Perspektif / Insights pages (PB-6, PB-9).
  'insights',
] as const;

/**
 * P17 — Initial namespaces shipped on first paint. Everything else loads
 * lazily via `useRouteNamespaces` (see `./useRouteNamespaces.ts`) or
 * automatically by `react-i18next` when `useTranslation('foo')` is called.
 *
 * Rationale: previously all 11 namespaces fetched on app boot (~10-20KB
 * total JSON over the wire even when only `common` was needed for the
 * header/footer of a static page like /privacy). Now only the universally
 * shared ns load eagerly; route-specific ns wait until that route mounts.
 *
 * SAFETY:
 *   `forms`  — referenced by `zod-error-map` (validation messages can
 *              fire from any page that mounts a form). Must be loaded
 *              eagerly to keep first-validation paint flicker-free.
 *   `legal`  — referenced by a handful of footer + cookie banner strings
 *              that render on every route (offline banner, cookie notice).
 *
 * Route-specific ns (blog, services, pricing, caseStudies, newsletter,
 * liveChat, contact) load lazily via `react-i18next`'s `useTranslation(ns)`
 * binding or via `useRouteNamespaces([ns])` at the page boundary.
 */
export const INITIAL_NAMESPACES = ['translation', 'common', 'forms', 'legal'] as const;

i18n
  .use(ICU)
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_LANG,
    supportedLngs: SUPPORTED_LANGS as readonly string[] as string[],
    // P17 — Initial `ns` minimised. The full `NAMESPACES` array is still
    // valid and react-i18next's `useTranslation('blog')` will trigger
    // `loadNamespaces` on demand because HTTP backend is wired up.
    ns: INITIAL_NAMESPACES as readonly string[] as string[],
    // `partialBundledLanguages: true` — tells i18next that the initial bundle
    // is intentionally partial; missing namespaces are fetched on demand
    // rather than triggering a noisy missing-key warning.
    partialBundledLanguages: true,
    defaultNS: 'translation',
    interpolation: { escapeValue: false }, // React already escapes
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    react: {
      // We render <Suspense> at the App boundary already; opt out of nested
      // suspense so individual leaves don't stall during initial bundle hydration.
      useSuspense: false,
    },
  })
  .catch((err) => {
    // Don't throw — failing to initialize i18n should still let the app boot.
    Logger.warn('[i18n] init failed', err);
  });

export default i18n;
