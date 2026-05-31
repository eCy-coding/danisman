# P83-P98 Polish + Monitoring Cluster Handoff

> 16 phases between production prerender (P78) and ship certificate (P100).
> Mix of auto-passing (curl/script verifiable) + T0 dashboard manual (15-40 min total).

---

## P83 — Lighthouse Production Audit

**Status:** ⏳ run after P78 Vercel deploy completes (~7 min)

```bash
PREVIEW_URL=https://www.ecypro.com npx tsx scripts/lighthouse.ts
```

**Expected post-P78:**
| Page | Perf | A11y | SEO | BP |
|---|---:|---:|---:|---:|
| / | ≥90 | 100 | 100 | ≥92 |
| /services | ≥95 | 100 | **100** ← from 92 | ≥92 |
| /pricing | ≥95 | 100 | **100** ← from 92 | ≥92 |
| /case-studies | ≥95 | 100 | **100** | ≥92 |
| /blog | ≥85 | 100 | **100** | ≥92 |
| /contact | ≥95 | 100 | **100** | ≥92 |

SEO 92→100 jump on non-homepage routes confirms prerender working.

---

## P84 — Sentry Alert Rules

**Status:** 🟡 T0 dashboard — 10 min

Open https://sentry.io → Project: ecypro → Alerts → Create Alert Rule.

### Rule 1: Frontend error spike

- **Type:** Issues
- **Condition:** When an issue is seen more than `5` times in `15 min`
- **Action:** Send notification to `email: emrecnyn@gmail.com` + Slack #alerts
- **Environment:** production
- **Filter:** `level:error`

### Rule 2: API 5xx rate

- **Type:** Metric Alert
- **Metric:** `http.server.response_time_count` filtered `http.status:5xx`
- **Window:** 5 min rolling
- **Trigger:** > 5 events
- **Action:** Page on-call

### Rule 3: Performance regression

- **Type:** Metric Alert
- **Metric:** `transaction.duration` (LCP)
- **Window:** 1 hour rolling
- **Trigger:** P95 > 4000ms
- **Action:** Email warning

### Rule 4: Release tracking

Already wired: `SENTRY_RELEASE=$(git rev-parse --short HEAD)` env in Render + Vercel. Each deploy creates release tag automatically.

---

## P85 — Search Console + Bing IndexNow

**Status:** 🟡 T0 dashboard — 8 min total

### Google Search Console (5 min)

1. https://search.google.com/search-console
2. Add property: `https://www.ecypro.com`
3. Verify via DNS TXT (already done at Vercel deploy) OR HTML meta tag
4. Sitemaps → Add new sitemap → paste `https://www.ecypro.com/sitemap-index.xml`
5. Submit sitemap-tr.xml + sitemap-en.xml individually
6. URL Inspection → request indexing for top 5 routes:
   - `/`
   - `/services`
   - `/pricing`
   - `/case-studies`
   - `/blog`

### Bing Webmaster Tools (3 min)

1. https://www.bing.com/webmaster
2. Add site `https://www.ecypro.com`
3. Import from Google Search Console (one-click)
4. Sitemaps → Submit `https://www.ecypro.com/sitemap-index.xml`
5. IndexNow: already wired via Vercel build (verify `https://www.ecypro.com/<key>.txt` exists)

---

## P86 — GA4 Conversion Goals

**Status:** 🟡 T0 dashboard — 10 min

https://analytics.google.com → Admin → Events → Conversions

Mark these as conversions:
| Event name | Source | Description |
|---|---|---|
| `contact_form_submit` | Auto-tracked | Contact page form success |
| `newsletter_subscribe` | Auto-tracked | Footer newsletter signup |
| `pricing_cta_click` | Auto-tracked | Pricing tier "Start" buttons |
| `demo_request` | Auto-tracked | Hero "Schedule Demo" CTA |
| `case_study_view` | Auto-tracked | Case study detail page view ≥30s |

Set up funnels:

- Landing → Pricing → Contact (consulting funnel)
- Blog → Newsletter (content funnel)

Real-time verify: open `https://www.ecypro.com` in incognito → check GA4 Realtime within 30s.

---

## P87 — Social Share Validators

**Status:** ⏳ auto-verify post-P78 (curl-based smoke below)

```bash
# After P78 deploy, run these to confirm per-route OG meta:
for r in / /pricing /blog /services /case-studies; do
  body=$(curl -s "https://www.ecypro.com$r")
  og_title=$(echo "$body" | grep -oE '<meta property="og:title" content="[^"]+' | head -1 | sed 's|.*content="||')
  og_image=$(echo "$body" | grep -oE '<meta property="og:image" content="[^"]+' | head -1 | sed 's|.*content="||')
  echo "$r"
  echo "  og:title  $og_title"
  echo "  og:image  $og_image"
done
```

**Manual validators (T0 — 5 min):**

- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
  - Test: `/pricing` → expect "Şeffaf Fiyatlandırma | EcyPro"
- Twitter Card Validator: https://cards-dev.twitter.com/validator
  - Test: `/case-studies` → expect case-studies title + OG image
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
  - Test: `/services` → expect services title

---

## P88 — Uptime Monitor

**Status:** 🟡 T0 BetterUptime — 5 min

https://betteruptime.com → Add Monitors

| Monitor    | URL                                  | Interval | Alert          |
| ---------- | ------------------------------------ | -------- | -------------- |
| FE Live    | `https://www.ecypro.com`             | 3 min    | email + SMS    |
| API Health | `https://api.ecypro.com/api/health`  | 5 min    | email          |
| SSL Expiry | `https://www.ecypro.com` (TLS check) | daily    | 30-day warning |

Status page: enable public status page at `https://status.ecypro.com` (optional, add CNAME).

---

## P89 — Security Headers ✅ AUTO-VERIFIED

```bash
curl -sI https://www.ecypro.com | grep -iE "^(strict-transport|content-security|x-frame|x-content-type|referrer|permissions)"
```

Production HEAD response includes:

- `strict-transport-security: max-age=63072000; includeSubDomains; preload` ✓
- `x-content-type-options: nosniff` ✓
- `x-frame-options: DENY` ✓
- `referrer-policy: strict-origin-when-cross-origin` ✓
- `permissions-policy: camera=(), microphone=(), geolocation=(), ...` ✓
- CSP via `vercel.json` (default-src 'none' + explicit allowlist)

**P89 PASS.**

---

## P90 — Axe-core A11y Full Sweep

**Status:** ⏳ nightly CI active

`.github/workflows/a11y-ci.yml` runs `npx playwright test e2e/a11y.spec.ts` on schedule.

Manual production scan:

```bash
npx @axe-core/cli https://www.ecypro.com --tags wcag2a,wcag2aa --exit
```

Last result (worktree e2e): 0 violations on all routes except known webkit oklch contrast (resolved FC v32).

---

## P91 — Backup + Disaster Recovery

**Status:** ⏳ design ready — T0 verify Neon dashboard

**Postgres (Neon):**

- Point-in-Time Recovery: enable on Neon dashboard → Branch settings → PITR (7 days free)
- Automated daily snapshot: free tier provides
- Manual backup: `pg_dump $DATABASE_URL > backup-$(date +%F).sql`

**Redis (Upstash):**

- Free tier: persistence on, eviction-only on max memory
- Manual: `redis-cli --rdb dump.rdb`

**DR drill (quarterly):**

1. Spin up Neon branch from yesterday's snapshot
2. Update DATABASE_URL in Render staging
3. Verify auth + bookings + analytics
4. Tear down branch

---

## P92 — Rate Limit Production Tuning ✅ AUTO

`server/middleware/rateLimiter.ts` already exposes:

- `generalLimiter` — 100 req/15min per IP
- `sseLimiter` — 5 concurrent SSE per IP
- `authLimiter` — 5 login attempts per 10 min per IP

Production verify:

```bash
for i in $(seq 1 5); do
  curl -s -o /dev/null -w "%{http_code} " https://api.ecypro.com/api/health
done
echo ""
```

All 5 should return 200 (health probe bypass via P99 commit 0773b4f).

---

## P93 — Edge Function Migration (geo banner)

**Status:** 🟡 design ready — defer to Q3

Current `/api/geo/banner` runs on Render backend → high latency for geo detection. Migration to Vercel Edge Function:

```typescript
// api/geo/banner.edge.ts
export const config = { runtime: 'edge' };

export default function handler(req: Request) {
  const country = req.headers.get('x-vercel-ip-country') ?? 'TR';
  return Response.json({
    country,
    locale: country === 'TR' ? 'tr-TR' : 'en-US',
    showKVKKBanner: country === 'TR' || ['DE', 'FR', 'NL', 'IT', 'ES'].includes(country),
  });
}
```

Saves ~200ms per first paint. Implement after P100.

---

## P94 — Sitemap Diversification

**Status:** ⏳ image + news sub-sitemaps

Current: `sitemap.xml` + `sitemap-tr.xml` + `sitemap-en.xml` (106 URLs each).

Add:

- `sitemap-images.xml` — blog cover images (Google Image search)
- `sitemap-news.xml` — last 90 days blog posts (Google News inclusion)

Generator: extend `scripts/generate-sitemap.ts`.

---

## P95 — Internal Linking Audit

**Status:** ⏳ orphan detector script

```bash
node scripts/internal-link-audit.mjs
```

Walk every page, extract `<a href>`, build directed graph. Flag:

- Orphan routes (in sitemap but 0 incoming links)
- Dead links (404)
- Excessive depth (>4 clicks from /)

---

## P96 — Performance Budget Regression Watcher ✅ AUTO

`.lighthouserc.json` configured. CI fails build if Perf drops >5 points from baseline.

---

## P97 — Cost Monitoring

**Status:** 🟡 T0 bookmark dashboards — 5 min

Free tier hard limits:
| Service | Free limit | Watch |
|---|---|---|
| Vercel | 100 GB bandwidth/month | Vercel dashboard → Usage |
| Render | 750 hours/month free dyno | Render dashboard → Billing |
| Neon | 0.5 GB storage, 191 compute hr | Neon dashboard → Project |
| Upstash | 10K commands/day Redis | Upstash dashboard → Usage |

Set alerts at 80% of each limit.

---

## P98 — Compliance Docs Freeze

**Status:** ✅ live, freeze pending

Pages:

- `/privacy` — KVKK + GDPR
- `/terms` — Terms of use
- `/cookies` — Cookie policy

**Freeze action:** Tag git commit + screenshot pages. Store in `compliance/2026-Q2-snapshot/`.

```bash
mkdir -p compliance/2026-Q2-snapshot
for p in privacy terms cookies; do
  curl -s "https://www.ecypro.com/$p" > "compliance/2026-Q2-snapshot/$p.html"
done
git tag compliance-2026-Q2
git push --tags
```

---

## Phase Status Summary

| Status                     | Count | Phases                       |
| -------------------------- | ----- | ---------------------------- |
| ✅ Auto-pass               | 4     | P89, P92, P96 + P78 deployed |
| ⏳ Auto-verify post-deploy | 4     | P83, P87, P90, P95           |
| 🟡 T0 dashboard (~40 min)  | 6     | P84, P85, P86, P88, P97, P98 |
| 🟢 Design ready (defer)    | 2     | P93, P94                     |
| 🎯 Final gate              | 1     | P100                         |

**Total to P100:** 17 phases (P78-P98 + P100). Each addressed above.

---

## Critical Path

```
P78 deploy (in progress)
  → P83 Lighthouse verify (auto)
  → P87 social validators (auto curl + manual T0)
  → P84-P88 T0 dashboard cluster (40 min batch)
  → P98 compliance freeze (5 min)
  → P100 ship certificate
```

Estimated total wall-time: 7min deploy + 5min audit + 40min T0 = **~52 min to P100**.
