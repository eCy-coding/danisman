/**
 * Track B — minimal server-side PostHog client.
 *
 * Posts a single event to the PostHog `/capture/` endpoint. When
 * POSTHOG_API_KEY is unset (dev / CI / preview environments) the call is a
 * silent no-op so unit tests and offline runs don't depend on outbound HTTP.
 * Errors are logged and swallowed — analytics must never break a user flow.
 *
 * KVKK compliance:
 *   - `captureWithConsent()` is the public API; callers must supply consent flags.
 *   - Email is never sent as distinctId — always SHA-256 hashed first.
 *   - Gate order: kvkk required first, then analytics opt-in required.
 */

import { createHash } from 'node:crypto';
import { logger } from '../config/logger';

const KEY = process.env.POSTHOG_API_KEY ?? '';
const HOST = (process.env.POSTHOG_HOST ?? 'https://eu.i.posthog.com').replace(/\/$/, '');

export interface CaptureInput {
  event: string;
  distinctId: string;
  properties?: Record<string, unknown>;
}

export interface ConsentInput {
  analytics: boolean;
  kvkk: boolean;
}

export interface CaptureWithConsentInput {
  event: string;
  email: string;
  properties?: Record<string, unknown>;
  consent: ConsentInput;
}

export interface CaptureWithConsentResult {
  captured: boolean;
  distinctId?: string;
  reason?: 'kvkk_missing' | 'analytics_opt_out';
}

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

export async function captureWithConsent(
  input: CaptureWithConsentInput,
): Promise<CaptureWithConsentResult> {
  if (!input.consent.kvkk) {
    return { captured: false, reason: 'kvkk_missing' };
  }
  if (!input.consent.analytics) {
    return { captured: false, reason: 'analytics_opt_out' };
  }
  const distinctId = hashEmail(input.email);
  await capture({ event: input.event, distinctId, properties: input.properties });
  return { captured: true, distinctId };
}

export async function capture(input: CaptureInput): Promise<void> {
  if (!KEY) return;
  try {
    await fetch(`${HOST}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: KEY,
        event: input.event,
        distinct_id: input.distinctId,
        properties: { ...(input.properties ?? {}), $lib: 'ecypro-server' },
      }),
    });
  } catch (err) {
    logger.warn('[posthog] capture failed', { event: input.event, err: String(err) });
  }
}
