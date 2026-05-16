# ADR-003: i18n — i18next with namespace splitting

- Status: accepted
- Date: 2026-05-15
- Decider(s): @emre

## Context

EcyPro launches with two locales (Turkish, English) and may add a third
(Arabic, RTL) within the year. The site has three content tiers:

- Marketing copy (landing, services, pricing) — translator-edited.
- App UI (dashboard, forms, errors) — engineer-edited.
- Legal copy (privacy, terms, cookies) — counsel-edited, change-controlled.

Forces:

- Translator workflow must allow per-page editing without touching app
  code. Marketing copy iteration must not require a deploy.
- App UI strings should ship inside the JS bundle to avoid an extra
  request on first paint.
- Legal copy is rarely edited but when edited must be auditable and
  diffable.
- RTL support is a future, not a now — but we must not paint ourselves
  into a corner.

## Decision

Use **i18next + react-i18next** with the following structure:

```
public/locales/
  ├── en/
  │   ├── common.json        ← navigation, generic CTAs
  │   ├── landing.json       ← hero, features, testimonials
  │   ├── pricing.json       ← pricing page
  │   ├── services.json      ← services pages
  │   ├── dashboard.json     ← app shell
  │   ├── errors.json        ← validation + runtime
  │   └── legal.json         ← privacy/terms/cookies
  └── tr/  (mirror)
```

- One namespace per content domain. Load `common` eagerly; load others
  lazily via i18next's HTTP backend.
- Detection order: localStorage → navigator → fallback `en`.
- Date / number / currency formatting via `Intl.*` (no third-party).
- RTL support is gated behind a CSS variable (`--direction`) that the
  language detector flips; component code never reads `dir` directly.

## Consequences

**Easier:**

- Translators edit `tr/landing.json` without touching code. Marketing
  iteration is a JSON PR.
- Dashboard bundle does not pay for marketing translations.
- Adding a third locale is a copy of `public/locales/en` + edits.

**Harder:**

- Compile-time key safety requires `i18next-resources-for-ts` or a
  custom codegen. Currently we rely on runtime warnings.
- Lazy-loaded namespaces add a fetch on first visit to a new page. We
  mitigate by preloading the namespace inside the route's
  `componentDidMount` equivalent.

**Risks accepted:**

- A typo in a translation key silently falls back to the key string in
  production. Mitigation: ESLint plugin `i18next/no-literal-string` on
  CI, and a sanity test that loads every namespace and asserts no key
  resolves to itself.

## Alternatives considered

- **`react-intl`** — heavier API, ICU MessageFormat unnecessary for our
  copy complexity (no plurals beyond `count`, no gendered nouns).
- **One JSON per page** — rejected because it explodes the file count
  and makes shared CTAs ("Get started") duplicate-tax-prone.
- **Inline translations via Crowdin/Lokalise SDK** — rejected as it
  introduces vendor lock-in and a runtime dependency on a SaaS we
  don't currently need.
- **Compile-time codegen (e.g. lingui)** — considered, deferred. The
  build-step tax wasn't worth it for our current scale.
