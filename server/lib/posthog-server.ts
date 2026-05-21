/**
 * Track B — minimal server-side PostHog client.
 *
 * Posts a single event to the PostHog `/capture/` endpoint. When
 * POSTHOG_API_KEY is unset (dev / CI / preview environments) the call is a
 * silent no-op so unit tests and offline runs don't depend on outbound HTTP.
 * Errors are logged and swallowed — analytics must never break a user flow.
 */

import { logger } from '../config/logger';

const KEY = process.env.POSTHOG_API_KEY ?? '';
const HOST = (process.env.POSTHOG_HOST ?? 'https://eu.i.posthog.com').replace(/\/$/, '');

export interface CaptureInput {
  event: string;
  distinctId: string;
  properties?: Record<string, unknown>;
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
