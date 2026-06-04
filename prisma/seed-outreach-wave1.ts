/**
 * P44-T07 Round-5 — Outreach Wave-1 Sales Pipeline Seed.
 *
 * Source: memory reference `reference_ecypro_sales_pipeline.md` — 5 Türkiye
 * mid-market hedef şirketi (Eker / Midas / Astor / ODE / İpliksan) with
 * realistic outreach-status mix. Wave is LIVE so the admin /admin/outreach
 * page renders a "current pipeline" rather than empty + completed history.
 *
 * Run: `npx tsx prisma/seed-outreach-wave1.ts` or via master orchestrator.
 */
import { PrismaClient, WaveStatus, ProspectStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const WAVE_ID = 'wave-q2-2026-tr-midmarket';

interface Prospect {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactRole: string;
  status: ProspectStatus;
  estimatedValueUsd: number;
  sentAt?: Date;
  openedAt?: Date | null;
  repliedAt?: Date | null;
}

const PROSPECTS: Prospect[] = [
  {
    companyName: 'Eker Süt Ürünleri A.Ş.',
    contactName: 'Murat Eker',
    contactEmail: 'm.eker@eker.example',
    contactRole: 'CFO',
    status: 'MEETING',
    estimatedValueUsd: 24000,
    sentAt: new Date('2026-05-05T10:00:00Z'),
    openedAt: new Date('2026-05-05T13:24:00Z'),
    repliedAt: new Date('2026-05-08T09:11:00Z'),
  },
  {
    companyName: 'Midas Yatırım Menkul Değerler',
    contactName: 'Beste Karakaya',
    contactEmail: 'b.karakaya@midas.example',
    contactRole: 'Head of Compliance',
    status: 'REPLIED',
    estimatedValueUsd: 31000,
    sentAt: new Date('2026-05-10T11:00:00Z'),
    openedAt: new Date('2026-05-10T11:43:00Z'),
    repliedAt: new Date('2026-05-12T15:02:00Z'),
  },
  {
    companyName: 'Astor Enerji A.Ş.',
    contactName: 'Cem Aksoy',
    contactEmail: 'c.aksoy@astor.example',
    contactRole: 'M&A Director',
    status: 'OPENED',
    estimatedValueUsd: 18000,
    sentAt: new Date('2026-05-15T09:30:00Z'),
    openedAt: new Date('2026-05-15T16:05:00Z'),
    repliedAt: null,
  },
  {
    companyName: 'ODE Yalıtım Sanayi A.Ş.',
    contactName: 'Selçuk Önder',
    contactEmail: 's.onder@ode.example',
    contactRole: 'CEO',
    status: 'SENT',
    estimatedValueUsd: 14000,
    sentAt: new Date('2026-05-22T08:45:00Z'),
    openedAt: null,
    repliedAt: null,
  },
  {
    companyName: 'İpliksan Tekstil A.Ş.',
    contactName: 'Nurşen Çakır',
    contactEmail: 'n.cakir@ipliksan.example',
    contactRole: 'CFO',
    status: 'OPENED',
    estimatedValueUsd: 10000,
    sentAt: new Date('2026-05-28T10:15:00Z'),
    openedAt: new Date('2026-05-28T18:32:00Z'),
    repliedAt: null,
  },
];

export async function seedOutreachWave1(): Promise<{
  waveId: string;
  prospects: number;
  estimatedTotal: number;
}> {
  await prisma.outreachWave.upsert({
    where: { id: WAVE_ID },
    create: {
      id: WAVE_ID,
      name: 'Q2 2026 — Türkiye Mid-Market Wave',
      status: 'LIVE' as WaveStatus,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-07-31'),
      // Aggregate target across the wave: $97K (memory reference).
      targetRevenueUsd: 97000,
      realizedRevenueUsd: 0,
    },
    update: {
      status: 'LIVE' as WaveStatus,
      targetRevenueUsd: 97000,
    },
  });

  // Clean + re-seed prospects so a re-run reflects the current Wave-1 spec.
  await prisma.outreachProspect.deleteMany({ where: { waveId: WAVE_ID } });
  await prisma.outreachProspect.createMany({
    data: PROSPECTS.map((p) => ({ ...p, waveId: WAVE_ID })),
  });

  const total = PROSPECTS.reduce((sum, p) => sum + p.estimatedValueUsd, 0);
  return { waveId: WAVE_ID, prospects: PROSPECTS.length, estimatedTotal: total };
}
