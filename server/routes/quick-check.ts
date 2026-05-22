/**
 * Track 1 — Quick-Check assessment submission.
 *
 *   POST /api/v1/quick-check-submit
 *
 * Inputs:
 *   - 10 answers (each A|B|C|D) — maturity self-assessment.
 *   - Identity (name, email, company, sector).
 *   - kvkkConsent boolean — required, KVKK m.5/2-f legal basis.
 *
 * Scoring rubric:
 *   A=3 (mature), B=2, C=1, D=0 (high-risk).
 *   Sum 0–30 → tier:
 *     ≤12  → "high-risk"
 *     13–21 → "medium"
 *     22–30 → "mature"
 *
 * Red flag: D answer on Q8 or Q9 marks the row as immediate-follow-up.
 *
 * Side effects:
 *   - Notion CRM Prospect (Source="Quick-Check inbound", Stage="Lead",
 *     Priority derived from tier).
 *   - Resend HTML result email to the lead, reply-to founder.
 *   - PostHog `quick_check_completed` event with tier + score.
 *
 * Errors:
 *   400 INVALID_PAYLOAD — zod validation failed
 *   400 KVKK_REQUIRED   — kvkkConsent not true
 *   429 RATE_LIMITED    — handled by quickCheckLimiter middleware
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Resend } from 'resend';
import { quickCheckLimiter } from '../middleware/rateLimiter';
import { idempotency } from '../middleware/idempotency';
import { HttpError } from '../middleware/error';
import { logger } from '../config/logger';
import { capture as posthogCapture } from '../lib/posthog-server';
import { upsertProspect } from '../services/notion';

const router = Router();

const AnswerLetter = z.enum(['A', 'B', 'C', 'D']);

const QuickCheckSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  company: z.string().trim().max(180).optional().default(''),
  sector: z.string().trim().max(120).optional().default(''),
  answers: z.array(AnswerLetter).length(10, 'Exactly 10 answers required'),
  kvkkConsent: z.boolean().optional().default(false),
  hp_field: z.string().max(0).optional().default(''),
});

const RESEND_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'eCyPro <noreply@ecypro.com>';
const FOUNDER_EMAIL = process.env.FOUNDER_EMAIL ?? 'hello@ecypro.com';
let resendClient: Resend | null = null;
function getResend(): Resend | null {
  if (!RESEND_KEY) return null;
  if (!resendClient) resendClient = new Resend(RESEND_KEY);
  return resendClient;
}

const LETTER_SCORE: Record<'A' | 'B' | 'C' | 'D', number> = { A: 3, B: 2, C: 1, D: 0 };

export type QuickCheckTier = 'high-risk' | 'medium' | 'mature';

function scoreAnswers(answers: ReadonlyArray<'A' | 'B' | 'C' | 'D'>): {
  score: number;
  tier: QuickCheckTier;
  redFlag: boolean;
} {
  const score = answers.reduce((sum, letter) => sum + LETTER_SCORE[letter], 0);
  const tier: QuickCheckTier = score <= 12 ? 'high-risk' : score <= 21 ? 'medium' : 'mature';
  // Q8 / Q9 (indices 7, 8) D answers signal operational immaturity in
  // critical-path areas — treat as red flag regardless of total score.
  const redFlag = answers[7] === 'D' || answers[8] === 'D';
  return { score, tier, redFlag };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tierCopy(tier: QuickCheckTier): { headline: string; cta: string } {
  switch (tier) {
    case 'high-risk':
      return {
        headline:
          'Acil müdahale önerilir. Mevcut yapı kritik risk taşıyor; öncelikli aksiyon planı çıkarmak için ücretsiz Discovery Call rezerve edebilirsiniz.',
        cta: 'Discovery Call rezerve et',
      };
    case 'medium':
      return {
        headline:
          'Temel altyapınız sağlam ancak skala için boşluklar mevcut. Çeyreklik Engagement ile bu açıkları kapatabiliriz.',
        cta: 'Strateji Oturumu planla',
      };
    default:
      return {
        headline:
          'Operasyonel olgunluğunuz yüksek. Bir sonraki büyüme katmanı için Yıllık Partnerlik’i değerlendirmek isteyebilirsiniz.',
        cta: 'Yıllık Partnerlik incele',
      };
  }
}

function resultEmailHtml(opts: {
  name: string;
  score: number;
  tier: QuickCheckTier;
  redFlag: boolean;
}): string {
  const tierLabel =
    opts.tier === 'high-risk' ? 'Yüksek Risk' : opts.tier === 'medium' ? 'Orta Olgunluk' : 'Olgun';
  const copy = tierCopy(opts.tier);
  const flagBlock = opts.redFlag
    ? `<p style="margin:0 0 16px;color:#fca5a5"><strong>🚩 Kritik bulgu:</strong> Operasyonel risk alanlarında acil incelemeyi gerektiren cevaplar var.</p>`
    : '';
  return `<!DOCTYPE html><html lang="tr"><body style="font-family:Inter,system-ui,sans-serif;background:#050810;color:#e2e8f0;margin:0;padding:40px 20px">
<div style="max-width:560px;margin:0 auto;background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px">
  <div style="margin-bottom:24px"><strong style="font-size:20px;color:#fff">e<span style="color:#2563eb">Cy</span>Pro</strong></div>
  <h1 style="font-size:22px;color:#fff;margin:0 0 12px">Quick-Check sonuçlarınız hazır, ${escapeHtml(opts.name)}</h1>
  <div style="background:#020617;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin:0 0 20px">
    <p style="margin:0 0 4px;font-size:12px;color:#64748b;letter-spacing:0.08em;text-transform:uppercase">Skor</p>
    <p style="margin:0 0 12px;font-size:32px;color:#fff;font-weight:600">${opts.score} / 30</p>
    <p style="margin:0 0 4px;font-size:12px;color:#64748b;letter-spacing:0.08em;text-transform:uppercase">Olgunluk Sınıfı</p>
    <p style="margin:0;font-size:18px;color:#38bdf8;font-weight:600">${tierLabel}</p>
  </div>
  ${flagBlock}
  <p style="line-height:1.6;color:#cbd5e1;margin:0 0 20px">${copy.headline}</p>
  <p style="margin:0 0 24px"><a href="https://calendly.com/ecypro/discovery" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">${copy.cta}</a></p>
  <p style="font-size:12px;color:#64748b;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;margin:0">eCyPro Premium Consulting · İstanbul, Türkiye · KVKK m.5/2-f çerçevesinde işlendi.</p>
</div></body></html>`;
}

router.post(
  '/',
  quickCheckLimiter,
  idempotency({ ttlMs: 24 * 60 * 60 * 1000 }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = QuickCheckSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(
          400,
          'INVALID_PAYLOAD',
          parsed.error.issues[0]?.message ?? 'Invalid payload',
        );
      }
      const data = parsed.data;

      if (data.hp_field) {
        logger.info('[quick-check] honeypot triggered, silently accepting', { ip: req.ip });
        res.json({ ok: true });
        return;
      }
      if (!data.kvkkConsent) {
        throw new HttpError(
          400,
          'KVKK_REQUIRED',
          'Quick-Check sonuçlarını işlemek için KVKK onayı zorunludur',
        );
      }

      const { score, tier, redFlag } = scoreAnswers(data.answers);
      const nowIso = new Date().toISOString();

      void upsertProspect({
        company: data.company || undefined,
        decisionMaker: data.name,
        decisionMakerEmail: data.email,
        sector: data.sector || undefined,
        outreachStatus: 'Replied',
        quickCheckScore: score,
        quickCheckDate: nowIso,
        firstContactDate: nowIso,
        serviceSlug: 'quick-check',
        kvkkConsentAt: nowIso,
        notes: [
          `Maturity tier: ${tier}`,
          `Quick-Check answers: ${data.answers.join('')}`,
          redFlag && '🚩 Red flag: Q8/Q9 D cevabı',
        ]
          .filter(Boolean)
          .join('\n'),
      }).catch((err) => logger.warn('[quick-check] notion upsert failed', { err: String(err) }));

      const resend = getResend();
      if (resend) {
        resend.emails
          .send({
            from: EMAIL_FROM,
            to: data.email,
            replyTo: FOUNDER_EMAIL,
            subject: 'Quick-Check sonuçlarınız — eCyPro',
            html: resultEmailHtml({ name: data.name, score, tier, redFlag }),
          })
          .catch((err) => logger.warn('[quick-check] result email failed', { err: String(err) }));
      }

      void posthogCapture({
        event: 'quick_check_completed',
        distinctId: data.email,
        properties: {
          score,
          tier,
          redFlag,
          sector: data.sector || null,
        },
      });

      res.json({ ok: true, score, tier, redFlag });
    } catch (err) {
      next(err);
    }
  },
);

export const __quickCheckInternals = { scoreAnswers };
export default router;
