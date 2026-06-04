/**
 * PostHog event taxonomy v1.0 — KVKK compliant.
 * All payloads are PII-free; no email, name, or IP fields allowed.
 */
import { getPostHog } from '../posthog';

export type PostHogEventName =
  | 'page_view'
  | 'signup_started'
  | 'signup_completed'
  | 'discovery_booked'
  | 'dsar_submitted'
  | 'retainer_inquiry'
  | 'founder_letter_signup'
  | 'exit_intent_shown'
  | 'language_switch'
  | 'kvkk_consent_given'
  | 'kvkk_consent_revoked';

export interface PostHogEventMap {
  page_view: { path: string; title?: string; referrer?: string };
  signup_started: { source: string };
  signup_completed: { source: string };
  discovery_booked: { source: string; service?: string };
  dsar_submitted: {
    request_type: 'access' | 'deletion' | 'correction' | 'portability';
  };
  retainer_inquiry: { tier?: string };
  founder_letter_signup: { source: string };
  exit_intent_shown: { page: string; trigger: 'timer' | 'scroll' | 'cursor' };
  language_switch: { from: 'tr' | 'en'; to: 'tr' | 'en' };
  kvkk_consent_given: { categories: string[] };
  kvkk_consent_revoked: { categories: string[] };
}

export async function capturePostHog<K extends PostHogEventName>(
  name: K,
  payload: PostHogEventMap[K],
): Promise<void> {
  try {
    const ph = await getPostHog();
    if (!ph) return;
    if (!ph.has_opted_in_capturing()) return;
    ph.capture(name, payload);
  } catch {
    // Silently swallow — analytics must never break the host feature
  }
}
