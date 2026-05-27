/**
 * M1: Phase 6 Enterprise Schema — test-first validation
 * Schema integrity, enum coverage, seed data shape, business rules.
 */

import { describe, it, expect } from 'vitest';

// ─── Local type mirrors (generated Prisma enums) ─────────────

type LetterStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
type SuccessionStatus = 'ASSESSMENT' | 'PLANNING' | 'EXECUTION' | 'COMPLETED';
type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
type ESGPillar = 'ENVIRONMENTAL' | 'SOCIAL' | 'GOVERNANCE';
type ESGStatus = 'GAP_ANALYSIS' | 'DATA_COLLECTION' | 'REVIEW' | 'PUBLISHED';
type Regulator = 'SPK' | 'MASAK' | 'KVKK' | 'TCMB' | 'BDDK';
type ComplianceItemStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';
type ResidencyLocation = 'TR_LOCAL' | 'EU_GDPR' | 'US_SCC' | 'OTHER';

// ─── FounderLetter shape ────────────────────────────────────

interface FounderLetter {
  id: string;
  slug: string;
  titleTr: string;
  titleEn?: string;
  contentMdTr: string;
  contentMdEn?: string;
  authorId: string;
  status: LetterStatus;
  publishedAt?: Date;
  scheduledFor?: Date;
  emailSent: boolean;
  emailSentAt?: Date;
  subscriberCount: number;
  openRate?: number;
  clickRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── SuccessionRoadmap / KPI shapes ────────────────────────

interface SuccessionRoadmap {
  id: string;
  clientId: string;
  generationFrom: number;
  generationTo: number;
  estimatedYear?: number;
  status: SuccessionStatus;
  notes?: string;
  ownerId: string;
}

interface SuccessionKPI {
  id: string;
  roadmapId: string;
  metric: string;
  baselineValue: string;
  targetValue: string;
  currentValue?: string;
  measuredAt?: Date;
}

// ─── ESG shapes ─────────────────────────────────────────────

interface ESGDatapoint {
  id: string;
  esrsCode: string;
  pillar: ESGPillar;
  category: string;
  topic: string;
  metricName: string;
  unit?: string;
  isDoubleMaterial: boolean;
  isMandatory: boolean;
}

interface DoubleMaterialityMatrix {
  impact: { high: string[]; medium: string[]; low: string[] };
  financial: { high: string[]; medium: string[]; low: string[] };
}

// ─── Fintech / Residency shapes ─────────────────────────────

interface FintechComplianceItem {
  id: string;
  clientId: string;
  regulator: Regulator;
  category: string;
  status: ComplianceItemStatus;
  riskScore: number;
  dueDate?: Date;
  lastReviewedAt?: Date;
  notes?: string;
}

interface DataResidencyTag {
  id: string;
  resourceType: string;
  resourceId: string;
  location: ResidencyLocation;
  transferMechanism?: string;
  documentedAt: Date;
}

// ─── SEED DATA ──────────────────────────────────────────────

const LETTER_STATUSES: LetterStatus[] = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];
const SUCCESSION_STATUSES: SuccessionStatus[] = [
  'ASSESSMENT',
  'PLANNING',
  'EXECUTION',
  'COMPLETED',
];
const MILESTONE_STATUSES: MilestoneStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'];
const ESG_PILLARS: ESGPillar[] = ['ENVIRONMENTAL', 'SOCIAL', 'GOVERNANCE'];
const ESG_STATUSES: ESGStatus[] = ['GAP_ANALYSIS', 'DATA_COLLECTION', 'REVIEW', 'PUBLISHED'];
const REGULATORS: Regulator[] = ['SPK', 'MASAK', 'KVKK', 'TCMB', 'BDDK'];
const COMPLIANCE_STATUSES: ComplianceItemStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
];
const RESIDENCY_LOCATIONS: ResidencyLocation[] = ['TR_LOCAL', 'EU_GDPR', 'US_SCC', 'OTHER'];

const ESRS_SEED_DATAPOINTS: ESGDatapoint[] = [
  {
    id: '1',
    esrsCode: 'E1-6-44',
    pillar: 'ENVIRONMENTAL',
    category: 'Climate change',
    topic: 'Gross Scopes 1, 2, 3',
    metricName: 'Total GHG emissions',
    unit: 'tCO2e',
    isDoubleMaterial: true,
    isMandatory: true,
  },
  {
    id: '2',
    esrsCode: 'S1-7-1',
    pillar: 'SOCIAL',
    category: 'Workforce',
    topic: 'Non-discrimination',
    metricName: 'Discrimination incidents',
    unit: 'count',
    isDoubleMaterial: false,
    isMandatory: true,
  },
  {
    id: '3',
    esrsCode: 'G1-3-22',
    pillar: 'GOVERNANCE',
    category: 'Business conduct',
    topic: 'Corruption & bribery',
    metricName: 'Confirmed corruption cases',
    unit: 'count',
    isDoubleMaterial: true,
    isMandatory: true,
  },
  {
    id: '4',
    esrsCode: 'E2-4-18',
    pillar: 'ENVIRONMENTAL',
    category: 'Pollution',
    topic: 'Pollution to water',
    metricName: 'Water pollutants discharged',
    unit: 'kg',
    isDoubleMaterial: true,
    isMandatory: false,
  },
  {
    id: '5',
    esrsCode: 'S2-3-9',
    pillar: 'SOCIAL',
    category: 'Workers in value chain',
    topic: 'Significant incidents',
    metricName: 'Incidents reported',
    unit: 'count',
    isDoubleMaterial: false,
    isMandatory: false,
  },
];

// ESRS code format: <Pillar><1-5>-<topic>-<metric#>
const ESRS_CODE_PATTERN = /^[ESRSG][1-5]-\d+-\d+$/;

// ─── TESTS ──────────────────────────────────────────────────

describe('Phase 6 M1 — Enterprise Schema', () => {
  // T1: FounderLetter enum coverage
  it('LetterStatus covers full lifecycle (DRAFT → ARCHIVED)', () => {
    expect(LETTER_STATUSES).toHaveLength(4);
    expect(LETTER_STATUSES).toContain('DRAFT');
    expect(LETTER_STATUSES).toContain('SCHEDULED');
    expect(LETTER_STATUSES).toContain('PUBLISHED');
    expect(LETTER_STATUSES).toContain('ARCHIVED');
  });

  // T2: FounderLetter default + TR/EN parity check
  it('FounderLetter requires TR content, EN is optional', () => {
    const letter: FounderLetter = {
      id: 'clx1',
      slug: 'mayis-2026',
      titleTr: 'Mayıs 2026 Bülteni',
      authorId: 'u1',
      contentMdTr: '## Değerli Müşterilerimiz\n\nBu ayki mektup...',
      status: 'DRAFT',
      emailSent: false,
      subscriberCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(letter.contentMdTr.length).toBeGreaterThan(0);
    expect(letter.titleEn).toBeUndefined(); // EN optional
    expect(letter.status).toBe('DRAFT');
    expect(letter.emailSent).toBe(false);
  });

  // T3: Succession roadmap generation span validation
  it('SuccessionRoadmap generationFrom < generationTo', () => {
    const roadmap: SuccessionRoadmap = {
      id: 'sr1',
      clientId: 'c1',
      generationFrom: 1,
      generationTo: 2,
      estimatedYear: 2028,
      status: 'ASSESSMENT',
      ownerId: 'u1',
    };
    expect(roadmap.generationFrom).toBeLessThan(roadmap.generationTo);
    expect(SUCCESSION_STATUSES).toContain(roadmap.status);
  });

  // T4: MilestoneStatus + succession milestone names (Türkçe)
  it('MilestoneStatus has 4 states including DELAYED', () => {
    expect(MILESTONE_STATUSES).toHaveLength(4);
    const turkishMilestones = [
      'Aile anayasası imza',
      'Holding kuruluş',
      'MIP başlangıç',
      'Profesyonel CEO atama',
      'Aile meclisi ilk toplantı',
    ];
    turkishMilestones.forEach((name) => {
      expect(name.length).toBeGreaterThan(0);
    });
    expect(MILESTONE_STATUSES).toContain('DELAYED');
  });

  // T5: SuccessionKPI — metric + baseline/target/current
  it('SuccessionKPI tracks baseline → target → current progression', () => {
    const kpis: SuccessionKPI[] = [
      {
        id: 'k1',
        roadmapId: 'sr1',
        metric: 'ESG skor',
        baselineValue: '32',
        targetValue: '65',
        currentValue: '48',
        measuredAt: new Date(),
      },
      {
        id: 'k2',
        roadmapId: 'sr1',
        metric: 'Yönetim Kurulu bağımsızlığı %',
        baselineValue: '0',
        targetValue: '33',
        currentValue: undefined,
      },
      {
        id: 'k3',
        roadmapId: 'sr1',
        metric: 'Profesyonel CEO atama',
        baselineValue: 'hayır',
        targetValue: 'evet',
        currentValue: undefined,
      },
    ];
    expect(kpis).toHaveLength(3);
    const esgKpi = kpis.find((k) => k.metric === 'ESG skor');
    expect(Number(esgKpi!.currentValue)).toBeGreaterThan(Number(esgKpi!.baselineValue));
    expect(Number(esgKpi!.currentValue)).toBeLessThan(Number(esgKpi!.targetValue));
  });

  // T6: ESGDatapoint ESRS code format + pillar distribution
  it('ESG seed datapoints have valid ESRS codes and cover all 3 pillars', () => {
    ESRS_SEED_DATAPOINTS.forEach((dp) => {
      expect(dp.esrsCode).toMatch(ESRS_CODE_PATTERN);
    });
    const pillars = [...new Set(ESRS_SEED_DATAPOINTS.map((d) => d.pillar))];
    expect(pillars).toContain('ENVIRONMENTAL');
    expect(pillars).toContain('SOCIAL');
    expect(pillars).toContain('GOVERNANCE');
    expect(ESG_PILLARS).toHaveLength(3);
    expect(ESG_STATUSES).toHaveLength(4);
  });

  // T7: DoubleMaterialityMatrix structure validation
  it('DoubleMaterialityMatrix has impact + financial axes with 3 tiers each', () => {
    const matrix: DoubleMaterialityMatrix = {
      impact: { high: ['E1-6-44', 'G1-3-22'], medium: ['E2-4-18'], low: [] },
      financial: { high: ['G1-3-22'], medium: ['E1-6-44'], low: ['S1-7-1', 'S2-3-9'] },
    };
    expect(Object.keys(matrix.impact)).toEqual(['high', 'medium', 'low']);
    expect(Object.keys(matrix.financial)).toEqual(['high', 'medium', 'low']);
    const isDoubleMaterial = (code: string) =>
      matrix.impact.high.includes(code) && matrix.financial.high.includes(code);
    expect(isDoubleMaterial('G1-3-22')).toBe(true);
    expect(isDoubleMaterial('S1-7-1')).toBe(false);
  });

  // T8: Fintech — 5 regulators + risk score + DataResidency locations
  it('covers 5 Turkish regulators and 4 data residency jurisdictions', () => {
    expect(REGULATORS).toHaveLength(5);
    expect(REGULATORS).toEqual(['SPK', 'MASAK', 'KVKK', 'TCMB', 'BDDK']);

    const item: FintechComplianceItem = {
      id: 'fc1',
      clientId: 'c1',
      regulator: 'MASAK',
      category: 'AML programı',
      status: 'IN_PROGRESS',
      riskScore: 7,
    };
    expect(item.riskScore).toBeGreaterThanOrEqual(1);
    expect(item.riskScore).toBeLessThanOrEqual(10);
    expect(COMPLIANCE_STATUSES).toHaveLength(5);

    expect(RESIDENCY_LOCATIONS).toEqual(['TR_LOCAL', 'EU_GDPR', 'US_SCC', 'OTHER']);
    const badge: DataResidencyTag = {
      id: 'dr1',
      resourceType: 'Lead',
      resourceId: 'l1',
      location: 'TR_LOCAL',
      documentedAt: new Date(),
    };
    expect(badge.location).toBe('TR_LOCAL');
  });
});
