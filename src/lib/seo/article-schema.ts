/**
 * P51.2 — Article + BlogPosting JSON-LD builder.
 *
 * Google Rich Results için Article structured data.
 * 34 blog post detayında inject edilir (BlogPostPage).
 */

interface ArticleInput {
  url: string;
  title: string;
  description: string;
  image: string;
  publishedAt: string; // ISO
  modifiedAt?: string;
  author: string;
  authorUrl?: string;
  section?: string; // category
  keywords?: string[];
  wordCount?: number;
  readingTimeMin?: number;
}

export function buildArticleSchema(input: ArticleInput) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Article', 'BlogPosting'],
    '@id': `${input.url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    headline: input.title.slice(0, 110), // Google headline limit
    description: input.description,
    image: {
      '@type': 'ImageObject',
      url: input.image,
      width: 1600,
      height: 900,
    },
    datePublished: input.publishedAt,
    dateModified: input.modifiedAt ?? input.publishedAt,
    author: {
      '@type': 'Person',
      '@id': 'https://www.ecypro.com/#founder',
      name: input.author,
      url: input.authorUrl ?? 'https://www.ecypro.com/about',
    },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://www.ecypro.com/#organization',
      name: 'EcyPro Premium Consulting',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.ecypro.com/pwa-512x512.png',
        width: 512,
        height: 512,
      },
    },
    ...(input.section ? { articleSection: input.section } : {}),
    ...(input.keywords?.length ? { keywords: input.keywords.join(', ') } : {}),
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
    ...(input.readingTimeMin
      ? {
          timeRequired: `PT${input.readingTimeMin}M`,
        }
      : {}),
    inLanguage: 'tr-TR',
  };
}
