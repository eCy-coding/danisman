/**
 * `src/schemas/forms/` barrel — Sprint 10 Phase 10C (P45a)
 *
 * Single import surface for every public-facing form schema. Call sites
 * should prefer this over deep imports once Phase 10C completes:
 *
 *   import { newsletterSubscribeSchema, contactLegacySchema } from '@/schemas/forms';
 *
 * Adding a new form: drop a file next to this one (e.g. `discovery.ts`),
 * append its exports below. Keep KVKK consent + i18n key-path conventions.
 */

export { newsletterSubscribeSchema, type NewsletterSubscribeInput } from './newsletterSubscribe';

export {
  contactSchema,
  contactLegacySchema,
  type ContactFormData,
  type ContactLegacyInput,
} from './contactLegacy';
