# BetterStack Setup — Owner Tier 3

Template-ready code is merged. Monitors activate after you complete these steps.

## Step 1 — Create Account

1. Sign up at [betterstack.com](https://betterstack.com)
2. Create team: **eCyPro**

## Step 2 — Generate API Token

1. Go to **Settings → API → Uptime API tokens**
2. Create token: `ecypro-monitors`
3. Copy the token value (shown once)

## Step 3 — Add to GitHub Secrets

In the [eCy-coding/danisman](https://github.com/eCy-coding/danisman) repo → **Settings → Secrets and variables → Actions**:

| Secret name | Value |
|-------------|-------|
| `BETTERSTACK_API_TOKEN` | Your API token from Step 2 |
| `BETTERSTACK_HEARTBEAT_URL` | Heartbeat URL from Step 5 |

## Step 4 — Add to Render ENV

In Render dashboard → your API service → **Environment**:

| Key | Value |
|-----|-------|
| `BETTERSTACK_API_TOKEN` | Your API token from Step 2 |
| `BETTERSTACK_HEARTBEAT_URL` | Heartbeat URL from Step 5 |

## Step 5 — Create Heartbeat Monitor

1. BetterStack → **Uptime → New monitor → Heartbeat**
2. Name: `eCyPro Heartbeat`
3. Expected period: `600` seconds (10 min)
4. Grace period: `300` seconds (5 min)
5. Copy the **heartbeat URL** — add to secrets from Step 3

## Step 6 — Run Sync Workflow

```bash
gh workflow run betterstack-sync.yml
```

Or push to trigger via GitHub Actions. The sync script will create/update all 5 monitors from `scripts/betterstack-monitors.json`.

## Step 7 — Create Status Page

1. BetterStack → **Status pages → New status page**
2. **Public URL:** `status.ecypro.com`
3. Add the 5 components from `docs/STATUS_PAGE_SCHEMA.md`
4. Enable subscriber notifications (email)

## Step 8 — DNS CNAME

In Cloudflare for `ecypro.com`:

```
Type:    CNAME
Name:    status
Target:  <your-page-slug>.betterstack.com
Proxy:   DNS only (grey cloud — BetterStack needs origin for SSL)
```

## Step 9 — Verify

After setup, verify:

```bash
# API token works
curl -H "Authorization: Bearer $BETTERSTACK_API_TOKEN" \
  https://uptime.betterstack.com/api/v2/monitors | jq '.data | length'
# Should return 5 (or however many exist)

# Heartbeat fires
node scripts/heartbeat.mjs

# Status page reachable
curl -I https://status.ecypro.com
```

## GitHub Actions Note

> CI billing is currently locked. The `heartbeat.yml` cron will activate once billing is restored.
> Track: `docs/CI_BILLING_LOCK_REDLINE.md`
