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

function baseLayout(title: string, body: string, footerText: string, lang: Lang = 'tr'): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
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
      html: baseLayout('Hoş Geldiniz', body, 'eCyPro Premium Consulting · İstanbul, Türkiye', 'tr'),
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
    html: baseLayout('Welcome', body, 'eCyPro Premium Consulting · Istanbul, Türkiye', 'en'),
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
      html: baseLayout('Şifre Sıfırlama', body, 'eCyPro Premium Consulting', 'tr'),
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
    html: baseLayout('Password Reset', body, 'eCyPro Premium Consulting', 'en'),
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
      html: baseLayout('Veri İhracatı', body, 'eCyPro Premium Consulting · GDPR', 'tr'),
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
    html: baseLayout('Data Export', body, 'eCyPro Premium Consulting · GDPR', 'en'),
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
      html: baseLayout('Silme Onayı', body, 'eCyPro Premium Consulting · GDPR', 'tr'),
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
    html: baseLayout('Account Deletion Confirm', body, 'eCyPro Premium Consulting · GDPR', 'en'),
    text: `Confirm account deletion: ${data.confirmUrl}`,
  };
}

// ── Founder letter (lead nurture) ──────────────────────────────────────────

export interface FounderLetterData {
  firstName: string;
  lang: Lang;
}

export function renderFounderLetter(data: FounderLetterData): RenderedEmail {
  const name = escapeHtml(data.firstName);
  if (data.lang === 'tr') {
    const body = `
      <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Sayın ${name},</h2>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 16px">
        eCyPro olarak, işletmenizin uyum, veri güvenliği ve dijital dönüşüm
        yolculuğunda yanınızda olmaktan memnuniyet duyuyoruz. Kişisel olarak
        sürecinizi takip edeceğimi bilmenizi isterim.
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
        Sorularınız için doğrudan bana ulaşabilirsiniz. İlk adımı birlikte
        atalım.
      </p>
      ${ctaButton('https://ecypro.com/tr/contact', 'Görüşme Planla')}
      <p style="color:#64748b;font-size:13px;margin-top:24px">
        Saygılarımla,<br/><strong style="color:#cbd5e1">eCyPro Kurucu Ekibi</strong>
      </p>
    `;
    return {
      subject: "eCyPro'ya Hoş Geldiniz",
      html: baseLayout(
        'Kurucu Mektubu',
        body,
        'eCyPro Premium Consulting · İstanbul, Türkiye',
        'tr',
      ),
      text: `Sayın ${data.firstName}, eCyPro olarak uyum ve dijital dönüşüm yolculuğunuzda yanınızdayız. https://ecypro.com/tr/contact`,
    };
  }
  const body = `
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Dear ${name},</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 16px">
      At eCyPro, we're glad to stand beside you on your compliance, data
      security, and digital transformation journey. I want you to know I'll
      be following your process personally.
    </p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
      Reach out to me directly with any questions. Let's take the first step
      together.
    </p>
    ${ctaButton('https://ecypro.com/en/contact', 'Schedule a Call')}
    <p style="color:#64748b;font-size:13px;margin-top:24px">
      Warm regards,<br/><strong style="color:#cbd5e1">The eCyPro Founding Team</strong>
    </p>
  `;
  return {
    subject: 'Welcome to eCyPro',
    html: baseLayout('Founder Letter', body, 'eCyPro Premium Consulting · Istanbul, Türkiye', 'en'),
    text: `Dear ${data.firstName}, at eCyPro we stand beside you on your compliance and digital transformation journey. https://ecypro.com/en/contact`,
  };
}

// ── Quick-Check autoresponder ──────────────────────────────────────────────

export interface QuickCheckResultData {
  company: string;
  lang: Lang;
}

export function renderQuickCheckResult(data: QuickCheckResultData): RenderedEmail {
  const company = escapeHtml(data.company);
  if (data.lang === 'tr') {
    const body = `
      <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">KVKK Hızlı Kontrol Sonuçlarınız 📊</h2>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
        <strong style="color:#cbd5e1">${company}</strong> için hazırladığımız
        KVKK Hızlı Kontrol sonuçlarınız ekteki PDF'tedir. Rapor, mevcut uyum
        seviyenizi ve öncelikli aksiyon alanlarınızı özetler.
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
        Detaylı bir değerlendirme için ücretsiz bir keşif görüşmesi
        planlayabilirsiniz.
      </p>
      ${ctaButton('https://ecypro.com/tr/contact', 'Keşif Görüşmesi Planla')}
    `;
    return {
      subject: 'KVKK Hızlı Kontrol Sonuçlarınız',
      html: baseLayout('KVKK Hızlı Kontrol', body, 'eCyPro Premium Consulting · KVKK', 'tr'),
      text: `${data.company} için KVKK Hızlı Kontrol sonuçlarınız ekteki PDF'tedir. Keşif görüşmesi: https://ecypro.com/tr/contact`,
    };
  }
  const body = `
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Your KVKK Quick Check Results 📊</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
      Your KVKK Quick Check results for <strong style="color:#cbd5e1">${company}</strong>
      are in the attached PDF. The report summarizes your current compliance
      posture and the highest-priority action areas.
    </p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
      For a deeper assessment, you can book a free discovery call.
    </p>
    ${ctaButton('https://ecypro.com/en/contact', 'Book a Discovery Call')}
  `;
  return {
    subject: 'Your KVKK Quick Check Results',
    html: baseLayout('KVKK Quick Check', body, 'eCyPro Premium Consulting · KVKK', 'en'),
    text: `Your KVKK Quick Check results for ${data.company} are in the attached PDF. Discovery call: https://ecypro.com/en/contact`,
  };
}

// ── Pricing inquiry acknowledgment ─────────────────────────────────────────

export interface PricingInquiryAckData {
  firstName: string;
  lang: Lang;
}

export function renderPricingInquiryAck(data: PricingInquiryAckData): RenderedEmail {
  const name = escapeHtml(data.firstName);
  if (data.lang === 'tr') {
    const body = `
      <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Talebiniz Alındı ✅</h2>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
        Merhaba ${name}, fiyatlandırma talebiniz başarıyla alındı.
        İhtiyaçlarınıza özelleştirilmiş bir teklifi <strong style="color:#cbd5e1">24 saat
        içinde</strong> sizinle paylaşacağız.
      </p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
        Bu süre zarfında hizmetlerimizi daha yakından inceleyebilirsiniz.
      </p>
      ${ctaButton('https://ecypro.com/tr/services', 'Hizmetleri İncele')}
    `;
    return {
      subject: 'Talebiniz Alındı — eCyPro',
      html: baseLayout('Teklif Talebi', body, 'eCyPro Premium Consulting', 'tr'),
      text: `Merhaba ${data.firstName}, talebiniz alındı. 24 saat içinde özelleştirilmiş teklif paylaşacağız. https://ecypro.com/tr/services`,
    };
  }
  const body = `
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Your Inquiry Has Been Received ✅</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
      Hi ${name}, your pricing inquiry has been received. We'll share a
      customized proposal tailored to your needs <strong style="color:#cbd5e1">within
      24 hours</strong>.
    </p>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
      In the meantime, feel free to explore our services in more detail.
    </p>
    ${ctaButton('https://ecypro.com/en/services', 'Explore Services')}
  `;
  return {
    subject: 'Your inquiry has been received — eCyPro',
    html: baseLayout('Pricing Inquiry', body, 'eCyPro Premium Consulting', 'en'),
    text: `Hi ${data.firstName}, your inquiry has been received. A customized proposal within 24 hours. https://ecypro.com/en/services`,
  };
}

// ── Discovery call confirmation ────────────────────────────────────────────

export interface DiscoveryConfirmedData {
  date: string;
  lang: Lang;
}

export function renderDiscoveryConfirmed(data: DiscoveryConfirmedData): RenderedEmail {
  const date = escapeHtml(data.date);
  if (data.lang === 'tr') {
    const body = `
      <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Discovery Call Onaylandı 🗓️</h2>
      <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
        <strong style="color:#cbd5e1">${date}</strong> tarihinde Discovery Call
        için randevunuz onaylandı. Görüşmeden önce ihtiyaçlarınızı not almanızı
        öneririz.
      </p>
      ${ctaButton('https://ecypro.com/tr/account', 'Randevumu Yönet')}
      <p style="color:#64748b;font-size:12px;margin-top:24px">
        Tarihi değiştirmeniz gerekirse hesabınızdan randevuyu güncelleyebilirsiniz.
      </p>
    `;
    return {
      subject: 'Discovery Call Onayı — eCyPro',
      html: baseLayout('Discovery Call Onayı', body, 'eCyPro Premium Consulting', 'tr'),
      text: `${data.date} tarihinde Discovery Call için randevunuz onaylandı. https://ecypro.com/tr/account`,
    };
  }
  const body = `
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">Discovery Call Confirmed 🗓️</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
      Your Discovery Call is confirmed for <strong style="color:#cbd5e1">${date}</strong>.
      We recommend jotting down your needs before the call.
    </p>
    ${ctaButton('https://ecypro.com/en/account', 'Manage My Booking')}
    <p style="color:#64748b;font-size:12px;margin-top:24px">
      If you need to reschedule, you can update the booking from your account.
    </p>
  `;
  return {
    subject: 'Discovery Call Confirmed — eCyPro',
    html: baseLayout('Discovery Call Confirmed', body, 'eCyPro Premium Consulting', 'en'),
    text: `Your Discovery Call is confirmed for ${data.date}. https://ecypro.com/en/account`,
  };
}

// ── Generic notification ───────────────────────────────────────────────────

export interface GenericNotifData {
  heading: string;
  message: string;
  ctaUrl?: string;
  ctaLabel?: string;
  lang: Lang;
}

export function renderGenericNotification(data: GenericNotifData): RenderedEmail {
  const heading = escapeHtml(data.heading);
  const message = escapeHtml(data.message);
  const cta = data.ctaUrl && data.ctaLabel ? ctaButton(data.ctaUrl, data.ctaLabel) : '';
  const footer =
    data.lang === 'tr'
      ? 'eCyPro Premium Consulting · İstanbul, Türkiye'
      : 'eCyPro Premium Consulting · Istanbul, Türkiye';
  const body = `
    <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px">${heading}</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">${message}</p>
    ${cta}
  `;
  return {
    subject: data.heading,
    html: baseLayout(data.heading, body, footer, data.lang),
    text: `${data.heading}\n\n${data.message}${data.ctaUrl ? `\n\n${data.ctaUrl}` : ''}`,
  };
}

// ── Test seam: escape helpers exposed for direct assertion ────────────────

export const _testing = { escapeHtml, escapeAttr };
