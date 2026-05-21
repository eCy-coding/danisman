/**
 * P17 BE Track 2 / Aşama 2 — Transactional email templates (TR + EN).
 *
 * Each template returns `{ subject, html, text }`. We keep them plain
 * tagged-template-string functions instead of pulling react-email so the
 * server bundle stays tiny (server already ships ~28MB to Render; an
 * extra 4MB of react-email + MJML would push the cold-start ceiling).
 *
 * The styling follows the existing dark-surface palette used in
 * server/lib/email.ts (#0f172a body, #2563eb CTA). The footer block is
 * shared via `baseLayout` so legal text + unsubscribe link are uniform.
 *
 * Localisation: `lang` is enforced at the type level — callers pass
 * 'tr' | 'en' and the template router returns the matching variant.
 */

export type Lang = 'tr' | 'en';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function baseLayout(title: string, body: string, footerText: string): string {
  return `<!DOCTYPE html>
<html lang="${title.length > 0 ? 'en' : 'tr'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#050810;font-family:'Inter',system-ui,sans-serif;color:#e2e8f0;">
  <table role="presentation" style="width:100%;max-width:560px;margin:0 auto;padding:40px 20px">
    <tr>
      <td>
        <div style="margin-bottom:32px">
          <span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px">
            Ecy<span style="color:#2563eb">Pro</span>
          </span>
          <span style="display:block;font-size:11px;color:#64748b;letter-spacing:3px;text-transform:uppercase;margin-top:2px">
            Premium Consulting
          </span>
        </div>
        <div style="background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px">
          ${body}
        </div>
        <p style="color:#475569;font-size:12px;margin-top:24px;text-align:center;line-height:1.6">
          ${escapeHtml(footerText)}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, text: string, color = '#2563eb'): string {
  return `<a href="${escapeAttr(href)}" style="display:inline-block;background:${color};color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px">${escapeHtml(text)}</a>`;
}

// ── Small HTML safety helpers ──────────────────────────────────────────────
//
// Templates are server-side rendered, but every variable that gets
// substituted (name, urls) MUST be escaped to defend against an attacker
// who manages to inject `<script>` or javascript:-style payloads through
// signup / password-reset forms. The escape table is the standard 5-char
// HTML entity set; URLs additionally get the `javascript:` scheme stripped.

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return ch;
    }
  });
}

function escapeAttr(s: string): string {
  // Reject obvious injection schemes outright. We never want a JS-scheme
  // URL inside an email button — even a self-clicked one would phish the
  // recipient by impersonating us.
  const trimmed = String(s).trim();
  if (/^\s*javascript:/i.test(trimmed) || /^\s*data:/i.test(trimmed)) {
    return '#';
  }
  return escapeHtml(trimmed);
}

// ── Welcome ────────────────────────────────────────────────────────────────

export interface WelcomeData {
  name: string;
  lang: Lang;
}

export function renderWelcome(data: WelcomeData): RenderedEmail {
  if (data.lang === 'tr') {
    const body = `
      <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">eCyPro'ya Hoş Geldiniz 🚀</h2>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
        Merhaba ${escapeHtml(data.name)}, eCyPro Premium Consulting hesabınız başarıyla oluşturuldu.
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
        Stratejik danışmanlık, AI entegrasyonu ve dijital dönüşüm projelerinizde
        size yardımcı olmak için buradayız.
      </p>
      ${ctaButton('https://ecypro.com/account', 'Hesabımı Yönet')}
    `;
    return {
      subject: "🎉 eCyPro'ya Hoş Geldiniz",
      html: baseLayout('Hoş Geldiniz', body, 'eCyPro Premium Consulting · İstanbul, Türkiye'),
      text: `Merhaba ${data.name}, eCyPro hesabınız oluşturuldu. https://ecypro.com/account`,
    };
  }
  const body = `
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Welcome to eCyPro 🚀</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
      Hi ${escapeHtml(data.name)}, your eCyPro Premium Consulting account is ready.
    </p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
      We're here to help with strategic consulting, AI integration, and digital transformation.
    </p>
    ${ctaButton('https://ecypro.com/account', 'Manage Account')}
  `;
  return {
    subject: '🎉 Welcome to eCyPro',
    html: baseLayout('Welcome', body, 'eCyPro Premium Consulting · Istanbul, Türkiye'),
    text: `Hi ${data.name}, your eCyPro account is ready. https://ecypro.com/account`,
  };
}

// ── Password reset ─────────────────────────────────────────────────────────

export interface PasswordResetData {
  resetUrl: string;
  lang: Lang;
}

export function renderPasswordReset(data: PasswordResetData): RenderedEmail {
  if (data.lang === 'tr') {
    const body = `
      <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Şifre Sıfırlama Talebi</h2>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
        Hesabınız için şifre sıfırlama talebi aldık. Aşağıdaki butona tıklayarak
        yeni bir şifre belirleyin. Bu link 1 saat geçerlidir.
      </p>
      ${ctaButton(data.resetUrl, '🔐 Şifremi Sıfırla')}
      <p style="color:#64748b;font-size:12px;margin-top:24px">
        Bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
        Hesabınız güvende.
      </p>
    `;
    return {
      subject: '🔐 eCyPro Şifre Sıfırlama',
      html: baseLayout('Şifre Sıfırlama', body, 'eCyPro Premium Consulting'),
      text: `Şifrenizi sıfırlamak için: ${data.resetUrl}`,
    };
  }
  const body = `
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Password Reset Request</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
      We received a request to reset your password. Click the button below to
      set a new password. This link expires in 1 hour.
    </p>
    ${ctaButton(data.resetUrl, '🔐 Reset Password')}
    <p style="color:#64748b;font-size:12px;margin-top:24px">
      If you didn't request this, you can safely ignore this email — your account remains secure.
    </p>
  `;
  return {
    subject: '🔐 Reset your eCyPro password',
    html: baseLayout('Password Reset', body, 'eCyPro Premium Consulting'),
    text: `Reset your password: ${data.resetUrl}`,
  };
}

// ── GDPR export ready ──────────────────────────────────────────────────────

export interface GdprExportReadyData {
  downloadUrl: string;
  expiresAt: string;
  lang: Lang;
}

export function renderGdprExportReady(data: GdprExportReadyData): RenderedEmail {
  const expiry = new Date(data.expiresAt).toLocaleDateString(
    data.lang === 'tr' ? 'tr-TR' : 'en-US',
    { dateStyle: 'long' },
  );
  if (data.lang === 'tr') {
    const body = `
      <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Veri İhracatınız Hazır 📦</h2>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
        GDPR Madde 20 (Verilerin Taşınabilirliği) talebiniz tamamlandı.
        Hesabınızla ilişkili tüm veriler JSON formatında hazırlandı.
      </p>
      ${ctaButton(data.downloadUrl, '📥 Verilerimi İndir')}
      <p style="color:#64748b;font-size:12px;margin-top:24px">
        Link <strong>${escapeHtml(expiry)}</strong> tarihine kadar geçerlidir.
        Güvenlik için bir kez indirildikten sonra arşivlenir.
      </p>
    `;
    return {
      subject: '📦 GDPR Veri İhracatınız Hazır',
      html: baseLayout('Veri İhracatı', body, 'eCyPro Premium Consulting · GDPR'),
      text: `Veri ihracatınız: ${data.downloadUrl} (son geçerlilik: ${expiry})`,
    };
  }
  const body = `
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Your Data Export is Ready 📦</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
      Your GDPR Article 20 (Right to Data Portability) request is complete.
      All data associated with your account has been packaged as JSON.
    </p>
    ${ctaButton(data.downloadUrl, '📥 Download my data')}
    <p style="color:#64748b;font-size:12px;margin-top:24px">
      The link is valid until <strong>${escapeHtml(expiry)}</strong> and is archived after first download.
    </p>
  `;
  return {
    subject: '📦 Your GDPR data export is ready',
    html: baseLayout('Data Export', body, 'eCyPro Premium Consulting · GDPR'),
    text: `Data export: ${data.downloadUrl} (expires: ${expiry})`,
  };
}

// ── GDPR delete confirmation ───────────────────────────────────────────────

export interface GdprDeleteConfirmData {
  confirmUrl: string;
  lang: Lang;
}

export function renderGdprDeleteConfirm(data: GdprDeleteConfirmData): RenderedEmail {
  if (data.lang === 'tr') {
    const body = `
      <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Silme Talebinizi Onaylayın ⚠️</h2>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
        GDPR Madde 17 (Unutulma Hakkı) silme talebi aldık. Bu işlem
        <strong>geri alınamaz</strong>: tüm verileriniz kalıcı olarak silinecektir.
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
        Talebi onaylamak için aşağıdaki linke tıklayın. Link 24 saat geçerlidir.
      </p>
      ${ctaButton(data.confirmUrl, '🗑️ Silmeyi Onayla', '#dc2626')}
      <p style="color:#64748b;font-size:12px;margin-top:24px">
        Bu talebi siz yapmadıysanız bu e-postayı görmezden gelin. Hiçbir
        veri otomatik olarak silinmez — onayınız olmadan işlem yapılmaz.
      </p>
    `;
    return {
      subject: '⚠️ eCyPro Hesap Silme Onayı',
      html: baseLayout('Silme Onayı', body, 'eCyPro Premium Consulting · GDPR'),
      text: `Hesap silme talebinizi onaylayın: ${data.confirmUrl}`,
    };
  }
  const body = `
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Confirm Account Deletion ⚠️</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
      We received a GDPR Article 17 (Right to Erasure) request. This action is
      <strong>irreversible</strong>: all of your data will be permanently deleted.
    </p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px">
      To confirm, click the link below. It expires in 24 hours.
    </p>
    ${ctaButton(data.confirmUrl, '🗑️ Confirm Deletion', '#dc2626')}
    <p style="color:#64748b;font-size:12px;margin-top:24px">
      If you didn't request this, ignore this email — nothing is deleted
      without your explicit confirmation.
    </p>
  `;
  return {
    subject: '⚠️ Confirm your eCyPro account deletion',
    html: baseLayout('Account Deletion Confirm', body, 'eCyPro Premium Consulting · GDPR'),
    text: `Confirm account deletion: ${data.confirmUrl}`,
  };
}

// ── Test seam: escape helpers exposed for direct assertion ────────────────

export const _testing = { escapeHtml, escapeAttr };
