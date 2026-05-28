import { describe, test, expect } from 'vitest';
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildSeriesJsonLd,
  buildHubItemListJsonLd,
  type InsightPostSEO,
  type InsightSeriesSEO,
} from '../../lib/seo/insightsStructuredData';

const samplePost: InsightPostSEO = {
  slug: 'm-a-due-diligence-checklist',
  titleTr: 'M&A Due Diligence Kontrol Listesi',
  titleEn: 'M&A Due Diligence Checklist',
  excerptTr: 'Satın alma sürecinde kritik adımlar.',
  excerptEn: 'Critical steps in an acquisition process.',
  primaryDomain: 'M_A',
  subDomain: 'due-diligence',
  authorName: 'Emre Can Yalçın',
  authorSlug: 'emre-can-yalcin',
  coverImageUrl: 'https://www.ecypro.com/images/cover.jpg',
  publishedAt: '2026-05-01T09:00:00Z',
  updatedAt: '2026-05-02T09:00:00Z',
  readingTimeMin: 8,
  wordCount: 1600,
  tags: ['due-diligence', 'm-a'],
};

describe('buildArticleJsonLd', () => {
  test('returns valid JSON string', () => {
    const result = buildArticleJsonLd(samplePost, 'tr');
    expect(() => JSON.parse(result)).not.toThrow();
  });

  test('includes headline from titleTr for tr locale', () => {
    const parsed = JSON.parse(buildArticleJsonLd(samplePost, 'tr'));
    expect(parsed.headline).toBe(samplePost.titleTr);
  });

  test('includes headline from titleEn for en locale, falls back to titleTr if no EN', () => {
    const withEn = JSON.parse(buildArticleJsonLd(samplePost, 'en'));
    expect(withEn.headline).toBe(samplePost.titleEn);

    const noEnPost = { ...samplePost, titleEn: undefined };
    const withoutEn = JSON.parse(buildArticleJsonLd(noEnPost, 'en'));
    expect(withoutEn.headline).toBe(samplePost.titleTr);
  });

  test('includes author name and URL', () => {
    const parsed = JSON.parse(buildArticleJsonLd(samplePost, 'tr'));
    expect(parsed.author.name).toBe(samplePost.authorName);
    expect(parsed.author.url).toContain(samplePost.authorSlug);
  });

  test('includes publisher with eCyPro name', () => {
    const parsed = JSON.parse(buildArticleJsonLd(samplePost, 'tr'));
    expect(parsed.publisher.name).toBe('eCyPro');
  });

  test('includes datePublished', () => {
    const parsed = JSON.parse(buildArticleJsonLd(samplePost, 'tr'));
    expect(parsed.datePublished).toBe(samplePost.publishedAt);
  });
});

describe('buildBreadcrumbJsonLd', () => {
  const items = [
    { name: 'Ana Sayfa', url: 'https://www.ecypro.com' },
    { name: 'Perspektif', url: 'https://www.ecypro.com/insights' },
    { name: 'M&A', url: 'https://www.ecypro.com/insights/m-a' },
  ];

  test('returns valid BreadcrumbList JSON-LD', () => {
    const result = buildBreadcrumbJsonLd(items);
    const parsed = JSON.parse(result);
    expect(parsed['@type']).toBe('BreadcrumbList');
    expect(parsed['@context']).toBe('https://schema.org');
  });

  test('sets correct position numbers starting from 1', () => {
    const parsed = JSON.parse(buildBreadcrumbJsonLd(items));
    expect(parsed.itemListElement[0].position).toBe(1);
    expect(parsed.itemListElement[2].position).toBe(3);
  });

  test('includes item URL when href provided', () => {
    const parsed = JSON.parse(buildBreadcrumbJsonLd(items));
    expect(parsed.itemListElement[1].item).toBe('https://www.ecypro.com/insights');
  });
});

describe('buildSeriesJsonLd', () => {
  const series: InsightSeriesSEO = {
    slug: 'aile-sirketi-serisi',
    titleTr: 'Aile Şirketi Serisi',
    coverImageUrl: 'https://www.ecypro.com/images/series-cover.jpg',
    authorName: 'Emre Can Yalçın',
    parts: [
      { slug: 'part-1', titleTr: 'Bölüm 1', order: 1, publishedAt: '2026-05-01T09:00:00Z' },
      { slug: 'part-2', titleTr: 'Bölüm 2', order: 2, publishedAt: '2026-05-08T09:00:00Z' },
    ],
  };

  test('returns valid ItemList JSON-LD', () => {
    const result = buildSeriesJsonLd(series);
    const parsed = JSON.parse(result);
    expect(parsed['@type']).toBe('ItemList');
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed.itemListElement).toHaveLength(2);
    expect(parsed.itemListElement[0].position).toBe(1);
    expect(parsed.name).toBe(series.titleTr);
  });
});

describe('buildHubItemListJsonLd', () => {
  test('returns valid ItemList JSON-LD for hub page', () => {
    const posts = [
      { slug: 'post-1', titleTr: 'Başlık 1', publishedAt: '2026-05-01T09:00:00Z' },
      { slug: 'post-2', titleTr: 'Başlık 2', publishedAt: '2026-05-05T09:00:00Z' },
    ];
    const result = buildHubItemListJsonLd(posts);
    const parsed = JSON.parse(result);
    expect(parsed['@type']).toBe('ItemList');
    expect(parsed.itemListElement).toHaveLength(2);
    expect(parsed.itemListElement[0].url).toContain('post-1');
  });
});
