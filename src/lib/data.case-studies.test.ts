import { describe, it, expect } from 'vitest';
import { getCaseStudies } from './data';
import { CaseStudyListSchema } from '../schemas/caseStudy';
import { CASE_STUDIES as MOCK_CASE_STUDIES } from '../data/mockCaseStudies';

describe('getCaseStudies', () => {
  const studies = getCaseStudies();

  it('returns a non-empty list', () => {
    expect(Array.isArray(studies)).toBe(true);
    expect(studies.length).toBeGreaterThan(0);
  });

  it('every entry satisfies the case-study shape', () => {
    for (const s of studies) {
      expect(typeof s.slug).toBe('string');
      expect(typeof s.title).toBe('string');
      expect(typeof s.content).toBe('string');
      expect(typeof s.industry).toBe('string');
    }
  });

  it('includes the real atlas-freight content compiled from .mdoc', () => {
    const real = studies.find((s) => s.slug === 'atlas-freight');
    expect(real).toBeDefined();
    // Body came from marked() over the .mdoc Markdown, not the mock HTML.
    expect(real?.content).toContain('Atlas Freight');
    expect(real?.content).toMatch(/<h[12]>/);
  });

  it('merges mock fallback for slugs not yet migrated to real content', () => {
    const slugs = new Set(studies.map((s) => s.slug));
    for (const m of MOCK_CASE_STUDIES) {
      expect(slugs.has(m.slug)).toBe(true);
    }
    // No duplicate slugs after the merge.
    expect(slugs.size).toBe(studies.length);
  });

  it('real entries win over mock on slug collision (real first)', () => {
    const realSlugs = new Set(['atlas-freight']);
    const firstReal = studies.findIndex((s) => realSlugs.has(s.slug));
    const firstMock = studies.findIndex((s) => !realSlugs.has(s.slug));
    expect(firstReal).toBeLessThan(firstMock);
  });

  it('the generated JSON validates against CaseStudyListSchema', () => {
    const real = studies.filter((s) => s.slug === 'atlas-freight');
    expect(CaseStudyListSchema.safeParse(real).success).toBe(true);
  });
});
