/**
 * L1-8 — /pricing data validation
 *
 * Pure data tests — no rendering. Validates tier structure, feature matrix,
 * quiz scoring, FAQ count, and brand voice.
 */

import { describe, it, expect } from 'vitest';
import {
  PRICING_TIERS,
  FEATURE_MATRIX,
  QUIZ_QUESTIONS,
  PRICING_FAQS,
  scoreToTier,
  type TierId,
} from '@/data/pricing-tiers';

const TIER_IDS: TierId[] = ['starter', 'growth', 'enterprise'];

// ─── Tier structure ───────────────────────────────────────────────────────────

describe('PRICING_TIERS — structure', () => {
  it('exports exactly 3 tiers', () => {
    expect(PRICING_TIERS).toHaveLength(3);
  });

  it('tier ids are starter, growth, enterprise', () => {
    expect(PRICING_TIERS.map((t) => t.id)).toEqual(TIER_IDS);
  });

  it('each tier has non-empty name, tagline, priceLabel, minTerm, cta, ctaHref', () => {
    for (const tier of PRICING_TIERS) {
      expect(tier.name.trim().length, `name missing on ${tier.id}`).toBeGreaterThan(0);
      expect(tier.tagline.trim().length, `tagline missing on ${tier.id}`).toBeGreaterThan(0);
      expect(tier.priceLabel.trim().length, `priceLabel missing on ${tier.id}`).toBeGreaterThan(0);
      expect(tier.minTerm.trim().length, `minTerm missing on ${tier.id}`).toBeGreaterThan(0);
      expect(tier.cta.trim().length, `cta missing on ${tier.id}`).toBeGreaterThan(0);
      expect(tier.ctaHref.startsWith('/'), `ctaHref not rooted on ${tier.id}`).toBe(true);
    }
  });

  it('growth tier is highlighted (Most Popular)', () => {
    const growth = PRICING_TIERS.find((t) => t.id === 'growth');
    expect(growth?.highlight).toBe(true);
  });

  it('starter and enterprise are NOT highlighted', () => {
    const starter = PRICING_TIERS.find((t) => t.id === 'starter');
    const enterprise = PRICING_TIERS.find((t) => t.id === 'enterprise');
    expect(starter?.highlight).toBeFalsy();
    expect(enterprise?.highlight).toBeFalsy();
  });

  it('starter price label contains USD', () => {
    const starter = PRICING_TIERS.find((t) => t.id === 'starter');
    expect(starter?.priceLabel).toMatch(/USD/);
  });

  it('growth price label contains USD', () => {
    const growth = PRICING_TIERS.find((t) => t.id === 'growth');
    expect(growth?.priceLabel).toMatch(/USD/);
  });

  it('enterprise price label is Custom', () => {
    const enterprise = PRICING_TIERS.find((t) => t.id === 'enterprise');
    expect(enterprise?.priceLabel).toMatch(/[Cc]ustom/);
  });

  it('each tier has at least 4 features', () => {
    for (const tier of PRICING_TIERS) {
      expect(tier.features.length, `${tier.id} needs 4+ features`).toBeGreaterThanOrEqual(4);
    }
  });
});

// ─── Feature matrix ───────────────────────────────────────────────────────────

describe('FEATURE_MATRIX — shape', () => {
  it('has at least 15 rows', () => {
    expect(FEATURE_MATRIX.length).toBeGreaterThanOrEqual(15);
  });

  it('every row has non-empty feature label', () => {
    for (const row of FEATURE_MATRIX) {
      expect(row.feature.trim().length, `empty feature label`).toBeGreaterThan(0);
    }
  });

  it('every row has starter, growth, enterprise values', () => {
    for (const row of FEATURE_MATRIX) {
      expect('starter' in row).toBe(true);
      expect('growth' in row).toBe(true);
      expect('enterprise' in row).toBe(true);
    }
  });

  it('KVKK row exists and all tiers have it', () => {
    const kvkk = FEATURE_MATRIX.find((r) => r.feature.includes('KVKK'));
    expect(kvkk).toBeDefined();
    expect(kvkk?.starter).toBeTruthy();
    expect(kvkk?.growth).toBeTruthy();
    expect(kvkk?.enterprise).toBeTruthy();
  });

  it('success fee row: only enterprise has it', () => {
    const fee = FEATURE_MATRIX.find((r) => r.feature.toLowerCase().includes('success fee'));
    expect(fee).toBeDefined();
    expect(fee?.starter).toBeFalsy();
    expect(fee?.growth).toBeFalsy();
    expect(fee?.enterprise).toBeTruthy();
  });
});

// ─── Quiz ─────────────────────────────────────────────────────────────────────

describe('QUIZ_QUESTIONS — shape', () => {
  it('has exactly 5 questions', () => {
    expect(QUIZ_QUESTIONS).toHaveLength(5);
  });

  it('each question has id, question string, and 3 options', () => {
    for (const q of QUIZ_QUESTIONS) {
      expect(q.id.trim().length).toBeGreaterThan(0);
      expect(q.question.trim().length).toBeGreaterThan(0);
      expect(q.options).toHaveLength(3);
    }
  });

  it('option scores are 1, 2, 3 for each question', () => {
    for (const q of QUIZ_QUESTIONS) {
      const scores = q.options.map((o) => o.score).sort();
      expect(scores).toEqual([1, 2, 3]);
    }
  });

  it('unique question ids', () => {
    const ids = QUIZ_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('scoreToTier — scoring algorithm', () => {
  it('score 5 (all Starter) → starter', () => {
    expect(scoreToTier(5)).toBe('starter');
  });

  it('score 8 (boundary high Starter) → starter', () => {
    expect(scoreToTier(8)).toBe('starter');
  });

  it('score 9 (boundary low Growth) → growth', () => {
    expect(scoreToTier(9)).toBe('growth');
  });

  it('score 12 (boundary high Growth) → growth', () => {
    expect(scoreToTier(12)).toBe('growth');
  });

  it('score 13 (boundary low Enterprise) → enterprise', () => {
    expect(scoreToTier(13)).toBe('enterprise');
  });

  it('score 15 (all Enterprise) → enterprise', () => {
    expect(scoreToTier(15)).toBe('enterprise');
  });
});

// ─── FAQ ─────────────────────────────────────────────────────────────────────

describe('PRICING_FAQS — shape', () => {
  it('has exactly 10 FAQ items', () => {
    expect(PRICING_FAQS).toHaveLength(10);
  });

  it('each FAQ has non-empty question and answer', () => {
    for (const faq of PRICING_FAQS) {
      expect(faq.question.trim().length, `empty question`).toBeGreaterThan(0);
      expect(faq.answer.trim().length, `empty answer`).toBeGreaterThan(20);
    }
  });

  it('no duplicate questions', () => {
    const qs = PRICING_FAQS.map((f) => f.question);
    expect(new Set(qs).size).toBe(qs.length);
  });
});

// ─── Brand voice ─────────────────────────────────────────────────────────────

describe('Brand voice — zero violations', () => {
  const allText = [
    ...PRICING_TIERS.flatMap((t) => [t.name, t.tagline, t.cta, ...t.features]),
    ...FEATURE_MATRIX.map((r) => r.feature),
    ...QUIZ_QUESTIONS.flatMap((q) => [q.question, ...q.options.map((o) => o.label)]),
    ...PRICING_FAQS.flatMap((f) => [f.question, f.answer]),
  ].join(' ');

  it('no Lead / Deal violations in data', () => {
    for (const re of [/\bLead\b/, /\bDeal\b/]) {
      expect(re.test(allText), `violation: ${re}`).toBe(false);
    }
  });

  it('Retainer word only in minTerm context (allowed in field)', () => {
    // "retainer" appears in minTerm fields and FAQ answers — that is intentional
    // brand-voice rule forbids using it as a SaaS synonym for "subscription"
    // We allow it in context but verify it's not used as a generic pricing term
    const tierText = PRICING_TIERS.flatMap((t) => [t.name, t.tagline, t.cta]).join(' ');
    expect(/\bRetainer\b/.test(tierText)).toBe(false);
  });
});
