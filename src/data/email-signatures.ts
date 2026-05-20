/**
 * P53.D3 — Email signature templates (HTML + plain text, TR + EN).
 *
 * Use cases:
 *   - Gmail / Outlook personal signature paste
 *   - Customer Service templates
 *   - Newsletter / Drip campaign footer
 *
 * Signature variants:
 *   - founder: Emre Can Yalçın, Founder & Chief Strategist
 *   - support: Customer Service (generic)
 *   - team: Future team member fallback template
 */

const SITE = 'https://www.ecypro.com';
const FOUNDER_LINKEDIN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FOUNDER_LINKEDIN)
  ? String(import.meta.env.VITE_FOUNDER_LINKEDIN).trim()
  : 'https://www.linkedin.com/in/emre-can-yalcin/';

export interface EmailSignature {
  html: string;
  text: string;
}

export const SIGNATURES: Record<'founder' | 'support', { tr: EmailSignature; en: EmailSignature }> = {
  founder: {
    tr: {
      html: `
<table style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #0F172A;" cellspacing="0" cellpadding="0">
  <tr>
    <td style="padding-right: 16px; vertical-align: top;">
      <img src="${SITE}/brand/icon-mark.svg" alt="eCyPro" width="56" height="56" style="display: block;" />
    </td>
    <td style="vertical-align: top;">
      <div style="font-size: 15px; font-weight: 700; color: #0F172A;">Emre Can Yalçın</div>
      <div style="font-size: 12px; color: #475569; margin-top: 2px;">Founder &amp; Chief Strategist</div>
      <div style="font-size: 12px; color: #475569; margin-top: 8px;">EcyPro Premium Consulting</div>
      <div style="margin-top: 10px; font-size: 12px; color: #475569;">
        <a href="${SITE}" style="color: #2563EB; text-decoration: none;">${SITE.replace('https://', '')}</a> ·
        <a href="tel:+905417143000" style="color: #2563EB; text-decoration: none;">+90 541 714 30 00</a> ·
        <a href="${FOUNDER_LINKEDIN}" style="color: #2563EB; text-decoration: none;">LinkedIn</a>
      </div>
      <div style="margin-top: 6px; font-size: 11px; color: #94A3B8;">
        eCyverse · Stratejik Dönüşüm · Kurumsal Yönetişim · KVKK &amp; GDPR Uyumlu
      </div>
    </td>
  </tr>
</table>
      `.trim(),
      text: `
Emre Can Yalçın
Founder & Chief Strategist
EcyPro Premium Consulting

Web: ${SITE}
Tel: +90 541 714 30 00
LinkedIn: ${FOUNDER_LINKEDIN}

eCyverse · Stratejik Dönüşüm · Kurumsal Yönetişim · KVKK & GDPR Uyumlu
      `.trim(),
    },
    en: {
      html: `
<table style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #0F172A;" cellspacing="0" cellpadding="0">
  <tr>
    <td style="padding-right: 16px; vertical-align: top;">
      <img src="${SITE}/brand/icon-mark.svg" alt="eCyPro" width="56" height="56" style="display: block;" />
    </td>
    <td style="vertical-align: top;">
      <div style="font-size: 15px; font-weight: 700; color: #0F172A;">Emre Can Yalçın</div>
      <div style="font-size: 12px; color: #475569; margin-top: 2px;">Founder &amp; Chief Strategist</div>
      <div style="font-size: 12px; color: #475569; margin-top: 8px;">EcyPro Premium Consulting</div>
      <div style="margin-top: 10px; font-size: 12px; color: #475569;">
        <a href="${SITE}" style="color: #2563EB; text-decoration: none;">${SITE.replace('https://', '')}</a> ·
        <a href="tel:+905417143000" style="color: #2563EB; text-decoration: none;">+90 541 714 30 00</a> ·
        <a href="${FOUNDER_LINKEDIN}" style="color: #2563EB; text-decoration: none;">LinkedIn</a>
      </div>
      <div style="margin-top: 6px; font-size: 11px; color: #94A3B8;">
        eCyverse · Strategic Transformation · Corporate Governance · KVKK &amp; GDPR Compliant
      </div>
    </td>
  </tr>
</table>
      `.trim(),
      text: `
Emre Can Yalçın
Founder & Chief Strategist
EcyPro Premium Consulting

Web: ${SITE}
Tel: +90 541 714 30 00
LinkedIn: ${FOUNDER_LINKEDIN}

eCyverse · Strategic Transformation · Corporate Governance · KVKK & GDPR Compliant
      `.trim(),
    },
  },
  support: {
    tr: {
      html: `
<table style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #0F172A;" cellspacing="0" cellpadding="0">
  <tr><td style="padding-right: 16px;">
    <img src="${SITE}/brand/icon-mark.svg" alt="eCyPro" width="40" height="40" />
  </td><td>
    <div style="font-weight: 700;">eCyPro · Müşteri Hizmetleri</div>
    <div style="font-size: 12px; color: #475569; margin-top: 4px;">
      <a href="mailto:info@ecypro.com" style="color: #2563EB; text-decoration: none;">info@ecypro.com</a> ·
      <a href="tel:+905417143000" style="color: #2563EB; text-decoration: none;">+90 541 714 30 00</a>
    </div>
    <div style="font-size: 11px; color: #94A3B8; margin-top: 4px;">Pazartesi-Cuma, 09:00-18:00</div>
  </td></tr>
</table>
      `.trim(),
      text: `eCyPro · Müşteri Hizmetleri\ninfo@ecypro.com · +90 541 714 30 00\nPazartesi-Cuma, 09:00-18:00`,
    },
    en: {
      html: `
<table style="font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #0F172A;" cellspacing="0" cellpadding="0">
  <tr><td style="padding-right: 16px;">
    <img src="${SITE}/brand/icon-mark.svg" alt="eCyPro" width="40" height="40" />
  </td><td>
    <div style="font-weight: 700;">EcyPro · Customer Service</div>
    <div style="font-size: 12px; color: #475569; margin-top: 4px;">
      <a href="mailto:info@ecypro.com" style="color: #2563EB; text-decoration: none;">info@ecypro.com</a> ·
      <a href="tel:+905417143000" style="color: #2563EB; text-decoration: none;">+90 541 714 30 00</a>
    </div>
    <div style="font-size: 11px; color: #94A3B8; margin-top: 4px;">Mon-Fri, 09:00-18:00 (GMT+3)</div>
  </td></tr>
</table>
      `.trim(),
      text: `EcyPro · Customer Service\ninfo@ecypro.com · +90 541 714 30 00\nMon-Fri, 09:00-18:00 (GMT+3)`,
    },
  },
};
