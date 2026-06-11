/**
 * GATE-5 — search quality + latency over the real corpus (istek.md v2 §PHASE 5).
 * Asserts: zero-result rate <5% on the committed 30-query set, p95 <300ms,
 * diacritic insensitivity, and relevance ordering (title hits outrank body).
 */
import { describe, it, expect } from 'vitest';
import { filterItems, searchPerspektifler } from './perspektifler';
import queriesFile from '../../e2e/search-queries.json';

const QUERIES: string[] = (queriesFile as { queries: string[] }).queries;

describe('perspektifler search (GATE-5)', () => {
  it('30-query set: zero-result <5%, p95 <300ms', () => {
    expect(QUERIES.length).toBe(30);
    const latencies: number[] = [];
    let zero = 0;
    const report: string[] = [];

    for (const q of QUERIES) {
      const t0 = performance.now();
      const hits = searchPerspektifler(q);
      const ms = performance.now() - t0;
      latencies.push(ms);
      if (hits.length === 0) {
        zero++;
        report.push(`ZERO  "${q}"`);
      } else {
        report.push(`${String(hits.length).padStart(3)}  "${q}"  ${ms.toFixed(2)}ms`);
      }
    }

    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.ceil(latencies.length * 0.95) - 1] ?? 0;
    // eslint-disable-next-line no-console
    console.log(report.join('\n'));
    // eslint-disable-next-line no-console
    console.log(
      `zero-result: ${zero}/${QUERIES.length} (${((zero / QUERIES.length) * 100).toFixed(1)}%) · p95: ${p95.toFixed(2)}ms`,
    );

    expect(zero / QUERIES.length).toBeLessThan(0.05);
    expect(p95).toBeLessThan(300);
  });

  it('diacritic-insensitive equivalence', () => {
    const a = searchPerspektifler('dönüşüm').map((h) => h.slug);
    const b = searchPerspektifler('donusum').map((h) => h.slug);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('relevance: a title-hit ranks above an excerpt-only hit', () => {
    const hits = searchPerspektifler('yapay zeka');
    expect(hits.length).toBeGreaterThan(1);
    const titleHit = hits.findIndex((h) => /yapay zeka/i.test(h.title));
    expect(titleHit).toBe(0);
  });

  it('facets compose with q (AND across types)', () => {
    const all = searchPerspektifler('yapay zeka');
    const scoped = filterItems({
      q: 'yapay zeka',
      kategori: 'yapay-zeka-teknoloji',
      sirala: 'yeni',
      page: 1,
    });
    expect(scoped.length).toBeLessThanOrEqual(all.length);
    expect(scoped.every((i) => i.categorySlug === 'yapay-zeka-teknoloji')).toBe(true);
  });
});
