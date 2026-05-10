/**
 * P34-T10: Lead Scoring System
 *
 * Scoring model:
 *   Behavioral score   — computed from interaction history (page visits, CTA, form, ROI calc)
 *   Firmographic score — inferred from email domain (corporate vs free mail)
 *   Recency decay      — exponential decay: score halves every 30 days
 *
 * Tier mapping:
 *   A (≥100) — Hot lead: immediate follow-up in ≤24h
 *   B (50-99) — Warm lead: follow-up within 3 days
 *   C (<50)  — Cold lead: nurturing sequence
 *
 * Math:
 *   Total = Σ(event_weight × frequency_factor) × firmographic_multiplier × decay_factor
 *   frequency_factor(n) = ln(n + 1)  ← logarithmic diminishing returns (spam visits don't inflate)
 *   decay_factor = 2^(-days_since_last_activity / 30)  ← half-life 30 days
 *
 * Usage:
 *   const score = computeLeadScore(interactions, email, lastActivityAt);
 *   const lead = classifyLead(score);
 */

import { logger } from '../config/logger';

// ─── Event weights (behavioral scoring table) ─────────────

export const BEHAVIORAL_WEIGHTS: Record<string, number> = {
  PAGE_VIEW: 5, // Basic page view
  CTA_CLICK: 20, // Strong intent signal
  FORM_SUBMIT: 100, // Highest intent — direct contact
  BOOKING_START: 50, // High intent — booking intent
  DOWNLOAD: 30, // Content interest
  SCROLL_DEPTH: 3, // Per 25% milestone (max 12 points)
  PRICING_VIEW: 40, // Commercial intent signal
  ROI_CALC: 60, // Very high intent — ROI curiosity = purchase readiness
};

// ─── Firmographic scoring (email domain analysis) ──────────

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'yandex.com',
  'icloud.com',
  'protonmail.com',
  'mail.com',
  'yandex.ru',
  'windowslive.com',
  'msn.com',
]);

export function getFirmographicMultiplier(email: string): number {
  const domain = email.toLowerCase().split('@')[1] ?? '';
  if (FREE_EMAIL_DOMAINS.has(domain)) return 1.0; // Personal email: no boost
  if (domain.endsWith('.edu.tr') || domain.endsWith('.edu')) return 1.2;
  if (domain.endsWith('.gov.tr') || domain.endsWith('.gov')) return 1.5;
  return 1.3; // Corporate email: +30% boost
}

// ─── Lead score computation ────────────────────────────────

export interface InteractionRecord {
  type: string; // matches BEHAVIORAL_WEIGHTS keys
  count: number; // total occurrences
  lastAt?: Date;
}

export interface LeadScoreResult {
  behavioralScore: number;
  firmographicMultiplier: number;
  decayFactor: number;
  totalScore: number;
  tier: 'A' | 'B' | 'C';
  tierLabel: string;
}

/**
 * Computes lead score with logarithmic diminishing returns and exponential time decay.
 *
 * @param interactions  Array of interaction records (type + count)
 * @param email         Lead email (for firmographic scoring)
 * @param lastActivityAt Last interaction timestamp (for decay)
 */
export function computeLeadScore(
  interactions: InteractionRecord[],
  email: string,
  lastActivityAt: Date = new Date(),
): LeadScoreResult {
  // 1. Behavioral score — Σ(weight × ln(count + 1))
  let behavioralScore = 0;
  for (const { type, count } of interactions) {
    const weight = BEHAVIORAL_WEIGHTS[type] ?? 0;
    if (weight === 0 || count <= 0) continue;
    // Logarithmic diminishing returns: frequent visits contribute less per additional visit
    behavioralScore += weight * Math.log(count + 1);
  }
  behavioralScore = Math.round(behavioralScore);

  // 2. Firmographic multiplier
  const firmographicMultiplier = getFirmographicMultiplier(email);

  // 3. Exponential time decay: half-life = 30 days
  const daysSinceActivity = Math.max(
    0,
    (Date.now() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  const decayFactor = Math.pow(2, -daysSinceActivity / 30);

  // 4. Total score
  const totalScore = Math.round(behavioralScore * firmographicMultiplier * decayFactor);

  // 5. Tier classification
  const tier: 'A' | 'B' | 'C' = totalScore >= 100 ? 'A' : totalScore >= 50 ? 'B' : 'C';
  const tierLabel =
    tier === 'A'
      ? 'Hot — Follow up in 24h'
      : tier === 'B'
        ? 'Warm — Follow up in 3 days'
        : 'Cold — Nurturing sequence';

  return { behavioralScore, firmographicMultiplier, decayFactor, totalScore, tier, tierLabel };
}

// ─── Classify lead (alias for API usage) ─────────────────

export function classifyLead(score: number): {
  tier: 'A' | 'B' | 'C';
  label: string;
  color: string;
} {
  if (score >= 100) return { tier: 'A', label: 'Hot', color: '#ef4444' };
  if (score >= 50) return { tier: 'B', label: 'Warm', color: '#f59e0b' };
  return { tier: 'C', label: 'Cold', color: '#64748b' };
}

// ─── Refresh score from DB interactions ──────────────────

export async function computeLeadScoreFromDB(
  contactId: string,
  email: string,
  prisma: {
    analytics: {
      groupBy: (
        args: object,
      ) => Promise<
        { interactionType: string; _count: { id: number }; _max: { timestamp: Date } }[]
      >;
    };
  },
): Promise<LeadScoreResult> {
  try {
    const rows = await prisma.analytics.groupBy({
      by: ['interactionType'],
      where: { sessionId: { contains: contactId } }, // approximation
      _count: { id: true },
      _max: { timestamp: true },
    });

    const interactions: InteractionRecord[] = rows.map((r) => ({
      type: r.interactionType,
      count: r._count.id,
      lastAt: r._max.timestamp,
    }));

    const lastActivity =
      rows.reduce<Date | undefined>((latest, r) => {
        const ts = r._max.timestamp;
        return !latest || ts > latest ? ts : latest;
      }, undefined) ?? new Date();

    return computeLeadScore(interactions, email, lastActivity);
  } catch (err) {
    logger.warn('[lead-scoring] DB query failed, returning default score', {
      error: (err as Error).message,
    });
    return computeLeadScore([], email);
  }
}
