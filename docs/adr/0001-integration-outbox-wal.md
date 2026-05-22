# ADR-0001: Integration Outbox / Write-Ahead Log Pattern

**Status:** Accepted (landed in PR #46, 2026-05-22)
**Date:** 2026-05-22
**Owner:** Emre Can Yalçın
**NLD gate:** Phase 3 cross-vault CONVERGENT 5/5 (`~/Documents/eCyPro-memory/decisions/2026-05-22-2330-nld-phase-3-advanced-5-vault.md`)


## Context

eCyPro's lead funnel is `Form → Notion CRM → Resend autoresponder → Calendly booking → Calendly webhook → Notion update`. Each link in this chain depends on a third-party API:

- **Notion API:** known intermittent timeouts and rate-limits.
- **Resend API:** occasional 429 / 5xx during high-volume periods.
- **Calendly:** webhook delivery is at-least-once but not guaranteed in-order; failures can occur on either Calendly's side or our HMAC verify side.

PR #31 (silent-lead-loss preventer) fixed a contract mismatch in `upsertProspect.ts` — the 16 Türkçe Notion property names were not matched in the property mapping. But that fix only addresses the case where the call SUCCEEDS but maps wrong; it does nothing for the case where the call FAILS at runtime.

Wave-1 launch outreach Monday 2026-05-25 morning will hit the form chain hardest. A single Notion blip during that window risks silent lead loss for outreach-generated traffic — exactly the audience we cannot afford to lose.

## Decision

Implement a Write-Ahead Log (WAL) / Outbox pattern in `server/lib/outbox.ts` that wraps every external integration call in the funnel chain.

The wrapper:

1. Inserts a `PENDING` row into `integration_outbox` table BEFORE invoking the external operation.
2. Executes the operation.
3. On success: transitions row to `COMPLETED`.
4. On failure: transitions row to `FAILED`, increments `attempts`, stores `lastError`, and re-throws to the caller (preserving existing error semantics).

A retry cron (`server/jobs/process-outbox.ts` using node-cron) runs every 5 minutes:

- Selects `PENDING` or `FAILED` rows older than 2 minutes with `attempts < 5`
- Re-invokes the original operation via a `REGISTRY` map keyed by `(service, operation)`
- After 5 failed attempts → transitions row to `DLQ` (Dead Letter Queue) and emits an alert via `notify('error', ...)` (Telegram bridge via PR #43 `sendTelegramAlert` once that PR merges and bot is provisioned)

API contract: form submission route returns success once the WAL row is committed, regardless of downstream success. Client UX surfaces the eventual-consistency model in the confirmation message.

## Consequences

### Positive
- **No silent lead loss.** Even if Notion + Resend both fail, the Supabase row persists. Cron retries until success or DLQ.
- **Observable failures.** DLQ entries trigger founder-visible alerts (Foundation First #4).
- **At-least-once delivery semantics** for the lead funnel, reconcilable from the Outbox table.
- **Idempotent retries.** `upsertProspect` is already an upsert; Resend autoresponder is keyed by `{to, kind, locale}` (functionally idempotent within retry window).

### Negative
- **Latency tradeoff.** Each external call adds 1 Supabase write upfront (~5-15ms). Acceptable for lead capture.
- **Storage growth.** `integration_outbox` grows with traffic. Mitigation: cron sweeps `COMPLETED` rows older than 30 days quarterly (post-launch task).
- **Eventual consistency.** Downstream completion may take up to ~25 min (5 retries × 5 min) before DLQ. Foundation First #1 (form chain) needs to surface this in UX copy — current "confirmation arrives shortly" framing is correct.

### Constraints
- Migration is **additive only** (`CREATE TABLE integration_outbox` + 3 indexes). No existing tables modified.
- Payload field MUST be sanitized — no PII secrets like full email body or auth tokens.
- Wrapper preserves caller error contract (re-throws on failure) so existing routes need no semantic changes.

## Schema

```prisma
model IntegrationOutbox {
  id         String   @id @default(uuid())
  service    String   // 'NOTION' | 'RESEND' | 'CALENDLY'
  operation  String   // 'upsertProspect', 'sendAutoresponder', etc.
  payload    Json     // sanitized
  status     String   @default("PENDING") // PENDING | COMPLETED | FAILED | DLQ
  attempts   Int      @default(0)
  lastError  String?  @db.Text
  traceId    String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([status, attempts])
  @@index([service, status])
  @@index([createdAt])
  @@map("integration_outbox")
}
```

## Wrapper signature

```ts
export interface OutboxContext {
  service: 'NOTION' | 'RESEND' | 'CALENDLY';
  operation: string;
  payload: Record<string, unknown>;
  traceId?: string;
}

export async function withOutboxRecord<T>(
  ctx: OutboxContext,
  operation: () => Promise<T>,
): Promise<T>
```

## Wrap sites in PR #46

| Site | Service | Operation | Payload (sanitized) |
|---|---|---|---|
| `server/services/notion.ts` `upsertProspect` (wrapped variant) | NOTION | `upsertProspect` | `{ email, name, company, source }` |
| `server/services/contact-ack.ts` autoresponder | RESEND | `sendAutoresponder` | `{ to, kind, locale }` (no email body) |
| _Deferred to post-launch:_ Calendly webhook Notion update | CALENDLY | `webhookProcess` | _Calendly is idempotent on their side; wrap later if observability gap emerges_ |

## Retry semantics

- **Backoff:** linear at 5-minute cron cadence + 2-minute minimum age before retry
- **Max attempts:** 5
- **DLQ behavior:** after 5 failures, row transitions to `DLQ` status, alert fires. DLQ rows can be manually retried via psql or via a future `npm run outbox:replay <id>` script (not in PR #46)

## Verification

- 5 unit tests in `server/lib/outbox.test.ts`: happy path, failure path, sequential failure attempts increment, DLQ transition, payload sanitization
- All 402/402 server tests pass as of PR #46 landing
- Migration SQL inspected: additive only, 0 destructive operations
- Pre-push lefthook PASS without `--no-verify`

## References

- PR #46: https://github.com/eCy-coding/danisman/pull/46
- Decision record: `~/Documents/eCyPro-memory/decisions/2026-05-22-2330-nld-phase-3-advanced-5-vault.md`
- Phase 3 brain trust query: 5/5 CONVERGENT across Architect, Standards Lead, Patterns Librarian, Launch Commander, Operations Archive
- Dependency: PR #43 `sendTelegramAlert` for DLQ alerts (currently fallback to existing `notify('error', ...)` until PR #43 merges)
- Foundation First #1 (form chain) + #4 (founder paged before customers) — this ADR satisfies both at the code layer
- NLD playbook §7 (ADR process): `~/Documents/eCyPro-memory/NOTEBOOKLM_CODING_PLAYBOOK.md`

## Supersedes / Superseded by

- **Supersedes:** ad-hoc try/catch around Notion/Resend calls (which silently swallowed errors before PR #46)
- **Superseded by:** TBD — when a managed queue solution (BullMQ, AWS SQS, etc.) replaces this in-DB queue post-launch as part of platform maturity work

## NotebookLM Consensus

Phase 3 cross-vault advanced consultation 2026-05-22 23:30 (T-33h) CONVERGENT 5/5 (Architect / Standards Lead / Patterns Librarian / Launch Commander / Operations Historian). All 5 vaults independently specified the same Prisma model shape, wrapper signature, and API contract.

Launch Commander verdict (verbatim): *"If all 21 PRs merge tonight, lead capture STILL has silent-failure risk. Outbox closes that gap."*

Phase 6 cross-vault 2026-05-23 03:00 (T-30h) flagged ADR-0001 as Priority 2 SAFE doc-only contribution closing the audit-trail gap for the Phase 3 decision.

This ADR is the formal record of the decision that PR #46 implements.
