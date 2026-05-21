/**
 * P17 BE Track 2 / Aşama 2 — Mailer abstraction (Resend primary,
 * Telegram operator-fallback).
 *
 * Why a layer above `server/lib/email.ts`?
 *   - `email.ts` is the existing P37 booking-confirmation surface. It's
 *     well-tested but tightly coupled to booking templates.
 *   - The new transactional surfaces (welcome, password-reset, GDPR x2)
 *     need (a) TR + EN localisation, (b) a single typed entry point the
 *     email queue worker can call, (c) graceful degradation when
 *     RESEND_API_KEY is missing — without silently dropping the message.
 *
 * Strategy:
 *   1. Primary  → Resend HTTP API (server/lib/email.ts already uses it
 *                 successfully for bookings; we reuse the same client).
 *   2. Fallback → Telegram operator chat — the operator gets a heads-up
 *                 that an email could not be sent so they can manually
 *                 follow up. This is NOT a substitute for the user-facing
 *                 message; it's a fail-loud signal.
 *
 * Public API:
 *   - `sendTransactionalMail(payload: EmailJobPayload)` is the canonical
 *     entry point. The email queue worker calls it. Callers should
 *     prefer `enqueue('email', payload)` so retry + DLQ kick in.
 *   - Synchronous callers that absolutely cannot wait for the queue can
 *     call `sendTransactionalMail` directly — useful in tests.
 */

import { Resend } from 'resend';
import { logger } from '../config/logger';
import { notify } from './telegram';
import type { EmailJobPayload } from '../queues';
import {
  renderWelcome,
  renderPasswordReset,
  renderGdprExportReady,
  renderGdprDeleteConfirm,
  type RenderedEmail,
  type Lang,
} from '../emails/templates';

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? 'eCyPro <noreply@ecypro.com>';

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!RESEND_KEY) return null;
  if (!resendClient) resendClient = new Resend(RESEND_KEY);
  return resendClient;
}

// ── Template dispatcher ─────────────────────────────────────────────────────

function renderEmail(payload: EmailJobPayload): RenderedEmail | null {
  switch (payload.type) {
    case 'welcome':
      return renderWelcome({ name: payload.name, lang: normalizeLang(payload.lang) });
    case 'password-reset':
      return renderPasswordReset({
        resetUrl: payload.resetUrl,
        lang: normalizeLang(payload.lang),
      });
    case 'gdpr-export-ready':
      return renderGdprExportReady({
        downloadUrl: payload.downloadUrl,
        expiresAt: payload.expiresAt,
        lang: normalizeLang(payload.lang),
      });
    case 'gdpr-delete-confirm':
      return renderGdprDeleteConfirm({
        confirmUrl: payload.confirmUrl,
        lang: normalizeLang(payload.lang),
      });
    case 'transactional':
      return { subject: payload.subject, html: payload.html, text: payload.html };
    default: {
      const _exhaustive: never = payload;
      logger.error('[mailer] unknown email payload type', { payload: _exhaustive });
      return null;
    }
  }
}

function normalizeLang(lang: unknown): Lang {
  return lang === 'en' ? 'en' : 'tr';
}

// ── Public entry point ─────────────────────────────────────────────────────

export async function sendTransactionalMail(payload: EmailJobPayload): Promise<void> {
  const rendered = renderEmail(payload);
  if (!rendered) {
    throw new Error(`mailer: unknown payload type ${String((payload as { type?: string }).type)}`);
  }

  const client = getResend();
  if (!client) {
    // No Resend configured → operator-fallback via Telegram so a real
    // human can pick up the slack. We still log a high-severity warn so
    // alerting (Sentry / Logtail) treats it as a real failure mode.
    logger.warn('[mailer] RESEND_API_KEY missing — operator fallback', {
      to: payload.to,
      subject: rendered.subject,
    });
    await operatorFallback(payload.to, rendered);
    return;
  }

  try {
    const { error } = await client.emails.send({
      from: FROM,
      to: payload.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    if (error) {
      throw new Error(error.message);
    }
    logger.info('[mailer] sent', { to: payload.to, subject: rendered.subject });
  } catch (err) {
    logger.error('[mailer] Resend delivery failed — operator fallback', {
      to: payload.to,
      subject: rendered.subject,
      message: (err as Error).message,
    });
    await operatorFallback(payload.to, rendered);
    // Re-throw so BullMQ retry kicks in. The fallback is best-effort;
    // we still want the queue to retry the primary path.
    throw err;
  }
}

async function operatorFallback(to: string, rendered: RenderedEmail): Promise<void> {
  // Operator just needs a pointer to follow up manually. The structured
  // details map plays nicely with the existing `notify` formatter.
  const preview = rendered.text.slice(0, 200);
  await notify('warn', 'Email delivery fallback', {
    To: to,
    Subject: rendered.subject,
    Preview: preview,
  }).catch((err: Error) => {
    logger.warn('[mailer] operator-fallback Telegram failed', { message: err.message });
  });
}

// ── Convenience producers ──────────────────────────────────────────────────

/** Enqueue a welcome email; safe at signup. */
export async function queueWelcome(to: string, name: string, lang: Lang = 'tr'): Promise<void> {
  // Lazy-import to avoid the worker registry pulling Resend into hot paths
  // it never needs.
  const { enqueue } = await import('../queues');
  await enqueue('email', { type: 'welcome', to, name, lang });
}

/** Enqueue a password-reset email. */
export async function queuePasswordReset(
  to: string,
  resetUrl: string,
  lang: Lang = 'tr',
): Promise<void> {
  const { enqueue } = await import('../queues');
  await enqueue('email', { type: 'password-reset', to, resetUrl, lang });
}

/** Enqueue the GDPR export-ready notification. */
export async function queueGdprExportReady(
  to: string,
  downloadUrl: string,
  expiresAt: string,
  lang: Lang = 'tr',
): Promise<void> {
  const { enqueue } = await import('../queues');
  await enqueue('email', { type: 'gdpr-export-ready', to, downloadUrl, expiresAt, lang });
}

/** Enqueue a GDPR delete confirmation. */
export async function queueGdprDeleteConfirm(
  to: string,
  confirmUrl: string,
  lang: Lang = 'tr',
): Promise<void> {
  const { enqueue } = await import('../queues');
  await enqueue('email', { type: 'gdpr-delete-confirm', to, confirmUrl, lang });
}
