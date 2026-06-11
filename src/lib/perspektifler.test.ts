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
