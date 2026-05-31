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

This folder consolidates two previously separate ADR logs:

- **`ADR-001`–`ADR-005`** — original infrastructure/stack decisions (hosting, state, i18n, ORM, monitoring)
- **`0001-integration-outbox-wal`** — outbox/WAL pattern (MADR filename convention)
- **`ADR-001-notion-proxy-pattern`** through **`ADR-009-motion-architecture`** — domain/feature decisions (migrated from the legacy decisions log)

> **Note on duplicate numbers:** ADR-001, ADR-003, and ADR-004 each appear twice because the merged set (notion-proxy, kvkk, rbac) came from a separate domain-decision log and used the same numbering sequence independently. Numbers are preserved for immutability. Renumbering is a future cleanup task.

### Infrastructure / Stack (original series)

| File                                           | Title                                        | Status   |
| ---------------------------------------------- | -------------------------------------------- | -------- |
| [ADR-001](./ADR-001-hosting-strategy.md)       | Hosting strategy — Render + Hostinger split  | accepted |
| [ADR-002](./ADR-002-state-management.md)       | Client state management — Zustand over Redux | accepted |
| [ADR-003](./ADR-003-i18n-strategy.md)          | i18n — i18next namespaces over JSON-per-page | accepted |
| [ADR-004](./ADR-004-database-orm.md)           | Database / ORM — Postgres + Prisma           | accepted |
| [ADR-005](./ADR-005-monitoring.md)             | Monitoring — Sentry RUM + Web Vitals         | accepted |
| [0001](./0001-integration-outbox-wal.md)       | Integration Outbox / Write-Ahead Log Pattern | accepted |

### Domain / Feature (migrated from legacy decisions log)

| File                                                             | Title                                            | Status   |
| ---------------------------------------------------------------- | ------------------------------------------------ | -------- |
| [ADR-001](./ADR-001-notion-proxy-pattern.md)                     | Notion as Admin Lead CRM — Server-Side Proxy     | accepted |
| [ADR-003](./ADR-003-kvkk-compliance-architecture.md)             | KVKK Compliance Shield Architecture             | accepted |
| [ADR-004](./ADR-004-rbac-permission-model.md)                    | RBAC Permission Model — Runtime Yetki Yönetimi  | accepted |
| [ADR-007](./ADR-007-enterprise-data-architecture.md)             | Enterprise Data Architecture — Phase 6          | accepted |
| [ADR-008](./ADR-008-design-token-system.md)                      | Unified Design Token System                     | accepted |
| [ADR-009](./ADR-009-motion-architecture.md)                      | Motion Architecture                             | accepted |
