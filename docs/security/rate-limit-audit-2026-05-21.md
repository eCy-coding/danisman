# Rate-limit audit + chaos validation — 2026-05-21

Track 2 / H3, pre-launch 2026-05-25.

## Actual production budgets (audited)

Mounted in `server/index.ts` on `/api`, in order:

| Layer | Middleware | Budget | Key | Source |
|---|---|---|---|---|
| Per-IP general | `generalLimiter` | 100 / 15 min | IP | `rateLimiter.ts:165` |
| Per-tier | `tierRateLimiter` (anonymous) | 60 / 15 min | IP | `rate-limit-tier.ts:232` |
| Per-tier | `tierRateLimiter` (auth) | 300 / 15 min | user id | " |
| Per-tier | `tierRateLimiter` (admin) | 1000 / 15 min | user id | " |

For an anonymous client the **tier limiter (60/15min) caps first** (60 < 100).

### Per-route limiters (mounted on the route)

| Route | Middleware | Budget |
|---|---|---|
| `POST /api/quick-check` | `quickCheckLimiter` | **3 / 60 min** |
| `POST /api/pricing-calc` (contact) | `contactLimiter` | 3 / 60 min |
| `POST /api/contact`, newsletter | `contactLimiter` | 3 / 60 min |
| public booking | `publicBookingLimiter` | 10 / 24 h |
| SSE | `sseLimiter` | 3 / 60 s |

Health probes + Calendly webhook ingress are exempt (`isRateLimitExempt`) so platform
liveness checks don't self-inflict 429s (Render recover-loop fix, P99).

### Divergence from master plan

The H3 brief assumed per-second budgets (10/sec quick-check, 5/sec pricing, 100/sec health).
The real design is per-IP/per-tier **windowed** limits and is *far stricter* (3/hour for the
abuse-prone funnels), which is correct for one-shot assessment/quote endpoints. No change made —
the brief's numbers were illustrative.

## Chaos test

`scripts/chaos/rate-limit-test.ts` — boots an ephemeral Express app with the **real**
`generalLimiter` + `tierRateLimiter` + `quickCheckLimiter` and hammers it over loopback (also
supports `CHAOS_TARGET=<url>` for live/staging). No DB/Redis required (in-memory fallback).

Run: `npx tsx scripts/chaos/rate-limit-test.ts`
Report: `~/Documents/eCyPro-memory/chaos-reports/rate-limit-<date>.json`

### Result (2026-05-21, in-process)

- **Global stack**: 90 requests → 68×200, 22×429. Throttling engaged past the anonymous-tier
  budget; `X-RateLimit-*` headers and `Retry-After` present on 429s. ✅
- **quickCheckLimiter (3/hr)**: 8 requests → 3×200, 5×429, first 429 at request #4 (exact budget). ✅

Pass criteria (CI-gateable, exit 1 on failure): global stack must emit a 429 + rate-limit headers
+ Retry-After; strict bucket must throttle at/under the 4th hit.
