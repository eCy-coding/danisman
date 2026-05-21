/**
 * Track B — Calendly CTA helper.
 *
 * Single source of truth for every "Discovery Call" / "Görüşme Planla" CTA.
 * When `VITE_CALENDLY_URL` is set we open the public Calendly slot picker in a
 * new tab; otherwise we route to the in-app `/discovery-call` page which mounts
 * the same `<CalendlyEmbed />` with a graceful native-form fallback.
 *
 * The returned `dataAttrs` are surfaced to PostHog autocapture so every CTA
 * funnel step is identifiable without bespoke event wiring.
 */

export type CalendlyCtaSource =
  | 'hero-primary'
  | 'hero-secondary'
  | 'navbar'
  | 'about-final'
  | 'pricing-tier'
  | 'pricing-final'
  | 'booking-section'
  | 'mobile-sticky'
  | 'contact-page'
  | 'thank-you-secondary';

export interface CalendlyCtaTarget {
  href: string;
  /** `_blank` when an external Calendly URL is configured. */
  target?: '_blank';
  /** Set when target is `_blank`. */
  rel?: string;
  /** Tracking attributes — surface to <a> / <button> / <Link>. */
  dataAttrs: Record<string, string>;
}

const FALLBACK_ROUTE = '/discovery-call';

function readCalendlyUrl(): string {
  const raw = (import.meta.env.VITE_CALENDLY_URL as string | undefined) ?? '';
  return raw.trim();
}

/** Resolve the right destination for a Calendly CTA. */
export function getCalendlyCta(
  source: CalendlyCtaSource,
  extra?: Record<string, string>,
): CalendlyCtaTarget {
  const calendly = readCalendlyUrl();
  const dataAttrs: Record<string, string> = {
    'data-cta': 'discovery',
    'data-track': 'cta-click',
    'data-cta-source': source,
    ...(extra ?? {}),
  };

  if (calendly) {
    return {
      href: calendly,
      target: '_blank',
      rel: 'noopener noreferrer',
      dataAttrs,
    };
  }
  return { href: FALLBACK_ROUTE, dataAttrs };
}

/** True when an external Calendly URL is configured. */
export function hasExternalCalendly(): boolean {
  return readCalendlyUrl().length > 0;
}
