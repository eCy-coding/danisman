/**
 * EN article-parity mechanism — precise lang-preference behavior.
 *
 * perspektifler.test.ts covers itemsForLang() directly (it takes an
 * injectable items list), but getFeatured/relatedItems/seriesSiblings read
 * from the module-private `posts` array (parsed from blog-posts.json at
 * import time). Today's real corpus is 100% TR with zero pairId values, so
 * "prefer same-lang" can't be observed against it. This file mocks
 * blog-posts.json with a small bilingual + paired fixture to exercise the
 * actual tie-break logic deterministically.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/data/blog-posts.json', () => ({
  default: [
    {
      slug: 'tr-solo',
      title: 'TR Solo',
      excerpt: '',
      date: '2026-01-01T00:00:00.000Z',
      author: 'A',
      category: 'Strateji',
      categorySlug: 'strateji',
      tags: ['ai'],
      readingTime: '5 dk okuma',
      readTimeMin: 5,
      lang: 'tr',
      format: 'makale',
      featured: true,
    },
    {
      slug: 'tr-paired',
      title: 'TR Paired',
      excerpt: '',
      date: '2026-01-02T00:00:00.000Z',
      author: 'A',
      category: 'Strateji',
      categorySlug: 'strateji',
      tags: ['ai'],
      readingTime: '5 dk okuma',
      readTimeMin: 5,
      lang: 'tr',
      format: 'makale',
      featured: true,
      pairId: 'p1',
    },
    {
      slug: 'en-paired',
      title: 'EN Paired',
      excerpt: '',
      date: '2026-01-03T00:00:00.000Z',
      author: 'A',
      category: 'Strateji',
      categorySlug: 'strateji',
      tags: ['ai'],
      readingTime: '5 min read',
      readTimeMin: 5,
      lang: 'en',
      format: 'makale',
      featured: true,
      pairId: 'p1',
    },
    {
      slug: 'en-solo',
      title: 'EN Solo',
      excerpt: '',
      date: '2026-01-04T00:00:00.000Z',
      author: 'A',
      category: 'Strateji',
      categorySlug: 'strateji',
      tags: ['ai'],
      readingTime: '5 min read',
      readTimeMin: 5,
      lang: 'en',
      format: 'makale',
      featured: true,
    },
  ],
}));

vi.mock('@/data/mockCaseStudies', () => ({ CASE_STUDIES: [] }));

import { getFeatured, relatedItems, seriesSiblings, itemsForLang } from './perspektifler';

describe('EN article-parity — same-lang preference (synthetic bilingual corpus)', () => {
  it('itemsForLang("en") = EN posts + TR-only posts, excludes the paired TR sibling', () => {
    const slugs = itemsForLang('en')
      .map((i) => i.slug)
      .sort();
    expect(slugs).toEqual(['en-paired', 'en-solo', 'tr-solo']);
  });

  it('itemsForLang("tr") = TR posts only', () => {
    const slugs = itemsForLang('tr')
      .map((i) => i.slug)
      .sort();
    expect(slugs).toEqual(['tr-paired', 'tr-solo']);
  });

  it('getFeatured("en") orders EN-lang items before TR (cross-lang still fills remaining slots)', () => {
    const { lead, secondary } = getFeatured('en');
    const order = [lead, ...secondary].filter((x): x is NonNullable<typeof x> => x !== null);
    expect(order.map((i) => i.slug)).toEqual(['en-solo', 'en-paired', 'tr-paired', 'tr-solo']);
  });

  it('getFeatured("tr") orders TR-lang items before EN', () => {
    const { lead, secondary } = getFeatured('tr');
    const order = [lead, ...secondary].filter((x): x is NonNullable<typeof x> => x !== null);
    expect(order.map((i) => i.slug)).toEqual(['tr-paired', 'tr-solo', 'en-solo', 'en-paired']);
  });

  it('getFeatured() with no lang arg keeps the original date-desc order (backward compat)', () => {
    const { lead, secondary } = getFeatured();
    const order = [lead, ...secondary].filter((x): x is NonNullable<typeof x> => x !== null);
    expect(order.map((i) => i.slug)).toEqual(['en-solo', 'en-paired', 'tr-paired', 'tr-solo']);
  });

  it('relatedItems ranks the same-lang candidate first when tag-overlap and category tie', () => {
    // source = en-paired (lang en). tr-solo/tr-paired tie with en-solo on
    // overlap(1) + sameCat(1); only en-solo also has sameLang(1) → must win.
    const related = relatedItems('en-paired', 3);
    expect(related[0]?.slug).toBe('en-solo');
    expect(related.map((r) => r.slug).sort()).toEqual(['en-solo', 'tr-paired', 'tr-solo']);
  });

  it('seriesSiblings falls back cross-lang when no seriesId is set at all', () => {
    expect(seriesSiblings('none')).toEqual([]);
    expect(seriesSiblings('none', 'en')).toEqual([]);
  });
});
