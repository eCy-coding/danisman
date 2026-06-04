import type { Language } from '@/lib/i18n';

/**
 * Locale-aware canonical + hreflang alternate builder.
 *
 * Önceki davranış: per-page canonical URL'ler locale-stripped + bazıları
 * non-www idi (örn. `https://ecypro.com/services`). Google `/tr/services` ve
 * `/en/services`'i aynı sayfa olarak görüp duplicate content riski yaratıyordu.
 * Bu util tek doğru pattern'i dayatır: `https://www.ecypro.com/{locale}{path}`.
 */

const SITE_URL = 'https://www.ecypro.com';

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(tr|en)(?=\/|$)/, '') || '/';
}

export function buildCanonical(pathname: string, locale: Language): string {
  const cleanPath = stripLocale(pathname);
  const normalizedPath = cleanPath === '/' ? '' : cleanPath;
  return `${SITE_URL}/${locale}${normalizedPath}`;
}

export function buildAlternateLinks(pathname: string): Array<{ hrefLang: string; href: string }> {
  const cleanPath = stripLocale(pathname);
  const normalizedPath = cleanPath === '/' ? '' : cleanPath;
  // S13-R4-S7/S8 — x-default points to apex (locale-less) form to match
  // sitemap.xml's apex hreflang declaration. Previous `/tr` x-default
  // contradicted the sitemap and broke hreflang reciprocity (Google's
  // International Targeting report flagged "no return tags").
  return [
    { hrefLang: 'tr-TR', href: `${SITE_URL}/tr${normalizedPath}` },
    { hrefLang: 'en', href: `${SITE_URL}/en${normalizedPath}` },
    { hrefLang: 'x-default', href: `${SITE_URL}${normalizedPath}` },
  ];
}
