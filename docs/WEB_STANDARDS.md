# eCyPro Web Page Standard

**Version:** 1.0
**Status:** Normative
**Owner:** eCyPro Engineering
**Applies to:** Every public-facing page, route, and shared UI surface in this repository.

> The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

---

## Table of Contents

1. [Scope & Authority](#1-scope--authority)
2. [Brand & Voice](#2-brand--voice)
3. [Page Anatomy](#3-page-anatomy)
4. [SEO Requirements](#4-seo-requirements)
5. [Internationalization (TR + EN)](#5-internationalization-tr--en)
6. [Accessibility (WCAG 2.1 AA)](#6-accessibility-wcag-21-aa)
7. [Performance Budgets](#7-performance-budgets)
8. [Component Patterns](#8-component-patterns)
9. [Testing Requirements](#9-testing-requirements)
10. [Git & PR Workflow](#10-git--pr-workflow)
11. [Code Style](#11-code-style)
12. [Security & Privacy (KVKK)](#12-security--privacy-kvkk)
13. [Verification Checklist](#13-verification-checklist)

---

## 1. Scope & Authority

### 1.1 What this document is

This is the **eCyPro Web Page Standard** — the single normative charter that defines what "done" means for any page or UI surface shipped in this repository. It is the **Definition of Done (DoD)** gate referenced by [`.github/pull_request_template.md`](../.github/pull_request_template.md).

### 1.2 Normative force

- Every requirement marked **MUST** / **MUST NOT** is a hard merge gate. A pull request that violates a **MUST** clause **SHALL NOT** be merged.
- Requirements marked **SHOULD** are strong defaults. Deviation **MUST** be justified in the PR body under the "Risk" section.
- Requirements marked **MAY** are permitted options with no obligation.

### 1.3 Precedence

When guidance conflicts, the following order applies (highest wins):

1. Legal / KVKK compliance (see [§12](#12-security--privacy-kvkk)).
2. This document.
3. [`CLAUDE.md`](../CLAUDE.md) project conventions.
4. Team convention / reviewer preference.

### 1.4 Override path

A requirement **MAY** be overridden only by:

1. Opening a PR that edits this document and bumps the version, **and**
2. Obtaining approval from the Engineering owner (see header).

Ad-hoc verbal exceptions are **NOT** valid. If a rule blocks a legitimate ship, change the rule in the open — do not bypass it silently.

### 1.5 Versioning

This document uses semantic versioning. Breaking changes to a **MUST** clause bump the **major**; new **SHOULD**/**MAY** clauses bump the **minor**; clarifications bump the **patch**. The current version is recorded in the header.

---

## 2. Brand & Voice

### 2.1 Brand name casing (hard rule)

The brand name is **`eCyPro`** and **MUST** be rendered exactly as such everywhere it appears in user-facing copy, metadata, JSON-LD, and documentation. The exact glyph sequence is:

| Position | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Glyph | `e` | `C` | `y` | `P` | `r` | `o` |
| Case | lower | **UPPER** | lower | **UPPER** | lower | lower |

> **Canonical spelling:** `eCyPro` — `e` lower, `C` upper, `y` lower, `P` upper, `r` lower, `o` lower.

The following are **MUST NOT** (incorrect) variants:

| Wrong | Why |
|---|---|
| `Ecypro` | leading cap, missing internal caps |
| `ECYPRO` | all caps |
| `ecypro` | all lower (acceptable **only** inside URLs/domains, e.g. `ecypro.com`) |
| `EcyPro` | wrong leading case |
| `eCYpro` / `ecyPro` | wrong internal casing |

**Exception:** In domains, email addresses, and URLs the lowercase form `ecypro.com` is correct and **MUST** be used (DNS is case-insensitive; canonical URLs use lowercase — see [§4.1](#41-canonical-urls)).

### 2.2 Untranslatable brand phrases

The following phrases are **brand assets** and **MUST NOT** be translated into Turkish (or any language). They appear verbatim in both the TR and EN UIs:

- **`Independent by Design`**
- **`Big4 Antidote`**

Correct usage in a Turkish sentence:

```tsx
// TR copy — brand phrase stays English, verbatim
<p>{t('hero.tagline')}</p>
// resolves to: "Big4 Antidote. Bağımsız danışmanlık, kurumsal disiplin."
```

```tsx
// MUST NOT — never localize the phrase
"Büyük Dörtlü Panzehiri"   // ❌ forbidden
"Tasarımdan Bağımsız"      // ❌ forbidden
```

### 2.3 Voice & tone

- **Formal register.** Turkish copy **MUST** use the formal second person ("Siz" / "siz" forms — e.g. "talebinizi", "size özel"), never the informal "sen". English copy **MUST** use a professional "You".
- **Hedge-free.** Copy **MUST NOT** hedge ("maybe", "we think", "belki", "sanırız"). State value with confidence and precision.
- **Precise, not promotional.** Prefer concrete claims over superlatives.

Examples:

```text
TR (correct, formal Siz):  "Süreçlerinizi bağımsız bir gözle denetliyoruz."
TR (wrong, informal):      "Süreçlerini denetliyoruz."           // ❌ uses "sen"
EN (correct):              "We audit your processes with an independent lens."
EN (wrong, hedged):        "We can probably help review some processes."  // ❌ hedge
```

### 2.4 Regulatory terminology

The Turkish data protection law **MUST** be referred to in English copy as:

> **"Turkish Personal Data Protection Law (KVKK)"**

The bare acronym `KVKK` **MAY** be used on subsequent mentions within the same page once the full term has been introduced. In Turkish copy the standard term `KVKK` (or "6698 sayılı Kişisel Verilerin Korunması Kanunu") is used. See [§12.5](#125-kvkk-compliance).

---

## 3. Page Anatomy

Every page **MUST** be composed of the following regions, in document order. Each region has required landmarks for accessibility (see [§6](#6-accessibility-wcag-21-aa)).

### 3.1 Header (`<header>`, landmark `banner`)

The header **MUST** contain:

1. **Logo** — links to the locale home (`/{locale}`). The logo `alt` text **MUST** read `eCyPro` (correct casing).
2. **Primary navigation** (`<nav aria-label="...">`) — all top-level routes, keyboard-reachable.
3. **Language switch** — the `LanguageToggle` control (`src/components/ui/LanguageToggle.tsx`). See [§5.4](#54-language-switching).

### 3.2 Hero

The first viewport section. It **MUST** contain exactly **one** `<h1>` per page (see [§6.3](#63-headings--structure)) and **SHOULD** contain:

1. **H1** — the page's single most important heading.
2. **Subheading / supporting line** — value proposition.
3. **Primary CTA** — a single, unambiguous call to action. A secondary CTA is **OPTIONAL**.

### 3.3 Body sections

- Each body section **MUST** be a landmark (`<section>` with an accessible name, or `<article>` where appropriate).
- Heading levels **MUST** descend without skipping (h1 → h2 → h3). See [§6.3](#63-headings--structure).
- Each section **MUST** handle **loading**, **empty**, and **error** states when it renders async data.

### 3.4 Footer (`<footer>`, landmark `contentinfo`)

The footer **MUST** contain:

1. **Legal links** — Privacy / KVKK notice, Terms, Cookie policy.
2. **Sitemap / secondary navigation** — links to all primary routes.
3. **Contact** — at minimum one contact channel.
4. **Copyright line** — `© {year} eCyPro` (correct casing).

---

## 4. SEO Requirements

Every page **MUST** render an `<SEO>` instance (`src/components/common/SEO.tsx`). The component centralizes canonical, alternate, Open Graph, Twitter, and JSON-LD emission.

> **Implementation status:** The locale-aware helpers `buildCanonical()` / `buildAlternateLinks()` (`src/i18n/canonical.ts`) are introduced by the canonical-cleanup work (branch `fix/inline-canonical-cleanup`) and are not yet on `main` at the time of writing. They are the **mandated** mechanism going forward; once merged, every `<SEO>` instance **MUST** route canonical/alternate emission through them and **MUST NOT** keep the legacy inline `${SITE_URL}${canonical}` form.

### 4.1 Canonical URLs

- Every page **MUST** emit a canonical link built **only** via `buildCanonical()` from `src/i18n/canonical.ts`.
- The canonical pattern is fixed:

  ```
  https://www.ecypro.com/{locale}{path}
  ```

- Inline / hand-written canonical strings are **MUST NOT**. The util guarantees the `www` host and the `/{locale}` prefix and strips any pre-existing locale segment.

  ```tsx
  // CORRECT — single source of truth
  const canonical = buildCanonical(pathname, language); // → https://www.ecypro.com/tr/services

  // MUST NOT — inline canonical bypass
  <link rel="canonical" href={`https://ecypro.com${pathname}`} /> // ❌ non-www, no locale
  ```

### 4.2 hreflang alternates

- Every page **MUST** emit hreflang alternate links via `buildAlternateLinks()` (`src/i18n/canonical.ts`).
- The required set is exactly three entries:

  | hreflang | target |
  |---|---|
  | `tr-TR` | `https://www.ecypro.com/tr{path}` |
  | `en` | `https://www.ecypro.com/en{path}` |
  | `x-default` | `https://www.ecypro.com/tr{path}` |

- `x-default` **MUST** point at the Turkish (`/tr`) variant (primary market default).

### 4.3 Structured data (JSON-LD)

JSON-LD **MUST** be emitted as `<script type="application/ld+json">`. Required and conditional graphs:

| Schema | When | Obligation |
|---|---|---|
| `Organization` | Every page | **MUST** |
| `BreadcrumbList` | Any page below the home level | **MUST** |
| `Service` | Service / offering pages | **MUST** |
| `Article` | Blog / insight posts | **MUST** |
| `CaseStudy` (`Article` subtype or `CreativeWork`) | Case study pages | **MUST** |
| `FAQPage` | Pages with a visible FAQ block | **MUST** |

All JSON-LD **MUST** validate (Rich Results / schema.org) and use correct `eCyPro` casing in `name`.

### 4.4 Title tag

- **MUST** be ≤ **60 characters**.
- **MUST** end with the brand suffix `| eCyPro`.
- **MUST** be unique per page.

```text
"Independent Management Consulting | eCyPro"   // 43 chars ✓
```

### 4.5 Meta description

- **MUST** be **150–160 characters**.
- **MUST** be action-oriented and unique per page.
- **MUST NOT** be auto-truncated body text.

### 4.6 Open Graph & Twitter

Every page **MUST** emit:

- `og:title` — locale-aware (matches the page title intent).
- `og:type` — `website` / `article` as appropriate.
- `og:url` — locale-aware, **MUST** equal the canonical (built from `buildCanonical()`).
- `og:locale` — `tr_TR` or `en_US` matching the active locale.
- `twitter:card` — `summary_large_image`.

> Implementation note: `SEO.tsx` currently emits `og:title`, `og:type`, `og:url`, and `twitter:card`. `og:locale` **MUST** be present per page; if a page renders without it, that is a standard violation to fix in the same PR.

---

## 5. Internationalization (TR + EN)

The site is bilingual — Turkish (primary) and English. i18n is powered by `i18next` / `react-i18next` (config in `src/lib/i18n.tsx`).

### 5.1 Namespaces

Translations live under `public/locales/{tr,en}/`. The repository defines **11 namespaces**, and both languages **MUST** contain all of them:

| # | Namespace | Purpose |
|---|---|---|
| 1 | `common` | Shared UI strings (buttons, labels) |
| 2 | `translation` | Default namespace / page copy |
| 3 | `services` | Services pages |
| 4 | `pricing` | Pricing pages |
| 5 | `contact` | Contact page + forms |
| 6 | `forms` | Form fields, validation messages |
| 7 | `newsletter` | Newsletter capture |
| 8 | `liveChat` | Live chat widget |
| 9 | `legal` | Legal / KVKK / cookie copy |
| 10 | `blog` | Blog / insight posts |
| 11 | `caseStudies` | Case study pages |

Adding a key to one language **MUST** be mirrored in the other (see [§5.2](#52-treng-parity)). New namespaces require a doc update (this table is normative).

### 5.2 TR=EN parity

- Every key present in `tr` **MUST** exist in `en`, and vice versa, with the same type (string vs object) at the same path.
- No value **MUST** be left as an empty string (untranslated placeholder).
- Parity **MUST** be verified by the audit script before merge:

  ```bash
  npm run i18n:parity      # → tsx scripts/i18n-audit.ts ; exit 1 on any drift
  ```

  A non-zero exit blocks merge.

### 5.3 Routing (`LocaleRoute`)

- All pages **MUST** be served under a `/{locale}/*` prefix via `LocaleRoute` (`src/components/routing/LocaleRoute.tsx`).
- A request without a locale prefix **MUST** redirect to the resolved locale (default `/tr`).
- The locale segment **MUST** be one of `tr` | `en`.

### 5.4 Language switching

- The language control (`LanguageToggle`, `src/components/ui/LanguageToggle.tsx`) **MUST** keep the user on the **same page** when switching languages.
- Switching **MUST** swap **only** the locale segment of the path (e.g. `/tr/services` → `/en/services`), preserving the rest of the path and query.
- The control **MUST** expose an accessible name describing the action (see [§6.5](#65-aria--labels)).

### 5.5 No hardcoded strings

- User-facing text **MUST** come from `t()` / a translation key. Hardcoded literals in JSX are **MUST NOT**.

  ```tsx
  // CORRECT
  <button>{t('common:cta.bookCall')}</button>

  // MUST NOT — hardcoded, breaks parity + i18n
  <button>Görüşme Ayarla</button> // ❌
  ```

- This applies to `alt`, `aria-label`, `title`, placeholder, and error text as well.

---

## 6. Accessibility (WCAG 2.1 AA)

All pages **MUST** conform to **WCAG 2.1 Level AA**. `axe-core` **MUST** report **zero** violations on every page (see [§9](#9-testing-requirements)).

### 6.1 Color contrast

- Body and UI text **MUST** meet a contrast ratio of **≥ 4.5:1**.
- Large text (≥ 24px, or ≥ 18.66px bold) and non-text UI components / focus indicators **MUST** meet **≥ 3:1**.

### 6.2 Keyboard navigation

- Every interactive element **MUST** be reachable and operable by keyboard (Tab / Shift+Tab / Enter / Space / Esc as appropriate).
- Focus order **MUST** follow visual / reading order.
- A visible focus indicator **MUST** be present and meet the 3:1 contrast rule.
- No keyboard trap (Esc / Tab **MUST** escape modals and menus).

### 6.3 Headings & structure

- Exactly **one** `<h1>` per page.
- Heading levels **MUST** descend without skipping.
- Landmarks (`banner`, `nav`, `main`, `contentinfo`) **MUST** be present and unique where required.

### 6.4 Touch targets

- Interactive controls **MUST** be at least **44 × 44 CSS px** (or have an equivalent hit area via padding).

### 6.5 ARIA & labels

- Icon-only buttons **MUST** have an `aria-label`.
- Decorative SVGs / icons **MUST** be hidden from AT (`aria-hidden="true"` or `role="presentation"`).
- ARIA **MUST NOT** be used to patch broken semantics where a native element exists (prefer `<button>` over `role="button"`).

### 6.6 Images & alt text

- Every `<img>` **MUST** have an `alt` attribute.
- Informative images **MUST** have descriptive `alt`; decorative images **MUST** use empty `alt=""`.

### 6.7 Forms

- Every form control **MUST** have an associated `<label>` (or `aria-label`/`aria-labelledby`).
- Validation errors **MUST** be programmatically associated (`aria-describedby`) and announced.
- Error text **MUST** be specific and come from `t()` (see [§5.5](#55-no-hardcoded-strings)).

### 6.8 Skip link

- Each page **MUST** provide a "Skip to content" link as the first focusable element, targeting the `main` landmark.

---

## 7. Performance Budgets

Budgets are enforced against **mobile** unless stated otherwise. Lighthouse runs via `npm run lh:audit`.

### 7.1 Core Web Vitals

| Metric | Budget |
|---|---|
| LCP (mobile) | **≤ 2.5 s** |
| LCP (desktop) | **≤ 1.8 s** |
| CLS | **≤ 0.1** |
| INP | **≤ 200 ms** |

### 7.2 JavaScript

- Initial JS bundle **MUST** be **≤ 500 KB** (transferred, gzip/brotli).
- Below-the-fold and route-level code **SHOULD** be lazy-loaded / code-split.

### 7.3 Images

- Images **MUST** be served as **WebP** or **AVIF**.
- Below-the-fold images **MUST** be lazy-loaded (`loading="lazy"`).
- Every `<img>` **MUST** declare intrinsic `width`/`height` (or aspect-ratio) to prevent layout shift.

### 7.4 Fonts

- Fonts **MUST** be subset.
- Fonts **MUST** use `font-display: swap`.
- Self-hosting fonts is **RECOMMENDED** over third-party CDNs for LCP/privacy.

### 7.5 Lighthouse gate

| Category | Minimum |
|---|---|
| Performance (mobile) | **≥ 85** |
| SEO | **100** |
| Accessibility | **≥ 95** |
| Best Practices | **≥ 95** (RECOMMENDED) |

---

## 8. Component Patterns

### 8.1 File naming

- React components: **PascalCase** `.tsx` (e.g. `LanguageToggle.tsx`, `SEO.tsx`).
- Utilities / non-component modules: **camelCase** `.ts` (e.g. `canonical.ts`).
- One component per file. Tiny private helpers **MAY** be co-located in the same file.

### 8.2 Props

- Props **MUST** be explicitly typed (interface or type alias).
- `any` **MUST NOT** be used in prop types (see [§11.1](#111-typescript)).
- Sensible default values **SHOULD** be provided for optional props.

### 8.3 Hooks

- Custom hooks **MUST** be named `use<Name>()` and live under `src/hooks/`.
- Hooks **MUST** obey the Rules of Hooks (top-level, no conditionals) — enforced by `react-hooks` ESLint plugin.

### 8.4 State

- Prefer **local** state first (`useState` / `useReducer`).
- Lift state **only** when genuinely shared; reach for global stores (Zustand / TanStack Query) only when local/lifted state is insufficient.

### 8.5 Styling

- Styling **MUST** use Tailwind utilities. Custom CSS is permitted only when a utility cannot express the rule.
- Class composition **MUST** use the `cn()` helper (`clsx` + `tailwind-merge`).
- Magic numbers **MUST NOT** be used for spacing/typography — use the Fibonacci/φ scale (e.g. `gap-fib-7`, `text-golden-lg`). See [`CLAUDE.md`](../CLAUDE.md).
- `backdrop-blur` / glassmorphism is **MUST NOT** (design doctrine).

---

## 9. Testing Requirements

### 9.1 Test layers

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | utils, hooks, pure functions |
| Component | Vitest + `@testing-library/react` | rendering, interaction, a11y roles |
| E2E | Playwright | bilingual smoke + critical user paths |

### 9.2 Bilingual E2E

- Critical paths (home, services, pricing, contact, booking funnel) **MUST** have Playwright smoke coverage in **both** `tr` and `en`.
- E2E **MUST** select elements by stable selectors (`data-testid`), not by translated text.

### 9.3 Coverage gate

| Target | Minimum statements |
|---|---|
| Utilities (`src/i18n`, `src/lib`, helpers) | **≥ 70 %** |
| Components | **≥ 60 %** |

Coverage runs via `npm run test:coverage`.

### 9.4 No regressions

- A PR **MUST NOT** leave any existing test broken.
- Deleting a test is **MUST NOT** unless the user explicitly authorizes it (see [`CLAUDE.md`](../CLAUDE.md) test discipline).
- New features **MUST** ship with tests (test-first preferred).

### 9.5 Commands

```bash
npm run test            # Vitest watch
npm run test -- --run   # single CI pass
npm run test:coverage   # coverage gate
npm run test:e2e        # full Playwright suite
npm run test:e2e:fast   # sanity smoke
```

---

## 10. Git & PR Workflow

### 10.1 Branch naming

Branches **MUST** use a conventional prefix:

| Prefix | Use |
|---|---|
| `feat/...` | new feature |
| `fix/...` | bug fix |
| `docs/...` | documentation only |
| `chore/...` | tooling, deps, config |
| `refactor/...` | behavior-preserving restructure |

### 10.2 Commit messages

- Commits **MUST** follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): description`.
- Allowed types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
- Subject **SHOULD** be ≤ 72 chars, imperative mood.

  ```text
  feat(seo): add og:locale to SEO component
  fix(i18n): mirror missing pricing keys in en namespace
  docs(standards): introduce Web Page Standard v1.0
  ```

### 10.3 Pull requests

- PR title **MUST** start with an action verb + scope.
- PR body **MUST** fill every section of [`.github/pull_request_template.md`](../.github/pull_request_template.md): **Why**, **What**, **How verified**, **Risk**.
- The Definition-of-Done checklist (see [§13](#13-verification-checklist)) **MUST** be completed before requesting review.

### 10.4 Merge policy

- Merge strategy **MUST** be **squash merge with `--delete-branch`**.
- The following **MUST** all pass before merge:
  - `npm run typecheck` — PASS
  - `npm run build` — PASS
  - `npm run lint` — PASS
  - `npm run test -- --run` — PASS

---

## 11. Code Style

### 11.1 TypeScript

- `strict` mode is **REQUIRED**.
- `any` **MUST NOT** be used. Where genuinely unavoidable, it **MUST** be justified with an inline comment explaining why; prefer `unknown` + a type guard.

### 11.2 ESLint

The lint config **MUST** extend:

- `eslint:recommended`
- `@typescript-eslint`
- `react-hooks`
- `jsx-a11y`

`npm run lint` **MUST** report zero errors before merge.

### 11.3 Prettier

- 2-space indent.
- Single quotes.
- Trailing commas.
- Semicolons required.

Run via `npm run format`.

### 11.4 Imports

- Imports **MUST** be at the top of the file.
- Import order **SHOULD** be grouped: builtin → external → internal (`@/`) → parent → sibling.

### 11.5 Logging

- `console.log` **MUST NOT** appear in production code.
- Server logging **MUST** use the winston logger (`server/config/logger.ts`).

---

## 12. Security & Privacy (KVKK)

### 12.1 PII handling

- Personally Identifiable Information **MUST NOT** leak to the client beyond what the user themselves submitted.
- PII in logs **MUST** be masked / redacted.

### 12.2 Webhook & form integrity

- Inbound webhooks (e.g. Calendly) and custom form submissions **MUST** be verified with an **HMAC** signature check before processing.

### 12.3 Rate limiting

- Every public endpoint **MUST** be rate-limited.

### 12.4 CORS

- CORS **MUST** use an explicit origin allowlist. Wildcard (`*`) origins are **MUST NOT** on credentialed routes.

### 12.5 KVKK compliance

- The cookie banner **MUST** be strict **opt-in** (no non-essential cookies set before consent), per the **Turkish Personal Data Protection Law (KVKK)**.
- Consent state **MUST** be persisted and revocable.
- Legal copy referencing the law **MUST** use the full English term "Turkish Personal Data Protection Law (KVKK)" on first mention (see [§2.4](#24-regulatory-terminology)).

### 12.6 Sentry / error reporting

- A PII scrubber **MUST** be configured on **both** frontend and backend Sentry clients before any event is sent.

---

## 13. Verification Checklist

Every PR that touches a page or shared UI surface **MUST** complete this 25-item Definition-of-Done checklist before review is requested. This list is mirrored in [`.github/pull_request_template.md`](../.github/pull_request_template.md).

- [ ] **TR + EN parity** — `npm run i18n:parity` passes (no drift, no empty values)
- [ ] **hreflang validator** — `tr-TR`, `en`, `x-default` present and correct
- [ ] **Lighthouse mobile** — Performance **≥ 85**
- [ ] **axe-core** — **0** violations
- [ ] **typecheck** — `npm run typecheck` PASS
- [ ] **lint** — `npm run lint` PASS
- [ ] **test** — `npm run test -- --run` PASS
- [ ] **Bundle size** — initial JS **≤ 500 KB**
- [ ] **Canonical** — emitted via `buildCanonical()` only (no inline)
- [ ] **Brand casing** — every brand mention is exactly `eCyPro`
- [ ] **No hardcoded strings** — all user-facing text from `t()`
- [ ] **Alt text + ARIA** — all `img` have `alt`; icon-only buttons labeled
- [ ] **No `any`** — or justified with inline comment
- [ ] **No `console.log`** — server uses winston logger
- [ ] **No magic number/string** — Fibonacci/φ scale used
- [ ] **Loading / empty / error states** — handled for async UI
- [ ] **Mobile responsive** — verified at 320 / 768 / 1024 / 1440
- [ ] **Touch targets** — **≥ 44 × 44 px**
- [ ] **Keyboard navigable** — all interactive elements tab-reachable, no traps
- [ ] **Color contrast** — text **≥ 4.5:1**, UI **≥ 3:1**
- [ ] **og:locale + og:url** — present and locale-aware
- [ ] **JSON-LD valid** — Organization + applicable schemas validate
- [ ] **Sitemap current** — new routes reflected in sitemaps
- [ ] **PR template** — all sections (Why / What / How verified / Risk) filled
- [ ] **Squash merge** — `--delete-branch` on merge

---

*eCyPro Web Page Standard v1.0 — normative. Changes require a versioned PR against this file (see [§1.4](#14-override-path)).*
