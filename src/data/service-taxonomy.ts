/**
 * SVC Taxonomy v2 — SINGLE SOURCE OF TRUTH for the Services vertical IA.
 *
 * Decision record: docs/adr/ADR-services-taxonomy-v2.md
 * Machine spec:    docs/reports/services-taxonomy-v2.json
 *
 * Two axes, one canonical URL per service:
 *   Axis 1 "Pillars"     → SERVICES_MEGA_MENU (browse; 9 items, 9 unique targets)
 *   Axis 2 "Departments" → SERVICE_DEPARTMENTS (filter chips + lifecycle clusters)
 *
 * MEGA_MENUS.services and DEPARTMENTS/SERVICES are projections of this file —
 * drift is impossible by construction + unit contract
 * (src/test/services-taxonomy-v2.test.ts).
 */

export interface Bilingual {
  tr: string;
  en: string;
}

export interface ServiceDepartment {
  id: 'ma' | 'esg' | 'fintech' | 'aile' | 'insan' | 'risk' | 'buyume';
  label: Bilingual;
  /** Uppercase short form rendered as a filter chip on /services. */
  chip: Bilingual;
  description: Bilingual;
  /** Ordered engagement workflow — index = lifecycle step (1-based). */
  lifecycle: string[];
}

export const SERVICE_DEPARTMENTS: ServiceDepartment[] = [
  {
    id: 'ma',
    label: { tr: 'M&A', en: 'M&A' },
    chip: { tr: 'M&A', en: 'M&A' },
    description: {
      tr: 'Birleşme ve satın alma yaşam döngüsü: değerlemeden entegrasyona',
      en: 'The M&A lifecycle: from valuation to integration',
    },
    lifecycle: [
      'company-valuation',
      'negotiation-loi',
      'due-diligence-suite',
      'deal-structuring',
      'post-merger-integration',
    ],
  },
  {
    id: 'esg',
    label: { tr: 'ESG', en: 'ESG' },
    chip: { tr: 'ESG', en: 'ESG' },
    description: {
      tr: 'Sürdürülebilirlik yolculuğu: stratejiden CSRD raporlamasına',
      en: 'The sustainability journey: from strategy to CSRD reporting',
    },
    lifecycle: [
      'esg-strategy',
      'double-materiality',
      'carbon-accounting',
      'esrs-roadmap',
      'csrd-compliance',
    ],
  },
  {
    id: 'fintech',
    label: { tr: 'Fintech', en: 'Fintech' },
    chip: { tr: 'FİNTECH', en: 'FINTECH' },
    description: {
      tr: 'Regülasyon ve lisans yolculuğu: veri uyumundan kripto varlıklara',
      en: 'The regulatory and licensing journey: from data compliance to crypto assets',
    },
    lifecycle: ['data-governance', 'masak-aml', 'spk-casp', 'open-banking', 'crypto-web3'],
  },
  {
    id: 'aile',
    label: { tr: 'Aile Şirketi', en: 'Family Business' },
    chip: { tr: 'AİLE ŞİRKETİ', en: 'FAMILY BUSINESS' },
    description: {
      tr: 'Nesiller arası süreklilik: anayasadan servet transferine',
      en: 'Continuity across generations: from constitution to wealth transfer',
    },
    lifecycle: [
      'family-business',
      'family-business-governance',
      'succession-planning',
      'conflict-resolution',
      'wealth-transfer',
      'family-office',
    ],
  },
  {
    id: 'insan',
    label: { tr: 'İnsan & Organizasyon', en: 'People & Organization' },
    chip: { tr: 'İNSAN & ORG.', en: 'PEOPLE & ORG.' },
    description: {
      tr: 'Yetenek, organizasyon tasarımı ve istihdam yolculuğu',
      en: 'The talent, organization design and employment journey',
    },
    lifecycle: ['hr-transformation', 'employer-branding', 'industrial-relations', 'payroll-audit'],
  },
  {
    id: 'risk',
    label: { tr: 'Risk & Kamu', en: 'Risk & Public Affairs' },
    chip: { tr: 'RİSK & KAMU', en: 'RISK & PUBLIC' },
    description: {
      tr: 'Makro riskten kriz yönetimine, regülasyondan kamu ilişkilerine',
      en: 'From macro risk to crisis management, regulation and public affairs',
    },
    lifecycle: [
      'macro-risk',
      'crisis-management',
      'competition-economics',
      'government-relations',
      'global-intelligence',
      'smart-cities',
    ],
  },
  {
    id: 'buyume',
    label: { tr: 'Büyüme & Operasyon', en: 'Growth & Operations' },
    chip: { tr: 'BÜYÜME & OPS.', en: 'GROWTH & OPS.' },
    description: {
      tr: 'Pazara giriş, teşvikler ve operasyonel mükemmellik yolculuğu',
      en: 'The market entry, incentives and operational excellence journey',
    },
    lifecycle: [
      'market-entry',
      'investment-incentives',
      'neuromarketing',
      'operational-excellence',
    ],
  },
];

/**
 * Menu umbrella pages — browse-axis targets that are NOT lifecycle steps.
 * Each has a full entry in src/data/service-content.ts.
 */
export const PILLAR_PAGES = [
  'strategic-transformation',
  'mergers-acquisitions',
  'ai-analytics',
  'digital-strategy',
  // Merge 2026-06-12 (fix/project-gaps gate işi): Phase-2 intent-rich sayfalar —
  // service-content.ts'de tam içerikleri var; registry dışı kalsalar 404'e düşerlerdi.
  'organizational-design',
  'cloud-platform-modernization',
  'revenue-growth-strategy',
  'cost-optimization',
  'digital-operations',
] as const;

export const CANONICAL_SERVICE_SLUGS: string[] = [
  ...SERVICE_DEPARTMENTS.flatMap((d) => d.lifecycle),
  ...PILLAR_PAGES,
];

const CANONICAL_SET = new Set(CANONICAL_SERVICE_SLUGS);

/** Resolver contract: a /services/:slug URL renders iff this returns true. */
export function isCanonicalServiceSlug(slug: string): boolean {
  return CANONICAL_SET.has(slug);
}

export interface LifecyclePosition {
  departmentId: ServiceDepartment['id'];
  department: ServiceDepartment;
  /** 1-based step inside the department workflow. */
  step: number;
  total: number;
}

export function getLifecyclePosition(slug: string): LifecyclePosition | undefined {
  for (const department of SERVICE_DEPARTMENTS) {
    const idx = department.lifecycle.indexOf(slug);
    if (idx !== -1) {
      return {
        departmentId: department.id,
        department,
        step: idx + 1,
        total: department.lifecycle.length,
      };
    }
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Axis 1 projection — mega menu (consumed by MEGA_MENUS.services in
// src/data/copy/common.ts and rendered by MegaMenu.tsx + mobile nav).
// 9 items → 9 unique, content-true targets (ADR: zero dead links, zero dupes).
// ─────────────────────────────────────────────────────────────────────────────

export interface MegaMenuItem {
  id: string;
  label: Bilingual;
  description: Bilingual;
  href: string;
  iconName: string;
}

export interface ServicesMegaMenu {
  sections: { id: string; title: Bilingual; items: MegaMenuItem[] }[];
  featured: {
    tag: Bilingual;
    title: Bilingual;
    description: Bilingual;
    href: string;
    cta: Bilingual;
    gradient: string;
  };
}

export const SERVICES_MEGA_MENU: ServicesMegaMenu = {
  sections: [
    {
      id: 'strategy',
      title: { tr: 'Strateji', en: 'Strategy' },
      items: [
        {
          id: 'corporate-strategy',
          label: { tr: 'Kurumsal Strateji', en: 'Corporate Strategy' },
          description: {
            tr: 'Uzun vadeli rekabet avantajı ve büyüme yol haritası',
            en: 'Long-term competitive advantage and growth roadmap',
          },
          href: '/services/strategic-transformation',
          iconName: 'Target',
        },
        {
          id: 'ma-advisory',
          label: { tr: 'M&A Danışmanlığı', en: 'M&A Advisory' },
          description: {
            tr: 'Birleşme, satın alma ve entegrasyon süreçleri',
            en: 'Mergers, acquisitions and integration processes',
          },
          href: '/services/mergers-acquisitions',
          iconName: 'Handshake',
        },
        {
          id: 'org-design',
          label: { tr: 'Organizasyonel Tasarım', en: 'Org Design' },
          description: {
            tr: 'Yetenek, performans ve çevik organizasyon yapıları',
            en: 'Talent, performance and agile organization structures',
          },
          href: '/services/hr-transformation',
          iconName: 'Network',
        },
      ],
    },
    {
      id: 'technology',
      title: { tr: 'Teknoloji', en: 'Technology' },
      items: [
        {
          id: 'ai-data',
          label: { tr: 'Yapay Zeka & Veri', en: 'AI & Data Strategy' },
          description: {
            tr: 'AI olgunluk değerlendirmesi ve uygulama yol haritası',
            en: 'AI maturity assessment and implementation roadmap',
          },
          href: '/services/ai-analytics',
          iconName: 'Brain',
        },
        {
          id: 'digital-transformation',
          label: { tr: 'Dijital Dönüşüm', en: 'Digital Transformation' },
          description: {
            tr: 'Uçtan uca dijitalleşme ve platform modernizasyonu',
            en: 'End-to-end digitization and platform modernization',
          },
          href: '/services/digital-strategy',
          iconName: 'Zap',
        },
        {
          id: 'data-governance',
          label: { tr: 'Veri Yönetişimi & Uyum', en: 'Data Governance & Compliance' },
          description: {
            tr: 'KVKK/GDPR uyumu ve veri yönetişimi çerçeveleri',
            en: 'KVKK/GDPR compliance and data governance frameworks',
          },
          href: '/services/data-governance',
          iconName: 'Database',
        },
      ],
    },
    {
      id: 'performance',
      title: { tr: 'Performans', en: 'Performance' },
      items: [
        {
          id: 'revenue-growth',
          label: { tr: 'Gelir Büyümesi', en: 'Revenue Growth' },
          description: {
            tr: 'Uluslararası pazara giriş ve yeni gelir akışları',
            en: 'International market entry and new revenue streams',
          },
          href: '/services/market-entry',
          iconName: 'TrendingUp',
        },
        {
          id: 'cost-transformation',
          label: { tr: 'Maliyet Dönüşümü', en: 'Cost Transformation' },
          description: {
            tr: 'Yalın operasyon, Altı Sigma ve tedarik zinciri optimizasyonu',
            en: 'Lean operations, Six Sigma and supply chain optimization',
          },
          href: '/services/operational-excellence',
          iconName: 'BarChart3',
        },
        {
          id: 'incentives-grants',
          label: { tr: 'Teşvik & Hibe Yönetimi', en: 'Incentives & Grants' },
          description: {
            tr: 'Devlet destekleri, Ar-Ge hibeleri ve teşvik optimizasyonu',
            en: 'State incentives, R&D grants and incentive optimization',
          },
          href: '/services/investment-incentives',
          iconName: 'BadgePercent',
        },
      ],
    },
  ],
  featured: {
    tag: { tr: 'Ücretsiz Değerlendirme', en: 'Free Assessment' },
    title: { tr: 'AI Olgunluk Analizi', en: 'AI Maturity Analysis' },
    description: {
      tr: 'Organizasyonunuzun yapay zeka hazırlığını 15 dakikada ölçün. Kişiselleştirilmiş yol haritanızı alın.',
      en: "Measure your organization's AI readiness in 15 minutes. Get your personalized roadmap.",
    },
    href: '/maturity-assessment',
    cta: { tr: 'Analizi Başlat', en: 'Start Analysis' },
    gradient: 'from-primary/20 to-secondary/10',
  },
};
