/**
 * Lead Pipeline Service — yeni ContactSubmission'ları otomatik işler
 *
 * Görev:
 *   1. Polling (her 30 sn) — yeni eklenen contact submissions tespit et
 *   2. Otomatik lead scoring + tier hesapla
 *   3. Tier A → Telegram bildirimi (HOT LEAD alert)
 *   4. SSE broadcast (admin dashboard live update için, yapılırsa)
 *
 * NOT: Postgres LISTEN/NOTIFY yerine polling tercih edildi (zero-config,
 * Prisma uyumlu, pgAdmin trigger gerektirmiyor). 30sn gecikme kabul edilebilir
 * (CRM Watcher daemon zaten 30sn polling yapıyor — ama o admin tokenı
 * gerektiriyor; bu service in-process olarak DB'den okuyor).
 *
 * Idempotent: lastSeenId tracking ile aynı satır 2x işlenmez.
 */
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { computeLeadScore, classifyLead, type InteractionRecord } from '../lib/lead-scoring';

const POLL_INTERVAL_MS = 30_000;

interface PipelineState {
  lastSeenAt: Date;
  totalProcessed: number;
  totalTierA: number;
  startedAt: Date;
  lastTickAt: Date | null;
}

const state: PipelineState = {
  lastSeenAt: new Date(),
  totalProcessed: 0,
  totalTierA: 0,
  startedAt: new Date(),
  lastTickAt: null,
};

let pollTimer: NodeJS.Timeout | null = null;
let stopping = false;

async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
  } catch (err) {
    logger.warn('[lead-pipeline] Telegram bildirim hatası', { err: (err as Error).message });
  }
}

async function processNew(): Promise<void> {
  state.lastTickAt = new Date();

  let newContacts: Array<{
    id: string;
    email: string;
    fullName: string;
    company: string | null;
    messageTr: string | null;
    messageEn: string | null;
    createdAt: Date;
  }>;

  try {
    newContacts = await prisma.contactSubmission.findMany({
      where: { createdAt: { gt: state.lastSeenAt } },
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: {
        id: true,
        email: true,
        fullName: true,
        company: true,
        messageTr: true,
        messageEn: true,
        createdAt: true,
      },
    });
  } catch (err) {
    logger.warn('[lead-pipeline] DB query failed', { err: (err as Error).message });
    return;
  }

  if (newContacts.length === 0) return;

  for (const contact of newContacts) {
    state.totalProcessed++;
    state.lastSeenAt = contact.createdAt;

    const interactions: InteractionRecord[] = [{ type: 'CONTACT_SUBMIT', count: 1 }];
    const result = computeLeadScore(interactions, contact.email, contact.createdAt);
    const tier = classifyLead(result.totalScore);

    logger.info('[lead-pipeline] new lead', {
      email: contact.email,
      tier: tier.tier,
      score: result.totalScore,
    });

    // Tier A → Telegram alert
    if (tier.tier === 'A') {
      state.totalTierA++;
      const message = (contact.messageTr ?? contact.messageEn ?? '').slice(0, 200);
      await notifyTelegram(
        [
          '🔥 *HOT LEAD — Tier A*',
          '',
          `*İsim:* ${contact.fullName}`,
          `*Email:* \`${contact.email}\``,
          contact.company ? `*Şirket:* ${contact.company}` : '',
          `*Skor:* ${result.totalScore} (${tier.label})`,
          '',
          `*Mesaj:* ${message}`,
          '',
          `_${contact.createdAt.toLocaleString('tr-TR')}_`,
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }
  }

  if (newContacts.length > 0) {
    logger.info('[lead-pipeline] batch processed', {
      count: newContacts.length,
      totalEver: state.totalProcessed,
    });
  }
}

async function tick(): Promise<void> {
  if (stopping) return;
  try {
    await processNew();
  } catch (err) {
    logger.error('[lead-pipeline] tick error', { err: (err as Error).message });
  }
  pollTimer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
}

/** Service'i başlat — server/index.ts'den çağrılmalı. */
export function startLeadPipeline(): void {
  if (pollTimer) {
    logger.warn('[lead-pipeline] zaten çalışıyor');
    return;
  }

  // Başlangıçta lastSeenAt = şu an (geçmiş leadler işlenmesin)
  state.lastSeenAt = new Date();
  state.startedAt = new Date();

  logger.info('[lead-pipeline] started', { pollIntervalMs: POLL_INTERVAL_MS });
  void tick();
}

/** Graceful shutdown */
export function stopLeadPipeline(): void {
  stopping = true;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  logger.info('[lead-pipeline] stopped', {
    totalProcessed: state.totalProcessed,
    totalTierA: state.totalTierA,
    runtimeMs: Date.now() - state.startedAt.getTime(),
  });
}

/** Service durumu — health endpoint için */
export function getLeadPipelineStatus(): {
  running: boolean;
  totalProcessed: number;
  totalTierA: number;
  startedAt: string;
  lastTickAt: string | null;
} {
  return {
    running: pollTimer !== null && !stopping,
    totalProcessed: state.totalProcessed,
    totalTierA: state.totalTierA,
    startedAt: state.startedAt.toISOString(),
    lastTickAt: state.lastTickAt?.toISOString() ?? null,
  };
}
