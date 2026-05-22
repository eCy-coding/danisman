<!--
  eCyPro Pull Request
  This template enforces the Definition of Done from docs/WEB_STANDARDS.md.
  Fill every section. Do not delete headings — write "N/A" if not applicable.
-->

## Why

<!-- The problem or goal. Link issue/ticket if any. -->

## What

<!-- What changed, at a glance. Scope of files/areas touched. -->

## How verified

<!-- Commands run + result. Screenshots/recordings for UI. Both TR and EN if user-facing. -->

## Risk

<!-- Blast radius, rollback plan, and any SHOULD-clause deviations (justify per WEB_STANDARDS §1.2). -->

---

## Definition of Done

> Normative gate — see [docs/WEB_STANDARDS.md](../docs/WEB_STANDARDS.md). Every box must be checked (or marked N/A with reason) before requesting review.

- [ ] **TR + EN parity** — `npm run i18n:parity` passes (no drift, no empty values)
- [ ] **hreflang validator** — `tr-TR`, `en`, `x-default` present and correct
- [ ] **Lighthouse mobile** — Performance ≥ 85
- [ ] **axe-core** — 0 violations
- [ ] **typecheck** — `npm run typecheck` PASS
- [ ] **lint** — `npm run lint` PASS
- [ ] **test** — `npm run test -- --run` PASS
- [ ] **Bundle size** — initial JS ≤ 500 KB
- [ ] **Canonical** — emitted via `buildCanonical()` only (no inline)
- [ ] **Brand casing** — every brand mention is exactly `eCyPro`
- [ ] **No hardcoded strings** — all user-facing text from `t()`
- [ ] **Alt text + ARIA** — all `img` have `alt`; icon-only buttons labeled
- [ ] **No `any`** — or justified with inline comment
- [ ] **No `console.log`** — server uses winston logger
- [ ] **No magic number/string** — Fibonacci/φ scale used
- [ ] **Loading / empty / error states** — handled for async UI
- [ ] **Mobile responsive** — verified at 320 / 768 / 1024 / 1440
- [ ] **Touch targets** — ≥ 44 × 44 px
- [ ] **Keyboard navigable** — all interactive elements tab-reachable, no traps
- [ ] **Color contrast** — text ≥ 4.5:1, UI ≥ 3:1
- [ ] **og:locale + og:url** — present and locale-aware
- [ ] **JSON-LD valid** — Organization + applicable schemas validate
- [ ] **Sitemap current** — new routes reflected in sitemaps
- [ ] **PR template** — all sections (Why / What / How verified / Risk) filled
- [ ] **Squash merge** — `--delete-branch` on merge
