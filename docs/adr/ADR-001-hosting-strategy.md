# ADR-001: Hosting strategy — Render (API) + Hostinger VPS (static)

- Status: accepted
- Date: 2026-05-15
- Decider(s): @emre

## Context

EcyPro consists of two deployable artifacts:

1. A React + Vite static bundle (landing site, dashboard SPA shell).
2. An Express + Prisma API with Postgres + Redis.

We considered three deployment shapes:

- **A. Monolith on Hostinger VPS** — single droplet runs nginx +
  pm2-managed Node + local Postgres + local Redis.
- **B. Monolith on Render** — single Render service runs everything
  including the static bundle behind Express.
- **C. Split** — Render hosts the API + managed Postgres + managed
  Redis. Hostinger VPS serves the static bundle via nginx.

Forces in play:

- Render's free Postgres + managed Redis lower operational toil for the
  stateful tier; we don't want to be Postgres SREs.
- The static bundle is cache-friendly; pushing it to a CDN-fronted
  nginx is faster and cheaper than serving via Render's bandwidth meter.
- DNS lives at Hostinger already, the certificate is already paid for.
- Render's free tier sleeps after 15 min idle; cold start hurts the
  contact form's first hit. The API tier needs to be paid.

## Decision

Adopt **Scenario C — Split**: API + managed Postgres + managed Redis on
**Render** (paid plan, no sleeping); static bundle served via **nginx on
Hostinger VPS**. The two tiers communicate over HTTPS using the
production CORS allowlist baked into the API.

## Consequences

**Easier:**

- Postgres backups, point-in-time-restore, and failover are Render's
  problem.
- Static bundle bandwidth is on Hostinger's flat-rate plan, decoupled
  from API metering.
- CI can deploy each tier independently (`DEPLOY_FRONTEND_HOSTINGER.command`
  vs `DEPLOY_BACKEND_RENDER.command`).

**Harder:**

- Two deployment targets means two failure modes — observability has to
  cover both.
- Cross-origin requests require strict CORS allowlist; preflight cache
  set to 24h to amortise.
- Cookies cannot be used for auth state (SPA on hostinger.com talking to
  api.ecypro.com); we use Bearer tokens in `Authorization`.

**Risks accepted:**

- Render outage = API down even though static landing still loads. We
  mitigate with a graceful CTA fallback (mailto link) on the contact form.

## Alternatives considered

- **A. Monolith on Hostinger VPS** — rejected because we don't want to
  operate Postgres/Redis ourselves and because Hostinger does not give
  us painless rolling-deploy semantics.
- **B. Monolith on Render** — rejected because Render bandwidth pricing
  for the static bundle is materially worse than Hostinger's flat plan
  and because we wanted to keep the marketing site reachable even when
  the API is rebooting.
