# eCyPro Canonical Patterns Catalog

> **Status:** Active · **Effective:** 2026-06-02 (Sprint 10 Phase 10A) · **Owner:** Patterns Librarian (NotebookLM `c8cf1440-784d-43ef-ad96-d87c8e97dbb6`) · **Cross-ref:** [`docs/WORKFLOW.md`](./WORKFLOW.md), [`NOTEBOOKLM_CODING_PLAYBOOK.md §3.11 PBVC`](../NOTEBOOKLM_CODING_PLAYBOOK.md), [`docs/adr/`](./adr/)

This catalog is the **single source of truth** for the canonical patterns codified through Sprint 6–9. Every pattern below is anchored to a real file in the repository, a real Pull Request, and a Definition-of-Done item from [`docs/reference/WEB_STANDARDS.md`](./reference/WEB_STANDARDS.md). PBVC §3.11 (Premise-Based Vault Correction) mandates that no new component be written if a pattern here already answers the responsibility — refuse the duplicate, close the actual gap.

Adoption count is the number of files in the repository that consume the canonical pattern at the time of this catalog snapshot (counted via `grep -rln <symbol> src/ server/`). Drift is the number of files that solve the same responsibility *without* the canonical pattern — Sprint 10 Phase 10C-F closes the form-drift counter.

---

## 0. How to use this catalog

1. **Before writing new code**, search this document for the responsibility you are about to implement.
2. If a canonical pattern exists, consume it and add the consumer entry; do not duplicate.
3. If your case is a genuine gap, open a new pattern with NotebookLM Patterns Librarian + Standards Lead convergent consensus and add it here under the next section number.
4. Drift discovered during PBVC must be tracked under §27 (Open Drift Register).
5. Every PR body that introduces or amends a pattern MUST include a `## NotebookLM Consensus` section (DoD #24).

---

## 1. ApiResponse — Discriminated success/error envelope (`success` + `partialFailure`)

**Source file:** [`src/types/api.ts`](../src/types/api.ts) · **PR:** #165, #167 · **DoD anchor:** #16 (loading/error states)

**Responsibility.** Wire every HTTP API response into a discriminated union so consumers can branch on `ok: true | false` without optional-chaining roulette. Reports `partialFailure` shape when an Outbox WAL accepted the payload but a downstream side-effect did not.

**Why canonical.** Eliminates 3 prior shapes (`{error}`, `{message}`, bare 200 with truthy fail). Powers `useNotify` (§2) and `FormErrorSummary` (§9) directly.

**Consumer pattern.**
```ts
import type { ApiResponse } from '@/types/api';
const body = (await res.json()) as ApiResponse<ContactSuccess>;
if (body.ok) {
  /* success branch */
} else if (body.meta?.partialFailure) {
  /* lead saved, Notion sync deferred */
} else {
  /* hard error: surface body.code, body.message */
}
```

**Adoption.** All routes under `server/routes/v1/*` + the `useApi` hook.
**Drift.** None at Sprint 9 closure.

---

## 2. useNotify — Canonical toast/banner notification hook

**Source file:** [`src/hooks/useNotify.ts`](../src/hooks/useNotify.ts) · **Tests:** [`useNotify.test.tsx`](../src/hooks/useNotify.test.tsx) · **PR:** #167

**Responsibility.** Surface ApiResponse outcomes to the user through a unified `notify({ severity, title, description, action })` API. Hooks into the global toast region; reads `success`, `partialFailure`, `rate_limited`, and hard-error branches without UI duplication.

**Why canonical.** Replaced 4 inline `setSuccessBanner`/`setErrorBanner` pairs and 2 component-local toast state machines. Always announce-aware (ARIA `role="status"` for success, `role="alert"` for error).

**Consumer guidance.** Compose with `createForm` (§7); never call directly inside a render. Always pass `description` keyed to an i18n string, not a raw label.

---

## 3. Skeleton primitive — Single loading shimmer source

**Source file:** [`src/components/ui/Skeleton.tsx`](../src/components/ui/Skeleton.tsx) · **Tests:** [`Skeleton.test.tsx`](../src/components/ui/Skeleton.test.tsx) · **PR:** #164

**Responsibility.** Provide the only Tailwind-driven shimmer block used across data-fetch sites. Variants: `box | text | avatar | line`. Honors `prefers-reduced-motion`.

**Why canonical.** Sprint 6 audit found 3 ad-hoc shimmer implementations across admin, insights, and dashboard. PR #164 unified to one component; PR #167 extended the variant set.

**Consumer pattern.**
```tsx
<Skeleton variant="text" lines={3} aria-hidden />
```

**Drift.** Closed at Sprint 6 P8.

---

## 4. createForm — Form Unification Factory

**Source file:** [`src/lib/forms/createForm.tsx`](../src/lib/forms/createForm.tsx) · **Test:** [`src/test/createForm.test.tsx`](../src/test/createForm.test.tsx) · **PR:** P15

**Responsibility.** Returns `useTypedForm`, a hook that wires:
- Zod schema validation via `@hookform/resolvers/zod`
- Submit-lock (`AbortController` + `mountedRef` + double-submit guard)
- Honeypot trap (`hp_field` silent-reject)
- `Idempotency-Key` header (`crypto.randomUUID`)
- `trackForm` analytics events (`start`, `submit_success`, `submit_error`)
- i18n error keys via zod messages (see §5)

**Why canonical.** Locked the contract that every public-facing form must obey. PBVC §3.11 verification 2026-06-02: confirmed live; no duplicate write needed.

**Sprint 10 Phase 10C-F.** Migrate the 11 forms still hand-rolling `zodResolver` onto this factory (see §27 Open Drift Register).

---

## 5. Zod i18n error map — `installZodI18n` global error map

**Source file:** [`src/lib/forms/zod-error-map.ts`](../src/lib/forms/zod-error-map.ts) · **Test:** [`src/test/zod-error-map.test.ts`](../src/test/zod-error-map.test.ts) · **PR:** P16

**Responsibility.** Idempotent global Zod error-map install that routes every `z.string().min(…)` and friends to i18n key paths (`contact.form.required`, etc.) so error rendering is locale-driven via `t()`.

**Why canonical.** Without this map, Zod emits English strings to the UI in `/tr` builds. Side-effect import is intentional: `createForm` runs `installZodI18n()` once at module load.

---

## 6. consent canonical-v1 — Single consent storage shape

**Source file:** [`src/lib/consent.ts`](../src/lib/consent.ts) + [`src/lib/consent-v1.ts`](../src/lib/consent-v1.ts) · **Test:** [`src/lib/consent.canonical-v1.test.ts`](../src/lib/consent.canonical-v1.test.ts) · **PR:** #173 (analytics consumer alignment), #179 (CookieBanner write contract)

**Responsibility.** One in-storage shape `{ functional, statistics, marketing, _v: 1, _ts }` written by `CookieBanner` and read by every consent-aware consumer (AnalyticsProvider, Sentry, ExitIntent, Newsletter). Backed by the custom event `ecypro:consent-changed` for cross-tab parity.

**Why canonical.** Pre-#179 had a v0 read-path and a v1 write-path; analytics consumed v0 keys that CookieBanner never wrote → silent opt-out leak.

**Consumer pattern.** `subscribeConsent()` listener + `getConsent()` reader. Never read `localStorage` directly.

---

## 7. AnalyticsProvider — Consent-aware analytics boot

**Source file:** [`src/components/providers/AnalyticsProvider.tsx`](../src/components/providers/AnalyticsProvider.tsx) · **Test:** [`AnalyticsProvider.test.tsx`](../src/components/providers/AnalyticsProvider.test.tsx) · **PR:** #173

**Responsibility.** Listen for `ecypro:consent-changed` and toggle PostHog + GrowthBook clients only when the user has granted `statistics: true`. Default state on first load: opt-out.

**Why canonical.** Was the missing link causing CookieBanner toggles to have no observable effect. Now the analytics tier is provably consent-gated for KVKK m.4 + GDPR Art. 7 evidence.

---

## 8. Sentry PII scrubber — Pure ESM scrub helper

**Source file:** [`src/lib/sentry-scrubber.ts`](../src/lib/sentry-scrubber.ts) · **Tests:** [`src/test/sentry-scrubber.test.ts`](../src/test/sentry-scrubber.test.ts) (13 cases) + 6 Playwright PII fixtures · **PR:** #171, #172, #177

**Responsibility.** Pure function `scrubSentryEvent(event)` that removes:
- Top-level `request.url` query strings
- `event.user.{email,ip_address}` if present
- Breadcrumb messages and breadcrumb `data.{email,phone,tckn}`
- `event.extra.{ip,query,metadata}` (server-side, #177)
- `event.contexts.state` keys matching `REDACTED_KEYS`

**Why canonical.** DoD #1 (PII never logged) requires a single scrub seam audit-grade testable. Frontend Sentry init + server Sentry handler both consume this module — same rules, one source of truth.

**Consumer guidance.** Both frontend and server Sentry `beforeSend` MUST call this; no inline scrub.

---

## 9. FormErrorSummary — A11y form error summary block

**Source file:** [`src/components/forms/FormErrorSummary.tsx`](../src/components/forms/FormErrorSummary.tsx) · **Test:** [`FormErrorSummary.test.tsx`](../src/components/forms/FormErrorSummary.test.tsx) · **PR:** #163

**Responsibility.** Render a `role="alert"`, focus-on-mount summary of validation errors with anchor links to each invalid field's `id`. Mandatory for any form rendered above the fold.

**Why canonical.** WCAG 2.1 AA error identification (3.3.1) + axe-core runtime check (DoD #5).

**Consumer pattern.** Place at the top of the form, pass `errors` from `useFormState`.

---

## 10. i18n canonical slug map — `swapLocaleInPath`

**Source file:** [`src/i18n/canonical.ts`](../src/i18n/canonical.ts) + [`src/i18n/helpers.ts`](../src/i18n/helpers.ts) · **Tests:** [`canonical.test.ts`](../src/i18n/canonical.test.ts), [`localized-slugs.test.ts`](../src/i18n/localized-slugs.test.ts) · **PR:** #168, #169

**Responsibility.** Cross-locale slug alias table (`/en/services` ↔ `/tr/hizmetler`) plus a pure path-translator used by canonical `<link>`, `Sitemap`, `LanguageSwitcher`, and the OG/Twitter card metadata blocks.

**Why canonical.** Pre-#168 the switcher prepended `/tr/` to the English slug → 404 on TR. The map + helper end class of bugs and supply translated sitemap entries.

---

## 11. hashIp — Canonical SHA-256 IP hash helper

**Source file:** [`server/lib/crypto/hashIp.ts`](../server/lib/crypto/hashIp.ts) · **Test:** [`hashIp.test.ts`](../server/lib/crypto/hashIp.test.ts) · **PR:** #135 (introduction), #155 (canonicalization), #160 (documentation)

**Responsibility.** Return 32-char lowercase SHA-256 hash of an IPv4/IPv6 address. Used by NewsletterConsent, RateLimit fingerprint, Sentry context — anywhere an IP is ever in scope.

**Why canonical.** KVKK Art. 32 + GDPR Art. 32 require pseudonymization at minimum; raw IPs are PII. The Sprint 7 audit found 3 places hashing inline with different algorithms → split key-space.

**Consumer guidance.** Never call Node's `crypto.createHash` directly for an IP; always go through this helper.

---

## 12. requireRole — Backend RBAC middleware accepting role arrays

**Source file:** [`server/middleware/auth.ts`](../server/middleware/auth.ts) (`requireRole`) · **Test:** [`server/middleware/require-role.test.ts`](../server/middleware/require-role.test.ts) · **PR:** #170

**Responsibility.** Express middleware: `requireRole(['admin', 'editor'])` → 403 if user role not in the readonly array; passes through on success. Pre-#170 only accepted a single string role.

**Why canonical.** Powers admin DSAR, Breach, Independence, Insights surfaces. The frontend `useCan` and `<RoleGate />` mirror this shape so authorization decisions are made the same way on both sides.

---

## 13. requirePermission — Permission-grained gate (action-based)

**Source file:** [`server/middleware/require-permission.ts`](../server/middleware/require-permission.ts) + [`server/middleware/requirePermission.ts`](../server/middleware/requirePermission.ts) · **ADR:** [`ADR-004-rbac-permission-model.md`](./adr/ADR-004-rbac-permission-model.md)

**Responsibility.** Action-level guard (`dsar:read`, `breach:write`) layered atop role membership for finer auditability. Pairs with `useCan(action)` on the frontend.

---

## 14. Idempotency-Key middleware

**Source file:** [`server/middleware/idempotency.ts`](../server/middleware/idempotency.ts) · **Test:** [`idempotency.test.ts`](../server/middleware/idempotency.test.ts)

**Responsibility.** Read `Idempotency-Key` header sent by `createForm`-driven submits, look up replay cache (Redis), short-circuit duplicates with the original response. Required for double-submit safety in lead capture.

---

## 15. Tier-based rate limiting

**Source file:** [`server/middleware/rate-limit-tier.ts`](../server/middleware/rate-limit-tier.ts) · **Tests:** [`rate-limit-tier.test.ts`](../server/middleware/rate-limit-tier.test.ts), [`rate-limit-health.integration.test.ts`](../server/middleware/rate-limit-health.integration.test.ts) · **DoD anchor:** §9 Security

**Responsibility.** Apply different request budgets per route tier (`public`, `authenticated`, `admin`, `webhook`). Health probes are explicitly exempt; abuse fingerprints use hashed IP (§11).

---

## 16. Origin guard — CSRF origin check

**Source file:** [`server/middleware/originGuard.ts`](../server/middleware/originGuard.ts) · **Test:** [`originGuard.test.ts`](../server/middleware/originGuard.test.ts)

**Responsibility.** Reject non-GET requests whose `Origin` (or fallback `Referer`) does not match the allowlist. Layered with the CSP and SameSite cookie defaults.

---

## 17. CSP nonce middleware

**Source file:** [`server/middleware/cspNonce.ts`](../server/middleware/cspNonce.ts)

**Responsibility.** Mint a per-request nonce, expose it to the HTML response, and feed it to the `Content-Security-Policy` header so inline scripts under our control are allowed while pure XSS injections fail.

---

## 18. Cache-Control discipline — `no-store` for liveness

**Source file:** [`server/middleware/cache-control.ts`](../server/middleware/cache-control.ts) · **Test:** [`cache-control.test.ts`](../server/middleware/cache-control.test.ts)

**Responsibility.** Force `Cache-Control: no-store` on health, auth, and any response that carries personal data. Prevents CDN/edge from serving stale liveness or PII-tainted payloads.

---

## 19. Health-probe middleware

**Source file:** [`server/middleware/health-probe.ts`](../server/middleware/health-probe.ts) · **Test:** [`health-probe.test.ts`](../server/middleware/health-probe.test.ts) · **Sprint 10 Phase 10B:** dependency probe extension

**Responsibility.** Drain-aware probe semantics. SIGTERM flips `isShuttingDown`; `/readyz` returns 503 + `Retry-After`. Sprint 10 Phase 10B will extend with DB and Redis probes (per NotebookLM Standards Lead "False Green" verdict).

---

## 20. Error middleware — Structured failure response

**Source file:** [`server/middleware/error.ts`](../server/middleware/error.ts)

**Responsibility.** Catch-all Express error handler that converts thrown errors into `ApiResponse` (§1) failure envelopes; logs through the Winston pipeline (§22) without leaking stacks to clients.

---

## 21. API key auth middleware

**Source file:** [`server/middleware/api-key-auth.ts`](../server/middleware/api-key-auth.ts) · **Test:** [`api-key-auth.test.ts`](../server/middleware/api-key-auth.test.ts)

**Responsibility.** Validate `X-API-Key` for machine-to-machine endpoints (webhooks, scheduled jobs). Pairs with the JWT auth path for user sessions.

---

## 22. Winston logger — REDACTED_KEYS PII discipline

**Source file:** [`server/config/logger.ts`](../server/config/logger.ts) · **PR:** #178 (PII categories extend)

**Responsibility.** Single Winston logger instance with `REDACTED_KEYS` covering email, phone, tckn, ipAddress, userAgent, full names, and any custom KVKK-sensitive field. No `console.log` in production paths — lefthook scans staged diffs.

**Why canonical.** DoD #1 (PII never logged) enforcement seam.

---

## 23. Outbox WAL — Notion sync durability

**Source file:** [`server/lib/outbox.ts`](../server/lib/outbox.ts) · **Test:** [`outbox.test.ts`](../server/lib/outbox.test.ts) · **PR:** #46 · **ADR:** [`0001-integration-outbox-wal.md`](./adr/0001-integration-outbox-wal.md)

**Responsibility.** Persist outbound side-effect jobs (Notion lead sync, webhook fanout) to a transactional outbox so a downstream outage never loses an acknowledged lead. Pairs with `ApiResponse.meta.partialFailure` (§1).

---

## 24. Preflight — Environment + secret sanity at boot

**Source file:** [`server/lib/preflight.ts`](../server/lib/preflight.ts) · **PR:** #43 (introduction), #174 (Calendly canonical alignment)

**Responsibility.** Boot-time check that every required env var is present, secret-shaped (`32+ char`), and points at an actually reachable service. Crash-loop early on misconfiguration; never run with half-config.

**Why canonical.** Foundation First #3. The Sprint 9 `CALENDLY_WEBHOOK_SIGNING_KEY` rename (#174) demonstrated the cost when one consumer drifts off the canonical env name.

---

## 25. Sprint-9 added: ecypro_consent_v1 storage key

**Source file:** [`src/lib/consent.ts`](../src/lib/consent.ts) (`STORAGE_KEY = 'ecypro_consent_v1'`) · **PR:** #179 + cross-reference §6 (consent canonical-v1)

**Responsibility.** Anchor the storage key as a string constant exported from the consent module. Any code that touches `localStorage.getItem('ecypro_consent_v1')` directly is a violation — go through `getConsent()`.

---

## 26. Sprint-9 added: ExitIntent + Newsletter consent-checkbox pattern

**Source files:** Exit-intent component (PR #175), `NewsletterSection` (PR #176)
**PR:** #175 (explicit KVKK consent checkbox + 3 vitest), #176 (pre-tick removal + real state thread)

**Responsibility.** Any newsletter or marketing CTA placed on top of an interactive moment (exit intent, mid-CTA) MUST render an unchecked-by-default KVKK consent checkbox and forward the value into the canonical consent store (§6). No silent opt-in.

**Why canonical.** GDPR Art. 7(2) (consent must be unbundled and unambiguous) + KVKK Kurul rehberi (açık rıza). Pre-#176 the footer pre-ticked the checkbox → audit-grade non-compliant.

---

## 27. Open Drift Register

The patterns below have a canonical implementation but live consumer drift exists. Sprint 10 Phase 10C–10F closes the form-drift counter.

| # | Canonical pattern | Drift count | Drift files | Target phase |
|---|---|---|---|---|
| 27.1 | `createForm` (§4) | **11 forms** | `NewsletterSidebar`, `CommentForm`, `NewsletterMidCTA`, `CommentsSection`, `Contact.tsx` (legacy), `BookingWizard`, `GrowthCalculator`, `IndependenceCheckForm`, `LeadCaptureForm`, `DSARRequestForm` (admin), `BreachDetailForm`, `AdminInsightsCategoriesPage` | Phase 10C/D/E/F |
| 27.2 | Centralized Zod schema (`src/schemas/*`) | **9 inline schemas** | Same forms as 27.1 minus those that already export schema in component module | Phase 10C/D/E/F |
| 27.3 | `/healthz` + `/readyz` dependency probe | **0 probes** (basic shape only) | `server/index.ts` lines 210–222 | Phase 10B |
| 27.4 | Customer-facing DSAR portal (§28 placeholder) | **N/A — gap** | No `src/pages/account/DataRightsPage.tsx` | Phase 10G (RISK) |

---

## 28. Placeholders pending Sprint 10 / 11

The following patterns are reserved for upcoming phases and will land in subsequent revisions of this document with full file anchors and consumer counts.

- **§28.1 Customer DSAR portal pattern** (Phase 10G). Compliance Lead vault citation required before write. Will codify the Art. 16/18/20/21 operator UI under `src/pages/account/`.
- **§28.2 Calendly webhook HMAC verifier** (Phase 11). Source file `server/routes/calendly-webhook.ts` (exists) — pattern doc pending sahip webhook config (Sprint 11).
- **§28.3 Better Stack heartbeat hook** (Phase 11). Source TBD.

---

## 29. Catalog change log

| Date | Author | Change | Source |
|---|---|---|---|
| 2026-06-02 | Phase 10A | Initial catalog — patterns §1–26 + drift register §27 | NotebookLM cross-vault consensus 2026-06-02 (Architect + Patterns Librarian + Standards Lead, 3/5 convergent, 0 divergence). See [`brain/sprint-10/notebooklm-consensus-2026-06-02.md`](../brain/sprint-10/notebooklm-consensus-2026-06-02.md). |

---

## 30. NotebookLM Consensus (Phase 10A authorization)

This catalog is authorized by a **CONVERGENT 3/5 vault** verdict on 2026-06-02:

- **Architect (`212e2553-…`):** *"CANONICAL_DOCS is zero-dependency and provides the 'Source of Truth' for the 25 patterns needed to guide the other tasks. … Foundation to Surface trajectory."*
- **Patterns Librarian (`c8cf1440-…`):** *"CANONICAL_DOCS requires engineering:documentation to bridge the Librarian's catalog into a persistent docs/ file."*
- **Standards Lead (`6111898f-…`):** *"CANONICAL_DOCS: MUST. Satisfies DoD #24; the NotebookLM Consensus gate is meaningless if patterns aren't codified."*
- Launch Commander + Compliance Lead vaults responded `RESOURCE_EXHAUSTED` (Google rate limit) and will be re-queried for Phase 10G; their absence does not block Phase 10A because the doc-only, additive nature of this change is below the threshold that requires their input.

Full transcript: [`brain/sprint-10/notebooklm-consensus-2026-06-02.md`](../brain/sprint-10/notebooklm-consensus-2026-06-02.md).

---

**End of CANONICAL_PATTERNS.md — Sprint 10 Phase 10A**
