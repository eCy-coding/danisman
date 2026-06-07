/**
 * Contact-legacy Zod schema — Sprint 10 Phase 10C (P45a)
 *
 * Canonical re-export of `src/schemas/contact.ts` under the
 * `src/schemas/forms/` directory. Two reasons to ship the shim instead of
 * physically moving the file in P45a:
 *
 *   1. Reversibility (§3.2.2 P2). Every existing import path
 *      (`@/schemas/contact`, `'../../schemas/contact'`) keeps working.
 *      No call-site rewrites needed in this PR; a follow-up phase can
 *      flip imports one by one and finally delete the leaf file.
 *
 *   2. Surgical change (§3.2.2 P3). Touching N call sites in P45a would
 *      explode the diff and bury the actual centralization signal.
 *
 * The "legacy" suffix is the form's identity inside the new
 * `schemas/forms/` namespace — it is the original public contact form
 * (Sprint 4-era), separate from any future contact variants (e.g.
 * sales-specific intake). The KVKK m.5/2 explicit-consent refine and the
 * i18n key-path error messages are preserved verbatim.
 */

export { contactSchema, type ContactFormData } from '../contact';

// Re-exported under the form-namespaced names so call sites that want the
// canonical "forms/contactLegacy" surface read fluently.
export { contactSchema as contactLegacySchema } from '../contact';
export type { ContactFormData as ContactLegacyInput } from '../contact';
