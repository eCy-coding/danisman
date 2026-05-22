# eCyPro — Production Runbook

> Last updated: 2026-05-21 (autonomous cron)

## Architecture Overview

| Component | Host       | URL                          |
| --------- | ---------- | ---------------------------- |
| Frontend  | Vercel     | https://ecypro.com           |
| API       | Render     | https://api.ecypro.com       |
| Database  | Render PG  | (internal, via DATABASE_URL) |
| DNS/CDN   | Cloudflare | ecypro.com zone              |

## Health Checks

```bash
# Frontend (Vercel)
curl -fI https://ecypro.com

# API (Render)
curl -f https://api.ecypro.com/api/v1/health
```

**Expected:** Frontend → 200, API → 200 JSON `{ status: "ok" }`.

Render free-tier spins down after 15 min inactivity. First request after
sleep takes ~30s (cold start). If API returns 502 persistently, check
Render dashboard for deploy failures or env var issues.

## Deployment

### Frontend (Vercel)

- Auto-deploys on push to `main` branch.
- Build command: `pnpm build` (Vite).
- Preview deploys on PRs.

### API (Render)

- Auto-deploys on push to `main` branch.
- Build: `pnpm install && pnpm build:server`
- Start: `node dist/server/index.js`
- Health check path: `/api/v1/health`

### Database Migrations

```bash
# Run pending migrations (production)
DATABASE_URL="postgres://..." npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

## Admin Bootstrap

First-time admin user creation (run once after initial deploy):

```bash
ADMIN_EMAIL=founder@ecypro.com \
ADMIN_PASSWORD=your-secure-password-here \
DATABASE_URL="postgres://..." \
npx tsx server/scripts/seed-admin.ts
```

## Environment Variables

Critical production env vars (validated by Zod at boot):

| Variable           | Required | Description                          |
| ------------------ | -------- | ------------------------------------ |
| DATABASE_URL       | Yes      | Postgres connection string           |
| JWT_SECRET         | Yes      | ≥32 char signing secret              |
| CORS_ORIGIN        | Yes      | Frontend origin (https://ecypro.com) |
| NODE_ENV           | Yes      | Must be `production`                 |
| PORT               | No       | Default 3001                         |
| SENTRY_DSN         | No       | Sentry error tracking                |
| TELEGRAM_BOT_TOKEN | No       | Ops notification bot                 |
| TELEGRAM_CHAT_ID   | No       | Founder chat for alerts              |
| RESEND_API_KEY     | No       | Transactional email                  |

Missing critical vars in production → server exits with code 1.

## Incident Response

### API 502 (Render cold start vs real outage)

1. Wait 30s, retry `curl -f https://api.ecypro.com/api/v1/health`
2. If still 502 → check Render dashboard for deploy status
3. Check Render logs: `render logs --service ecypro-api --tail 100`
4. Verify env vars haven't been cleared (Render dashboard → Environment)

### Database connection failures

1. Check Render PG dashboard for status
2. Verify `DATABASE_URL` is correct in Render env
3. Check connection pool: `PG_POOL_MAX` default is 10
4. If pool exhaustion → restart service or increase pool

### Frontend build failures

1. Check Vercel dashboard for build logs
2. Common: TypeScript errors — run `pnpm typecheck` locally
3. Prerender failures are non-blocking (graceful skip in place)

## Monitoring

- **Sentry:** Error tracking (backend + frontend)
- **Vercel Analytics:** Frontend performance
- **Render Metrics:** API CPU/memory/response times
- **Telegram Bot:** Critical alerts to founder chat

## Rollback

```bash
# Revert last commit on main
git revert HEAD --no-edit
git push origin main
# Vercel + Render auto-redeploy on push

# Emergency: force-deploy specific commit on Render
# Use Render dashboard → Manual Deploy → enter commit SHA
```

## Scheduled Maintenance

- **Prisma migrations:** Always run `prisma migrate deploy` (not `dev`) in production
- **Dependencies:** `pnpm audit` weekly; `pnpm update` monthly
- **SSL:** Managed by Vercel (frontend) and Cloudflare (API proxy)
- **Backups:** Render PG automatic daily backups (7-day retention on paid tier)
