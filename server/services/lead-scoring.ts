/**
 * P44-T07 Round-6 — Server-side Lead Scoring.
 *
 * Pure-function scorer for ContactSubmission rows. Used by:
 *   - Dashboard "Sıcak Lead (Tier A)" panel (admin-dashboard.ts hotLeads count)
 *   - CRM /admin/crm "Tier A" roster
 *   - LiveLeadFeed real-time card tier indicator
 *
 * Tiering threshold:
 *   - score >= 80  → Tier A (Hot)
 *   - score >= 50  → Tier B (Warm)
 *   - score >= 20  → Tier C (Cold)
 *   - else         → Tier D (Cold / disqualify)
 *
 * Signals (additive, capped at 100):
 *   +40  Corporate email domain (not free-mail: gmail/yahoo/hotmail/outlook/icloud/proton)
 *   +30  High-margin service interest (M&A / ESG / Fintech)
 *   +20  Family-business interest (longer sales cycle, still high-value)
 *   +15  Message length >= 100 chars (intent signal)
 *   +10  Message length 50-99 chars
 *   +10  Phone number provided (sales velocity signal)
 *   +5   UTM source = referral / partner / linkedin (warm channel)
 *   -10  Free-mail domain on a B2B inquiry (likely tire-kicker)
 */

const FREE_MAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'protonmail.com',
  'proton.me',
  'aol.com',
  'mail.com',
  'gmx.com',
  'gmx.de',
  'yandex.com',
  'yandex.ru',
]);

const HIGH_MARGIN_SERVICES =
  /m&a|m\.a|merger|acqui|due diligence|esg|csrd|esrs|fintech|spk|masak|tcmb|bddk|kvkk/i;
const FAMILY_BIZ_SERVICES = /aile|family|halefi|succession|kuşak/i;
const WARM_CHANNELS = new Set(['referral', 'partner', 'linkedin', 'newsletter']);

export interface ContactSignal {
  email: string;
  service?: string | null;
  messageTr?: string | null;
  messageEn?: string | null;
  phone?: string | null;
  source?: string | null;
}

export type LeadTier = 'A' | 'B' | 'C' | 'D';

export interface LeadScore {
  score: number; // 0-100
  tier: LeadTier;
  reasons: string[];
}

function emailDomain(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 0) return '';
  return email
    .slice(at + 1)
    .toLowerCase()
    .trim();
}

export function scoreLead(c: ContactSignal): LeadScore {
  let score = 0;
  const reasons: string[] = [];

  // Email domain analysis
  const dom = emailDomain(c.email);
  const isFreeMail = dom !== '' && FREE_MAIL_DOMAINS.has(dom);
  if (!isFreeMail && dom !== '') {
    score += 40;
    reasons.push(`corp-email:${dom} +40`);
  } else if (isFreeMail) {
    score -= 10;
    reasons.push(`free-mail:${dom} -10`);
  }

  // Service interest
  const svc = c.service ?? '';
  if (HIGH_MARGIN_SERVICES.test(svc)) {
    score += 30;
    reasons.push(`hi-margin-service +30`);
  } else if (FAMILY_BIZ_SERVICES.test(svc)) {
    score += 20;
    reasons.push(`family-biz-service +20`);
  }

  // Message intent length
  const msg = (c.messageTr ?? c.messageEn ?? '').trim();
  if (msg.length >= 100) {
    score += 15;
    reasons.push(`msg>=100 +15`);
  } else if (msg.length >= 50) {
    score += 10;
    reasons.push(`msg>=50 +10`);
  }

  // Phone
  if (c.phone && c.phone.trim().length >= 7) {
    score += 10;
    reasons.push(`phone +10`);
  }

  // Source channel
  if (c.source && WARM_CHANNELS.has(c.source.toLowerCase())) {
    score += 5;
    reasons.push(`warm-channel:${c.source} +5`);
  }

  // Cap
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  // Tier
  let tier: LeadTier;
  if (score >= 80) tier = 'A';
  else if (score >= 50) tier = 'B';
  else if (score >= 20) tier = 'C';
  else tier = 'D';

  return { score, tier, reasons };
}

/**
 * Convenience: bulk score for the dashboard "Sıcak Lead" count.
 * Filters to Tier A only and returns the count + ids.
 */
export function countHotLeads<T extends ContactSignal & { id: string }>(
  contacts: T[],
): { count: number; ids: string[] } {
  const ids: string[] = [];
  for (const c of contacts) {
    const { tier } = scoreLead(c);
    if (tier === 'A') ids.push(c.id);
  }
  return { count: ids.length, ids };
}
