# ADR-001: Notion as Admin Lead CRM — Server-Side Proxy Pattern

**Status:** Accepted  
**Date:** 2026-05-26  
**Deciders:** eCyPro Engineering

---

## Context

eCyPro needs to capture high-revenue B2B leads (Adaylar) during the pre-launch phase without
committing to a full Postgres CRM. The team already uses Notion for operations. A lightweight
proxy that writes leads to Notion provides immediate value with minimal new infrastructure.

## Decision

All admin lead operations (create, list, get) go through a server-side Express route
(`/api/admin/leads`) that proxies to the Notion API. The Notion API key (`NOTION_API_KEY`)
and database ID (`NOTION_LEADS_DB_ID`) live in server environment variables and are never
exposed to the client bundle.

Key constraints enforced:

1. **Notion token server-side only** — never forwarded in API responses or logged.
2. **Inline throttle (334 ms/req)** — respects Notion's 3 req/s rate limit without adding
   ESM-only dependencies (avoids CJS/ESM mismatch on Render).
3. **Inline TTL cache (10 min, 100 entries)** — reduces redundant Notion reads; invalidated
   on every write via `invalidateAdayCache()`.
4. **KVKK audit trail** — every lead creation fires a `ConsentRecord` insert (fire-and-forget)
   into Postgres via Prisma. This satisfies ROPA SAT-01 without blocking the response.
5. **ADMIN RBAC** — all routes require `authenticate` + `requireRole('ADMIN')` middleware.
6. **SSE broadcast** — successful creates publish `admin.new_candidate` to connected admin
   clients via `SseManager`, enabling real-time dashboard updates without polling.

## Alternatives Considered

| Option | Reason rejected |
|--------|----------------|
| Client-side Notion SDK | Exposes API key in browser bundle — security violation |
| Full Postgres CRM | Over-engineered for pre-launch volume; delays shipping |
| Third-party CRM (HubSpot, Pipedrive) | Vendor lock-in; KVKK data residency concerns |
| @notionhq/client SDK | ESM-only in v3+ causes `require()` errors in CJS server build |

## Consequences

**Positive:**
- Zero new infrastructure; reuses existing Notion workspace
- Notion token never reaches the client
- KVKK consent audit satisfies legal requirements at no extra latency
- Real-time notifications via SSE without polling overhead

**Negative/Risks:**
- Notion API is external dependency; 503 fallback message points to `info@ecypro.com`
- Rate limit (3 req/s) limits concurrent admin activity; acceptable for pre-launch volume
- Cache invalidation is manual (`invalidateAdayCache()`); stale reads possible in multi-instance deploy

## Migration Path

When lead volume justifies a proper CRM:
1. Write a Postgres `Lead` model migration
2. Swap `notion-leads-client` functions with Prisma calls (same interface)
3. Run a one-time Notion→Postgres backfill script
4. Remove `NOTION_API_KEY` / `NOTION_LEADS_DB_ID` env vars
