/**
 * Telegram Notification Service — @ecy_agent_crm_bot
 *
 * Sends operational alerts to a Telegram chat for:
 *   - Server startup / shutdown
 *   - New booking created
 *   - Booking cancelled / rescheduled
 *   - Critical errors (unhandled exceptions)
 *   - Deploy events (CI can POST to /api/admin/notify)
 *
 * ENV:
 *   TELEGRAM_BOT_TOKEN — bot token (required)
 *   TELEGRAM_CHAT_ID   — numeric chat/group ID (required for actual send)
 *
 * Setup:
 *   1. Message @ecy_agent_crm_bot with /start
 *   2. curl https://api.telegram.org/bot{TOKEN}/getUpdates
 *   3. Copy chat.id → TELEGRAM_CHAT_ID in .env.local
 *
 * If TELEGRAM_CHAT_ID is not set → logs warning, no-op (never throws).
 */

import { logger } from '../config/logger';
import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';
import { withRetry } from './retry';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

// P14-BE: a tripped circuit prevents a Telegram outage from blocking
// the rest of the request pipeline. 5 fails → 30s OPEN → 1 probe → recover.
const telegramBreaker = new CircuitBreaker({
  name: 'telegram.sendMessage',
  failureThreshold: 5,
  openMs: 30_000,
  callTimeoutMs: 6_000, // tiny safety cap above the per-call AbortSignal.timeout
});

export type TelegramLevel = 'info' | 'warn' | 'error' | 'success';

const EMOJI: Record<TelegramLevel, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '🚨',
  success: '✅',
};

function isConfigured(): boolean {
  return !!(BOT_TOKEN && CHAT_ID);
}

async function sendRaw(text: string): Promise<void> {
  if (!isConfigured()) return;

  // sendMessage is idempotent at our usage layer (we never rely on its
  // server-side ID), so wrapping it in retry is safe. We also gate it
  // behind a circuit breaker — if Telegram is fully down, fail-fast.
  try {
    await telegramBreaker.run(() =>
      withRetry({ name: 'telegram.sendMessage', maxAttempts: 3 }, async () => {
        const res = await fetch(`${API_BASE}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
          signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) {
          // 4xx → don't retry (caller error); 5xx → retry path via throw
          const body = await res.text();
          if (res.status >= 400 && res.status < 500) {
            logger.warn('[Telegram] Send rejected (4xx, no retry)', {
              status: res.status,
              body: body.slice(0, 120),
            });
            return;
          }
          throw new Error(`Telegram ${res.status}: ${body.slice(0, 120)}`);
        }
      }),
    );
  } catch (err) {
    if (err instanceof CircuitOpenError) {
      // Suppress — operator already knows Telegram is down from the trip log.
      return;
    }
    logger.warn('[Telegram] Network error after retries', { message: (err as Error).message });
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function notify(
  level: TelegramLevel,
  title: string,
  details?: Record<string, unknown>,
): Promise<void> {
  if (!isConfigured()) {
    logger.debug('[Telegram] TELEGRAM_CHAT_ID not set — notification skipped', { level, title });
    return;
  }

  const env = process.env.NODE_ENV ?? 'dev';
  const ts = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
  const emoji = EMOJI[level];

  let text = `${emoji} <b>[EcyPro ${env.toUpperCase()}]</b> ${escapeHtml(title)}\n<i>${ts}</i>`;

  if (details && Object.keys(details).length > 0) {
    const lines = Object.entries(details)
      .slice(0, 8)
      .map(([k, v]) => `  • <b>${escapeHtml(String(k))}</b>: ${escapeHtml(String(v))}`);
    text += '\n' + lines.join('\n');
  }

  await sendRaw(text);
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

export const tgInfo = (title: string, d?: Record<string, unknown>) => notify('info', title, d);
export const tgWarn = (title: string, d?: Record<string, unknown>) => notify('warn', title, d);
export const tgError = (title: string, d?: Record<string, unknown>) => notify('error', title, d);
export const tgSuccess = (title: string, d?: Record<string, unknown>) =>
  notify('success', title, d);

// ── Domain events ─────────────────────────────────────────────────────────────

export async function notifyNewBooking(data: {
  name: string;
  email: string;
  date: string;
  time: string;
  timezone: string;
}): Promise<void> {
  await notify('success', '📅 Yeni Görüşme Talebi', {
    Ad: data.name,
    Tarih: `${data.date} ${data.time}`,
    Timezone: data.timezone,
  });
}

export async function notifyCancellation(data: { name: string; date: string }): Promise<void> {
  await notify('warn', '❌ Görüşme İptal Edildi', {
    Kişi: data.name,
    Tarih: data.date,
  });
}

export async function notifyServerStart(port: number | string): Promise<void> {
  await notify('success', `🚀 Sunucu Başlatıldı :${port}`, {
    PID: process.pid,
    Node: process.version,
  });
}

export async function notifyCriticalError(err: Error, context?: string): Promise<void> {
  await notify('error', `FATAL: ${err.message.slice(0, 120)}`, {
    Context: context ?? 'unknown',
    Stack: err.stack?.split('\n')[1]?.trim() ?? '',
  });
}

// ── Ping / health check ───────────────────────────────────────────────────────

export async function pingBot(): Promise<{ ok: boolean; username?: string }> {
  if (!BOT_TOKEN) return { ok: false };
  try {
    const res = await fetch(`${API_BASE}/getMe`, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as { ok: boolean; result?: { username: string } };
    return { ok: data.ok, username: data.result?.username };
  } catch {
    return { ok: false };
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
