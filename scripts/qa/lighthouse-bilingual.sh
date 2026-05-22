#!/usr/bin/env bash
#
# Track 4 / F3 — Lighthouse audit across BOTH locales (TR + EN), mobile.
#
# Captures Performance + SEO scores for the locale-prefixed pages. SEO should
# be >= 95 on every page now that path-based hreflang renders post-hydration.
#
# Usage:
#   scripts/qa/lighthouse-bilingual.sh                      # vs local preview
#   BASE_URL=https://ecypro.com scripts/qa/lighthouse-bilingual.sh   # vs prod
#
# Requires: lighthouse CLI + jq. Outputs JSON reports + a markdown table.
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4173}"
OUT_DIR="${OUT_DIR:-test-results/lighthouse-bilingual-$(date +%Y%m%d)}"
PATHS=("" "/services" "/pricing" "/about")
LOCALES=("tr" "en")

mkdir -p "$OUT_DIR"
TABLE="$OUT_DIR/summary.md"
{
  echo "# Lighthouse — Bilingual (mobile)"
  echo
  echo "Target: \`$BASE_URL\` · $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo
  echo "| Locale | Path | Performance | SEO |"
  echo "|---|---|---:|---:|"
} > "$TABLE"

for locale in "${LOCALES[@]}"; do
  for path in "${PATHS[@]}"; do
    url="${BASE_URL}/${locale}${path}"
    slug="${locale}$(echo "${path:-/_home}" | tr '/' '_')"
    json="$OUT_DIR/mobile_${slug}.json"
    echo "→ Auditing $url"
    lighthouse "$url" \
      --form-factor=mobile \
      --screenEmulation.mobile \
      --only-categories=performance,seo \
      --output=json \
      --output-path="$json" \
      --chrome-flags="--headless=new --no-sandbox" \
      --quiet 2>/dev/null || { echo "  ⚠️ lighthouse failed for $url"; continue; }
    perf=$(jq -r '(.categories.performance.score // 0) * 100 | round' "$json")
    seo=$(jq -r '(.categories.seo.score // 0) * 100 | round' "$json")
    echo "  perf=${perf} seo=${seo}"
    echo "| ${locale} | ${path:-/} | ${perf} | ${seo} |" >> "$TABLE"
  done
done

echo
echo "===== SUMMARY ====="
cat "$TABLE"
echo
echo "Reports: $OUT_DIR"
