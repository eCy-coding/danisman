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
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

export const SUPPORTED_LANGS = ['tr', 'en'] as const;
export const DEFAULT_LANG = 'tr';

export const NAMESPACES = [
  'translation',  // legacy default — already shipping
  'blog',
  'contact',
  'services',
  // Phase 20 additions:
  'pricing',
  'caseStudies',
  'newsletter',
  'liveChat',
  'common',
] as const;

i18n
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
    if (typeof console !== 'undefined') console.warn('[i18n] init failed:', err);
  });

export default i18n;
