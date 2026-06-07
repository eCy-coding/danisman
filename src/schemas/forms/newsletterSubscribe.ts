/**
 * Newsletter subscription Zod schema — Sprint 10 Phase 10C (P45a)
 *
 * Canonical contract for every newsletter-capture surface:
 *   - footer (`NewsletterCapture` / `NewsletterSidebar` variants)
 *   - article mid-CTA (`NewsletterMidCTA`)
 *   - dedicated section (`NewsletterSection`)
 *
 * Before P45a these forms validated inline (`if (!email || !consent)` boolean
 * checks). Centralizing the schema gives us:
 *   - one place to evolve KVKK consent semantics (Sprint 9 P44 pattern)
 *   - typed payload for `/api/newsletter/subscribe` callers
 *   - testable refinements (consent must be explicitly true)
 *
 * i18n: error `message` values are i18n key paths (`newsletter.form.*`),
 * resolved in the UI via `t(errors.x.message)` — same convention as
 * `src/schemas/contact.ts`.
 */

import { z } from 'zod';

export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'newsletter.form.email_required' })
    .email({ message: 'newsletter.form.invalid_email' }),
  // KVKK md.5/2(a) — explicit consent. `refine` on `true` so the form blocks
  // submission until the consent checkbox is ticked. Mirrors Sprint 9 P44-T08
  // fix where `Footer` newsletter no longer pre-ticks the box.
  consent: z.boolean().refine((v) => v === true, {
    message: 'newsletter.form.consent_required',
  }),
  // Analytics tag — which surface triggered the subscription. Free-form
  // string so new placements don't require a schema bump. Trimmed to 64 char
  // to keep payloads predictable.
  source: z.string().max(64, { message: 'newsletter.form.source_too_long' }).optional(),
  // Optional locale hint — UI may pass `tr` or `en`. Backend uses it to
  // route the double-opt-in confirmation email template.
  locale: z.enum(['tr', 'en']).optional(),
  // Honeypot — bots usually fill every visible field. Real users tab past
  // the off-screen input. Schema accepts the field but server-side route
  // rejects non-empty values.
  hp_field: z.string().optional(),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
