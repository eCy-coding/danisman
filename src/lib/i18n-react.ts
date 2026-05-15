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

export const NAMESPACES = [
  'translation', // legacy default — already shipping
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
] as const;

i18n
  .use(ICU)
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_LANG,
    supportedLngs: SUPPORTED_LANGS as readonly string[] as string[],
    ns: NAMESPACES as readonly string[] as string[],
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
