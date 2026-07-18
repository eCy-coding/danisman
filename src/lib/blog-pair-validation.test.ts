import { describe, it, expect } from 'vitest';
import { validatePairReciprocity, type PairValidationPost } from './blog-pair-validation';

describe('validatePairReciprocity (EN article-parity mechanism)', () => {
  it('no pair_id anywhere → 0 errors, 0 warnings (todays TR-only corpus)', () => {
    const posts: PairValidationPost[] = [
      { slug: 'a', lang: 'tr' },
      { slug: 'b', lang: 'tr' },
    ];
    const result = validatePairReciprocity(posts, new Map());
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('reciprocal pair (tr + en, same pair_id) → 0 errors', () => {
    const posts: PairValidationPost[] = [
      { slug: 'kpi-tahminleme', pairId: 'kpi-forecast', lang: 'tr' },
      { slug: 'kpi-forecasting', pairId: 'kpi-forecast', lang: 'en' },
    ];
    const result = validatePairReciprocity(
      posts,
      new Map([
        ['kpi-tahminleme', 'published'],
        ['kpi-forecasting', 'published'],
      ]),
    );
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('orphan pair_id, status:draft → warning only, no error', () => {
    const posts: PairValidationPost[] = [{ slug: 'draft-post', pairId: 'lonely', lang: 'tr' }];
    const result = validatePairReciprocity(posts, new Map([['draft-post', 'draft']]));
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('lonely');
    expect(result.warnings[0]).toContain('draft-post');
  });

  it('orphan pair_id, status:published → error (not silently allowed)', () => {
    const posts: PairValidationPost[] = [{ slug: 'published-post', pairId: 'lonely', lang: 'tr' }];
    const result = validatePairReciprocity(posts, new Map([['published-post', 'published']]));
    expect(result.warnings).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('lonely');
  });

  it('pair with two members sharing the same lang → error', () => {
    const posts: PairValidationPost[] = [
      { slug: 'a-tr', pairId: 'p1', lang: 'tr' },
      { slug: 'b-tr', pairId: 'p1', lang: 'tr' },
    ];
    const result = validatePairReciprocity(
      posts,
      new Map([
        ['a-tr', 'published'],
        ['b-tr', 'published'],
      ]),
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/same lang|share lang/);
  });

  it('pair_id with 3+ members → error', () => {
    const posts: PairValidationPost[] = [
      { slug: 'a', pairId: 'p1', lang: 'tr' },
      { slug: 'b', pairId: 'p1', lang: 'en' },
      { slug: 'c', pairId: 'p1', lang: 'tr' },
    ];
    const result = validatePairReciprocity(posts, new Map());
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('3 members');
  });

  it('missing status defaults to non-draft (treated as error when orphaned)', () => {
    const posts: PairValidationPost[] = [{ slug: 'no-status', pairId: 'lonely', lang: 'tr' }];
    const result = validatePairReciprocity(posts, new Map());
    expect(result.errors).toHaveLength(1);
    expect(result.warnings).toEqual([]);
  });
});
