# eCyPro Status Page — 5-Component Schema

> Manual setup at betterstack.com after owner adds `BETTERSTACK_API_TOKEN`.
> Public URL: **status.ecypro.com** (CNAME → BetterStack)

## Components

| # | Component Name | Type | Description |
|---|----------------|------|-------------|
| 1 | Frontend | Website | www.ecypro.com — React SPA served by Vercel |
| 2 | API | API | api.ecypro.com — Express 5 on Render |
| 3 | Database | Service | PostgreSQL via API health probe (/health/db) |
| 4 | Heartbeat | Heartbeat | 10-min cron — detects silent CI failures |
| 5 | Status Page | Website | status.ecypro.com self-check |

## Status Levels

| Level | Color | Meaning |
|-------|-------|---------|
| Operational | Green | All checks passing |
| Degraded Performance | Yellow | Slow but responding |
| Partial Outage | Orange | Some regions failing |
| Major Outage | Red | Monitor down or unresponsive |

## Incident Template

**Title:** `[Component] — [brief description]`

**Body:**
```
We are investigating an issue with [component].
Impact: [who/what is affected]
Status: Investigating / Identified / Monitoring / Resolved
Next update: [time]
```

## DNS Setup

Add to Cloudflare (DNS-only, not proxied):

```
CNAME  status  <your-betterstack-status-page-subdomain>.betterstack.com
```

> Cloudflare: set to "DNS only" (grey cloud) — BetterStack must see the origin for status page SSL.
