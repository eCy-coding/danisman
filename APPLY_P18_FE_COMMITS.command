#!/usr/bin/env bash
# eCyPro — P18 FE Track 1 atomic commit recipe (host-only)
#
# Sandbox `.git`'e yazamadığı için bu script kullanıcının MacBook'unda
# çalıştırılır. Her commit conventional, dar kapsamlı, validate-edilmiş.
#
# Kullanım:
#   cd ~/Desktop/ecypro
#   bash APPLY_P18_FE_COMMITS.command
#
# Çalıştırmadan önce:
#   - `git status` temiz değilse bu recipe'a uymayan değişiklikleri
#     stash'le veya commit'le.
#   - Test/lefthook host'ta çalışır; sandbox'ta değil.

set -euo pipefail
cd "$(dirname "$0")"

TS=$(date +%Y%m%d-%H%M%S)
LOG="outputs/p18-fe-commits-${TS}.log"
mkdir -p outputs
exec > >(tee -a "$LOG") 2>&1

echo "============================================================"
echo " eCyPro P18 FE atomic commits"
echo " Timestamp : $TS"
echo "============================================================"

if ! git diff --quiet --cached; then
  echo "⚠  Staged changes exist before P18-FE commits — aborting to keep history atomic."
  echo "   Inspect with: git diff --cached"
  exit 1
fi

require_clean_for() {
  local glob="$1"
  if ! git status --short | grep -qE "$glob"; then
    echo "ℹ  Nothing to commit for $glob — skipping."
    return 1
  fi
  return 0
}

# ──────────────────────────────────────────────────────────────────
# Commit 1 — TanStack Query data layer foundation
# ──────────────────────────────────────────────────────────────────
echo "▶ Commit 1/5 — TanStack Query data layer"
git add src/lib/query-client.ts || true
git add src/hooks/useApi.ts || true
git add src/components/dashboard/widgets/PipelineWidget.tsx \
        src/components/dashboard/widgets/HotLeadsWidget.tsx \
        src/components/dashboard/widgets/SystemHealthWidget.tsx \
        src/components/admin/PipelineFunnelChart.tsx \
        src/components/admin/HotLeadsTable.tsx || true

if ! git diff --quiet --cached; then
  git commit -m "feat(query): P18-FE üretim seviyesi TanStack Query data layer

- src/lib/query-client.ts: staleTime 5dk, gcTime 30dk, retry 3
  (4xx short-circuit), exponential backoff, refetchOnReconnect=always,
  QueryKeys merkezi map (auth/bookings/analytics/status).
- useApi.ts: inline key'leri QueryKeys helper'ına bağlandı; mutation
  invalidate'leri QueryKeys.bookings.all root'una migrate edildi.
- Dashboard widget + admin pendant'ları aynı QueryKeys root'unu
  paylaşır → cache deduplication (Pipeline/HotLeads tek fetch).
- Lokal retry override'ları kaldırıldı; merkezi policy uygulanıyor."
else
  echo "  (no staged changes for commit 1)"
fi

# ──────────────────────────────────────────────────────────────────
# Commit 2 — A11y CI workflow + critical-route spec
# ──────────────────────────────────────────────────────────────────
echo "▶ Commit 2/5 — A11y CI"
git add e2e/a11y-ci.spec.ts .github/workflows/a11y-ci.yml || true

if ! git diff --quiet --cached; then
  git commit -m "ci(a11y): P18-FE critical-route WCAG 2.1 AA gate

- e2e/a11y-ci.spec.ts: 6 critical public rota, axe-core,
  impact==='critical' gate; serious/moderate informational.
- .github/workflows/a11y-ci.yml: chromium-only, 12 dk timeout,
  failure'da playwright-report artifact (14 gün).
- Mevcut e2e/a11y.spec.ts AAA suite ve crawl_a11y_wcag.spec.ts
  korunur; bu yeni gate hızlı PR check'tir."
else
  echo "  (no staged changes for commit 2)"
fi

# ──────────────────────────────────────────────────────────────────
# Commit 3 — Visual regression baseline + workflow
# ──────────────────────────────────────────────────────────────────
echo "▶ Commit 3/5 — Visual regression"
git add e2e/visual.spec.ts .github/workflows/visual-regression.yml || true

if ! git diff --quiet --cached; then
  git commit -m "test(visual): P18-FE visual regression baseline (6 rota × 2 viewport)

- e2e/visual.spec.ts: chromium screenshot diff, mobile (375x812)
  + desktop (1280x720), animation/transition disabled,
  external image stub, maxDiffPixelRatio 0.05.
- .github/workflows/visual-regression.yml: baseline yoksa warn,
  varsa diff gate; failure'da playwright-report artifact.
- Baseline PNG'leri ayrı commit'te (–update-snapshots sonrası)."
else
  echo "  (no staged changes for commit 3)"
fi

# ──────────────────────────────────────────────────────────────────
# Commit 4 — Storybook primitive stories
# ──────────────────────────────────────────────────────────────────
echo "▶ Commit 4/5 — Storybook stories"
git add src/components/ui/Button.stories.tsx \
        src/components/ui/Card.stories.tsx \
        src/components/ui/Input.stories.tsx || true

if ! git diff --quiet --cached; then
  git commit -m "docs(storybook): P18-FE Button/Card/Input primitive stories

- Button: 8 variant + Matrix grid (size×variant), loading,
  disabled story'leri.
- Card: flat/elevated/overlay + Interactive + VariantGrid
  (AI Studio Tech doctrine drift detection).
- Input: Default/Error/Disabled/Stack — aria-invalid +
  aria-describedby surface.
- Toplam 19 yeni named story, addon-a11y ile inline denetim."
else
  echo "  (no staged changes for commit 4)"
fi

# ──────────────────────────────────────────────────────────────────
# Commit 5 — Reports + commit recipe
# ──────────────────────────────────────────────────────────────────
echo "▶ Commit 5/5 — Reports"
git add outputs/P18_FE_S1_TANSTACK_QUERY.md \
        outputs/P18_FE_S2_A11Y_CI.md \
        outputs/P18_FE_S3_VISUAL_REGRESSION.md \
        outputs/P18_FE_S4_STORYBOOK.md \
        outputs/P18_FE_S5_WEB_WORKER_SKIP.md \
        outputs/P18_FE_FINAL.md \
        APPLY_P18_FE_COMMITS.command 2>/dev/null || true

if ! git diff --quiet --cached; then
  git commit -m "docs(p18-fe): aşama raporları + atomik commit recipe

- outputs/P18_FE_S1..S5: aşama raporları.
- outputs/P18_FE_FINAL.md: synthesis + Go/No-Go.
- APPLY_P18_FE_COMMITS.command: bu recipe (idempotent, host-only)."
else
  echo "  (no staged changes for commit 5)"
fi

# ──────────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────────
echo
echo "============================================================"
echo " ✅ P18 FE commits applied"
echo "============================================================"
echo "  git log --oneline -10"
git log --oneline -10
echo
echo "Sıradaki adımlar (manuel):"
echo "  1. npm run typecheck   # tüm projeyi doğrula"
echo "  2. npm run lint        # eslint clean"
echo "  3. npm run test -- --run   # vitest"
echo "  4. (opsiyonel) visual baseline üret:"
echo "       npx playwright test e2e/visual.spec.ts --project=chromium --update-snapshots"
echo "       git add e2e/snapshots/visual.spec.ts-snapshots/"
echo "       git commit -m 'test(visual): P18-FE baseline PNG'leri'"
echo "  5. Push kullanıcının manuel kararıyla yapılır (force-push YASAK)."
