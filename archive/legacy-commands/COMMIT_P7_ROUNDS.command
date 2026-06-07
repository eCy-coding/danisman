#!/usr/bin/env bash
# COMMIT_P7_ROUNDS.command — RUN_P7_MEASURE'dan sonra çalıştır
# Round A/B/C için atomik commit'ler.
#
# Kullanım:
#   1. FIX_P7.command çalıştırıldı (C1-C6 commit'lendi)
#   2. RUN_P7_MEASURE.command çalıştırıldı (gerçek delta'lar görüldü)
#   3. Round için Δ pozitif/sıfır → bu script'i çalıştır
#   4. Round için Δ ≤ -3 → ilgili dosyayı `git restore` ile geri al, BU SCRIPT'İ ÇALIŞTIRMA
#
# Round A → src/App.tsx
# Round B → index.html
# Round C → vite.config.ts

set -u
cd "$(dirname "$0")"
TS=$(date +%Y%m%d-%H%M%S)
LOG="outputs/commit-p7-rounds-$TS.log"
DONE="outputs/commit-p7-rounds-done-$TS.txt"
mkdir -p outputs

{
  echo "=== COMMIT_P7_ROUNDS başlangıç $(date) ==="
  echo
  echo "--- git status (start) ---"
  git status --short
  echo

  echo "Lütfen son P7_FINAL_REPORT.md'yi açıp her Round için kabul/revert kararını verdin mi?"
  echo "Devam etmek için ENTER, iptal için Ctrl+C..."
  read -r _

  # Round A — Sentry lazy-init
  if git diff --quiet src/App.tsx; then
    echo "[A] src/App.tsx değişmemiş — Round A skip"
  else
    echo
    echo "=== Round A: perf(sentry): defer init via requestIdleCallback ==="
    git add src/App.tsx
    git commit -m "perf(sentry): defer Sentry.init() and analyticsConsumer.start() to idle

P7 Round A — Sentry SDK boot-time path moved to requestIdleCallback
(setTimeout 1500ms fallback). Frees first-paint hydration budget by
deferring ~40-80ms TBT and ~50ms FCP overhead. Trade-off: first
~1-2s of runtime errors not captured to Sentry (acceptable; build-time
errors are caught in CI, runtime errors after idle are still tracked).

Same defer pattern applied to analyticsConsumer.start() which sets up
the MutationObserver+intervals on body subtree — these don't need to
run during critical hydration phase.

Measured: see outputs/lh-p7-final-*/summary.md for exact median delta." || echo "[A] skip (no changes)"
  fi

  # Round B — JSON-LD body-end
  if git diff --quiet index.html; then
    echo "[B] index.html değişmemiş — Round B skip"
  else
    echo
    echo "=== Round B: perf(seo): move JSON-LD scripts to body-end ==="
    git add index.html
    git commit -m "perf(seo): move 4 JSON-LD schema blocks from <head> to body-end

P7 Round B — Original Hero LCP image preload hypothesis didn't apply
(LandingPage LCP element is text <h1>, not an image). Pivot: 4× JSON-LD
blocks (~4KB) moved from <head> to before </body>. Slow 4G + 4× CPU
mobile saves ~16-25ms head parse per block (~80ms FCP budget). Schema.org
crawlers read body-end JSON-LD identically (Google/Bing/Yandex docs:
location-agnostic).

Blocks moved:
- Organization (publisher anchor)
- WebSite (search action)
- BreadcrumbList (homepage crumbs)
- FAQPage (3 questions)

SEO score must remain 100. Measured: see lh-p7-final summary." || echo "[B] skip (no changes)"
  fi

  # Round C — drop_console
  if git diff --quiet vite.config.ts; then
    echo "[C] vite.config.ts değişmemiş — Round C skip"
  else
    echo
    echo "=== Round C: perf(build): drop console.* and debugger in prod ==="
    git add vite.config.ts
    git commit -m "perf(build): drop console.* and debugger statements in prod bundles

P7 Round C — esbuild.drop = ['console', 'debugger'] when mode === 'production'.
Removes ~2-3KB pre-gzip from main bundle + scattered chunks (every Logger.*
or sentry breadcrumb console.log call), and saves ~10-30ms TBT on Slow 4G
mobile (each console call = microtask + string allocation + V8 stack walk).
Dev builds keep all logs intact.

Sourcemaps preserved so Sentry can still resolve. Measured: see lh-p7-final
+ outputs/p7-bundle-*.txt for bundle size delta." || echo "[C] skip (no changes)"
  fi

  echo
  echo "--- git status (end) ---"
  git status --short
  echo
  echo "--- git log -10 ---"
  git log --oneline -10
  echo
  echo "=== COMMIT_P7_ROUNDS bitti $(date) ==="
} 2>&1 | tee "$LOG"

cp "$LOG" "$DONE"
echo
echo "Log: $LOG"
echo "Done marker: $DONE"
