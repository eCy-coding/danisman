/**
 * P44-T07 Round-5 — Succession Planning Demo Seed.
 *
 * Creates one anonymised family-business client ("Akdeniz Tekstil A.Ş.") and
 * a fully populated SuccessionRoadmap (gen 1→2, target 2028, status PLANNING)
 * with 4 milestones spanning the typical 24-month transition + 3 KPIs that
 * board-of-directors / family-council steering committees track in practice.
 *
 * Run: `npx tsx prisma/seed-succession.ts` or via master orchestrator.
 */
import { PrismaClient, SuccessionStatus, SuccessionMilestoneStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEMO_CLIENT_ID = 'demo-aile-akdeniz';
const DEMO_ROADMAP_ID = 'demo-roadmap-akdeniz-2028';
// Operator placeholder — replaces the missing User FK requirement on ownerId.
// In production this would be the lead consultant; for the demo we point at
// the admin user the seed bootstraps elsewhere (admin@ecypro.com).
const FALLBACK_OWNER_EMAIL = 'admin@ecypro.com';

const MILESTONES = [
  {
    id: 'demo-ms-1',
    name: 'Aile Anayasası — yetki + karar matrisi imzalandı',
    expectedDate: new Date('2026-09-15'),
    actualDate: null,
    status: 'IN_PROGRESS' as SuccessionMilestoneStatus,
  },
  {
    id: 'demo-ms-2',
    name: '2. kuşak çoğunluk pay devri (vergi etkin yapı)',
    expectedDate: new Date('2027-03-30'),
    actualDate: null,
    status: 'PENDING' as SuccessionMilestoneStatus,
  },
  {
    id: 'demo-ms-3',
    name: 'Aile Meclisi kuruluşu + İcra Komitesi ayrıştırma',
    expectedDate: new Date('2027-09-30'),
    actualDate: null,
    status: 'PENDING' as SuccessionMilestoneStatus,
  },
  {
    id: 'demo-ms-4',
    name: 'Dış denetimli KPI baseline + nirengi rapor',
    expectedDate: new Date('2028-06-30'),
    actualDate: null,
    status: 'PENDING' as SuccessionMilestoneStatus,
  },
];

const KPIS = [
  {
    id: 'demo-kpi-1',
    metric: 'EBITDA marjı (%)',
    baselineValue: '11.4',
    targetValue: '14.0',
    currentValue: '11.7',
    measuredAt: new Date('2026-05-31'),
  },
  {
    id: 'demo-kpi-2',
    metric: 'Aile-dışı üst düzey yönetici oranı (%)',
    baselineValue: '12',
    targetValue: '40',
    currentValue: '18',
    measuredAt: new Date('2026-05-31'),
  },
  {
    id: 'demo-kpi-3',
    metric: 'Yönetim Kurulu / Risk Komitesi yıllık toplantı sayısı',
    baselineValue: '2',
    targetValue: '8',
    currentValue: '4',
    measuredAt: new Date('2026-05-31'),
  },
];

export async function seedSuccession(): Promise<{ roadmapId: string }> {
  // Demo client
  await prisma.client.upsert({
    where: { id: DEMO_CLIENT_ID },
    create: {
      id: DEMO_CLIENT_ID,
      name: 'Akdeniz Tekstil A.Ş. (Demo)',
      contactEmail: 'yk-baskan@akdeniz-tekstil.example',
      sector: 'İmalat / Tekstil',
      isActive: true,
    },
    update: {},
  });

  // Resolve owner — fall back to admin seed if specific owner missing.
  const owner = await prisma.user.findFirst({ where: { email: FALLBACK_OWNER_EMAIL } });
  if (!owner) {
    throw new Error(
      `Succession seed requires the bootstrap admin (${FALLBACK_OWNER_EMAIL}) to exist. Run scripts/seed.ts first.`,
    );
  }

  // Roadmap with full nested milestones + KPIs.
  await prisma.successionRoadmap.upsert({
    where: { id: DEMO_ROADMAP_ID },
    create: {
      id: DEMO_ROADMAP_ID,
      clientId: DEMO_CLIENT_ID,
      generationFrom: 1,
      generationTo: 2,
      estimatedYear: 2028,
      status: 'PLANNING' as SuccessionStatus,
      notes:
        'Kurucu kuşaktan ikinci kuşağa yapısal devir. Vergi optimal yapı + Aile Anayasası + İcra/Sahiplik ayrıştırma. Risk: kuşak içi anlaşmazlık (4 kardeş).',
      ownerId: owner.id,
    },
    update: {},
  });

  // Wipe + re-seed children (clean state).
  await prisma.successionMilestone.deleteMany({ where: { roadmapId: DEMO_ROADMAP_ID } });
  await prisma.successionMilestone.createMany({
    data: MILESTONES.map((m) => ({ ...m, roadmapId: DEMO_ROADMAP_ID })),
  });
  await prisma.successionKPI.deleteMany({ where: { roadmapId: DEMO_ROADMAP_ID } });
  await prisma.successionKPI.createMany({
    data: KPIS.map((k) => ({ ...k, roadmapId: DEMO_ROADMAP_ID })),
  });
  return { roadmapId: DEMO_ROADMAP_ID };
}
