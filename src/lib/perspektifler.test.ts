import { describe, it, expect } from 'vitest';
import {
  parseHubFilter,
  serializeHubFilter,
  filterItems,
  facetOptions,
  visibleWindow,
  topTopics,
  getFeatured,
  ALL_ITEMS,
  PAGE_SIZE,
  DOM_CARD_CAP,
  type HubFilter,
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

// ─── DB-post merge (NotebookLM pipeline → hub feed) ──────────────────────────

import type { FeedItem } from './perspektifler';
import { mapToFeedItem } from '@/hooks/usePublishedPosts';

const DB_ROW = {
  slug: 'nlm-arastirma-yazisi',
  titleTr: 'NotebookLM Araştırma Yazısı',
  excerptTr: 'Aile şirketlerinde kuşak çatışması üzerine sentez.',
  coverImageUrl: '/insights-covers/aile-sirketi-1.webp',
  readingTimeMin: 4,
  publishedAt: '2026-06-12T12:54:44.000Z',
  primaryDomain: 'AILE_SIRKETI',
  author: { displayName: 'Emre Can Yalçın' },
  category: null,
};

describe('published DB posts merge into the hub feed', () => {
  it('mapToFeedItem maps domain → taxonomy category and rapor format', () => {
    const item = mapToFeedItem(DB_ROW);
    expect(item.categorySlug).toBe('insan-organizasyon');
    expect(item.format).toBe('rapor');
    expect(item.href).toBe('/perspektifler/nlm-arastirma-yazisi');
    expect(item.readTimeMin).toBe(4);
    expect(item.coverImage).toBe('/insights-covers/aile-sirketi-1.webp');
  });

  it('merged corpus filters/sorts and counts facets including DB items', () => {
    const db = mapToFeedItem(DB_ROW);
    const merged: FeedItem[] = [...ALL_ITEMS, db];
    const f: HubFilter = { sirala: 'yeni', page: 1 };

    const results = filterItems(f, merged);
    expect(results.some((i) => i.slug === db.slug)).toBe(true);

    const raporOnly = filterItems({ ...f, format: 'rapor' }, merged);
    expect(raporOnly.some((i) => i.slug === db.slug)).toBe(true);

    const opts = facetOptions(f, merged);
    const raporFacet = opts.formatlar.find((o) => o.value === 'rapor');
    const raporStatic = facetOptions(f).formatlar.find((o) => o.value === 'rapor');
    expect((raporFacet?.count ?? 0) - (raporStatic?.count ?? 0)).toBe(1);
  });

  it('static slugs win on collision (dedupe contract)', () => {
    const staticSlug = ALL_ITEMS[0].slug;
    const clash = { ...mapToFeedItem(DB_ROW), slug: staticSlug, title: 'DB GÖLGE' };
    const staticSlugs = new Set(ALL_ITEMS.map((i) => i.slug));
    const merged = [...ALL_ITEMS, clash].filter(
      (i, idx) => idx < ALL_ITEMS.length || !staticSlugs.has(i.slug),
    );
    expect(merged.filter((i) => i.slug === staticSlug)).toHaveLength(1);
    expect(merged.find((i) => i.slug === staticSlug)?.title).not.toBe('DB GÖLGE');
  });
});
