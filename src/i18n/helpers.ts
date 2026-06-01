import { SUPPORTED_LANGS, DEFAULT_LANG } from '@/lib/i18n-react';
import { translateSlug } from './localized-slugs';

export type Locale = (typeof SUPPORTED_LANGS)[number];

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (SUPPORTED_LANGS as readonly string[]).includes(value);
}

export function resolveLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : (DEFAULT_LANG as Locale);
}

/**
 * Build a locale-prefixed internal href: localizedHref('/privacy', 'en') → '/en/privacy'.
 * Hash/query-only and external links are returned untouched.
 */
export function localizedHref(path: string, locale: Locale): string {
  if (/^([a-z]+:|\/\/|#|\?|mailto:|tel:)/i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalized === '/' ? '' : normalized}`;
}

/**
 * Swap the locale segment of an already-rendered pathname AND translate
 * the top-level slug when a localized counterpart exists.
 *
 * Sprint 9 P44-T02: pre-localized-slugs callers only swapped the locale
 * prefix, so `/tr/hizmetler` + 'en' resolved to `/en/hizmetler` (404).
 * Now the slug is translated to the target locale's canonical form via
 * `translateSlug()`, falling back to a 1:1 swap for unmapped paths
 * (`/blog`, `/insights/*`, etc).
 *
 * Examples:
 *   swapLocaleInPath('/en/services', 'tr')        → '/tr/hizmetler'
 *   swapLocaleInPath('/tr/hizmetler', 'en')       → '/en/services'
 *   swapLocaleInPath('/tr/blog/foo', 'en')        → '/en/blog/foo' (unmapped)
 *   swapLocaleInPath('/privacy', 'tr')            → '/tr/gizlilik' (no prefix yet)
 */
export function swapLocaleInPath(pathname: string, next: Locale): string {
  const segments = pathname.split('/');
  if (isLocale(segments[1])) {
    const currentLocale = segments[1] as Locale;
    if (currentLocale === next) return pathname;
    // Reassemble the post-prefix portion, translate it, then re-prefix.
    const remainder = '/' + segments.slice(2).join('/');
    const translated = translateSlug(remainder, currentLocale, next);
    return `/${next}${translated === '/' ? '' : translated}`;
  }
  // No locale prefix: translate from the default locale into the target.
  const translated = translateSlug(pathname, DEFAULT_LANG as Locale, next);
  return localizedHref(translated, next);
}
