import { prisma } from '../config/db';
import { calculateInvoice } from '../services/billing-calculator';

export interface BillingRunOptions {
  dryRun?: boolean;
}

export interface BillingRunResult {
  created: number;
  skipped: number;
  errors: number;
}

function buildInvoiceNumber(retainerId: string, now: Date): string {
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `ECYPRO-RET-${retainerId.slice(-6).toUpperCase()}-${ym}`;
}

export async function runMonthlyBilling(
  options: BillingRunOptions = {},
): Promise<BillingRunResult> {
  const { dryRun = false } = options;
  const now = new Date();
  let created = 0;
  let skipped = 0;
  let errors = 0;

  const allRetainers = await prisma.retainer.findMany();
  const activeRetainers = allRetainers.filter((r) => r.status === 'ACTIVE');

  for (const retainer of activeRetainers) {
    try {
      const subtotal = Number(retainer.monthlyAmount);
      const kdvRate = Number(retainer.kdvRate);
      const stopajRate = Number(retainer.stopajRate);
      const { kdv, stopaj, total } = calculateInvoice({ subtotal, kdvRate, stopajRate });

      const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);

      if (!dryRun) {
        const invoice = await prisma.invoice.create({
          data: {
            retainerId: retainer.id,
            invoiceNumber: buildInvoiceNumber(retainer.id, now),
            dueDate,
            subtotal,
            kdv,
            stopaj,
            total,
            currency: retainer.currency,
            status: 'DRAFT',
          },
        });

        await prisma.auditLog.create({
          data: {
            adminId: 'system:monthly-billing-cron',
            action: 'INVOICE_AUTO_CREATE',
            targetType: 'Invoice',
            targetId: invoice.id,
            newValue: {
              retainerId: retainer.id,
              total,
              currency: retainer.currency,
              billingMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
            } as never,
          },
        });

        created++;
      }
    } catch {
      errors++;
    }
  }

  skipped = allRetainers.length - activeRetainers.length;

  return { created, skipped, errors };
}

// Cron schedule: node-cron — 1st of each month at 06:00
// Registered in server/index.ts: cron.schedule('0 6 1 * *', () => runMonthlyBilling())
