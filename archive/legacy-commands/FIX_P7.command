#!/usr/bin/env bash
# FIX_P7.command — P7 Aşama 1 Commit Recovery
# Host'tan Finder Cmd+O ile çalıştır.
# Push YOK. Sadece local commit'ler.

set -u
cd "$(dirname "$0")"
LOG="outputs/fix-p7-$(date +%Y%m%d-%H%M%S).txt"
DONE="outputs/fix-p7-done-$(date +%Y%m%d-%H%M%S).txt"
mkdir -p outputs

{
  echo "=== FIX_P7 başlangıç $(date) ==="
  echo

  # Safety: working tree expected to have P6 changes uncommitted.
  echo "--- git status (start) ---"
  git status --short
  echo

  # C6 prep — gitignore writability probe artifact + remove it
  if [ -f public/_test ]; then
    if ! grep -q "^public/_test$" .gitignore 2>/dev/null; then
      echo "public/_test" >> .gitignore
    fi
    rm -f public/_test
    echo "[C6] public/_test removed, .gitignore updated"
  fi

  # C1 — a11y bundle
  echo
  echo "=== C1: fix(a11y): improve Footer target-size and LanguageToggle dynamic aria-label ==="
  git add src/components/layout/Footer.tsx src/components/ui/LanguageToggle.tsx
  git commit -m "fix(a11y): Footer target-size + dynamic LanguageToggle aria-label

- Footer social buttons p-2.5 -> p-3 min-w-11 min-h-11 (WCAG 2.1 AA target-size >=44px)
- Footer link rows -> min-h-11 py-2 to satisfy touch target budget
- LanguageToggle aria-label is now dynamic; matches visible 'TR'/'EN' content
  (resolves audits.label-content-name-mismatch)
- Globe icon aria-hidden=true to dedupe AT announcement

Measured: P6 baseline A11y=93 (regression). After this commit A11y must
recover to >=95 in next Lighthouse pass." || echo "[C1] skip (no changes)"

  # C2 — perf micro on services
  echo
  echo "=== C2: perf(services): lazy-mount heavy widgets + drop layout motion wrappers ==="
  git add src/pages/ServicesPage.tsx src/components/services/ServiceCard.tsx
  git commit -m "perf(services): lazy-mount GrowthCalculator+BookingWizard, drop motion layout

- GrowthCalculator and BookingWizard wrapped in React.lazy + IntersectionObserver
  gate (rootMargin: 320px) so Lighthouse mobile viewport (412x823) does not
  mount recharts ResponsiveContainer until user scrolls toward tools section.
- Outer AnimatePresence/motion.div wrapper around services grid removed; cards
  still animate via their own whileHover (event-driven, no layout pass).
- ServiceCard motion.div drops 'layout' prop (forced relayout-on-every-render
  was contributing to TBT).

Note: This did NOT (yet) recover ServicesPage from Lighthouse PAGE_HUNG in
P6 fix-baseline-v2 (still 0/5 runs successful). Root cause analysis is
deferred to P7 Aşama 2 (see outputs/P7_SERVICES_HANG_ROOT_CAUSE.md). The
change is kept because it is a legitimate code-quality improvement
independent of Lighthouse behaviour." || echo "[C2] skip (no changes)"

  # C3 — seo regen artifacts
  echo
  echo "=== C3: chore(seo): regenerate sitemaps, rss, og-image, blog metadata ==="
  git add public/sitemap.xml public/sitemap-en.xml public/sitemap-tr.xml public/rss.xml public/og-image.jpg src/data/blog-posts.json docs/PERFORMANCE_REPORT.md
  git commit -m "chore(seo): refresh sitemap/rss/og-image/blog metadata and perf report

- public/sitemap{,-en,-tr}.xml + rss.xml: build postbuild regenerated with
  current lastmod / pubDate timestamps (lastmod = build wall clock).
- public/og-image.jpg: add 1200x630 Open Graph image (was missing in tree).
- src/data/blog-posts.json: gen:blog refresh (date stamps current).
- docs/PERFORMANCE_REPORT.md: replace placeholder zeros with P6 baseline
  median scores (Landing 64 / Services 0-hung / Pricing 62 / Cases 66 /
  Blog 67 / Contact 67)." || echo "[C3] skip (no changes)"

  # C4 — tooling recipes
  echo
  echo "=== C4: chore(tools): lh-5run harness + host runner recipes ==="
  git add scripts/lh-5run.mjs RUN_LH5RUN.command RUN_LH5RUN_FIX.command RUN_ALL.command FIX_P5.command FIX_AND_COMMIT.command
  git commit -m "chore(tools): add 5-run Lighthouse harness and host recipes

- scripts/lh-5run.mjs: 5-run median Lighthouse runner per page (mobile,
  slow 4G), writes outputs/lh-<label>-<iso>/summary.md + per-run JSON
- RUN_LH5RUN.command / RUN_LH5RUN_FIX.command: host wrappers (Finder Cmd+O)
- RUN_ALL.command: e2e + smoke + LH composition
- FIX_P5.command / FIX_AND_COMMIT.command: host commit recipes from P5
  pattern (sandbox .git is read-only, recipes run on host)" || echo "[C4] skip (no changes)"

  # C5 — deploy recipes + env template
  echo
  echo "=== C5: chore(deploy): deploy recipes + env template ==="
  git add DEPLOY_BACKEND_RENDER.command DEPLOY_FRONTEND_HOSTINGER.command .env.production.example
  git commit -m "chore(deploy): add Render backend + Hostinger frontend recipes and env template

- DEPLOY_BACKEND_RENDER.command: backend Render deploy walkthrough recipe
- DEPLOY_FRONTEND_HOSTINGER.command: dist/ -> Hostinger panel upload recipe
- .env.production.example: production env shape (no secrets) for first
  publish (DATABASE_URL/REDIS_URL/JWT_SECRET/SENTRY_DSN/etc placeholders)

Companion: outputs/DEPLOY_BRIDGE.md (P7 Aşama 5)" || echo "[C5] skip (no changes)"

  # C6 — gitignore probe artifact
  echo
  echo "=== C6: chore: gitignore the writability probe artifact ==="
  git add .gitignore
  git commit -m "chore: gitignore public/_test writability probe artifact

P5/P6 sandbox kontrolünden kalmış 5-byte 'test' dosyası. Public asset
değil; gitignore'a eklendi ve repodan kaldırıldı." || echo "[C6] skip (no changes)"

  # C7 — P7 specific recipes + docs (RUN_P7_MEASURE, COMMIT_P7_ROUNDS, DEPLOY_PRECHECK + outputs/P7_*.md)
  echo
  echo "=== C7: chore(p7): add P7 runner recipes and triage docs ==="
  git add RUN_P7_MEASURE.command COMMIT_P7_ROUNDS.command DEPLOY_PRECHECK.command FIX_P7.command \
          outputs/P7_COMMIT_TRIAGE.md outputs/P7_SERVICES_HANG_ROOT_CAUSE.md outputs/P7_FINAL_REPORT.md \
          outputs/DEPLOY_BRIDGE.md outputs/RESUME_STATE_REPORT.md 2>/dev/null || true
  git commit -m "chore(p7): add P7 runner recipes and triage docs

- FIX_P7.command (this script — self-add for resume)
- RUN_P7_MEASURE.command: build + 3-run × 6-page Lighthouse measurement
- COMMIT_P7_ROUNDS.command: atomic commits for Round A/B/C post-measurement
- DEPLOY_PRECHECK.command: tek-tık deploy readiness dashboard
- outputs/P7_COMMIT_TRIAGE.md: 10 uncommitted dosya triaj
- outputs/P7_SERVICES_HANG_ROOT_CAUSE.md: ServicesPage hang ölçüm hatası bulgusu
- outputs/P7_FINAL_REPORT.md: P7 final rapor (ölçüm pending)
- outputs/DEPLOY_BRIDGE.md: deploy sıralama + blocker'lar
- outputs/RESUME_STATE_REPORT.md: P7 bölümü eklendi" || echo "[C7] skip (no changes)"

  echo
  echo "--- git status (end) ---"
  git status --short
  echo
  echo "--- git log -8 ---"
  git log --oneline -8
  echo
  echo "=== FIX_P7 bitti $(date) ==="
} 2>&1 | tee "$LOG"

cp "$LOG" "$DONE"
echo
echo "Log: $LOG"
echo "Done marker: $DONE"
