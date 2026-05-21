# CRITICAL — Notion CRM Prospect contract mismatch (silent lead loss)

Found during H2 (Calendly HMAC + Notion sync verify), pre-launch 2026-05-25.

## Impact

Both lead funnels — **Calendly `invitee.created`** (`server/routes/calendly.ts`) and the
**Quick-Check** funnel (`server/routes/quick-check.ts:176`) — write prospects through the
same `upsertProspect()` in `server/services/notion.ts`. The property contract that function
builds does **not** match the live "Prospects" Notion database.

Notion rejects a `pages.create` / `pages.update` if **any** property name in the payload does
not exist on the database — the entire write fails (no partial create). `notionFetch` swallows
the non-2xx, logs a warning, and returns `null`; the webhook/route still returns `200`.

**Result: at launch every Calendly booking and every Quick-Check submission returns success to
the user but creates ZERO CRM record.** Silent lead loss + a KVKK provenance gap (see below).

The HMAC verification path itself is correct and now covered by 9 unit tests
(`server/routes/calendly.test.ts`). This finding is purely the downstream Notion contract.

## Two independent defects

### 1. Env-var wiring gap
- Code reads `process.env.NOTION_PROSPECTS_DB_ID` / `NOTION_INTERACTIONS_DB_ID`
  (`server/services/notion.ts:32-33`, matches `.env.example`).
- Ops token file `~/.ecypro-tokens.env` names them `NOTION_DB_PROSPECTS` / `NOTION_DB_NOTES` /
  `NOTION_DB_DELIVERABLES` **and all three values are empty**.
- If the backend `.env` leaves `NOTION_PROSPECTS_DB_ID` unset → `isConfigured()` is false → every
  CRM write is a silent no-op (at least this is logged at startup).

Live Prospects DB id (recovered via Notion search, token valid as bot "Emre Yalçın's"):
`3672c526-2dea-81b6-8aa9-d161a4bba0a2`. There is also a separate **Leads** DB
`28b2c526-2dea-80ba-9990-de1a7b5ca3db` — confirm which one is the intended target.

### 2. Property contract mismatch (the blocker)

| Code `PROP` (built by `buildProspectProperties`) | Type in code | Live Prospects DB property | Live type | Status |
|---|---|---|---|---|
| `Name` | title | `Şirket` | title | ❌ name mismatch (and `Şirket`=company, code `name`=person) |
| `Email` | email | `Decision Maker Email` | email | ❌ name mismatch |
| `Company` | rich_text | — (company is the title `Şirket`) | — | ❌ no rich_text company field |
| `Sector` | rich_text | `Sektör` | **select** | ❌ name + type mismatch |
| `Source` | select | — | — | ❌ no equivalent (closest: `Etiketler` multi_select) |
| `Stage` | **status** | `Outreach Status` | **select** | ❌ name + type mismatch |
| `Priority` | select | — | — | ❌ no equivalent |
| `KVKK Consent At` | date | — | — | ❌ **no consent field exists** (compliance gap) |
| `Notes` | rich_text | `Notes` | rich_text | ✅ only match |
| `Score` | number | `Quick-Check Skoru` | number | ❌ name mismatch |
| `Tier` | select | `Engagement Tier` | select | ❌ name mismatch |

### `stage` value mapping (code `ProspectStage` → live `Outreach Status` options)
Live options: `Wave-1 Ready, Email Sent, Replied, Discovery Booked, Proposal Sent, Won, Lost, Cold, Not Contacted`

| Code stage | → suggested Outreach Status |
|---|---|
| `Lead` | `Not Contacted` (no `Lead` option) — **decision needed** |
| `Discovery Booked` | `Discovery Booked` ✅ |
| `Discovery Done` | — no option — **decision needed** |
| `Proposal` | `Proposal Sent` |
| `Active` | — no option — **decision needed** |
| `Closed Won` | `Won` |
| `Closed Lost` | `Lost` |

## Recommended fix (owner decision required — NOT auto-applied)

This is a data-model + KVKK-compliance decision, so it was deliberately not rewritten blind:

1. Decide target DB (Prospects vs Leads) and wire `NOTION_PROSPECTS_DB_ID` in the backend env
   (reconcile the `NOTION_DB_PROSPECTS` naming in the ops token file).
2. Rewrite the `PROP` map + `buildProspectProperties` to the live Turkish schema, change
   `stage` from `statusProp` → `selectProp` against `Outreach Status`, and add a stage-value map.
3. **KVKK**: `kvkkConsentAt` currently has nowhere to land. Add a `KVKK Consent At` (date) property
   to the Notion DB, or drop the field — but the consent timestamp MUST be persisted somewhere for
   KVKK provenance. Do not ship the funnel without a home for it.
4. Add a live smoke test (gated on `NOTION_API_KEY`) that creates + archives one throwaway
   prospect, asserting the create returns a page id — this would have caught the mismatch.
