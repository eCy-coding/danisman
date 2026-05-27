# ADR-003: KVKK Compliance Shield Architecture

**Date:** 2026-05-26  
**Status:** Accepted  
**Deciders:** Emre C. Yalcin (T0), Claude Code (T1)  
**Citations:** 01_NOTEBOOKLM_FINDINGS_2026-05-26.md §2.1-2.7 (C Vault: cc490f6a, 776806c9, 5e9f549e, 515b87b5, a3745a3e)

---

## Context

eCyPro is a data controller under KVKK (6698 sayılı Kişisel Verilerin Korunması Kanunu) and processes personal data of Turkish data subjects. Legal obligations include:

- **KVKK m.11**: Data subject rights (access, rectification, erasure, portability, objection)
- **KVKK m.12/5**: 72-hour breach notification to Kurul (KVKK supervisory authority)
- **KVKK m.12**: Immutable audit logging; 2-year audit-readiness obligation
- **GDPR Art.30**: Records of Processing Activities (ROPA)
- **5651 sayılı Kanun**: Web log retention for 2 years
- **VUK + İK m.41**: Payroll/financial record retention for 10 years

No dedicated compliance module existed prior to Phase 3.

---

## Decision

Build a self-contained KVKK Compliance Shield as 8 milestones within the eCyPro admin panel, with the following architectural decisions:

### 1. Prisma Models (M1)

Six new models added to `prisma/schema.prisma`:

| Model | Purpose |
|---|---|
| `DSARRequest` + `DSARAuditEntry` | KVKK m.11 rights portal with 30-day SLA |
| `BreachIncident` | 72-hour Kurul notification tracker |
| `ROPAProcess` | GDPR Art.30 processing activities register |
| `RetentionPolicy` | Nightly enforcement with imha sertifikası |
| `IndependenceCheck` | Big4 conflict screen + Bağımsızlık Beyanı |

### 2. Code-Locked Retention Periods

**Decision:** ROPA retention periods stored in `src/constants/ropa-template.ts` as `Object.freeze()` — NOT editable via admin UI.

**Rationale:** Incorrect retention periods constitute a KVKK violation. Admin UI shows values with a 🔒 indicator; DPO must modify source code + trigger a deployment to change any retention period. This creates an intentional friction that protects against accidental compliance violations.

**Source:** `01_NOTEBOOKLM_FINDINGS_2026-05-26.md §2.7` (C Vault: 776806c9, 5e9f549e).

### 3. Immutable Audit Log

**Decision:** `DSARAuditEntry` is append-only. Application layer never issues UPDATE or DELETE against this table. Future hardening can add a DB-level row trigger to enforce this at the PostgreSQL layer.

**Rationale:** KVKK m.12 requires audit logs to remain intact for regulatory inspection. Accidental or malicious deletion would constitute a KVKK compliance failure.

### 4. Permission System (M8)

**Decision:** 4 new semantic permission keys in `src/constants/ropa-template.ts`:

```ts
COMPLIANCE_PERMISSIONS = {
  DSAR_MANAGE:   'dsar.manage',
  CONSENT_READ:  'consent.read',
  ROPA_EDIT:     'ropa.edit',
  BREACH_REPORT: 'breach.report',
}
```

All Phase 3 endpoints use `requirePermission(key)` middleware (v1 maps to ADMIN role). When eCyPro adds a DPO or Compliance Officer role in a future phase, only `PERMISSION_ROLES` in `requirePermission.ts` needs to change — no route file changes required.

### 5. VERBİS Status via SiteConfig

**Decision:** VERBİS registration status stored in `SiteConfig` key-value table (keys: `verbis_status`, `verbis_sicil_no`, `verbis_registered_at`) rather than a dedicated model.

**Rationale:** VERBİS is a single global status per entity — a KV pair is sufficient and avoids a migration purely for a two-state flag.

### 6. Independence Check via Prisma

**Decision:** `IndependenceCheck` is a Prisma model (not a SiteConfig entry) because:
- Multiple clients may be checked over time (1:N relationship with clients)
- `validUntil` requires date-based queries
- Audit trail of past checks is valuable

### 7. DSAR SLA Business Logic

**Decision:** SLA deadline computed server-side: `slaDeadline = receivedAt + 30 days`. Extension: `+30 days` allowed exactly once (`extendedOnce` guard). Countdown badge color logic:
- **Green** > 7 days  
- **Yellow** ≤ 7 days  
- **Red** ≤ 1 day  
- **Overdue** past deadline (line-through text)

**Legal basis:** KVKK m.13/1 (30 days) + m.13/2 (+30 day extension, max once).

---

## Consequences

**Positive:**
- Full KVKK m.11 rights portal with SLA tracking
- 72-hour breach notification workflow (KVKK m.12/5)
- ROPA compliant with GDPR Art.30 (8 processes seeded)
- Code-locked retention prevents accidental KVKK violation
- Permission layer extensible to fine-grained roles

**Negative / Risks:**
- DB-level immutability for `DSARAuditEntry` is enforced by application code only in v1; a DBA with direct DB access could delete records. Mitigation: DB trigger in Phase 3.5.
- VERBİS `PENDING` status means eCyPro is not yet registered; admin must complete registration at `verbis.kvkk.gov.tr` manually.
- `IndependenceCheck` Big4 detection is client-side text matching only; edge cases (subsidiaries, merged entities) require human review.

---

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Single `ComplianceRecord` table for all KVKK events | Too generic; DSAR/Breach/ROPA have very different schemas and queries |
| External KVKK SaaS | Cost + Türkiye data residency constraint (C Vault: 515b87b5) |
| localStorage for consent storage | No server-side audit trail; KVKK audit requires server records |
