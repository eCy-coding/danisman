/**
 * P44-T07 Round-5 — Insights / Perspektif Bootstrap Seed.
 *
 * Creates the 5 InsightCategory rows + 2 Authors that AdminInsightsCategoriesPage
 * + AdminInsightsMetadataPage + AdminInsightsPostsPage all expect. Without
 * these, the admin "Yeni Yazı" form's category and author dropdowns are
 * empty and authors cannot be selected when drafting a Perspektif post.
 *
 * Idempotent via slug unique constraints.
 *
 * Run: `npx tsx prisma/seed-insights-bootstrap.ts` or via master orchestrator.
 */
import { PrismaClient, Domain, CategoryStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CATEGORIES: Array<{
  slug: string;
  slugEn: string;
  nameTr: string;
  nameEn: string;
  descTr: string;
  descEn: string;
  domain: Domain;
  iconName: string;
  colorAccent: string;
  displayOrder: number;
}> = [
  {
    slug: 'm-a-danismanligi',
    slugEn: 'm-and-a-advisory',
    nameTr: 'M&A Danışmanlığı',
    nameEn: 'M&A Advisory',
    descTr:
      'Birleşme, satın alma, due diligence ve değerleme — Türkiye mid-market odaklı analizler.',
    descEn: 'Mergers, acquisitions, due diligence, valuation — Türkiye mid-market focus.',
    domain: 'M_A',
    iconName: 'TrendingUp',
    colorAccent: '#f59e0b',
    displayOrder: 1,
  },
  {
    slug: 'esg-stratejisi',
    slugEn: 'esg-strategy',
    nameTr: 'ESG Stratejisi',
    nameEn: 'ESG Strategy',
    descTr: 'CSRD / ESRS uyum, çift materyalite, karbon ayak izi ve sürdürülebilir finansman.',
    descEn: 'CSRD / ESRS readiness, double materiality, carbon footprint, sustainable finance.',
    domain: 'ESG',
    iconName: 'Leaf',
    colorAccent: '#22c55e',
    displayOrder: 2,
  },
  {
    slug: 'fintech-uyum',
    slugEn: 'fintech-compliance',
    nameTr: 'Fintech Uyum',
    nameEn: 'Fintech Compliance',
    descTr: 'SPK CASP, MASAK Travel Rule, KVKK, TCMB ödeme ve BDDK çerçeveleri.',
    descEn: 'SPK CASP, MASAK Travel Rule, KVKK, TCMB payments, BDDK frameworks.',
    domain: 'FINTECH',
    iconName: 'Landmark',
    colorAccent: '#3b82f6',
    displayOrder: 3,
  },
  {
    slug: 'aile-sirketi',
    slugEn: 'family-business',
    nameTr: 'Aile Şirketi',
    nameEn: 'Family Business',
    descTr: 'Halefiyet planlaması, Aile Anayasası, kuşak geçişi ve kurumsallaşma.',
    descEn:
      'Succession planning, Family Constitution, generational transition, institutionalisation.',
    domain: 'AILE_SIRKETI',
    iconName: 'Crown',
    colorAccent: '#a855f7',
    displayOrder: 4,
  },
];

const AUTHORS = [
  {
    slug: 'emre-can-yalcin',
    displayName: 'Emre Can Yalçın',
    bioTr:
      'eCyPro Premium Consulting kurucusu. M&A, ESG, Fintech regülasyonu ve aile şirketleri stratejisi alanlarında danışmanlık veriyor. Yazıları regülatör değişikliklerini operatör pratikleriyle birleştirir.',
    bioEn:
      'Founder of eCyPro Premium Consulting. Advises on M&A, ESG, fintech regulation and family-business strategy. Writing connects regulator change to operator practice.',
    avatarUrl: 'https://ecypro.com/images/authors/emre-can-yalcin.jpg',
    linkedinUrl: 'https://linkedin.com/in/emrecanyalcin',
    isFounder: true,
  },
  {
    slug: 'editorial-team',
    displayName: 'eCyPro Editorial Team',
    bioTr:
      "eCyPro Perspektif yayın ekibi. Sektör araştırması, mevzuat takibi ve içerik kalite kontrolünden sorumlu. Yazılar kurucu Emre Can Yalçın'ın gözetiminde yayınlanır.",
    bioEn:
      "eCyPro Perspektif editorial team. Sector research, regulatory tracking, content quality. Published under founder Emre Can Yalçın's oversight.",
    avatarUrl: 'https://ecypro.com/images/authors/editorial-team.jpg',
    isFounder: false,
  },
];

export async function seedInsightsBootstrap(): Promise<{
  categories: number;
  authors: number;
}> {
  for (const c of CATEGORIES) {
    await prisma.insightCategory.upsert({
      where: { slug: c.slug },
      create: { ...c, status: 'ACTIVE' as CategoryStatus },
      update: { ...c },
    });
  }
  for (const a of AUTHORS) {
    await prisma.author.upsert({
      where: { slug: a.slug },
      create: a,
      update: a,
    });
  }
  return { categories: CATEGORIES.length, authors: AUTHORS.length };
}
