import { describe, it, expect } from 'vitest';
import {
  parseHubFilter,
  serializeHubFilter,
  filterItems,
  facetOptions,
  visibleWindow,
  topTopics,
  getFeatured,
  itemsForLang,
  relatedItems,
  seriesSiblings,
  ALL_ITEMS,
  PAGE_SIZE,
  DOM_CARD_CAP,
  type HubFilter,
  type FeedItem,
} from './perspektifler';

describe('perspektifler hub state (GATE-3)', () => {
  it('URL round-trip: parse(serialize(f)) === f', () => {
    const f: HubFilter = {
      kategori: 'yapay-zeka-teknoloji',
      format: 'makale',
      konu: 'yapay-zeka',
      yil: '2026',
      sirala: 'eski',
      q: 'dönüşüm',
      page: 3,
    };
    const round = parseHubFilter(serializeHubFilter(f));
    expect(round).toEqual(f);
  });

  it('defaults: empty params → yeni sort, page 1, no facets', () => {
    const f = parseHubFilter(new URLSearchParams());
    expect(f).toEqual({
      kategori: undefined,
      format: undefined,
      konu: undefined,
      yil: undefined,
      sirala: 'yeni',
      q: undefined,
      page: 1,
    });
  });

  it('legacy /blog params migrate: ?cat=<label> and ?tag=<raw>', () => {
    const f = parseHubFilter(new URLSearchParams('cat=Yapay+Zeka&tag=six+sigma'));
    expect(f.kategori).toBe('yapay-zeka-teknoloji');
    expect(f.konu).toBe('alti-sigma');
  });

  it('invalid facet values are dropped, not crashed', () => {
    const f = parseHubFilter(new URLSearchParams('kategori=hile&konu=yok&page=-4'));
    expect(f.kategori).toBeUndefined();
    expect(f.konu).toBeUndefined();
    expect(f.page).toBe(1);
  });

  it('diacritic-insensitive q: "donusum" finds "dönüşüm" titles', () => {
    const hits = filterItems({ sirala: 'yeni', page: 1, q: 'donusum' });
    expect(hits.length).toBeGreaterThan(0);
    const hitsTr = filterItems({ sirala: 'yeni', page: 1, q: 'dönüşüm' });
    expect(hits.map((h) => h.slug).sort()).toEqual(hitsTr.map((h) => h.slug).sort());
  });

  it('facet counts respect other facets and hide zeros', () => {
    const opts = facetOptions({ kategori: 'kamu-esg', sirala: 'yeni', page: 1 });
    expect(opts.formatlar.every((o) => o.count > 0)).toBe(true);
    expect(opts.yillar.every((o) => o.count > 0)).toBe(true);
  });

  it('window caps DOM at 48 cards and follows page', () => {
    const all = filterItems({ sirala: 'yeni', page: 1 });
    expect(visibleWindow(all, 1).length).toBe(Math.min(PAGE_SIZE, all.length));
    const page5 = visibleWindow(all, 5);
    expect(page5.length).toBeLessThanOrEqual(DOM_CARD_CAP);
  });

  it('topic chips ≤12, labels from vocabulary', () => {
    const chips = topTopics({ sirala: 'yeni', page: 1 });
    expect(chips.length).toBeLessThanOrEqual(12);
    expect(chips.every((c) => c.count > 0 && c.label.length > 0)).toBe(true);
  });

  it('hero: 1 lead + ≤3 secondary featured', () => {
    const { lead, secondary } = getFeatured();
    expect(lead).not.toBeNull();
    expect(secondary.length).toBeLessThanOrEqual(3);
  });

  it('case studies join feed as vaka-analizi with shared categories', () => {
    const cs = ALL_ITEMS.filter((i) => i.format === 'vaka-analizi');
    expect(cs.length).toBeGreaterThanOrEqual(6);
    expect(cs.every((i) => i.categorySlug.length > 0)).toBe(true);
  });
});

describe('EN article-parity mechanism (istek.md v2)', () => {
  // Synthetic fixture — today's real corpus has zero pairId/en posts, so
  // these tests exercise the mechanism directly rather than relying on
  // future content.
  const fixture: FeedItem[] = [
    {
      slug: 'tr-only',
      title: 'TR Only',
      excerpt: '',
      date: '2026-01-01T00:00:00.000Z',
      author: 'A',
      category: 'Strateji',
      categorySlug: 'strateji',
      tags: [],
      readingTime: '5 dk okuma',
      readTimeMin: 5,
      lang: 'tr',
      format: 'makale',
      featured: false,
      href: '/perspektifler/tr-only',
    },
    {
      slug: 'paired-tr',
      title: 'Paired TR',
      excerpt: '',
      date: '2026-01-02T00:00:00.000Z',
      author: 'A',
      category: 'Strateji',
      categorySlug: 'strateji',
      tags: [],
      readingTime: '5 dk okuma',
      readTimeMin: 5,
      lang: 'tr',
      format: 'makale',
      featured: false,
      href: '/perspektifler/paired-tr',
      pairId: 'pair-1',
    },
    {
      slug: 'paired-en',
      title: 'Paired EN',
      excerpt: '',
      date: '2026-01-03T00:00:00.000Z',
      author: 'A',
      category: 'Strateji',
      categorySlug: 'strateji',
      tags: [],
      readingTime: '5 min read',
      readTimeMin: 5,
      lang: 'en',
      format: 'makale',
      featured: false,
      href: '/perspektifler/paired-en',
      pairId: 'pair-1',
    },
  ];

  it("itemsForLang('tr') excludes en posts", () => {
    const out = itemsForLang('tr', fixture);
    expect(out.map((i) => i.slug).sort()).toEqual(['paired-tr', 'tr-only']);
  });

  it("itemsForLang('en') = EN posts + TR-only posts (paired TR sibling excluded)", () => {
    const out = itemsForLang('en', fixture);
    expect(out.map((i) => i.slug).sort()).toEqual(['paired-en', 'tr-only']);
  });

  it("itemsForLang('en') never empty when corpus has zero pairId (today's reality)", () => {
    const allTr: FeedItem[] = fixture.filter((i) => i.lang === 'tr' && !i.pairId);
    const out = itemsForLang('en', allTr);
    expect(out.length).toBe(allTr.length);
  });

  it('getFeatured(lang) accepts an optional lang without throwing (real corpus is TR-only today)', () => {
    expect(() => getFeatured('tr')).not.toThrow();
    expect(() => getFeatured('en')).not.toThrow();
    const { lead: leadTr } = getFeatured('tr');
    const { lead: leadEn } = getFeatured('en');
    expect(leadTr === null || typeof leadTr.slug === 'string').toBe(true);
    expect(leadEn === null || typeof leadEn.slug === 'string').toBe(true);
  });

  it('relatedItems/seriesSiblings accept the new params without regressing on the real corpus', () => {
    const [first] = ALL_ITEMS;
    if (first) {
      expect(relatedItems(first.slug, 3).length).toBeLessThanOrEqual(3);
    }
    expect(seriesSiblings('nonexistent-series')).toEqual([]);
    expect(seriesSiblings('nonexistent-series', 'en')).toEqual([]);
  });
});
