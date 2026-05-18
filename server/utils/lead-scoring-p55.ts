/**
 * P55.A4 — Lead scoring (additive formula, P55 variant).
 *
 * Complements existing logarithmic+decay model in server/lib/lead-scoring.ts.
 * This P55 variant is simpler / more interpretable for admin dashboards:
 *
 *   score = sourceWeight + serviceInterest + assessmentBonus
 *         + bookingBonus + newsletterBonus + recencyBoost
 *
 *   classification:
 *     score >= 80  →  hot
 *     40-79        →  warm
 *     < 40         →  cold
 *
 * Pure function — no DB dependency. Caller assembles the inputs from
 * Prisma queries (ContactSubmission + NewsletterSubscriber + Booking).
 */

export type LeadSource = 'organic' | 'direct' | 'referral' | 'paid' | 'social' | 'other';
export type LeadClassification = 'hot' | 'warm' | 'cold';

export interface LeadScoringInputs {
  source?: LeadSource;
  serviceInterest?: string; // e.g. 'strategic-transformation'
  assessmentsCompleted?: number; // count of quiz/audit completions (cap 4)
  bookedDiscoveryCall?: boolean;
  newsletterSubscribed?: boolean;
  newsletterConfirmed?: boolean;
  lastActivityAt?: Date;
}

export interface LeadScoreOutput {
  total: number;
  classification: LeadClassification;
  breakdown: {
    source: number;
    serviceInterest: number;
    assessment: number;
    booking: number;
    newsletter: number;
    recency: number;
  };
}

const SOURCE_WEIGHTS: Record<LeadSource, number> = {
  referral: 15,
  organic: 10,
  direct: 8,
  social: 7,
  paid: 5,
  other: 3,
};

const HIGH_PRIORITY_SERVICES = new Set([
  'strategic-transformation',
  'mergers-acquisitions',
  'ai-analytics',
  'esg-strategy',
  'crisis-management',
]);

const MID_PRIORITY_SERVICES = new Set([
  'family-business',
  'operational-excellence',
  'digital-strategy',
  'data-governance',
  'investment-incentives',
  'macro-risk',
  'competition-economics',
  'market-entry',
]);

function recencyPoints(lastActivityAt: Date | undefined): number {
  if (!lastActivityAt) return 0;
  const days = (Date.now() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24);
  if (days < 7) return 10;
  if (days < 30) return 5;
  return 0;
}

export function scoreLeadP55(input: LeadScoringInputs): LeadScoreOutput {
  const source = SOURCE_WEIGHTS[input.source ?? 'other'];

  let serviceInterest = 0;
  if (input.serviceInterest) {
    if (HIGH_PRIORITY_SERVICES.has(input.serviceInterest)) serviceInterest = 20;
    else if (MID_PRIORITY_SERVICES.has(input.serviceInterest)) serviceInterest = 10;
    else serviceInterest = 5;
  }

  const assessmentCount = Math.min(4, Math.max(0, input.assessmentsCompleted ?? 0));
  const assessment = assessmentCount * 25;

  const booking = input.bookedDiscoveryCall ? 50 : 0;

  let newsletter = 0;
  if (input.newsletterSubscribed) newsletter += 5;
  if (input.newsletterConfirmed) newsletter += 5;

  const recency = recencyPoints(input.lastActivityAt);

  const total = source + serviceInterest + assessment + booking + newsletter + recency;

  let classification: LeadClassification;
  if (total >= 80) classification = 'hot';
  else if (total >= 40) classification = 'warm';
  else classification = 'cold';

  return {
    total,
    classification,
    breakdown: {
      source,
      serviceInterest,
      assessment,
      booking,
      newsletter,
      recency,
    },
  };
}

/**
 * Human-readable label for admin UI badges.
 */
export function classificationLabel(c: LeadClassification): {
  label: string;
  color: string;
  action: string;
} {
  switch (c) {
    case 'hot':
      return { label: 'Hot', color: '#ef4444', action: '24 saat içinde dön' };
    case 'warm':
      return { label: 'Warm', color: '#f59e0b', action: '3 gün içinde dön' };
    case 'cold':
      return { label: 'Cold', color: '#64748b', action: 'Nurturing dizisine al' };
  }
}
