/**
 * P17 BE Track 2 / Aşama 3 — full-text search query builder tests.
 *
 * The real /api/search endpoint needs a Postgres instance with the FTS
 * migration applied, which sandbox CI can't supply. We pin the
 * `buildTsQuery` codec instead — it's the unit that turns user input
 * into the Postgres `tsquery` syntax, so a regression here would
 * silently break search for everyone.
 */

import { describe, expect, it } from 'vitest';
import { buildTsQuery } from './search';

describe('buildTsQuery', () => {
  it('returns null for an empty query', () => {
    expect(buildTsQuery('')).toBeNull();
  });

  it('returns null when only punctuation/whitespace', () => {
    expect(buildTsQuery('   --- ??? ')).toBeNull();
  });

  it('lower-cases and prefix-matches a single token', () => {
    expect(buildTsQuery('AI')).toBe('ai:*');
  });

  it('joins multiple tokens with logical AND', () => {
    expect(buildTsQuery('strategic consulting')).toBe('strategic:* & consulting:*');
  });

  it('truncates each token at 32 characters', () => {
    const long = 'a'.repeat(40);
    const out = buildTsQuery(long)!;
    expect(out.length).toBeLessThanOrEqual(35); // "aaaa..."(32) + ":*"
    expect(out.endsWith(':*')).toBe(true);
  });

  it('caps the number of tokens at 6', () => {
    const out = buildTsQuery('one two three four five six seven eight');
    expect(out).toBe('one:* & two:* & three:* & four:* & five:* & six:*');
  });

  it('handles Turkish characters via Unicode property escapes', () => {
    expect(buildTsQuery('öğrenme yöntemi')).toBe('öğrenme:* & yöntemi:*');
  });

  it('strips punctuation between words', () => {
    expect(buildTsQuery('AI, ML & Data!')).toBe('ai:* & ml:* & data:*');
  });
});
