# Cloudflare Launch Shield — Audit + Freeze Status

**Date:** 2026-05-22 (sprint H5) · **Zone:** `ecypro.com` (active, **Free Website** plan)
**Method:** Read-only Cloudflare API audit. No production zone config was modified
(in-place prod changes require explicit owner authorization — see "Not applied" below).

## Edge Security Posture — already configured ✅

| Control | State | Verdict |
|---|---|---|
| SSL/TLS mode | `strict` (Full Strict) | ✅ |
| Always Use HTTPS | `on` | ✅ |
| Minimum TLS version | `1.2` | ✅ |
| TLS 1.3 | `on` (0-RTT) | ✅ |
| Browser Integrity Check | `on` | ✅ |
| Bot Fight Mode | `on` | ✅ |
| DDoS L7 ruleset | deployed | ✅ |
| WAF — Cloudflare Managed Free Ruleset | deployed, rules enabled (Log4j, Shellshock, WP CVEs) | ✅ |
| Rate limiting | `/api/contact` → 5 req / 10s → **block** | ✅ |
| Cache rules | static 1y immutable · HTML 5min edge · `api.ecypro.com` bypass · `/admin` bypass | ✅ |

**The launch shield is substantially in place.** No new WAF/rate-limit/cache rule was
required. The legacy `/rate_limits` POST from the original plan is deprecated and is
superseded by the existing `http_ratelimit` ruleset rule above — not re-created.

## ⚠️ Findings

### 1. HSTS max-age too short (recommend fix)
Current `Strict-Transport-Security` `max_age = 600` (10 minutes). This is effectively
no HSTS protection — a 10-minute window defeats the purpose.

**Recommended:** `max_age = 31536000` (1 year), `includeSubDomains=false`,
`preload=false`, `nosniff=true`. Safe because the zone is HTTPS-committed
(Always Use HTTPS on, SSL Full Strict).

**Status: NOT applied.** The in-place production zone write was intentionally not
performed in this autonomous sprint — modifying a live prod security header on launch
day requires explicit owner authorization. Apply manually:

```bash
source ~/.ecypro-tokens.env
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/settings/security_header" \
  -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"value":{"strict_transport_security":{"enabled":true,"max_age":31536000,"include_subdomains":false,"preload":false,"nosniff":true}}}'
```

### 2. Stale `RENDER_SERVICE_ID` secret
The configured `RENDER_SERVICE_ID` resolves to `not found: service: srv_d2bc…`. The
real backend service is **`ecypro-api`** (web_service, **not suspended**). The stored
ID is stale/truncated. Cross-references the secret-mismatch findings in
`docs/SECRET_ROTATION_PLAN.md` (sprint H4). Update the secret to the correct service ID.

### 3. Free-plan ceiling
WAF custom managed rulesets, advanced rate-limiting, and managed bot management beyond
Bot Fight Mode require Pro+. Current free-tier controls are adequate for launch; revisit
if traffic/abuse warrants a plan upgrade.

## Production Freeze — status + checklist

Freeze toggles change live deploy behavior and are **dashboard/owner actions** — not
auto-applied here.

| Target | Current state | Freeze action (owner) |
|---|---|---|
| Vercel `danisman` | github-linked, prod branch `main`, **not paused**, latest prod deploy = BUILDING | Settings → Git → Pause deployments (or disable auto-deploy on `main`) until launch sign-off |
| Render `ecypro-api` | web_service, **not suspended** | Settings → Suspend Auto-Deploy until launch sign-off |
| GitHub Actions | 🔴 billing-locked (see `docs/CI_BILLING_LOCK_REDLINE.md`) | resolve billing; CI is effectively frozen by the lock |

## Infra Status (read-only snapshot, 2026-05-22)

```json
{
  "cloudflare": {
    "zone": "ecypro.com",
    "status": "active",
    "plan": "Free Website",
    "ssl": "strict",
    "always_use_https": "on",
    "min_tls_version": "1.2",
    "tls_1_3": "on",
    "bot_fight_mode": true,
    "browser_check": "on",
    "ddos_l7": "deployed",
    "waf_managed_free_ruleset": "deployed",
    "rate_limit": "/api/contact 5req/10s block",
    "cache_rules": ["static 1y", "html 5min", "api bypass", "admin bypass"],
    "hsts_max_age": 600,
    "hsts_recommended": 31536000
  },
  "vercel": {
    "project": "danisman",
    "framework": "vite",
    "production_branch": "main",
    "paused": false,
    "latest_prod_deploy": "BUILDING"
  },
  "render": {
    "service": "ecypro-api",
    "type": "web_service",
    "suspended": false,
    "stored_service_id": "STALE — not found"
  },
  "github_actions": {
    "status": "BILLING_LOCKED",
    "ref": "docs/CI_BILLING_LOCK_REDLINE.md"
  }
}
```
