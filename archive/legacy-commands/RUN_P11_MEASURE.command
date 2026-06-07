#!/usr/bin/env bash
# eCyPro — P11 Lighthouse Re-measurement (host-only)
# P11/2 — perf-optimizer
#
# Re-runs the 5-run × 6-page Lighthouse harness AFTER ServicesPage infinite
# render loop fix landed on host. Produces outputs/lh-p11-final-<ISO>/summary.md
# and a delta report against P6 baseline + P9 median.
#
# Sandbox cannot launch headless Chrome → this runs on the user's MacBook.
#
# Usage:
#   chmod +x RUN_P11_MEASURE.command
#   ./RUN_P11_MEASURE.command

set -uo pipefail
cd "$(dirname "$0")"
mkdir -p outputs

TS=$(date +%Y%m%d-%H%M%S)
LOG="outputs/p11-measure-${TS}.log"
exec > >(tee -a "$LOG") 2>&1

echo "============================================================"
echo " eCyPro P11 Lighthouse re-measurement"
echo " Tag       : p11-final"
echo " Timestamp : $TS"
echo " Log       : $LOG"
echo "============================================================"

# Ensure tooling
if ! command -v node >/dev/null; then
  echo "❌ node not found in PATH."
  exit 1
fi
if ! [ -d node_modules ]; then
  echo "▶ node_modules missing — running npm ci"
  npm ci
fi

# Force rebuild so we measure post-fix dist/
echo "▶ Building production bundle (forced rebuild for P11 measure)"
LH_REBUILD=1 bash RUN_LH5RUN.command p11-final
RC=$?

if [ $RC -ne 0 ]; then
  echo "❌ Lighthouse run failed (RC=$RC)"
  exit $RC
fi

LATEST=$(ls -td outputs/lh-p11-final-* 2>/dev/null | head -1)
if [ -z "$LATEST" ] || [ ! -f "$LATEST/summary.md" ]; then
  echo "❌ No summary.md produced"
  exit 1
fi

echo
echo "▶ Latest measure: $LATEST"
echo

# Emit delta report
DELTA_OUT="outputs/P11_PERF_FINAL.md"
{
  echo "# P11/2 — Lighthouse Final Re-measurement"
  echo
  echo "**Tarih:** $(date '+%Y-%m-%d %H:%M:%S')"
  echo "**Rol:** perf-optimizer"
  echo "**Tag:** \`p11-final\` · 6 sayfa × 5-run · Slow 4G + 4× CPU · mobile 412×823"
  echo "**Kaynak veri:** \`$LATEST/summary.md\`"
  echo
  echo "## Ham özet (5-run median)"
  echo
  cat "$LATEST/summary.md"
  echo
  echo "## Delta — P6 baseline → P9 → P11 (median Performance)"
  echo
  echo "| Sayfa | P6 | P9 median | P11 median | Δ vs P6 | Δ vs P9 |"
  echo "|---|---:|---:|---:|---:|---:|"
  echo "| LandingPage | 64 | 66 | _check summary above_ | _calc_ | _calc_ |"
  echo "| ServicesPage | 0 (timeout) | × (timeout) | _check summary above_ | **fix landed** | **fix landed** |"
  echo "| PricingPage | 64 | 65 | _check summary above_ | _calc_ | _calc_ |"
  echo "| BlogPage | 68 | 69 | _check summary above_ | _calc_ | _calc_ |"
  echo "| ContactPage | 67 | 68 | _check summary above_ | _calc_ | _calc_ |"
  echo "| CaseStudiesPage | 67 | 66 | _check summary above_ | _calc_ | _calc_ |"
  echo
  echo "_Yukarıdaki tablonun \`P11 median\` sütununu \`$LATEST/summary.md\` çıktısından doldurun. Otomatik doldurma için future work._"
  echo
} > "$DELTA_OUT"

echo "✅ P11 perf report: $DELTA_OUT"
echo
echo "Done."
