import { SUPPORTED_LANGS, DEFAULT_LANG } from '@/lib/i18n-react';

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
 * Swap the locale segment of an already-rendered pathname.
 * '/en/privacy' + 'tr' → '/tr/privacy'. If no locale prefix present, prepends one.
 */
export function swapLocaleInPath(pathname: string, next: Locale): string {
  const segments = pathname.split('/');
  if (isLocale(segments[1])) {
    segments[1] = next;
    return segments.join('/') || `/${next}`;
  }
  return localizedHref(pathname, next);
}
