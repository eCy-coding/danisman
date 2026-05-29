/**
 * Track 1 — Pricing-calculator submission.
 *
 *   POST /api/v1/pricing-calculator-submit
 *
 * Inputs (zod-validated):
 *   - 4 categorical answers driving paket recommendation:
 *       teamSize   : "1-10" | "11-50" | "51-200" | "200+"
 *       maturity   : "early" | "scaling" | "mature"
 *       horizon    : "quarter" | "year" | "multi-year"
 *       budgetBand : "<5k" | "5k-25k" | "25k-100k" | "100k+"
 *   - Identity (name, email).
 *   - kvkkConsent boolean — required.
 *
 * Recommendation (3 canonical paket IDs — starter | growth | enterprise):
 *   The pricing page currently surfaces three SKUs. When the launch SPEC
 *   expands to 8 canonical paket IDs (`outputs/pricing_calculator_SPEC.md`),
 *   replace `recommendPaket` here — no other code paths reference the
 *   recommendation shape.
 *
 * Side effects:
 *   - Notion CRM Prospect (Source="Pricing-Calculator inbound").
 *   - Resend HTML result email with recommended paket.
 *   - PostHog `pricing_calculator_completed` event.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Resend } from 'resend';
import { contactLimiter } from '../middleware/rateLimiter';
import { idempotency } from '../middleware/idempotency';
import { HttpError } from '../middleware/error';
import { logger } from '../config/logger';
import { captureWithConsent } from '../lib/posthog-server';
import { upsertProspect } from '../services/notion';

const router = Router();

const TeamSize = z.enum(['1-10', '11-50', '51-200', '200+']);
const Maturity = z.enum(['early', 'scaling', 'mature']);
const Horizon = z.enum(['quarter', 'year', 'multi-year']);
const BudgetBand = z.enum(['<5k', '5k-25k', '25k-100k', '100k+']);

const PricingSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  company: z.string().trim().max(180).optional().default(''),
  sector: z.string().trim().max(120).optional().default(''),
  answers: z.object({
    teamSize: TeamSize,
    maturity: Maturity,
    horizon: Horizon,
    budgetBand: BudgetBand,
  }),
  kvkkConsent: z.boolean().optional().default(false),
  analyticsConsent: z.boolean().optional().default(false),
  hp_field: z.string().max(0).optional().default(''),
});

export type PricingAnswers = z.infer<typeof PricingSchema>['answers'];
export type PaketId = 'starter' | 'growth' | 'enterprise';

const PAKET_META: Record<PaketId, { name: string; href: string; blurb: string }> = {
  starter: {
    name: 'Strateji Oturumu',
    href: 'https://ecypro.com/pricing#starter',
    blurb: 'Yarım gün stratejik atölye. İlk doğru aksiyon planını çıkarmak için en hızlı yol.',
  },
  growth: {
    name: 'Çeyreklik Engagement',
    href: 'https://ecypro.com/pricing#growth',
    blurb: '90 günlük partnerlik. Skala için boşlukları sistemli kapatmak isteyenler için.',
  },
  enterprise: {
    name: 'Yıllık Partnerlik',
    href: 'https://ecypro.com/pricing#enterprise',
    blurb: 'Yönetim kurulu seviyesinde stratejik partnerlik. Çok yıllı dönüşüm yol haritası.',
  },
};

/**
 * Heuristic mapping until the canonical 8-paket SPEC lands. Conservative
 * defaults: low budget + early stage → starter; mature + multi-year +
 * 200+ team → enterprise; everything else → growth.
 */
export function recommendPaket(a: PricingAnswers): PaketId {
  const highTeam = a.teamSize === '51-200' || a.teamSize === '200+';
  const highBudget = a.budgetBand === '25k-100k' || a.budgetBand === '100k+';
  const longHorizon = a.horizon === 'year' || a.horizon === 'multi-year';

  if (a.maturity === 'mature' && longHorizon && (highTeam || highBudget)) {
    return 'enterprise';
  }
  if (a.budgetBand === '<5k' || (a.maturity === 'early' && a.horizon === 'quarter')) {
    return 'starter';
  }
  return 'growth';
}

const RESEND_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'eCyPro <noreply@ecypro.com>';
const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL ?? 'hello@ecypro.com';
let resendClient: Resend | null = null;
function getResend(): Resend | null {
  if (!RESEND_KEY) return null;
  if (!resendClient) resendClient = new Resend(RESEND_KEY);
  return resendClient;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resultEmailHtml(opts: { name: string; paket: PaketId }): string {
  const meta = PAKET_META[opts.paket];
  return `<!DOCTYPE html><html lang="tr"><body style="font-family:Inter,system-ui,sans-serif;background:#050810;color:#e2e8f0;margin:0;padding:40px 20px">
<div style="max-width:560px;margin:0 auto;background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px">
  <div style="margin-bottom:24px"><strong style="font-size:20px;color:#fff">e<span style="color:#2563eb">Cy</span>Pro</strong></div>
  <h1 style="font-size:22px;color:#fff;margin:0 0 12px">Önerilen paket hazır, ${escapeHtml(opts.name)}</h1>
  <div style="background:#020617;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin:0 0 20px">
    <p style="margin:0 0 4px;font-size:12px;color:#64748b;letter-spacing:0.08em;text-transform:uppercase">Sizin için seçim</p>
    <p style="margin:0 0 12px;font-size:24px;color:#fff;font-weight:600">${escapeHtml(meta.name)}</p>
    <p style="margin:0;line-height:1.6;color:#cbd5e1">${escapeHtml(meta.blurb)}</p>
  </div>
  <p style="margin:0 0 24px"><a href="${meta.href}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">Paket detayını incele</a></p>
  <p style="font-size:12px;color:#64748b;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;margin:0">eCyPro Premium Consulting · İstanbul, Türkiye · KVKK m.5/2-f çerçevesinde işlendi.</p>
</div></body></html>`;
}

router.post(
  '/',
  // Pricing intake is bursty (form refresh, browser back) — share the
  // contact form limiter rather than carving a new bucket.
  contactLimiter,
  idempotency({ ttlMs: 24 * 60 * 60 * 1000 }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = PricingSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(
          400,
          'INVALID_PAYLOAD',
          parsed.error.issues[0]?.message ?? 'Invalid payload',
        );
      }
      const data = parsed.data;

      if (data.hp_field) {
        logger.info('[pricing-calc] honeypot triggered, silently accepting', { ip: req.ip });
        res.json({ ok: true });
        return;
      }
      if (!data.kvkkConsent) {
        throw new HttpError(
          400,
          'KVKK_REQUIRED',
          'Paket önerisini iletmek için KVKK onayı zorunludur',
        );
      }

      const paket = recommendPaket(data.answers);
      const nowIso = new Date().toISOString();

      void upsertProspect({
        company: data.company || undefined,
        decisionMaker: data.name,
        decisionMakerEmail: data.email,
        sector: data.sector || undefined,
        outreachStatus: 'Replied',
        serviceSlug: 'pricing-calculator',
        firstContactDate: nowIso,
        kvkkConsentAt: nowIso,
        notes: [
          `Recommended paket: ${paket}`,
          `Team: ${data.answers.teamSize}`,
          `Maturity: ${data.answers.maturity}`,
          `Horizon: ${data.answers.horizon}`,
          `Budget: ${data.answers.budgetBand}`,
        ].join('\n'),
      }).catch((err) => logger.warn('[pricing-calc] notion upsert failed', { err: String(err) }));

      const resend = getResend();
      if (resend) {
        resend.emails
          .send({
            from: EMAIL_FROM,
            to: data.email,
            replyTo: FOUNDER_EMAIL,
            subject: `Önerilen paket: ${PAKET_META[paket].name} — eCyPro`,
            html: resultEmailHtml({ name: data.name, paket }),
          })
          .catch((err) => logger.warn('[pricing-calc] result email failed', { err: String(err) }));
      }

      void captureWithConsent({
        event: 'pricing_calculator_completed',
        email: data.email,
        consent: { kvkk: data.kvkkConsent, analytics: data.analyticsConsent },
        properties: {
          paket,
          teamSize: data.answers.teamSize,
          maturity: data.answers.maturity,
          horizon: data.answers.horizon,
          budgetBand: data.answers.budgetBand,
        },
      });

      res.json({ ok: true, paket });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
