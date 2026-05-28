/**
 * Perspektif (Insights) i18n key definitions — EN parity.
 *
 * EN copy policy:
 *   - Auto-translate ASLA (never auto-translate)
 *   - Only critical articles get EN parity (Founder Letter pattern)
 *   - EN strings reviewed by Founder (Emre Can Yalçın) before publish
 *
 * Companion: insights.ts (TR canonical)
 * Runtime translation: public/locales/en/insights.json
 *
 * Tag axis EN labels (§1.2 EN master prompt):
 *   depth:101 / depth:intermediate / depth:advanced / depth:masterclass
 *   format:case-study / format:framework / format:checklist / format:interview
 *   audience:founder / audience:cfo / audience:legal / audience:investor
 *   geo:turkey / geo:eu / geo:mena / geo:cross-border
 *   sector:tech / sector:industrial / sector:finance / sector:real-estate
 *   reg:kvkk / reg:gdpr / reg:csrd / reg:spk / reg:masak
 *   trend:ai-disruption / trend:climate-action / trend:digital-tl
 *
 * Domain EN names (§1.1 EN master prompt):
 *   M&A / Mergers & Acquisitions  → slug: m-a
 *   ESG / Sustainability           → slug: esg
 *   Fintech / Financial Technology → slug: fintech
 *   Family Business                → slug: family-business (EN alias, TR: aile-sirketi)
 */

export const insightsKeysEn = {
  nav: {
    insights: 'Perspektif',
    all: 'All',
    archive: 'Archive',
    search: 'Search',
  },
  category: {
    subtitle: 'articles',
    subDomainNav: 'Sub-categories',
    featuredTitle: 'Featured',
    latestTitle: 'Latest Articles',
    loadMore: 'Load More',
  },
  tag: {
    postsCount: '{count} articles',
    relatedTags: 'Related Tags',
  },
  series: {
    parts: 'parts',
    published: '{count} parts published',
    totalParts: '{total} parts',
    progressLabel: 'Series Progress',
    comingSoon: 'Coming Soon',
    readingLog: 'Reading History',
    loginPrompt: 'Sign in to track your progress',
  },
  author: {
    totalPosts: 'Total Articles',
    totalViews: 'Total Views',
    topDomain: 'Top Domain',
    discoveryCta: 'Meet Emre',
    founderBadge: 'Founding Partner',
  },
  archive: {
    title: 'Archive',
    yearSelector: 'Select Year',
    noPosts: 'No articles in this period',
    monthNames: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  },
  search: {
    placeholder: 'Search articles, topics or authors...',
    resultsCount: '{count} results found',
    noResults: 'No results found',
    noResultsHint: 'Try different keywords or use category filters',
    fallbackCta: "Can't find what you're looking for?",
    fallbackDesc: 'Talk directly with Emre',
  },
  card: {
    readMore: 'Read More',
    minRead: 'min read',
    featured: 'Featured',
    editorsPick: "Editor's Pick",
    seriesPart: 'Part {part}',
  },
  languageSwitcher: {
    trOnly: 'Turkish only',
    trOnlyTooltip: "The English version of this article isn't ready yet",
    availableIn: 'Available in:',
  },
  breadcrumb: {
    home: 'Home',
    insights: 'Perspektif',
  },
  newsletter: {
    title: 'Founder Letter',
    desc: 'Weekly strategic analysis and market insights',
    cta: 'Subscribe',
    kvkk: 'KVKK opt-in · Unsubscribe anytime',
  },
} as const;

export type InsightsKeyEn = typeof insightsKeysEn;
