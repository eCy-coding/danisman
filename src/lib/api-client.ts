/**
 * Track 4 lead-magnet endpoints (KVKK Quick-Check + Pricing Calculator).
 *
 * Lives next to the legacy axios client (api.ts) instead of replacing it:
 * the wizards POST a single payload with no auth, so a thin fetch wrapper is
 * cheaper than dragging in axios interceptors. Backend lands in Track 1 (PR
 * #13); until it merges, point VITE_API_URL at staging or rely on the
 * graceful-degradation branch in the wizard's submit handler.
 */

const RAW_BASE = import.meta.env.VITE_API_URL as string | undefined;
const IS_DEV = import.meta.env.DEV === true;

const API_BASE = ((): string => {
  if (typeof RAW_BASE === 'string' && RAW_BASE.trim().length > 0) {
    return RAW_BASE.trim().replace(/\/$/, '');
  }
  return IS_DEV ? 'http://localhost:3001/api' : '/api';
})();

export type RiskTier = 'high' | 'medium' | 'mature';

export interface QuickCheckAnswer {
  questionId: number;
  choice: 'A' | 'B' | 'C' | 'D';
  points: number;
}

export interface QuickCheckPayload {
  answers: QuickCheckAnswer[];
  score: number;
  tier: RiskTier;
  redFlag: boolean;
  redFlagReasons: string[];
  contact: {
    name: string;
    email: string;
    company: string;
    sector: string;
    position?: string;
  };
  kvkkConsent: true;
  source: 'quick-check';
  startedAt: string;
  completedAt: string;
}

export interface PricingPayload {
  answers: {
    sectors: string[];
    size: string;
    needs: string[];
    urgency: string;
  };
  recommendedPaket: string;
  paketLabel: string;
  paketPrice: string;
  contact: {
    name: string;
    email: string;
    company: string;
    sector: string;
  };
  kvkkConsent: true;
  source: 'pricing-calculator';
  completedAt: string;
}

export interface SubmitResponse {
  success: boolean;
  prospectId?: string;
  message?: string;
}

export class RateLimitError extends Error {
  constructor() {
    super('rate-limited');
    this.name = 'RateLimitError';
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    body: JSON.stringify(body),
  });

  if (res.status === 429) throw new RateLimitError();

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string };
      if (data && typeof data.message === 'string') detail = data.message;
    } catch {
      // ignore JSON parse errors — keep the HTTP-level message
    }
    throw new ApiError(res.status, detail);
  }

  return (await res.json()) as T;
}

export function submitQuickCheck(payload: QuickCheckPayload): Promise<SubmitResponse> {
  return postJson<SubmitResponse>('/v1/quick-check-submit', payload);
}

export function submitPricingCalc(payload: PricingPayload): Promise<SubmitResponse> {
  return postJson<SubmitResponse>('/v1/pricing-calc-submit', payload);
}
