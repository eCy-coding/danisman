/**
 * Phase 6.5 — Fintech Trifecta Compass Data Integrity
 * 5 regulator enum, risk boundary, DST deadline, status flow, per-regulator categories.
 */

import { describe, it, expect } from 'vitest';

// ─── Types ───────────────────────────────────────────────────

type Regulator = 'SPK' | 'MASAK' | 'KVKK' | 'TCMB' | 'BDDK';
type ComplianceItemStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

interface FintechComplianceItem {
  id: string;
  regulator: Regulator;
  category: string;
  status: ComplianceItemStatus;
  riskScore: number;
  dueDate?: string;
}

// ─── Constants ────────────────────────────────────────────────

const ALL_REGULATORS: readonly Regulator[] = ['SPK', 'MASAK', 'KVKK', 'TCMB', 'BDDK'] as const;

const REGULATOR_CATEGORIES: Record<Regulator, string[]> = {
  SPK: ['CASP lisans başvurusu', 'Yatırım aracı tescil', 'Kripto varlık platformu'],
  MASAK: ['AML programı', 'STR bildirim sistemi', 'PEP tarama'],
  KVKK: ['VERBİS kayıt', 'KVKK politikası', 'Veri işleme sözleşmesi'],
  TCMB: ['Ödeme hizmetleri lisansı', 'Açık bankacılık API', 'Elektronik para lisansı'],
  BDDK: ['Dijital banka başvurusu', 'Sermaye yeterliliği', 'Likidite raporlaması'],
};

// ─── Status flow (one-directional, no reverse to APPROVED) ───

const STATUS_ORDER: ComplianceItemStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'APPROVED',
];

function isValidTransition(from: ComplianceItemStatus, to: ComplianceItemStatus): boolean {
  if (from === 'REJECTED') return to === 'NOT_STARTED'; // restart only
  if (to === 'REJECTED') return true; // any → REJECTED allowed
  const fromIdx = STATUS_ORDER.indexOf(from);
  const toIdx = STATUS_ORDER.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx === fromIdx + 1; // forward only
}

// ─── Risk score validation ─────────────────────────────────

function validateRiskScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 10;
}

// ─── Deadline with DST handling ──────────────────────────────

function daysUntil(dueDateStr: string, referenceDate: Date): number {
  const due = new Date(dueDateStr);
  return Math.ceil((due.getTime() - referenceDate.getTime()) / 86_400_000);
}

// ─── TESTS ──────────────────────────────────────────────────

describe('Phase 6.5 — Fintech Trifecta Compass Integrity', () => {
  // T1: 5 regulator enum exactly (SPK/MASAK/KVKK/TCMB/BDDK)
  it('exactly 5 regulators in fixed enum, no additions allowed', () => {
    expect(ALL_REGULATORS).toHaveLength(5);
    expect(ALL_REGULATORS).toContain('SPK');
    expect(ALL_REGULATORS).toContain('MASAK');
    expect(ALL_REGULATORS).toContain('KVKK');
    expect(ALL_REGULATORS).toContain('TCMB');
    expect(ALL_REGULATORS).toContain('BDDK');

    // All regulators have category lists
    ALL_REGULATORS.forEach((reg) => {
      expect(REGULATOR_CATEGORIES[reg]).toBeDefined();
      expect(REGULATOR_CATEGORIES[reg].length).toBeGreaterThan(0);
    });

    // Specific category assignments
    expect(REGULATOR_CATEGORIES.SPK).toContain('CASP lisans başvurusu');
    expect(REGULATOR_CATEGORIES.MASAK).toContain('AML programı');
    expect(REGULATOR_CATEGORIES.KVKK).toContain('VERBİS kayıt');
    expect(REGULATOR_CATEGORIES.TCMB).toContain('Açık bankacılık API');
    expect(REGULATOR_CATEGORIES.BDDK).toContain('Dijital banka başvurusu');
  });

  // T2: Risk score 1-10 boundary validation
  it('risk score boundary: valid 1-10, invalid outside range', () => {
    // Valid
    expect(validateRiskScore(1)).toBe(true);
    expect(validateRiskScore(5)).toBe(true);
    expect(validateRiskScore(10)).toBe(true);

    // Invalid
    expect(validateRiskScore(0)).toBe(false);
    expect(validateRiskScore(11)).toBe(false);
    expect(validateRiskScore(-1)).toBe(false);
    expect(validateRiskScore(5.5)).toBe(false); // float
    expect(validateRiskScore(NaN)).toBe(false);

    // All mock items should have valid scores
    const mockItems: FintechComplianceItem[] = [
      { id: '1', regulator: 'SPK', category: 'CASP lisans', status: 'IN_PROGRESS', riskScore: 8 },
      { id: '2', regulator: 'MASAK', category: 'AML', status: 'APPROVED', riskScore: 3 },
      {
        id: '3',
        regulator: 'BDDK',
        category: 'Dijital banka',
        status: 'NOT_STARTED',
        riskScore: 10,
      },
    ];
    mockItems.forEach((item) => {
      expect(validateRiskScore(item.riskScore)).toBe(true);
    });
  });

  // T3: Deadline countdown with DST + year-boundary edge cases
  it('deadline countdown handles DST transition and year boundary correctly', () => {
    // Normal case: 2026-07-15 from 2026-05-27 = 49 days
    const ref = new Date('2026-05-27T00:00:00.000Z');
    expect(daysUntil('2026-07-15', ref)).toBe(49);

    // Year boundary: Dec 31 → Jan 1
    const dec30 = new Date('2025-12-30T00:00:00.000Z');
    expect(daysUntil('2026-01-01', dec30)).toBe(2);

    // Same day = 0 days (< 1 day)
    const today = new Date('2026-06-01T00:00:00.000Z');
    expect(daysUntil('2026-06-01', today)).toBe(0);

    // Overdue = negative (Math.ceil(-1) = -1, Math.ceil(-2) = -2)
    const past = new Date('2026-07-01T00:00:00.000Z');
    expect(daysUntil('2026-06-30', past)).toBe(-1); // exactly 1 day overdue
    expect(daysUntil('2026-06-29', past)).toBeLessThan(0);

    // DST transition (March 2026 — Turkey doesn't observe DST, UTC stable)
    const beforeDST = new Date('2026-03-28T00:00:00.000Z');
    const days = daysUntil('2026-03-29', beforeDST);
    expect(days).toBe(1);
  });

  // T4: Status flow forward-only, reverse YASAK
  it('status flow: forward transitions valid, reverse blocked', () => {
    // Valid forward chain
    expect(isValidTransition('NOT_STARTED', 'IN_PROGRESS')).toBe(true);
    expect(isValidTransition('IN_PROGRESS', 'UNDER_REVIEW')).toBe(true);
    expect(isValidTransition('UNDER_REVIEW', 'APPROVED')).toBe(true);

    // Any → REJECTED allowed
    expect(isValidTransition('IN_PROGRESS', 'REJECTED')).toBe(true);
    expect(isValidTransition('NOT_STARTED', 'REJECTED')).toBe(true);

    // REJECTED → NOT_STARTED only (restart)
    expect(isValidTransition('REJECTED', 'NOT_STARTED')).toBe(true);
    expect(isValidTransition('REJECTED', 'IN_PROGRESS')).toBe(false);
    expect(isValidTransition('REJECTED', 'APPROVED')).toBe(false);

    // Reverse YASAK
    expect(isValidTransition('APPROVED', 'UNDER_REVIEW')).toBe(false);
    expect(isValidTransition('APPROVED', 'IN_PROGRESS')).toBe(false);
    expect(isValidTransition('UNDER_REVIEW', 'NOT_STARTED')).toBe(false);

    // Skip steps YASAK
    expect(isValidTransition('NOT_STARTED', 'APPROVED')).toBe(false);
    expect(isValidTransition('NOT_STARTED', 'UNDER_REVIEW')).toBe(false);
  });

  // T5: Per-regulator categories non-overlapping
  it('regulator categories are distinct and non-overlapping', () => {
    const allCategories = Object.values(REGULATOR_CATEGORIES).flat();
    const uniqueCategories = new Set(allCategories);

    // No duplicate categories across regulators
    expect(allCategories.length).toBe(uniqueCategories.size);

    // Total category count: 5 regulators × 3 categories = 15
    expect(allCategories).toHaveLength(15);

    // SPK has CASP (crypto-related)
    expect(REGULATOR_CATEGORIES.SPK.some((c) => c.includes('CASP'))).toBe(true);

    // MASAK has AML + STR (financial crime)
    expect(REGULATOR_CATEGORIES.MASAK.some((c) => c.includes('AML'))).toBe(true);
    expect(REGULATOR_CATEGORIES.MASAK.some((c) => c.includes('STR'))).toBe(true);

    // KVKK has VERBİS (data protection registry)
    expect(REGULATOR_CATEGORIES.KVKK.some((c) => c.includes('VERBİS'))).toBe(true);
  });
});
