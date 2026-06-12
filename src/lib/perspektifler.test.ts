import { describe, it, expect } from 'vitest';
import {
  parseHubFilter,
  serializeHubFilter,
  filterItems,
  facetOptions,
  visibleWindow,
  topTopics,
  getFeatured,
  dbPostsToFeedItems,
  ALL_ITEMS,
  PAGE_SIZE,
  DOM_CARD_CAP,
  type DbPublishedPost,
  type HubFilter,
} from './perspektifler';
import { FORMATS } from '@/data/taxonomy';

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

describe('DB-published posts merge (CLS-safe append + arastirma format)', () => {
  const row = (over: Partial<DbPublishedPost> = {}): DbPublishedPost => ({
    slug: 'neon-arastirma-1',
    titleTr: 'Yapay Zekâ ile Tedarik Zinciri Araştırması',
    excerptTr: 'Saha verisiyle hazırlanan araştırma özeti.',
    publishedAt: '2026-06-10T09:00:00.000Z',
    createdAt: '2026-06-01T09:00:00.000Z',
    coverImageUrl: '/images/blog-default.jpg',
    readingTimeMin: 7,
    primaryDomain: 'M_A',
    author: { displayName: 'Emre Can Yalçın' },
    ...over,
  });

  it("taxonomy carries 'arastirma' as a first-class format", () => {
    expect(FORMATS.map((f) => f.slug)).toContain('arastirma');
  });

  it("maps rows to FeedItems with format 'arastirma' and hub href", () => {
    const [item] = dbPostsToFeedItems([row()], []);
    expect(item.format).toBe('arastirma');
    expect(item.href).toBe('/perspektifler/neon-arastirma-1');
    expect(item.title).toBe('Yapay Zekâ ile Tedarik Zinciri Araştırması');
    expect(item.categorySlug).toBe('ma-degerleme');
    expect(item.readingTime).toBe('7 dk okuma');
    expect(item.author).toBe('Emre Can Yalçın');
  });

  it('dedupes against the static corpus by slug (static wins)', () => {
    const staticSlug = ALL_ITEMS[0].slug;
    const items = dbPostsToFeedItems([row({ slug: staticSlug }), row()]);
    expect(items.map((i) => i.slug)).toEqual(['neon-arastirma-1']);
  });

  it('sorts newest first inside the appended block', () => {
    const items = dbPostsToFeedItems(
      [
        row({ slug: 'old', publishedAt: '2026-01-01T00:00:00.000Z' }),
        row({ slug: 'new', publishedAt: '2026-06-01T00:00:00.000Z' }),
      ],
      [],
    );
    expect(items.map((i) => i.slug)).toEqual(['new', 'old']);
  });

  it('falls back to createdAt when publishedAt is null', () => {
    const [item] = dbPostsToFeedItems([row({ publishedAt: null })], []);
    expect(item.date).toBe('2026-06-01T09:00:00.000Z');
  });

  it('?format=arastirma URL contract round-trips and filters DB items', () => {
    const f = parseHubFilter(new URLSearchParams('format=arastirma'));
    expect(f.format).toBe('arastirma');
    expect(serializeHubFilter(f).get('format')).toBe('arastirma');

    const db = dbPostsToFeedItems([row()], []);
    expect(filterItems(f, db).map((i) => i.slug)).toEqual(['neon-arastirma-1']);
    // Static corpus has no arastirma items yet: existing grid stays untouched.
    expect(filterItems(f).length).toBe(0);
  });

  it('unknown primaryDomain falls back to strateji', () => {
    const [item] = dbPostsToFeedItems([row({ primaryDomain: 'UNKNOWN_DOMAIN' })], []);
    expect(item.categorySlug).toBe('strateji');
    expect(item.category).toBe('Strateji');
  });
});
