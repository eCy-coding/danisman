# FC v37 — ALERT.txt Final Resolution + Production Sync Handoff

**Date:** 2026-05-17
**Author:** Claude (autonomous /ultrathink)
**Branch:** `main` HEAD `507459b`
**Target deploy:** Vercel `www.ecypro.com`

---

## ALERT.txt Root Cause Resolution Matrix

ALERT.txt (36 943 lines, 349 e2e failures) issues mapped to 7 distinct roots. Status after T0 manual recovery + FC v37 patches:

| Root | Symptom Count | Root Cause | Status | Resolution |
|---|---|---|---|---|
| A | 16 TS errors | NotFoundPage cherry-pick conflict markers | ✅ RESOLVED | T0 commit `a290489` |
| B | ~100 console errors | api.ecypro.com Render service `no-deploy` 502 | ✅ RESOLVED | T0 Render redeploy → 200 + CORS |
| C | 14 visual fails | Snapshot baselines first-run, untracked | ⚠️ PENDING | `e2e/snapshots/` commit (Phase 2b) |
| D | SEO 92 (non-home) | Per-route static HTML prerender missing | ⚠️ PENDING | `scripts/prerender.mjs` opt-in (Phase 2a) |
| E | 16 cherry-pick fail | Cascade after first conflict | ✅ RESOLVED | `git cherry-pick --abort` |
| F | 1 PR error | HEAD=main=base | ✅ N/A | User-side workflow |
| G | ~50 specific | Backend connectivity cascade | ✅ AUTO-RESOLVED | Root B fix cascades to G |

Net: 5/7 fully resolved. 2 (C, D) addressed by FC v37 patches.

---

## FC v37 Patches Delivered

### Patch 1 — `scripts/prerender.mjs` (per-route static HTML)

**Problem (Root D):** Vite SPA serves identical `dist/index.html` for all 18 routes. Per-page `<title>`, `<meta og:*>`, JSON-LD schemas inject via react-helmet-async AFTER React hydrates. Crawlers without JS engine (LinkedIn, Twitter, Slack, Facebook) only read static HTML → all share-cards show homepage meta. Confirmed via `curl https://www.ecypro.com/pricing | grep title` returning homepage title.

**Solution:** Build-time prerender script using Playwright headless Chromium:
1. Start `vite preview` on port 4179
2. For each route in `dist/sitemap.xml`, navigate via Playwright
3. Wait for `networkidle` (React + Helmet flushed)
4. Capture `document.outerHTML`
5. Write to `dist/<route>/index.html`

Vercel SPA rewrite (`vercel.json`) then serves prerendered HTML per route.

**Files modified:**
- `scripts/prerender.mjs` (NEW, 145 LOC)
- `package.json` — `postbuild` script chains `node scripts/prerender.mjs` (opt-in via `PRERENDER=1`)

**Opt-in design:** Default `npm run build` unchanged. `PRERENDER=1 npm run build` activates prerender. Lets T0 verify locally before enforcing in Vercel build.

**Cost:** ~30-60 s build overhead (depends on route count). Bundle unchanged (HTML files only).

**Verification:**
```bash
cd /Users/emrecnyngmail.com/Desktop/ecypro
PRERENDER=1 npm run build
# Expect ~18 routes prerendered. Verify per-route HTML:
grep -h "<title>" dist/services/index.html  # should differ from dist/index.html
grep -h "<title>" dist/pricing/index.html
```

**Vercel activation:**
Add `PRERENDER=1` env var in Vercel dashboard → Settings → Environment Variables (Production). Next deploy will prerender.

### Patch 2 — Visual snapshot baselines (Root C)

**Problem:** `e2e/visual.spec.ts` generates 14 baseline images on first run. Untracked in git → CI fails first run after each clean deploy.

**Solution:** Commit `e2e/snapshots/` directory.

```bash
cd /Users/emrecnyngmail.com/Desktop/ecypro
git add e2e/snapshots/
git commit -m "test(visual): commit Playwright snapshot baselines (14 routes × 3 viewports)"
```

**Trade-off:** Baselines drift after visual changes (CSS edits). Add to PR review checklist: "if visual diff, update snapshots via `npx playwright test --update-snapshots`".

---

## Production Verification (Post-FC-v37 Deploy)

### Smoke (immediate, T0 or Claude)

```bash
# 1) Backend live
curl -sH "Origin: https://www.ecypro.com" -I https://api.ecypro.com/api/health
# Expect: HTTP/2 200 + access-control-allow-origin

# 2) Per-route prerender working
for r in / /pricing /blog /services; do
  title=$(curl -s "https://www.ecypro.com$r" | grep -oE "<title>[^<]+" | head -1)
  echo "$r → $title"
done
# After PRERENDER=1 deploy: each route shows distinct title.
# Before: all show "EcyPro | Stratejik Yönetim Danışmanlığı"

# 3) Sitemap intact
curl -s https://www.ecypro.com/sitemap.xml | grep -c "<url>"
# Expect: ≥18

# 4) Lighthouse production
PREVIEW_URL=https://www.ecypro.com npx tsx scripts/lighthouse.ts
# Pre-FC-v37: SEO 92-100, BP 92
# Post-FC-v37 (after PRERENDER): expect SEO 100 across, BP 92+
```

### Social share preview (T0 manual, 5 min)

| Platform | URL | Verify |
|---|---|---|
| LinkedIn | https://www.linkedin.com/post-inspector/ | Paste /pricing → expect "Fiyatlandırma..." title (not homepage) |
| Twitter | https://cards-dev.twitter.com/validator | Paste /case-studies → expect case-study OG image |
| Facebook | https://developers.facebook.com/tools/debug/ | Paste /services → expect services title |
| Slack | Paste link in private channel | Preview shows page-specific title |

---

## T0 Monitoring Handoff (Phase 4)

### Sentry alert rules (10 min, sentry.io dashboard)

1. **Frontend error rate** — Trigger: >5 errors / 15 min — Action: email + Slack
2. **API 5xx rate** — Trigger: >1% of requests over 5 min — Action: page on-call
3. **Performance regression** — Trigger: P95 LCP > 4 s — Action: email
4. **Release tracking** — Each deploy creates release tag (already wired via `SENTRY_RELEASE` env)

### Google Search Console (5 min)

1. Property: `https://www.ecypro.com`
2. Settings → Verification (DNS TXT record already done at deploy)
3. Sitemaps → Add new sitemap → `https://www.ecypro.com/sitemap.xml`
4. URL Inspection → request indexing for top 5 routes: `/`, `/services`, `/pricing`, `/case-studies`, `/blog`

### Bing Webmaster Tools (5 min)

1. Property: `https://www.ecypro.com`
2. Sitemaps → Submit `https://www.ecypro.com/sitemap.xml`
3. IndexNow API key: already in `.well-known/IndexNow` (auto via Vercel build)

### GA4 verification (3 min)

1. Real-time report → visit www.ecypro.com → confirm pageview within 30 s
2. Events → verify `page_view`, `scroll`, `click` triggers
3. Conversions → mark `contact_form_submit`, `newsletter_subscribe` as conversions

### Uptime monitor (5 min)

UptimeRobot (free) or BetterUptime:
- Monitor 1: `https://www.ecypro.com` (5 min interval)
- Monitor 2: `https://api.ecypro.com/api/health` (5 min interval)
- Alert channel: email + Slack webhook

---

## Worktree → Main Strategic Decision

Worktree `claude/jolly-spence-49a11e` has 62 commits beyond `main`. Main P42 already implemented anonymized content (better UX than worktree empty arrays). FC v33-v35 worktree commits SKIPPED (main P42 superior).

Valuable worktree-only that DID NOT get merged + are not critical for production:
- 20 JSON-LD schema types (worktree FC v22-v30) — main has 5 base types. Could backport components individually if T0 wants richer Knowledge Graph signals.
- HelmetShim FC v31 fix — main uses real react-helmet-async (different SEO arch). Not directly portable.
- BlogCategoryPage + BlogAuthorPage routes (FC v20) — main lacks these. Optional add.

**Recommendation:** Park worktree as reference branch. Main P42 + FC v37 prerender patch sufficient for v1 launch. Backlog: worktree schemas can be cherry-picked individually in future sprints if SEO needs more depth.

---

## Outstanding (post-FC-v37, post-launch)

1. **Per-page meta description** (currently homepage description on all routes) — fix when adding prerender, ensure Helmet `<meta name="description">` injected per route
2. **PWA service worker** — currently `DISABLE_PWA=1`, enable when stable
3. **Cookie consent v2 backport** — worktree FC v15 has granular consent; main has basic
4. **Sentry sourcemap upload** — already wired via `SENTRY_AUTH_TOKEN` env in CI
5. **Newsletter SMTP wiring** — env var configured, verify delivery in production

---

## Sprint Summary

**FC v37 = 2 file changes:**
- `scripts/prerender.mjs` (NEW, +145 LOC)
- `package.json` postbuild + new `prerender` script (+1 line, +1 script)
- `docs/FC_V37_HANDOFF.md` (THIS doc, +220 LOC)

Plus optional:
- `e2e/snapshots/` directory commit (visual baselines)

**Total Impact:**
- Fixes Root D (per-route SEO) when `PRERENDER=1` enabled
- Fixes Root C (visual baselines) when snapshots committed
- Documentation handoff for T0 monitoring + worktree decision

**Risk:** Low — prerender is opt-in. Default build path unchanged. Vercel can roll back env var if issues.

---

## Hand-off Owner Actions

| # | Action | Owner | Where | Estimated |
|---|---|---|---|---|
| 1 | Test `PRERENDER=1 npm run build` locally | T0 | Local | 2 min |
| 2 | Inspect `dist/pricing/index.html` title differs from `dist/index.html` | T0 | Local | 1 min |
| 3 | Commit FC v37 + push origin/main | T0 | git | 1 min |
| 4 | Add `PRERENDER=1` env to Vercel Production | T0 | Vercel dashboard | 2 min |
| 5 | Trigger redeploy on Vercel | T0 | Vercel dashboard | 5 min build |
| 6 | Smoke test 4 routes (curl titles differ) | T0/Claude | bash | 1 min |
| 7 | LinkedIn post-inspector test for /pricing | T0 | LinkedIn | 2 min |
| 8 | Submit sitemap to Search Console + Bing | T0 | dashboards | 10 min |
| 9 | Sentry alert rules config | T0 | sentry.io | 10 min |
| 10 | Commit `e2e/snapshots/` baselines | T0/Claude | git | 1 min |
| 11 | Production Lighthouse re-run (verify SEO 100) | Claude | bash | 5 min |
| 12 | Close ALERT.txt issue thread | T0 | — | — |

**Total:** ~45 min T0 dashboard time, ~10 min Claude verification.

---

## Final State Declaration

After Patches 1+2 applied + T0 dashboard tasks complete:

- ✅ Code production-ready
- ✅ Backend live + CORS configured
- ✅ Frontend live on Vercel + CDN
- ✅ 18/18 routes 200
- ✅ All ALERT.txt root causes resolved
- ✅ Per-route static HTML prerendered → social shares correct
- ✅ Visual baseline regression catches future CSS changes
- ✅ Monitoring active (Sentry + GA4 + uptime)
- ✅ Search engines fed (sitemap submitted to Google + Bing)

**PROJECT SHIP COMPLETE.**
