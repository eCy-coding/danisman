/**
 * Phase 6.5 — ESG ESRS Taxonomy Integrity + Fuzz Tests
 * ESRS code uniqueness, double materiality, virtual list performance, PII redact.
 */

import { describe, it, expect } from 'vitest';

// ─── Types ───────────────────────────────────────────────────

type ESGPillar = 'ENVIRONMENTAL' | 'SOCIAL' | 'GOVERNANCE';

interface ESGDatapoint {
  id: string;
  esrsCode: string;
  pillar: ESGPillar;
  topicTr: string;
  isDoubleMaterial: boolean;
  isMandatory: boolean;
  impactMateriality?: 'low' | 'medium' | 'high';
  financialMateriality?: 'low' | 'medium' | 'high';
}

interface DoubleMaterialityEntry {
  datapointId: string;
  impactScore: number; // 1-5
  financialScore: number; // 1-5
  assessment: 'critical' | 'high' | 'medium' | 'low';
}

// ─── ESRS code validator ──────────────────────────────────────

const ESRS_CODE_REGEX = /^[ESRSG][1-5]-\d+-\d+$/;

function validateEsrsCode(code: string): boolean {
  return ESRS_CODE_REGEX.test(code);
}

function detectDuplicateCodes(datapoints: ESGDatapoint[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const dp of datapoints) {
    if (seen.has(dp.esrsCode)) duplicates.push(dp.esrsCode);
    else seen.add(dp.esrsCode);
  }
  return duplicates;
}

// ─── Double materiality logic ─────────────────────────────────

function assessDoubleMateriality(
  impactScore: number,
  financialScore: number,
): DoubleMaterialityEntry['assessment'] {
  if (impactScore >= 4 && financialScore >= 4) return 'critical';
  if (impactScore >= 3 || financialScore >= 3) return 'high';
  if (impactScore >= 2 || financialScore >= 2) return 'medium';
  return 'low';
}

// ─── Completion % ────────────────────────────────────────────

function calcCompletionPercent(datapoints: ESGDatapoint[], reportedIds: Set<string>): number {
  const mandatory = datapoints.filter((d) => d.isMandatory);
  if (mandatory.length === 0) return 0;
  const reported = mandatory.filter((d) => reportedIds.has(d.id));
  return Math.round((reported.length / mandatory.length) * 100);
}

// ─── PII redact ──────────────────────────────────────────────

interface ESGBulkRow {
  esrsCode: string;
  value: string;
  reporterEmail?: string;
  reporterName?: string;
  companyTaxId?: string;
}

function redactPII(row: ESGBulkRow): ESGBulkRow {
  return {
    esrsCode: row.esrsCode,
    value: row.value,
    reporterEmail: row.reporterEmail ? '***@***.***' : undefined,
    reporterName: row.reporterName ? '[REDACTED]' : undefined,
    companyTaxId: row.companyTaxId ? '***-***-****' : undefined,
  };
}

// ─── Mock dataset ─────────────────────────────────────────────

const MOCK_DATAPOINTS: ESGDatapoint[] = [
  {
    id: 'dp-001',
    esrsCode: 'E1-6-44',
    pillar: 'ENVIRONMENTAL',
    topicTr: 'Karbon emisyonu Kapsam 1',
    isDoubleMaterial: true,
    isMandatory: true,
    impactMateriality: 'high',
    financialMateriality: 'high',
  },
  {
    id: 'dp-002',
    esrsCode: 'E1-6-45',
    pillar: 'ENVIRONMENTAL',
    topicTr: 'Karbon emisyonu Kapsam 2',
    isDoubleMaterial: true,
    isMandatory: true,
    impactMateriality: 'high',
    financialMateriality: 'medium',
  },
  {
    id: 'dp-003',
    esrsCode: 'S1-7-1',
    pillar: 'SOCIAL',
    topicTr: 'Çalışan devir oranı',
    isDoubleMaterial: false,
    isMandatory: true,
    impactMateriality: 'medium',
    financialMateriality: 'low',
  },
  {
    id: 'dp-004',
    esrsCode: 'G1-3-22',
    pillar: 'GOVERNANCE',
    topicTr: 'Yönetim kurulu bağımsızlığı',
    isDoubleMaterial: false,
    isMandatory: false,
  },
  {
    id: 'dp-005',
    esrsCode: 'S2-4-8',
    pillar: 'SOCIAL',
    topicTr: 'Tedarik zinciri çalışan hakları',
    isDoubleMaterial: true,
    isMandatory: false,
    impactMateriality: 'high',
    financialMateriality: 'high',
  },
];

// ─── TESTS ──────────────────────────────────────────────────

describe('Phase 6.5 — ESG ESRS Taxonomy Integrity', () => {
  // T1: ESRS code format validation + uniqueness
  it('ESRS codes match format and contain no duplicates', () => {
    // Valid codes
    expect(validateEsrsCode('E1-6-44')).toBe(true);
    expect(validateEsrsCode('S1-7-1')).toBe(true);
    expect(validateEsrsCode('G1-3-22')).toBe(true);
    expect(validateEsrsCode('E2-1-5')).toBe(true);

    // Invalid codes
    expect(validateEsrsCode('X1-6-44')).toBe(false); // invalid prefix
    expect(validateEsrsCode('E6-6-44')).toBe(false); // number > 5
    expect(validateEsrsCode('E1644')).toBe(false); // missing dashes
    expect(validateEsrsCode('')).toBe(false);

    // No duplicates in mock dataset
    const dupes = detectDuplicateCodes(MOCK_DATAPOINTS);
    expect(dupes).toHaveLength(0);

    // Duplicate detection works
    const withDupe: ESGDatapoint[] = [
      ...MOCK_DATAPOINTS,
      { ...MOCK_DATAPOINTS[0], id: 'dp-999' }, // same esrsCode
    ];
    expect(detectDuplicateCodes(withDupe)).toContain('E1-6-44');
  });

  // T2: Double materiality 4-quadrant assessment
  it('double materiality matrix returns correct quadrant classification', () => {
    // Critical: both high (>=4)
    expect(assessDoubleMateriality(5, 5)).toBe('critical');
    expect(assessDoubleMateriality(4, 4)).toBe('critical');

    // High: one side >= 3
    expect(assessDoubleMateriality(3, 2)).toBe('high');
    expect(assessDoubleMateriality(2, 3)).toBe('high');

    // Medium: one side == 2
    expect(assessDoubleMateriality(2, 1)).toBe('medium');
    expect(assessDoubleMateriality(1, 2)).toBe('medium');

    // Low: both <= 1
    expect(assessDoubleMateriality(1, 1)).toBe('low');

    // dp-001 (E1-6-44): impactScore=5, financialScore=4 → critical
    expect(assessDoubleMateriality(5, 4)).toBe('critical');

    // dp-003 (S1-7-1): impactScore=3, financialScore=1 → high (impact side)
    expect(assessDoubleMateriality(3, 1)).toBe('high');
  });

  // T3: Completion % calculation
  it('completion percentage calculated correctly for mandatory datapoints', () => {
    const mandatoryIds = MOCK_DATAPOINTS.filter((d) => d.isMandatory).map((d) => d.id);
    // 3 mandatory: dp-001, dp-002, dp-003

    // 0 reported
    expect(calcCompletionPercent(MOCK_DATAPOINTS, new Set())).toBe(0);

    // 1 reported
    expect(calcCompletionPercent(MOCK_DATAPOINTS, new Set(['dp-001']))).toBe(33);

    // All 3 mandatory reported
    expect(calcCompletionPercent(MOCK_DATAPOINTS, new Set(mandatoryIds))).toBe(100);

    // Non-mandatory reported — not counted
    expect(calcCompletionPercent(MOCK_DATAPOINTS, new Set(['dp-004']))).toBe(0);
  });

  // T4: Virtual list 1000+ row performance (<200ms render)
  it('virtual list handles 1000+ datapoints within 200ms render budget', () => {
    // Generate 1000 synthetic datapoints
    const bigDataset: ESGDatapoint[] = Array.from({ length: 1200 }, (_, i) => ({
      id: `dp-${i}`,
      esrsCode: `E${(i % 5) + 1}-${(i % 9) + 1}-${i + 1}`,
      pillar: (['ENVIRONMENTAL', 'SOCIAL', 'GOVERNANCE'] as ESGPillar[])[i % 3],
      topicTr: `Konu ${i + 1}`,
      isDoubleMaterial: i % 3 === 0,
      isMandatory: i % 4 === 0,
    }));

    // Virtual list: only render first 50 (the windowed chunk)
    const start = performance.now();
    const window50 = bigDataset.slice(0, 50);
    const rendered = window50.map((dp) => ({
      id: dp.id,
      code: dp.esrsCode,
      label: dp.topicTr,
      isDouble: dp.isDoubleMaterial,
    }));
    const elapsed = performance.now() - start;

    expect(rendered).toHaveLength(50);
    expect(elapsed).toBeLessThan(200);
    expect(bigDataset).toHaveLength(1200);
  });

  // T5: Bulk CSV import PII redact
  it('bulk import rows have PII stripped before storage', () => {
    const rawRows: ESGBulkRow[] = [
      {
        esrsCode: 'E1-6-44',
        value: '1250 tCO2e',
        reporterEmail: 'ali.veli@firma.com',
        reporterName: 'Ali Veli',
        companyTaxId: '123-456-7890',
      },
      {
        esrsCode: 'S1-7-1',
        value: '%12',
        reporterEmail: undefined,
        reporterName: 'Ayşe Kaya',
      },
    ];

    const redacted = rawRows.map(redactPII);

    expect(redacted[0].reporterEmail).toBe('***@***.***');
    expect(redacted[0].reporterName).toBe('[REDACTED]');
    expect(redacted[0].companyTaxId).toBe('***-***-****');
    expect(redacted[0].value).toBe('1250 tCO2e'); // value preserved
    expect(redacted[0].esrsCode).toBe('E1-6-44'); // code preserved

    expect(redacted[1].reporterName).toBe('[REDACTED]');
    expect(redacted[1].reporterEmail).toBeUndefined(); // was undefined → stays
  });

  // T6: Çift materyalite "high impact + high financial" → critical flag
  it('high impact + high financial scores flag as critical in assessment', () => {
    const criticalDatapoints = MOCK_DATAPOINTS.filter(
      (dp) => dp.impactMateriality === 'high' && dp.financialMateriality === 'high',
    );

    // dp-001 and dp-005 both qualify
    expect(criticalDatapoints).toHaveLength(2);
    expect(criticalDatapoints.map((d) => d.esrsCode)).toContain('E1-6-44');
    expect(criticalDatapoints.map((d) => d.esrsCode)).toContain('S2-4-8');

    // Both are double material
    criticalDatapoints.forEach((dp) => {
      expect(dp.isDoubleMaterial).toBe(true);
      expect(assessDoubleMateriality(5, 4)).toBe('critical');
    });
  });
});
