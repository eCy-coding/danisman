import type { Language } from '@/lib/i18n';

/**
 * Locale-aware canonical + hreflang alternate builder.
 *
 * Önceki davranış: per-page canonical URL'ler locale-stripped + bazıları
 * non-www idi (örn. `https://ecypro.com/services`). Google `/tr/services` ve
 * `/en/services`'i aynı sayfa olarak görüp duplicate content riski yaratıyordu.
 * Bu util tek doğru pattern'i dayatır: `https://ecypro.com/{locale}{path}`.
 */

const SITE_URL = 'https://ecypro.com';

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(tr|en)(?=\/|$)/, '') || '/';
}

export function buildCanonical(pathname: string, locale: Language): string {
  const cleanPath = stripLocale(pathname);
  const normalizedPath = cleanPath === '/' ? '' : cleanPath;
  return `${SITE_URL}/${locale}${normalizedPath}`;
}

/**
 * EN article-parity mechanism — paired Perspektifler articles use DISTINCT
 * slugs per language (flat src/content/blog/*.mdx, `pair_id` links them), so
 * the generic path-based buildAlternateLinks() is wrong here: it would point
 * hreflang="en" at `/en/perspektifler/<tr-slug>`, a URL that doesn't exist.
 * This builds the correct pair-aware alternates instead.
 *
 * Either slug may be null (no reciprocal counterpart yet — TR-only or,
 * eventually, EN-only). x-default prefers the TR URL when both exist,
 * mirroring the site's TR-primary editorial default; otherwise it falls
 * back to whichever single URL exists.
 */
export function buildArticleAlternates(
  trSlug: string | null,
  enSlug: string | null,
): Array<{ hrefLang: string; href: string }> {
  const trHref = trSlug ? `${SITE_URL}/tr/perspektifler/${trSlug}` : null;
  const enHref = enSlug ? `${SITE_URL}/en/perspektifler/${enSlug}` : null;
  const defaultHref = trHref ?? enHref;

  const out: Array<{ hrefLang: string; href: string }> = [];
  if (trHref) out.push({ hrefLang: 'tr-TR', href: trHref });
  if (enHref) out.push({ hrefLang: 'en', href: enHref });
  if (defaultHref) out.push({ hrefLang: 'x-default', href: defaultHref });
  return out;
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
