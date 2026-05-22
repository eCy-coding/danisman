/**
 * Contact autoresponder — the best-effort acknowledgement email the lead
 * receives after submitting the contact / booking form.
 *
 * Extracted from server/routes/contact.ts so it has a single home that BOTH
 * the intake route AND the outbox retry cron can call: the route wraps it in
 * `withOutboxRecord` (RESEND / sendAutoresponder); the cron replays it from the
 * persisted payload. Unlike the route's old inline `.catch()`, this THROWS on a
 * Resend API error so the WAL row is correctly marked FAILED.
 */

import { Resend } from 'resend';
import { logger } from '../config/logger';

const RESEND_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'eCyPro <noreply@ecypro.com>';
const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL ?? 'hello@ecypro.com';

let resendClient: Resend | null = null;
function getResend(): Resend | null {
  if (!RESEND_KEY) return null;
  if (!resendClient) resendClient = new Resend(RESEND_KEY);
  return resendClient;
}

/** True when RESEND_API_KEY is present. */
export function isResendConfigured(): boolean {
  return !!RESEND_KEY;
}

export type ContactAckKind = 'contact' | 'booking';

export interface ContactAckPayload {
  to: string;
  name: string;
  kind: ContactAckKind;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ackEmailHtml(name: string): string {
  return `<!DOCTYPE html><html lang="tr"><body style="font-family:Inter,system-ui,sans-serif;background:#050810;color:#e2e8f0;margin:0;padding:40px 20px">
<div style="max-width:560px;margin:0 auto;background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px">
  <div style="margin-bottom:24px"><strong style="font-size:20px;color:#fff">e<span style="color:#2563eb">Cy</span>Pro</strong></div>
  <h1 style="font-size:22px;color:#fff;margin:0 0 12px">Mesajınız bize ulaştı, ${escapeHtml(name)}</h1>
  <p style="line-height:1.6;color:#cbd5e1;margin:0 0 12px">Talebinizi aldık. Bir iş günü içinde sizinle dönüş yaparak Discovery Call için uygun zaman dilimini netleştireceğiz.</p>
  <p style="line-height:1.6;color:#cbd5e1;margin:0 0 24px">Acil bir konu varsa <a href="mailto:hello@ecypro.com" style="color:#38bdf8">hello@ecypro.com</a> adresine yazabilirsiniz.</p>
  <p style="font-size:12px;color:#64748b;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;margin:0">eCyPro Premium Consulting · İstanbul, Türkiye · KVKK m.5/2-f</p>
</div></body></html>`;
}

/**
 * Send the autoresponder. No-op when Resend is unconfigured (dev / CI).
 * Throws on a Resend API error so the outbox wrapper records FAILED.
 */
export async function sendContactAck(payload: ContactAckPayload): Promise<void> {
  const resend = getResend();
  if (!resend) {
    logger.warn('[contact-ack] RESEND_API_KEY missing — autoresponder not sent', {
      kind: payload.kind,
    });
    return;
  }

  const subject =
    payload.kind === 'booking'
      ? 'Rezervasyon talebiniz alındı — eCyPro'
      : 'Mesajınız bize ulaştı — eCyPro';

  // `replyTo` routes the lead's reply to the founder inbox so the conversation
  // continues out of the noreply mailbox.
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: payload.to,
    replyTo: FOUNDER_EMAIL,
    subject,
    html: ackEmailHtml(payload.name),
  });
  if (error) {
    throw new Error(error.message);
  }
}
