# ADR-007: Enterprise Data Architecture — Phase 6

**Date:** 2026-05-27  
**Status:** Accepted  
**Deciders:** Emre Can Yalçın (T0), Claude Code (T1)

---

## Context

Phase 6 adds five enterprise modules to the eCyPro admin panel:
1. Founder Letter publishing (Emre Can Yalçın aylık bülteni)
2. Succession Roadmap Visualizer (aile şirketi kuşak geçişi)
3. ESG ESRS Taxonomy Explorer (CSRD 1000+ veri noktası)
4. Fintech Compliance Dashboard (SPK + MASAK + KVKK + TCMB + BDDK)
5. Local Data Residency Badges (veri yeri rozeti)

These modules require new data models, jurisdictional data tagging, and enterprise content management. Key architectural questions:

- How to model the consulting `Client` entity without breaking existing CRM flows?
- How to handle 1000+ ESRS datapoints efficiently in UI?
- How to tag all existing Phase 1-4 tables with data residency without full migration?
- How to manage Founder Letter TR/EN bilingual content?

---

## Decisions

### D1: Client model as separate pivot table

**Decision:** Create a dedicated `Client` model (not repurpose `User` or `ContactSubmission`).

**Rationale:**
- Consulting client (Succession/ESG/Fintech) has a different lifecycle than a CRM lead
- Avoids polluting `User` (authentication entity) with business-tier data
- `ContactSubmission` is a one-time form — `Client` is an ongoing relationship
- Keeps Phase 1-4 CRM flows intact

**Consequence:** New `clients` table; no impact on existing User/ContactSubmission routes.

---

### D2: ESG datapoints as seeded, code-locked table

**Decision:** `ESGDatapoint` rows are seeded from ESRS standard and treated as read-only. UI cannot create/delete ESRS codes.

**Rationale:**
- ESRS codes are international standard (EFRAG) — user mutation would introduce invalid codes
- 1000+ rows loaded once at seed time via `db:seed`
- Assessment values (`ESGAssessment.datapointValues`) are mutable; the taxonomy is not

**Consequence:** Seed script adds ~1000 rows. Admin panel shows read-only taxonomy, editable values.

---

### D3: Virtual list for ESG taxonomy (50-item window)

**Decision:** Render at most 50 datapoints at a time with pillar filtering; show total count.

**Rationale:**
- jsdom / real DOM rendering of 1000+ rows causes unacceptable paint time (>2s in tests)
- Pillar filter reduces visible set to ~333 items; 50-item window is sufficient for scan workflows
- Full export available via CSV endpoint (`/api/admin/esg/datapoints/export`)

**Consequence:** Component receives full array; slices `.slice(0, 50)` for render. Future: replace with react-virtual for infinite scroll.

---

### D4: Data Residency as tag overlay, not schema migration

**Decision:** `DataResidencyTag` table stores `(resourceType, resourceId, location)` as a separate overlay. No foreign-key constraints to individual resource tables.

**Rationale:**
- Adding FK constraints to all 15+ existing tables (Lead, Deal, Invoice, AuditLog, …) requires serial migrations with downtime risk
- Tag overlay allows retroactive classification without touching existing schemas
- `resourceType` + `resourceId` is a flexible generic join key (works with future tables too)

**Consequence:** No cascade deletes (tag orphans possible). Scheduled job cleans orphan tags quarterly.

---

### D5: FounderLetter TR-primary, EN-optional

**Decision:** `titleTr` and `contentMdTr` are required; `titleEn` and `contentMdEn` are optional.

**Rationale:**
- Primary audience is Turkish-speaking clients and stakeholders
- English version added for international investors when needed
- Parity enforcement: publishing requires TR; EN is enrichment only

**Consequence:** TR/EN parity check runs at publish time (not at save time).

---

### D6: Fintech compliance items are per-client, not global

**Decision:** `FintechComplianceItem` has a required `clientId` relation.

**Rationale:**
- Each fintech client has different regulatory status (SPK CASP license is per-entity)
- Global compliance templates can be cloned to clients via seed; they don't share runtime data
- Enables per-client risk scoring and deadline tracking

**Consequence:** Requires at least one `Client` record per fintech compliance view.

---

## Jurisdictional Architecture

| Resource       | Default Location | Legal Basis          |
|----------------|-----------------|----------------------|
| Lead           | TR_LOCAL        | KVKK m.12            |
| Deal           | TR_LOCAL        | KVKK m.12            |
| Invoice        | TR_LOCAL        | KVKK m.12 + VUK      |
| Document       | TR_LOCAL        | KVKK m.12            |
| AuditLog       | TR_LOCAL        | KVKK m.12 + immutable|
| Session        | TR_LOCAL        | KVKK m.12            |
| User           | TR_LOCAL        | KVKK m.12            |
| Analytics      | EU_GDPR         | Vercel Edge network  |

Transfer mechanisms:
- `EU_GDPR`: Standard Contractual Clauses (SCC 2021/914)
- `US_SCC`: SCC module 2 (controller → processor)

---

## Consequences

- **Positive:** Clean separation of enterprise concerns from core CRM; ESRS taxonomy locked to standard
- **Positive:** Residency badges visible on all admin tables without schema migrations
- **Negative:** Tag orphans require maintenance; no cascade deletes for residency tags
- **Risk (mitigated):** ESRS seed script fails silently if run twice — idempotent upsert guards added

---

## Related ADRs

- ADR-004: RBAC permission model (Phase 4)
- ADR-005: KVKK data architecture (Phase 3)
