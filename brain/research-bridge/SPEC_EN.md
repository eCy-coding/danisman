# eCyPro × NotebookLM Research Bridge — Specification (EN)

Canonical v1 specification for the NotebookLM research-to-draft pipeline in the eCyPro admin panel (https://ecypro.com/).

## 1. Original Request (faithful English translation)

Translated from the owner's Turkish directive, 2026-06-12:

> "Now translate this request of mine into complete English, identify its critically important gaps, and improve it with your most-likely-to-be-realized suggestions! Code completely and without interruption; work non-stop until you deliver the project to me. Think on my behalf about the missing parts and sections — with minimum token spend and maximum performance — decide, and implement! I grant all permissions! When I want to produce something in the E2E eCyPro https://ecypro.com/ admin panel, ensure that I use NotebookLM 100%! Prove it with your comprehensive end-to-end tests! When I want to research a post or anything in the eCyPro admin panel, the post data I want to create for the web page should arrive automatically from NotebookLM into the eCyPro admin panel, and simultaneously I should be able to make changes in the eCyPro admin panel! Research every detail of this combination in sufficient sources, calculate, plan, and build it step by step without interruption!"

## 2. Critical Gaps Identified (and chosen, most-feasible improvements)

| # | Gap | Why critical | Chosen improvement |
|---|-----|--------------|--------------------|
| G1 | NotebookLM has no official public API; auth lives on the owner's Mac (nlm CLI tokens). | Production (Render) can never call NotebookLM directly; without an access path the feature is dead on arrival. | **Local Bridge pattern**: a zero-dependency Node worker on the Mac polls the production API over HTTPS with a scoped API key and drives the local notebooklm-mcp server over stdio JSON-RPC. The admin panel works from anywhere; when the bridge is offline, jobs wait in QUEUED and the UI shows a bridge-status badge. |
| G2 | "Post data" contract undefined. | Untyped research output cannot be validated or mapped onto the blog schema. | Defined contract `{titleTr, excerptTr, bodyTrMdx, sources[], primaryDomain}` mapped onto the existing `CreatePostSchema`; the body is NotebookLM's own deep-research report (markdown) plus a Sources section. 100% NotebookLM: Claude does not author content. |
| G3 | "Simultaneous editing" ≠ realtime co-editing. | A literal reading implies CRDT/OT realtime collaboration — weeks of work the workflow does not need. | **Single-writer handoff**: once the draft `BlogPost(DRAFT)` is created, the bridge never touches it again; the admin edits in the existing Insights editor. Live visibility via 5-second job polling with stage labels (QUEUED→CLAIMED→RESEARCHING→IMPORTING→DRAFTING→DONE/FAILED). |
| G4 | NotebookLM API half-failures (proven gotchas: import returns "API error code 9" or a transport timeout while the mutation actually landed; research `task_id` changes between start and status). | Naive retries duplicate sources, orphan research tasks, and corrupt job state. | The bridge encodes **verify-after-mutation** (recount sources via `notebook_get`), uses the status-side `task_id`, never hammer-retries. |
| G5 | CI cannot reach NotebookLM. | An E2E proof that needs live Google auth on every run cannot exist in CI. | **Two-layer E2E proof**: (a) deterministic Playwright spec where a fixture-bridge drives the real API + UI flow; (b) live proof behind `RESEARCH_E2E=1` with a real NotebookLM fast research producing a real draft, screenshots archived under `brain/research-bridge/evidence/`. |
| G6 | Security / KVKK. | Bridge endpoints are internet-exposed; a leaked key or logged token compromises the pipeline and audit trail. | The bridge authenticates with the existing **ApiKey infrastructure** (SHA-256-hashed key, scope `research:bridge`, constant-time compare); token values are never logged; an `AuditLog` row records draft creation. |
| G7 | Production delivery undefined. | "Deliver the project" only counts when verified on live production, not localhost. | **PBVC gates** (typecheck + build + tests) → PR → merge → Render/Vercel auto-deploy → authenticated production probe → live production smoke through the bridge. |

## 3. Architecture

```
Admin UI /admin/research
  │  POST /api/v1/admin/research/jobs   (JWT: ADMIN|EDITOR)
  ▼
eCyPro API (production) ── Postgres ResearchJob [QUEUED]
  ▲ 5s status polling                │ POST /bridge/claim · PATCH /bridge/jobs/:id
  │ (stage labels in UI)             │ (API key, scope research:bridge, HTTPS outbound-only)
  │                                  ▼
  │                     Local Bridge (owner's Mac, zero-dep Node)
  │                                  │ stdio JSON-RPC
  │                                  ▼
  │                     notebooklm-mcp ──▶ NotebookLM (owner auth tokens)
  │                     research_start → research_status → research_import
  │                     (+ optional notebook_query)
  │
  └─ on DONE: server creates BlogPost(DRAFT), links postId
              → admin continues at /admin/insights/posts/:postId/edit
```

The admin queues a job from `/admin/research`; the production API (JWT, roles ADMIN|EDITOR) persists a `ResearchJob` row in Postgres. The local bridge — the only component holding NotebookLM credentials — claims the oldest QUEUED job via `POST /bridge/claim` with its scoped API key, runs the NotebookLM pipeline over stdio JSON-RPC (`research_start` → `research_status` poll → `research_import`, plus optional `notebook_query` enrichment), and PATCHes `/bridge/jobs/:id` after each stage so the UI's 5-second poll shows live progress. On DONE the server validates the draft payload, creates `BlogPost(DRAFT)`, links `postId`, and writes an `AuditLog` row; the admin continues in the existing editor. All connections are outbound from the Mac — no inbound port, tunnel, or VPN.

## 4. Data Contract

### ResearchJob (Postgres, Prisma)

- `topic` — string, required research question/topic
- `lang` — `tr | en` (research language, default `tr`)
- `mode` — `fast | deep` (NotebookLM research depth)
- `contentType` — string (`blog-post` in v1)
- `primaryDomain` — enum `M_A | ESG | FINTECH | AILE_SIRKETI` (Insights verticals)
- `status` — enum, 8 values: `QUEUED, CLAIMED, RESEARCHING, IMPORTING, DRAFTING, DONE, FAILED, CANCELLED`
- `stageDetail` — string, human-readable progress for the UI
- `notebookId` — NotebookLM notebook id for the run
- `sourceCount` — int, imported sources (verify-after-mutation evidence, G4)
- `reportTitle` — generated research report title
- `postId` — FK → BlogPost, set on draft creation
- `error` — failure reason when FAILED
- `requestedById` — FK → User (queuing admin)
- `claimedAt`, `finishedAt` — bridge-claim and terminal-state timestamps

### Draft payload (bridge → server, validated server-side)

- `titleTr` — string, 5–200 chars
- `excerptTr` — string, 20–500 chars
- `bodyTrMdx` — string, ≥100 chars (NotebookLM report markdown + Sources section)
- `metaDescTr` — string, ≤160 chars, optional
- `sources` — array of `{title, url}`

Validation failure marks the job FAILED with the error message; no partial BlogPost is created.

## 5. Non-goals (v1)

- **Realtime collaborative editing** — handoff is single-writer (G3); after draft creation the existing editor is the sole write path.
- **EN-localised drafts** — drafts ship in the research language only; EN localisation stays manual.
- **Automatic publishing** — drafts stop at DRAFT for human review; the bridge can never publish.
- **Running the bridge on the server** — NotebookLM auth is bound to the owner's Mac (G1).

## 6. Operational Runbook (summary)

### Bridge environment

| Variable | Purpose |
|----------|---------|
| `ECYPRO_API_URL` | Production API base URL |
| `RESEARCH_BRIDGE_KEY` | ApiKey with scope `research:bridge` (only its SHA-256 hash stored server-side) |
| `NLM_NOTEBOOK_ID` | Optional fixed notebook; otherwise the bridge creates/reuses one per job |
| `NLM_MCP_CMD` | Command spawning the notebooklm-mcp server over stdio |

Start with `npm run nlm:bridge` on the Mac. For always-on operation, install a `launchd` agent (`~/Library/LaunchAgents/com.ecypro.research-bridge.plist`, `KeepAlive=true`) so the bridge survives reboots.

### Failure modes

| Failure | Behaviour |
|---------|-----------|
| Bridge offline | Jobs accumulate in QUEUED; UI shows bridge-status badge (last heartbeat); no data loss |
| NotebookLM quota exhausted | Report-only fallback: draft built from the research report alone; `notebook_query` enrichment skipped |
| Draft validation fails | Job FAILED with the validation message in `error`; no BlogPost; admin re-queues after inspection |
