/**
 * Contact email service — two emails per submission:
 *
 *   sendFounderNotification — alert to FOUNDER_EMAIL with full contact details.
 *   sendContactAck          — confirmation to the visitor ("48h reply" promise).
 *
 * Both are called via withOutboxRecord in the route so a Resend blip is
 * retried by the process-outbox cron instead of silently dropped.
 * Throws on Resend API error so the WAL row is correctly marked FAILED.
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
  <div style="margin-bottom:24px"><strong style="font-size:20px;color:#fff">eCyPro</strong></div>
  <h1 style="font-size:22px;color:#fff;margin:0 0 12px">Mesajınız bize ulaştı, ${escapeHtml(name)}</h1>
  <p style="line-height:1.6;color:#cbd5e1;margin:0 0 12px">Talebinizi aldık. 48 saat içinde Founder Emre Can Yalçın size dönüş yapacak.</p>
  <p style="line-height:1.6;color:#cbd5e1;margin:0 0 24px">Acil bir konu varsa <a href="https://wa.me/905417143000" style="color:#f59e0b">WhatsApp</a> üzerinden ulaşabilirsiniz.</p>
  <p style="font-size:12px;color:#64748b;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;margin:0">eCyPro Premium Consulting · İstanbul, Türkiye · KVKK m.5/2-f · SAT-07 (6 ay saklama)</p>
</div></body></html>`;
}

export interface FounderNotificationPayload {
  name: string;
  email: string;
  message: string;
  company?: string;
  phone?: string;
  subject?: string;
}

function founderNotificationHtml(p: FounderNotificationPayload): string {
  const row = (label: string, value: string) =>
    value
      ? `<tr><td style="padding:6px 12px;color:#94a3b8;font-size:13px;width:90px">${label}</td><td style="padding:6px 12px;color:#e2e8f0;font-size:13px">${escapeHtml(value)}</td></tr>`
      : '';
  return `<!DOCTYPE html><html lang="tr"><body style="font-family:Inter,system-ui,sans-serif;background:#050810;color:#e2e8f0;margin:0;padding:40px 20px">
<div style="max-width:600px;margin:0 auto;background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px">
  <div style="margin-bottom:20px;display:flex;align-items:center;gap:8px">
    <strong style="font-size:18px;color:#fff">eCyPro</strong>
    <span style="font-size:12px;color:#f59e0b;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:4px;padding:2px 8px">Yeni İletişim</span>
  </div>
  <table style="width:100%;border-collapse:collapse;background:rgba(255,255,255,0.03);border-radius:8px;overflow:hidden;margin-bottom:20px">
    ${row('Ad', p.name)}
    ${row('Email', p.email)}
    ${row('Firma', p.company ?? '')}
    ${row('Telefon', p.phone ?? '')}
    ${row('Konu', p.subject ?? '')}
  </table>
  <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:16px;margin-bottom:20px">
    <p style="font-size:12px;color:#94a3b8;margin:0 0 8px">Mesaj</p>
    <p style="line-height:1.7;color:#e2e8f0;margin:0;white-space:pre-wrap">${escapeHtml(p.message)}</p>
  </div>
  <p style="font-size:11px;color:#64748b;margin:0">Reply-to bu email'e yanıt verirsen ${escapeHtml(p.email)} adresine gider.</p>
</div></body></html>`;
}

/**
 * Send founder notification. No-op when Resend is unconfigured.
 * Throws on Resend API error so the outbox wrapper records FAILED.
 */
export async function sendFounderNotification(payload: FounderNotificationPayload): Promise<void> {
  const resend = getResend();
  if (!resend) {
    logger.warn('[contact-ack] RESEND_API_KEY missing — founder notification not sent');
    return;
  }
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: FOUNDER_EMAIL,
    replyTo: payload.email,
    subject: `Yeni iletişim: ${payload.name}`,
    html: founderNotificationHtml(payload),
  });
  if (error) throw new Error(error.message);
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
