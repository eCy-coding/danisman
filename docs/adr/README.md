# Architecture Decision Records (ADR)

This folder captures significant architectural decisions made on the
EcyPro Premium Consulting codebase. Each record uses the **MADR 3.0**
template (`Markdown Any Decision Record`) and is numbered sequentially.

## Why ADRs?

A pull request answers "what changed". An ADR answers "why we chose
this and what else we considered". Six months from now, when someone
asks "why are we on Prisma + Postgres instead of Drizzle + Postgres?",
the ADR is the canonical reply — not Slack scrollback, not Notion, not
your colleague's memory.

## Authoring rules

1. **One decision per file.** If you find yourself making two unrelated
   choices in one ADR, split them.
2. **Number sequentially.** `ADR-001-...`, `ADR-002-...`, never reused.
3. **Status lifecycle:** `proposed` → `accepted` → `superseded by ADR-NNN`
   or `deprecated`. Never delete an ADR — supersede it.
4. **Keep it short.** Most ADRs fit on one screen. Long context goes
   in linked design docs.
5. **Write in present tense.** "We use Prisma" — not "we will use".

## Template

```markdown
# ADR-NNN: Short verb-led title

- Status: proposed | accepted | deprecated | superseded by ADR-XYZ
- Date: YYYY-MM-DD
- Decider(s): name(s)

## Context

What problem are we solving? What forces are at play (technical,
political, social, business)?

## Decision

The choice we made. Imperative voice.

## Consequences

What becomes easier? What becomes harder? What risks did we accept?

## Alternatives considered

The options we did NOT pick and why. This is the most valuable section
for future readers.
```

## Index

| # | Title | Status |
|---|---|---|
| [001](./ADR-001-hosting-strategy.md) | Hosting strategy — Render + Hostinger split | accepted |
| [002](./ADR-002-state-management.md) | Client state management — Zustand over Redux | accepted |
| [003](./ADR-003-i18n-strategy.md) | i18n — i18next namespaces over JSON-per-page | accepted |
| [004](./ADR-004-database-orm.md) | Database / ORM — Postgres + Prisma | accepted |
| [005](./ADR-005-monitoring.md) | Monitoring — Sentry RUM + Web Vitals | accepted |
