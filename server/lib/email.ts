/**
 * P37-T02: Email Service — Resend.com
 *
 * Provides transactional email primitives for:
 *   - Booking confirmation (with ICS attachment)
 *   - Booking reminder (24h + 1h before)
 *   - Reschedule / cancellation confirmation
 *   - Email verification (Phase 35-T03 dependency)
 *
 * Architecture:
 *   - Resend client (100 emails/day free tier, 3K/month)
 *   - HTML templates inline (no @react-email dep — server-only, plain HTML)
 *   - Fails gracefully: if RESEND_API_KEY not set → log warn + return ok
 *
 * ENV: RESEND_API_KEY, EMAIL_FROM (default: "eCyPro <noreply@ecypro.com>")
 */

import { Resend } from 'resend';
import { logger } from '../config/logger';

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM ?? 'eCyPro <noreply@ecypro.com>';

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!RESEND_KEY) {
    logger.warn('[Email] RESEND_API_KEY not set — email sending disabled');
    return null;
  }
  if (!resendClient) resendClient = new Resend(RESEND_KEY);
  return resendClient;
}

// ─── Template helpers ──────────────────────────────────────────────────────

function baseLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#050810;font-family:'Inter',system-ui,sans-serif;color:#e2e8f0;">
  <table role="presentation" style="width:100%;max-width:560px;margin:0 auto;padding:40px 20px">
    <tr>
      <td>
        <!-- Logo -->
        <div style="margin-bottom:32px">
          <span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px">
            Ecy<span style="color:#2563eb">Pro</span>
          </span>
          <span style="display:block;font-size:11px;color:#64748b;letter-spacing:3px;text-transform:uppercase;margin-top:2px">
            Premium Consulting
          </span>
        </div>
        <!-- Body -->
        <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px">
          ${body}
        </div>
        <!-- Footer -->
        <p style="color:#475569;font-size:12px;margin-top:24px;text-align:center;line-height:1.6">
          eCyPro Premium Consulting · İstanbul, Türkiye<br/>
          Bu e-postayı almak istemiyorsanız <a href="https://ecypro.com/unsubscribe" style="color:#2563eb">aboneliğinizi iptal edin</a>.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, text: string, color = '#2563eb'): string {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px">${text}</a>`;
}

// ─── Email senders ──────────────────────────────────────────────────────────

export interface BookingEmailData {
  to: string;
  name: string;
  date: string;
  time: string;
  timezone: string;
  meetingUrl?: string;
  manageUrl: string;
  icsContent?: string;
}

export async function sendBookingConfirmation(data: BookingEmailData): Promise<boolean> {
  const client = getResend();
  if (!client) return true;

  const body = `
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Görüşmeniz Onaylandı ✅</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
      Merhaba ${data.name}, stratejik danışmanlık görüşmeniz başarıyla planlandı.
    </p>
    <div style="background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.2);border-radius:12px;padding:20px;margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span style="font-size:20px">📅</span>
        <div>
          <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0">Tarih &amp; Saat</p>
          <p style="color:#fff;font-weight:600;font-size:15px;margin:4px 0 0">${data.date} · ${data.time}</p>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:20px">🌍</span>
        <div>
          <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0">Saat Dilimi</p>
          <p style="color:#fff;font-weight:500;font-size:14px;margin:4px 0 0">${data.timezone}</p>
        </div>
      </div>
      ${
        data.meetingUrl
          ? `
      <div style="display:flex;align-items:center;gap:12px;margin-top:12px">
        <span style="font-size:20px">💻</span>
        <div>
          <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0">Görüşme Linki</p>
          <a href="${data.meetingUrl}" style="color:#60a5fa;font-size:14px;margin:4px 0 0;display:block">${data.meetingUrl}</a>
        </div>
      </div>`
          : ''
      }
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      ${data.meetingUrl ? ctaButton(data.meetingUrl, '🎯 Görüşmeye Katıl') : ''}
      ${ctaButton(data.manageUrl, '📝 Değiştir / İptal Et', '#1e293b')}
    </div>
  `;

  try {
    const payload: Parameters<Resend['emails']['send']>[0] = {
      from: FROM,
      to: data.to,
      subject: `✅ Görüşme Onayı — ${data.date} ${data.time}`,
      html: baseLayout('Görüşme Onayı', body),
    };

    if (data.icsContent) {
      payload.attachments = [
        {
          filename: 'meeting.ics',
          content: Buffer.from(data.icsContent).toString('base64'),
        },
      ];
    }

    const { error } = await client.emails.send(payload);
    if (error) throw new Error(error.message);
    logger.info('[Email] Booking confirmation sent', { to: data.to });
    return true;
  } catch (err) {
    logger.error('[Email] Confirmation send failed', { message: (err as Error).message });
    return false;
  }
}

export interface ReminderEmailData {
  to: string;
  name: string;
  date: string;
  time: string;
  timezone: string;
  manageUrl: string;
  meetingUrl?: string;
  hoursUntil: number;
}

export async function sendReminderEmail(data: ReminderEmailData): Promise<boolean> {
  const client = getResend();
  if (!client) return true;

  const urgency = data.hoursUntil <= 1 ? '⚡ 1 Saat Sonra' : '🔔 Yarın';
  const body = `
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">${urgency} — Görüşme Hatırlatıcısı</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
      Merhaba ${data.name}, eCyPro stratejik danışmanlık görüşmeniz yaklaşıyor.
    </p>
    <div style="background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.2);border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="color:#fff;font-weight:600;font-size:15px;margin:0">📅 ${data.date} · ${data.time}</p>
      <p style="color:#94a3b8;font-size:13px;margin:4px 0 0">🌍 ${data.timezone}</p>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      ${data.meetingUrl ? ctaButton(data.meetingUrl, '🎯 Görüşmeye Katıl') : ''}
      ${ctaButton(data.manageUrl, '📝 Değiştir / İptal Et', '#1e293b')}
    </div>
  `;

  try {
    const { error } = await client.emails.send({
      from: FROM,
      to: data.to,
      subject: `${urgency}: Görüşmeniz — ${data.date} ${data.time}`,
      html: baseLayout('Görüşme Hatırlatıcısı', body),
    });
    if (error) throw new Error(error.message);
    logger.info('[Email] Reminder sent', { to: data.to, hoursUntil: data.hoursUntil });
    return true;
  } catch (err) {
    logger.error('[Email] Reminder send failed', { message: (err as Error).message });
    return false;
  }
}

export async function sendCancellationEmail(
  to: string,
  name: string,
  date: string,
): Promise<boolean> {
  const client = getResend();
  if (!client) return true;

  const body = `
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Görüşmeniz İptal Edildi</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
      Merhaba ${name}, ${date} tarihindeki görüşmeniz iptal edilmiştir.
    </p>
    <p style="color:#94a3b8;font-size:14px">Yeni bir görüşme planlamak için:</p>
    ${ctaButton('https://ecypro.com/#contact', '🗓️ Yeni Görüşme Planla')}
  `;

  try {
    const { error } = await client.emails.send({
      from: FROM,
      to,
      subject: '❌ Görüşme İptal Edildi',
      html: baseLayout('Görüşme İptali', body),
    });
    if (error) throw new Error(error.message);
    return true;
  } catch (err) {
    logger.error('[Email] Cancellation email failed', { message: (err as Error).message });
    return false;
  }
}

// ─── P37-T10: NPS Feedback Request Email ─────────────────

/**
 * Sent 1h after meeting end.
 * feedbackUrl = https://ecypro.com/feedback/{bookingId}?token={hmac}
 * Single-page 0-10 NPS slider. Token single-use, 7d TTL.
 */
export async function sendFeedbackRequestEmail(
  to: string,
  name: string,
  meetingDate: string,
  feedbackUrl: string,
): Promise<boolean> {
  const client = getResend();
  if (!client) return true;

  const body = `
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Görüşmenizi Değerlendirin 🌟</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px">
      Merhaba ${name}, ${meetingDate} tarihindeki stratejik danışmanlık görüşmemizi tamamladık.
      Deneyiminizi 0-10 arasında değerlendirerek hizmetimizi geliştirmemize yardımcı olun.
    </p>
    <p style="color:#94a3b8;font-size:12px;margin:0 0 20px;font-style:italic">
      Sadece 30 saniye sürer. Yanıtınız anonim tutulabilir.
    </p>
    ${ctaButton(feedbackUrl, '⭐ Değerlendirmemi Yap')}
    <p style="color:#64748b;font-size:11px;margin-top:20px">
      Bu link 7 gün geçerlidir ve yalnızca bir kez kullanılabilir.
    </p>
  `;

  try {
    const { error } = await client.emails.send({
      from: FROM,
      to,
      subject: `⭐ ${meetingDate} Görüşmenizi Değerlendirin — eCyPro`,
      html: baseLayout('Görüşme Değerlendirmesi', body),
    });
    if (error) throw new Error(error.message);
    logger.info('[Email] Feedback request sent', { to });
    return true;
  } catch (err) {
    logger.error('[Email] Feedback email failed', { message: (err as Error).message });
    return false;
  }
}

export async function sendEmailVerification(to: string, verifyUrl: string): Promise<boolean> {
  const client = getResend();
  if (!client) return true;

  const body = `
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">E-posta Adresinizi Doğrulayın</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
      eCyPro hesabınızı etkinleştirmek için aşağıdaki butona tıklayın. Link 24 saat geçerlidir.
    </p>
    ${ctaButton(verifyUrl, '✅ E-postamı Doğrula')}
  `;

  try {
    const { error } = await client.emails.send({
      from: FROM,
      to,
      subject: '🔐 eCyPro — E-posta Doğrulama',
      html: baseLayout('E-posta Doğrulama', body),
    });
    if (error) throw new Error(error.message);
    return true;
  } catch (err) {
    logger.error('[Email] Verification email failed', { message: (err as Error).message });
    return false;
  }
}
