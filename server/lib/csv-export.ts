import { prisma } from '../config/db';

export interface ExportOptions {
  resource: 'deals' | 'retainers' | 'outreach';
  filters: Record<string, unknown>;
  maskPII: boolean;
  requestedBy: string;
}

export interface ExportResult {
  csv: string;
  rowCount: number;
}

function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '***@hidden';
  return `***@${email.slice(at + 1)}`;
}

function maskName(_name: string): string {
  return '*** ***';
}

function toCsvRow(obj: Record<string, unknown>): string {
  return Object.values(obj)
    .map((v) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(',');
}

async function fetchDeals(filters: Record<string, unknown>) {
  const where: Record<string, unknown> = {};
  if (filters.stage) where.stage = filters.stage;
  return prisma.deal.findMany({ where: where as never });
}

async function fetchRetainers(filters: Record<string, unknown>) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  return prisma.retainer.findMany({ where: where as never });
}

async function fetchOutreach(_filters: Record<string, unknown>) {
  return prisma.outreachWave.findMany({
    include: { prospects: true },
  });
}

export async function exportToCsv(options: ExportOptions): Promise<ExportResult> {
  const { resource, filters, maskPII, requestedBy } = options;

  let rows: Record<string, unknown>[] = [];
  let headers: string[] = [];

  if (resource === 'deals') {
    const data = await fetchDeals(filters);
    headers = ['id', 'name', 'stage', 'transactionValueUsd', 'successFeePct', 'ownerId'];
    rows = data.map((d) => ({
      id: d.id,
      name: d.name,
      stage: d.stage,
      transactionValueUsd: String(d.transactionValueUsd ?? ''),
      successFeePct: String(d.successFeePct),
      ownerId: d.ownerId,
    }));
  } else if (resource === 'retainers') {
    const data = await fetchRetainers(filters);
    headers = ['id', 'dealId', 'currency', 'monthlyAmount', 'status'];
    rows = data.map((r) => ({
      id: r.id,
      dealId: r.dealId,
      currency: r.currency,
      monthlyAmount: String(r.monthlyAmount),
      status: r.status,
    }));
  } else {
    // outreach — PII fields: contactName, contactEmail
    const waves = await fetchOutreach(filters);
    headers = [
      'waveId',
      'waveName',
      'prospectId',
      'companyName',
      'contactName',
      'contactEmail',
      'status',
    ];
    for (const wave of waves) {
      const prospects = (wave as unknown as Record<string, unknown[]>).prospects as Array<
        Record<string, unknown>
      >;
      if (!prospects) continue;
      for (const p of prospects) {
        rows.push({
          waveId: wave.id,
          waveName: wave.name,
          prospectId: p.id,
          companyName: p.companyName,
          contactName: maskPII
            ? maskName(String(p.contactName ?? ''))
            : String(p.contactName ?? ''),
          contactEmail: maskPII
            ? maskEmail(String(p.contactEmail ?? ''))
            : String(p.contactEmail ?? ''),
          status: p.status,
        });
      }
    }
  }

  const csvLines = [headers.join(','), ...rows.map(toCsvRow)];
  const csv = csvLines.join('\n');

  await prisma.auditLog.create({
    data: {
      adminId: requestedBy,
      action: 'CSV_EXPORT',
      targetType: resource,
      newValue: { resource, filters, maskPII, rowCount: rows.length } as never,
    },
  });

  return { csv, rowCount: rows.length };
}
