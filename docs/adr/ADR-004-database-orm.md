# ADR-004: Database / ORM — Postgres + Prisma

- Status: accepted
- Date: 2026-05-15
- Decider(s): @emre

## Context

We need a relational database (auth, bookings, audit log, NPS feedback
all benefit from foreign keys + transactions) and an ergonomic Node
client. The team is mid-size and write-heavy on schema iteration during
the publish-ramp phase.

Forces:

- Schema iterates weekly (we are still in Phase 14 of 17).
- Migrations must be reviewable in PRs and runnable from CI.
- Type-safety from the DB schema all the way to React props is a
  productivity multiplier.
- Render's managed Postgres is a known quantity; our team has no
  operational experience with PlanetScale (MySQL) or CockroachDB.

## Decision

Use **PostgreSQL 16** (managed by Render) with **Prisma 7** as the ORM
and migration tool. Pin `prisma` and `@prisma/client` to the same minor
version. Generate the client into `node_modules/.prisma/client`
(default). Use `pg` connection pool for adhoc raw SQL where Prisma's
query builder is awkward (full-text search, gist indexes).

Conventions:

1. Every model has `id @id @default(uuid())`, `createdAt`, `updatedAt`.
2. Composite indexes are documented inline with a comment explaining
   which query they accelerate.
3. `onDelete: Cascade` for parent-owned child rows; `onDelete: SetNull`
   for analytics-style "user may have deleted account but the event
   still happened" rows.
4. Soft-delete via `deletedAt: DateTime?` is OPT-IN per model and
   filtered explicitly via the `notDeleted()` helper — no global
   middleware (P14-BE Aşama 1).
5. Migrations are atomic and additive when possible; destructive
   changes require a maintenance-window note.

## Consequences

**Easier:**

- `prisma generate` gives us TypeScript types matching the schema; no
  hand-written DTOs.
- Migrations live alongside the schema and review-cleanly.
- Studio (`npm run db:studio`) is a free admin UI for ops.

**Harder:**

- Prisma's query engine binary is 30+ MB; cold-starts on serverless
  matter. Mitigation: we are on Render long-running containers, not
  Vercel functions.
- Prisma raw SQL is fine but loses type-safety. We use it sparingly.
- The query engine is a separate process on Linux ARM64; sandbox
  workflows must `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` or skip.

**Risks accepted:**

- Vendor lock to Prisma's migration format. If we ever migrate off
  Prisma, we keep the SQL artefacts (they are dialect-portable) and
  rewrite the query layer.

## Alternatives considered

- **Drizzle** — SQL-first, smaller runtime, but younger ecosystem and
  no Studio equivalent at the time of decision.
- **TypeORM** — older, more flexible, but the decorator-based model is
  harder to reason about and migrations are clunkier.
- **Raw `pg` + Kysely** — type-safe SQL builder. Considered, may revisit
  if Prisma's overhead becomes a real bottleneck. For now, ergonomics
  win.
- **MySQL via PlanetScale** — rejected because Postgres-only features
  (PARTIAL indexes, JSONB GIN indexes, gen_random_uuid) we already lean
  on.
