/**
 * EN article-parity — pair-aware sitemap URL derivation for Perspektifler
 * articles.
 *
 * Paired articles live at DISTINCT slugs per language (flat
 * src/content/blog/*.mdx, linked via pair_id), so the sitemap must NOT do a
 * generic same-slug /tr↔/en swap:
 *   - /en/perspektifler/<slug> URLs are emitted ONLY for real lang:en posts;
 *   - TR posts get bare (apex) + /tr URLs; a TR-only post's phantom /en
 *     mirror stays OUT of sitemap-en.xml entirely;
 *   - hreflang pairing between the two sides goes through pair_id, pointing
 *     at each sibling's OWN slug.
 *
 * Pure + framework-free (mirrors src/lib/blog-pair-validation.ts) so the
 * rules are unit-testable; scripts/generate-sitemap.ts is a thin consumer.
 * All returned paths are BASE_URL-relative with no leading slash.
 */

export interface SitemapArticleEntry {
  slug: string;
  lang: 'tr' | 'en';
  pairId?: string;
}

/** One sitemap "article group": a reciprocal pair collapses into a single
 *  group; unpaired posts are singleton groups with the other side null. */
export interface ArticleSitemapGroup {
  trSlug: string | null;
  enSlug: string | null;
}

export function groupArticlesForSitemap(entries: SitemapArticleEntry[]): ArticleSitemapGroup[] {
  const groups: ArticleSitemapGroup[] = [];
  const byPair = new Map<string, ArticleSitemapGroup>();

  for (const e of entries) {
    if (!e.pairId) {
      groups.push(
        e.lang === 'en' ? { trSlug: null, enSlug: e.slug } : { trSlug: e.slug, enSlug: null },
      );
      continue;
    }
    let g = byPair.get(e.pairId);
    if (!g) {
      g = { trSlug: null, enSlug: null };
      byPair.set(e.pairId, g);
      groups.push(g);
    }
    // First member per side wins — gen:blog's pair validation already
    // rejects same-lang duplicates; this is just defensive.
    if (e.lang === 'en') g.enSlug = g.enSlug ?? e.slug;
    else g.trSlug = g.trSlug ?? e.slug;
  }

  return groups;
}

/** Apex sitemap.xml entry: one <url> per article group. `loc` prefers the
 *  TR slug (TR-primary editorial default, mirrors buildArticleAlternates'
 *  x-default rule); tr/en hreflang paths are emitted only for sides that
 *  actually exist. */
export interface ApexArticleUrl {
  /** e.g. 'perspektifler/<primary-slug>' — also the x-default target. */
  loc: string;
  trPath: string | null;
  enPath: string | null;
}

export function apexArticleUrls(groups: ArticleSitemapGroup[]): ApexArticleUrl[] {
  const out: ApexArticleUrl[] = [];
  for (const g of groups) {
    const primary = g.trSlug ?? g.enSlug;
    if (!primary) continue;
    out.push({
      loc: `perspektifler/${primary}`,
      trPath: g.trSlug ? `tr/perspektifler/${g.trSlug}` : null,
      enPath: g.enSlug ? `en/perspektifler/${g.enSlug}` : null,
    });
  }
  return out;
}

/** Locale sitemap (sitemap-tr.xml / sitemap-en.xml) entry. A group appears
 *  in a locale's list ONLY when it has a slug in that language — this is
 *  the mechanism that keeps TR-only posts' /en/... URL out of
 *  sitemap-en.xml. `otherPath` is null when no opposite-lang sibling
 *  exists (no hreflang link to a nonexistent URL). */
export interface LocaleArticleUrl {
  /** e.g. 'en/perspektifler/<en-slug>' — the <loc> of this entry. */
  selfPath: string;
  /** Opposite-locale sibling path, or null when unpaired. */
  otherPath: string | null;
  /** x-default target (apex, TR slug preferred). */
  defaultPath: string;
}

export function localeArticleUrls(
  groups: ArticleSitemapGroup[],
  locale: 'tr' | 'en',
): LocaleArticleUrl[] {
  const out: LocaleArticleUrl[] = [];
  for (const g of groups) {
    const selfSlug = locale === 'tr' ? g.trSlug : g.enSlug;
    if (!selfSlug) continue;
    const otherSlug = locale === 'tr' ? g.enSlug : g.trSlug;
    const otherLocale = locale === 'tr' ? 'en' : 'tr';
    out.push({
      selfPath: `${locale}/perspektifler/${selfSlug}`,
      otherPath: otherSlug ? `${otherLocale}/perspektifler/${otherSlug}` : null,
      defaultPath: `perspektifler/${g.trSlug ?? selfSlug}`,
    });
  }
  return out;
}
