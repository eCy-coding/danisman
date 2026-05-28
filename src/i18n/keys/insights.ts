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

// Bilingual object constants for Wave-2 components (SmartFilter, DomainFilterBar, EditorialHero)
// that use .tr accessors directly rather than i18next.
export const insightsI18n = {
  hub: {
    eyebrow: { tr: 'Perspektif', en: 'Perspektif' },
    h1: {
      tr: "Türkiye'nin Sermaye, Sürdürülebilirlik ve Aile Şirketi Düşüncesi",
      en: "Turkey's Capital, Sustainability & Family Business Intelligence",
    },
    sub: {
      tr: 'M&A, ESG, Fintech ve Aile Şirketi alanlarında Big4 derinliğinde bağımsız analiz.',
      en: 'Big4-depth independent analysis across M&A, ESG, Fintech and Family Business.',
    },
    subscribeNewsletter: { tr: 'Founder Letter abone ol', en: 'Subscribe to Founder Letter' },
    kvkkBadge: {
      tr: 'KVKK opt-in — istediğiniz zaman çıkabilirsiniz',
      en: 'GDPR/KVKK opt-in — unsubscribe anytime',
    },
    sortNewest: { tr: 'En yeni', en: 'Newest' },
    sortPopular: { tr: 'En çok okunan', en: 'Most read' },
    sortEditorsPick: { tr: "Editor's Pick", en: "Editor's Pick" },
    sortTrending: { tr: 'Trending (7 gün)', en: 'Trending (7 days)' },
    filterAll: { tr: 'Tümü', en: 'All' },
    articleCount: { tr: 'yazı', en: 'articles' },
    subDomainAll: { tr: 'Tüm Alt Kategoriler', en: 'All Sub-categories' },
    searchPlaceholder: { tr: "Perspektif'te ara...", en: 'Search Perspektif...' },
    filterSave: { tr: 'Filtreyi kaydet', en: 'Save filter' },
    featuredTitle: { tr: 'Öne Çıkanlar', en: 'Featured' },
    latestTitle: { tr: 'Son Yazılar', en: 'Latest' },
    loadMore: { tr: 'Daha fazla yükle', en: 'Load more' },
    domainSpotlightTitle: { tr: 'Alana Göre', en: 'By Domain' },
    domainLatest: { tr: 'En yeni', en: 'Latest' },
    domainPopular: { tr: 'En popüler', en: 'Most popular' },
    domainEditorsPick: { tr: "Editor's Pick", en: "Editor's Pick" },
    seriesTitle: { tr: 'Seri Yazılar', en: 'Article Series' },
    seriesParts: { tr: 'bölüm', en: 'parts' },
    noResults: { tr: 'Sonuç bulunamadı', en: 'No results found' },
    readingTime: { tr: 'dk okuma', en: 'min read' },
    views: { tr: 'görüntülenme', en: 'views' },
    dateFrom: { tr: 'Başlangıç', en: 'From' },
    dateTo: { tr: 'Bitiş', en: 'To' },
    readTimeLabel: { tr: 'Okuma süresi', en: 'Reading time' },
    tagAxes: {
      FORMAT: { tr: 'Format', en: 'Format' },
      AUDIENCE: { tr: 'Hedef Kitle', en: 'Audience' },
      GEO: { tr: 'Coğrafya', en: 'Geography' },
      SECTOR: { tr: 'Sektör', en: 'Sector' },
      REG: { tr: 'Regülasyon', en: 'Regulation' },
      TREND: { tr: 'Trend', en: 'Trend' },
    },
  },
} as const;
