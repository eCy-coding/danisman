// SEO structured data builders for Perspektif (Insights) pages.
// Wave-3A stub — real DB queries added when Wave-1 BlogPost schema merges.

export interface InsightPostSEO {
  slug: string;
  titleTr: string;
  titleEn?: string;
  excerptTr: string;
  excerptEn?: string;
  primaryDomain: string;
  subDomain: string;
  authorName: string;
  authorSlug: string;
  coverImageUrl: string;
  publishedAt: string; // ISO
  updatedAt?: string; // ISO
  readingTimeMin: number;
  wordCount?: number;
  tags?: string[];
  seriesTitle?: string;
  language?: string;
}

export interface InsightSeriesSEO {
  slug: string;
  titleTr: string;
  coverImageUrl: string;
  parts: Array<{ slug: string; titleTr: string; order: number; publishedAt?: string }>;
  authorName: string;
}

const BASE_URL = 'https://ecypro.com';

export function buildArticleJsonLd(post: InsightPostSEO, locale: 'tr' | 'en'): string {
  const headline = locale === 'en' && post.titleEn ? post.titleEn : post.titleTr;
  const description = locale === 'en' && post.excerptEn ? post.excerptEn : post.excerptTr;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    author: {
      '@type': 'Person',
      name: post.authorName,
      url: `${BASE_URL}/insights/author/${post.authorSlug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'eCyPro',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/ecypro-logo.png`,
      },
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    image: [post.coverImageUrl],
    articleSection: post.primaryDomain,
    wordCount: post.wordCount ?? 0,
    keywords: post.tags ?? [],
    url: `${BASE_URL}/insights/${post.slug}`,
    inLanguage: locale,
  };

  return JSON.stringify(schema);
}

export function buildSeriesJsonLd(series: InsightSeriesSEO): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: series.titleTr,
    url: `${BASE_URL}/insights/series/${series.slug}`,
    itemListElement: series.parts.map((part) => ({
      '@type': 'ListItem',
      position: part.order,
      url: `${BASE_URL}/insights/series/${series.slug}/part-${part.order}`,
    })),
  };

  return JSON.stringify(schema);
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return JSON.stringify(schema);
}

export function buildHubItemListJsonLd(
  posts: Array<{ slug: string; titleTr: string; publishedAt: string }>,
): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: posts.map((post, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: post.titleTr,
      url: `${BASE_URL}/insights/${post.slug}`,
    })),
  };

  return JSON.stringify(schema);
}
