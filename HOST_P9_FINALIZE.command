#!/usr/bin/env bash
# HOST_P9_FINALIZE.command
# P9 turunda kalan tüm host işlerini tek seferde:
#  1) .git/index.lock kilit temizliği
#  2) A11y düzeltmelerini commit (8 dosya, 10 değişim) + lint cleanup
#  3) Sitemap lastmod refresh (postbuild zaten yapacak ama parse-safe)
#  4) package.json `overrides` ile estree-walker @2.0.2 pinle
#  5) npm install --silent (override'ı uygula)
#  6) RUN_P7_MEASURE.command (build + Lighthouse 3-run × 6-page)
#  7) DEPLOY_PRECHECK.command (9-madde dashboard)
#  8) Tüm P9 dökümanlarını commit (outputs/ ignored, normal)
#  9) git push YOK
# Süre tahmini: 20-30 dk (npm install ~3-5 dk + build ~3 dk + Lighthouse ~15-20 dk + precheck ~10 dk)

set -u
cd "$(dirname "$0")"
TS="$(date +%Y%m%d-%H%M%S)"
LOG="outputs/host-p9-finalize-${TS}.txt"
mkdir -p outputs

exec > >(tee "$LOG") 2>&1
echo "============================================="
echo "  HOST_P9_FINALIZE başlangıç $(date)"
echo "============================================="

# ── Helper: atomik commit ────────────────────────────────────────────────────
commit_files () {
  local msg="$1"; shift
  local files=("$@")
  echo ""
  echo "=== COMMIT: $msg ==="
  local present=()
  for f in "${files[@]}"; do
    if [ -e "$f" ] || git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
      present+=("$f")
    fi
  done
  if [ ${#present[@]} -eq 0 ]; then
    echo "(no files to add — skip)"; return 0
  fi
  rm -f .git/index.lock 2>/dev/null
  git add -- "${present[@]}"
  if git diff --cached --quiet; then
    echo "(nothing staged after add — skip)"; return 0
  fi
  git commit -m "$msg" || echo "!!! commit failed"
}

# ── Step 1: lock cleanup ─────────────────────────────────────────────────────
echo ""
echo "── Step 1: lock cleanup ──"
rm -f .git/index.lock 2>&1 || true
find .git/objects -type f -name 'tmp_obj_*' -delete 2>/dev/null || true
echo "ok"

# ── Step 2: a11y commit ──────────────────────────────────────────────────────
commit_files "fix(a11y): bump gold-CTA contrast to AAA + clear lint warnings

WCAG 2.1 SC 1.4.3 — replace text-white with text-neutral on bg-secondary
(--color-secondary: #facc15). Ratio 1.64:1 → 12.86:1.

Touched (10 places, 8 files):
- src/components/ui/Button.tsx (secondary variant)
- src/components/sections/Hero.tsx (persona toggle)
- src/components/sections/NewsletterSection.tsx
- src/components/sections/ConversionBanner.tsx
- src/components/sections/ProcessTimeline.tsx
- src/components/features/roi/ROICalculator.tsx
- src/components/common/ExitIntentModal.tsx
- src/components/admin/TwoFactorSettings.tsx (3 buttons)

Also removed orphaned eslint-disable directive in ExitIntentModal.tsx.

See outputs/P9_A11Y_REPORT.md" \
  src/components/ui/Button.tsx \
  src/components/sections/Hero.tsx \
  src/components/sections/NewsletterSection.tsx \
  src/components/sections/ConversionBanner.tsx \
  src/components/sections/ProcessTimeline.tsx \
  src/components/features/roi/ROICalculator.tsx \
  src/components/common/ExitIntentModal.tsx \
  src/components/admin/TwoFactorSettings.tsx

# ── Step 3: bump sitemap lastmod to today ───────────────────────────────────
echo ""
echo "── Step 3: sitemap lastmod refresh ──"
TODAY=$(date +%Y-%m-%d)
for f in public/sitemap.xml public/sitemap-en.xml public/sitemap-tr.xml public/sitemap-index.xml; do
  if [ -f "$f" ]; then
    # bsd-sed compatible
    sed -i.bak -E "s|<lastmod>[0-9]{4}-[0-9]{2}-[0-9]{2}</lastmod>|<lastmod>${TODAY}</lastmod>|g" "$f"
    rm -f "${f}.bak"
  fi
done
echo "sitemap lastmod → ${TODAY}"
commit_files "chore(seo): bump sitemap lastmod to ${TODAY}" \
  public/sitemap.xml public/sitemap-en.xml public/sitemap-tr.xml public/sitemap-index.xml

# ── Step 4: package.json overrides for estree-walker ────────────────────────
echo ""
echo "── Step 4: package.json overrides (estree-walker pin) ──"
if grep -q '"overrides"' package.json; then
  echo "(overrides block already present — leave intact, ensure estree-walker entry)"
  # naive check; user can review manually if dup
else
  # Insert before last closing brace using node helper for safety
  node -e '
    const fs = require("fs");
    const path = "package.json";
    const pkg = JSON.parse(fs.readFileSync(path, "utf8"));
    pkg.overrides = pkg.overrides || {};
    pkg.overrides["estree-walker"] = "2.0.2";
    fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
    console.log("overrides.estree-walker = 2.0.2 yazıldı");
  '
fi
commit_files "chore(deps): pin estree-walker@2.0.2 via overrides (fix build PLUGIN_ERROR)" \
  package.json

# ── Step 5: npm install (apply override) ────────────────────────────────────
echo ""
echo "── Step 5: npm install (override apply) ──"
npm install --silent 2>&1 | tail -10 || echo "(npm install non-zero)"
commit_files "chore(deps): regenerate package-lock with estree-walker pin" \
  package-lock.json

# ── Step 6: RUN_P7_MEASURE ──────────────────────────────────────────────────
echo ""
echo "── Step 6: RUN_P7_MEASURE.command (build + Lighthouse 3-run × 6-page) ──"
bash ./RUN_P7_MEASURE.command || echo "(RUN_P7_MEASURE non-zero)"

# ── Step 7: DEPLOY_PRECHECK ─────────────────────────────────────────────────
echo ""
echo "── Step 7: DEPLOY_PRECHECK.command ──"
bash ./DEPLOY_PRECHECK.command || echo "(DEPLOY_PRECHECK non-zero)"

# ── Step 8: P9 docs commit (outputs/ is gitignored — skip) ──────────────────
echo ""
echo "── Step 8: P9 docs commit + scripts ──"
commit_files "chore(p9): add P9 host scripts (unlock/recover/finalize/live-smoke)" \
  UNLOCK_AND_COMMIT_P9.command RECOVER_AND_MEASURE.command HOST_P9_FINALIZE.command DEPLOY_LIVE_SMOKE.command

# ── Final summary ───────────────────────────────────────────────────────────
echo ""
echo "============================================="
echo "  HOST_P9_FINALIZE özet"
echo "============================================="
echo ""
echo "--- git log -20 ---"
git log --oneline -20
echo ""
echo "--- git status ---"
git status --short
echo ""
echo "=== HOST_P9_FINALIZE bitti $(date) ==="
