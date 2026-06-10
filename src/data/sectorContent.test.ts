import { describe, it, expect } from 'vitest';
import { SECTOR_CONTENT, getSectorContent } from './sectorContent';

const SECTORS = [
  'imalat-sanayi',
  'finansal-hizmetler',
  'ilac-saglik',
  'perakende-e-ticaret',
  'teknoloji-saas',
];

describe('SECTOR_CONTENT', () => {
  it('covers all 5 sector slugs', () => {
    expect(Object.keys(SECTOR_CONTENT).sort()).toEqual([...SECTORS].sort());
  });

  it('each sector has answer-first overview (TR+EN, substantive)', () => {
    for (const slug of SECTORS) {
      const c = SECTOR_CONTENT[slug];
      expect(c.overview.tr.length, `${slug} TR overview`).toBeGreaterThanOrEqual(80);
      expect(c.overview.en.length, `${slug} EN overview`).toBeGreaterThanOrEqual(80);
    }
  });

  it('each sector has ≥4 methodology steps with TR+EN title/desc', () => {
    for (const slug of SECTORS) {
      const m = SECTOR_CONTENT[slug].methodology;
      expect(m.length, `${slug} methodology`).toBeGreaterThanOrEqual(4);
      for (const s of m) {
        expect(s.title.tr.trim().length).toBeGreaterThan(0);
        expect(s.title.en.trim().length).toBeGreaterThan(0);
        expect(s.desc.tr.trim().length).toBeGreaterThan(0);
        expect(s.desc.en.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('each sector has ≥3 outcomes, every metric carries a concrete signal', () => {
    const signal = /[0-9]|%|<|\+|NRR|A\/B|Tek|Single|Özel|special/i;
    for (const slug of SECTORS) {
      const o = SECTOR_CONTENT[slug].outcomes;
      expect(o.length, `${slug} outcomes`).toBeGreaterThanOrEqual(3);
      for (const out of o) {
        expect(signal.test(out.metric), `${slug} metric "${out.metric}"`).toBe(true);
        expect(out.label.tr.trim().length).toBeGreaterThan(0);
        expect(out.label.en.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('getSectorContent', () => {
  it('returns content for a known slug', () => {
    expect(getSectorContent('imalat-sanayi')).toBe(SECTOR_CONTENT['imalat-sanayi']);
  });

  it('returns undefined for an unknown slug (no throw)', () => {
    expect(getSectorContent('does-not-exist')).toBeUndefined();
  });
});
