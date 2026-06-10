import { describe, it, expect } from 'vitest';
import { SECTOR_FAQS, getSectorFaqItems } from './sectorFaqs';
import { buildFaqSchema } from '../lib/structured-data';

const SECTORS = [
  'imalat-sanayi',
  'finansal-hizmetler',
  'ilac-saglik',
  'perakende-e-ticaret',
  'teknoloji-saas',
];

describe('SECTOR_FAQS', () => {
  it('covers all 5 sector slugs', () => {
    expect(Object.keys(SECTOR_FAQS).sort()).toEqual([...SECTORS].sort());
  });

  it('each sector has at least 6 Q&A with non-empty TR + EN', () => {
    for (const slug of SECTORS) {
      const faqs = SECTOR_FAQS[slug];
      expect(faqs.length).toBeGreaterThanOrEqual(6);
      for (const f of faqs) {
        expect(f.q.tr.trim().length).toBeGreaterThan(0);
        expect(f.q.en.trim().length).toBeGreaterThan(0);
        expect(f.a.tr.trim().length).toBeGreaterThan(0);
        expect(f.a.en.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('humanizer QA: every answer is substantive (not filler)', () => {
    // GEO/humanizer rule: answers are full, specific paragraphs — not one-liners.
    for (const slug of SECTORS) {
      for (const f of SECTOR_FAQS[slug]) {
        expect(f.a.tr.length, `${slug} TR: ${f.q.tr}`).toBeGreaterThanOrEqual(150);
        expect(f.a.en.length, `${slug} EN: ${f.q.en}`).toBeGreaterThanOrEqual(150);
      }
    }
  });

  it('humanizer QA: each sector carries concrete numbers/metrics (≥2 numeric answers per language)', () => {
    const numeric = /[0-9]|%/;
    for (const slug of SECTORS) {
      const trNum = SECTOR_FAQS[slug].filter((f) => numeric.test(f.a.tr)).length;
      const enNum = SECTOR_FAQS[slug].filter((f) => numeric.test(f.a.en)).length;
      expect(trNum, `${slug} TR numeric`).toBeGreaterThanOrEqual(2);
      expect(enNum, `${slug} EN numeric`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('getSectorFaqItems', () => {
  it('maps to flat {question, answer} in the requested language', () => {
    const tr = getSectorFaqItems('imalat-sanayi', 'tr');
    const en = getSectorFaqItems('imalat-sanayi', 'en');
    expect(tr).toHaveLength(SECTOR_FAQS['imalat-sanayi'].length);
    expect(tr[0].question).toBe(SECTOR_FAQS['imalat-sanayi'][0].q.tr);
    expect(en[0].answer).toBe(SECTOR_FAQS['imalat-sanayi'][0].a.en);
  });

  it('returns [] for an unknown slug (no throw)', () => {
    expect(getSectorFaqItems('does-not-exist', 'tr')).toEqual([]);
  });

  it('feeds a valid FAQPage schema (GEO citation candidate)', () => {
    const items = getSectorFaqItems('finansal-hizmetler', 'en');
    const schema = buildFaqSchema({
      questions: items.map((i) => ({ q: i.question, a: i.answer })),
    });
    expect(schema['@type']).toBe('FAQPage');
    expect((schema.mainEntity as unknown[]).length).toBe(items.length);
  });
});
