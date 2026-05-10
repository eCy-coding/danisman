# EcyPro Observability Setup Guide

P40-T04 (Uptime Monitoring) + P40-T05 (Status Page) manual setup instructions.
All other P40 items are automated in CI/CD.

---

## P40-T04: UptimeRobot Setup (5 monitors, free tier)

### Account setup
1. Register: https://uptimerobot.com (free — 50 monitors)
2. Login → **+ Add New Monitor**

### Monitor 1: Landing Page HTTP
```
Type:         HTTP(s)
Friendly Name: EcyPro Website
URL:          https://ecypro.com/
Monitoring Interval: 5 minutes
Alert Contacts: [your email]
```

### Monitor 2: API Health
```
Type:         HTTP(s) + Keyword
Friendly Name: EcyPro API Health
URL:          https://ecypro.com/api/health
Keyword:      "ok"
Monitoring Interval: 5 minutes
```

### Monitor 3: API Readiness
```
Type:         HTTP(s)
Friendly Name: EcyPro API Ready
URL:          https://ecypro.com/api/ready
Monitoring Interval: 5 minutes
Alert: If status not 200
```

### Monitor 4: SSL Certificate
```
Type:         SSL Expiry
Friendly Name: EcyPro SSL
URL:          ecypro.com
Alert when:   30 days before expiry
```

### Monitor 5: API Docs
```
Type:         HTTP(s)
Friendly Name: EcyPro API Docs
URL:          https://ecypro.com/api/docs
Monitoring Interval: 15 minutes
```

### Alert Channels
- Email: primary notification
- Telegram: `Settings → Alert Contacts → Telegram` (optional, instant)
- Webhook: POST to Slack/Discord (optional)

### Verify
After setup: UptimeRobot dashboard → all 5 monitors green.
Down simulation: temporarily block port → alert email arrives <6min.

---

## P40-T05: Status Page (Instatus — free tier)

### Account setup
1. Register: https://instatus.com (free — up to 5 components)
2. Create project: `EcyPro` → subdomain: `status` (→ `status.ecypro.com`)

### Components to add
```
1. Website        — https://ecypro.com/
2. API            — https://ecypro.com/api/health
3. Database       — manual update (no public endpoint)
4. Booking System — https://ecypro.com/api/bookings/slots
5. Admin Panel    — https://ecypro.com/admin
```

### UptimeRobot Integration (auto-update status)
1. Instatus → Settings → Integrations → UptimeRobot
2. Connect UptimeRobot account
3. Map each UptimeRobot monitor → Instatus component
4. Enable: auto-create incident on monitor down

### DNS CNAME Setup
Add to DNS provider (Vercel/Cloudflare):
```
CNAME   status   cname.instatus.com
```

### Verify
- https://status.ecypro.com → Instatus public page
- 3+ components "Operational"
- Simulate downtime → component turns red within 2min
- Incident appears automatically

---

## P40-T03: Better Stack (Logtail) — Already automated

`LOGTAIL_SOURCE_TOKEN` in `.env` activates Winston transport.
Verify: betterstack.com → Logs → search `level:error` → real-time stream.

---

## P40-T01: Sentry Source Maps — Already automated

Trigger: `git tag v1.0.0 && git push --tags`
Verify: Sentry → Releases → v1.0.0 + source maps uploaded.

---

## Phase 40 Checklist

- [x] Sentry Source Maps CI (`release.yml`)
- [x] Lighthouse CI (`.lighthouserc.js` + `ci.yml`)
- [x] Log Aggregation (Better Stack / `LOGTAIL_SOURCE_TOKEN`)
- [ ] UptimeRobot 5 monitors — setup above
- [ ] Status Page (Instatus) — setup above
- [x] PM2 production (`ecosystem.config.cjs`)
- [x] DB Backup (`scripts/backup-db.sh`)
- [x] Docker GHCR (`.github/workflows/docker.yml`)
- [x] Blue-Green Deployment (`scripts/blue-green-switch.sh`)
- [x] Incident Runbook (`docs/INCIDENT_RUNBOOK.md`)
