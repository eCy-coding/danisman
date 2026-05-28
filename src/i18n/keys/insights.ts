/**
 * Perspektif (Insights) i18n key definitions — TR canonical.
 *
 * Pattern: { tr: string } for TR primary strings.
 * Companion file: insights.en.ts for EN parity.
 * Runtime translation: public/locales/{tr,en}/insights.json
 *
 * Usage in components:
 *   import { insightsKeys } from '@/i18n/keys/insights';
 *   t(insightsKeys.nav.insights) // → 'Perspektif'
 */

export const insightsKeys = {
  nav: {
    insights: 'nav.insights',
    all: 'nav.all',
    archive: 'nav.archive',
    search: 'nav.search',
  },
  category: {
    subtitle: 'category.subtitle',
    subDomainNav: 'category.subDomainNav',
    featuredTitle: 'category.featuredTitle',
    latestTitle: 'category.latestTitle',
    loadMore: 'category.loadMore',
  },
  tag: {
    postsCount: 'tag.postsCount',
    relatedTags: 'tag.relatedTags',
  },
  series: {
    parts: 'series.parts',
    published: 'series.published',
    totalParts: 'series.totalParts',
    progressLabel: 'series.progressLabel',
    comingSoon: 'series.comingSoon',
    readingLog: 'series.readingLog',
    loginPrompt: 'series.loginPrompt',
  },
  author: {
    totalPosts: 'author.totalPosts',
    totalViews: 'author.totalViews',
    topDomain: 'author.topDomain',
    discoveryCta: 'author.discoveryCta',
    founderBadge: 'author.founderBadge',
  },
  archive: {
    title: 'archive.title',
    yearSelector: 'archive.yearSelector',
    noPosts: 'archive.noPosts',
    monthNames: 'archive.monthNames',
  },
  search: {
    placeholder: 'search.placeholder',
    resultsCount: 'search.resultsCount',
    noResults: 'search.noResults',
    noResultsHint: 'search.noResultsHint',
    fallbackCta: 'search.fallbackCta',
    fallbackDesc: 'search.fallbackDesc',
  },
  card: {
    readMore: 'card.readMore',
    minRead: 'card.minRead',
    featured: 'card.featured',
    editorsPick: 'card.editorsPick',
    seriesPart: 'card.seriesPart',
  },
  languageSwitcher: {
    trOnly: 'languageSwitcher.trOnly',
    trOnlyTooltip: 'languageSwitcher.trOnlyTooltip',
    availableIn: 'languageSwitcher.availableIn',
  },
  breadcrumb: {
    home: 'breadcrumb.home',
    insights: 'breadcrumb.insights',
  },
  newsletter: {
    title: 'newsletter.title',
    desc: 'newsletter.desc',
    cta: 'newsletter.cta',
    kvkk: 'newsletter.kvkk',
  },
} as const;

export type InsightsKey = typeof insightsKeys;
