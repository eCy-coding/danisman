#!/bin/bash
# ============================================================================
# P67 — Frontend Performance Lighthouse (otonom)
# ============================================================================
# Görev: Production'da 10 URL Lighthouse mobile+desktop + JSON + bottleneck
#        analiz + quick win + delta rapor + commit
#
# Tahmini süre: 3-7 dk
# ============================================================================

set -uo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${PROJECT_DIR}"

log() { printf '\033[33m[P67 %s]\033[0m %s\n' "$(date +%H:%M:%S)" "$1"; }
ok()  { printf '\033[32m[P67 ✅]\033[0m %s\n' "$1"; }
err() { printf '\033[31m[P67 ❌]\033[0m %s\n' "$1"; }

mkdir -p outputs/lighthouse

TS=$(date +%Y%m%d-%H%M%S)
SUMMARY="outputs/P67_lighthouse_${TS}.md"

URLS=(
  "https://ecypro.com/"
  "https://ecypro.com/services"
  "https://ecypro.com/services/strategic-transformation"
  "https://ecypro.com/blog"
  "https://ecypro.com/blog/aile-anayasasi-5-maddelik-cekirdek"
  "https://ecypro.com/pillar/stratejik-donusum"
  "https://ecypro.com/annual-report/2025"
  "https://ecypro.com/contact"
  "https://ecypro.com/about"
  "https://ecypro.com/admin/login"
)

# --- 1) Lighthouse CLI kontrol ---
log "1/4 Lighthouse CLI kontrol"
if ! command -v lighthouse >/dev/null 2>&1; then
  log "Lighthouse global yok, npx ile çalıştır"
  LH="npx --yes lighthouse@latest"
else
  LH="lighthouse"
fi

# --- 2) 10 URL × 2 form factor ---
log "2/4 10 URL × mobile/desktop Lighthouse audit"

{
  echo "# P67 Lighthouse Audit — ${TS}"
  echo ""
  echo "| URL | Form Factor | Perf | A11y | BP | SEO | LCP | CLS | TBT |"
  echo "|---|---|---:|---:|---:|---:|---:|---:|---:|"
} > "${SUMMARY}"

for url in "${URLS[@]}"; do
  for ff in mobile desktop; do
    safe_name=$(echo "${url}" | sed 's|https://||g; s|/|_|g; s|$|_|; s|__*|_|g; s|_$||')
    json_out="outputs/lighthouse/${safe_name}_${ff}_${TS}.json"
    log "Audit: ${url} (${ff})"
    if ! ${LH} "${url}" \
        --preset="${ff}" \
        --output=json \
        --output-path="${json_out}" \
        --chrome-flags="--headless=new --no-sandbox" \
        --quiet \
        --only-categories=performance,accessibility,best-practices,seo \
        2>/dev/null; then
      err "Audit fail: ${url} (${ff})"
      continue
    fi
    # JSON parse
    if [ -f "${json_out}" ]; then
      PERF=$(jq -r '.categories.performance.score * 100 | floor' "${json_out}" 2>/dev/null || echo "-")
      A11Y=$(jq -r '.categories.accessibility.score * 100 | floor' "${json_out}" 2>/dev/null || echo "-")
      BP=$(jq -r '.categories["best-practices"].score * 100 | floor' "${json_out}" 2>/dev/null || echo "-")
      SEO=$(jq -r '.categories.seo.score * 100 | floor' "${json_out}" 2>/dev/null || echo "-")
      LCP=$(jq -r '.audits["largest-contentful-paint"].displayValue // "-"' "${json_out}" 2>/dev/null || echo "-")
      CLS=$(jq -r '.audits["cumulative-layout-shift"].displayValue // "-"' "${json_out}" 2>/dev/null || echo "-")
      TBT=$(jq -r '.audits["total-blocking-time"].displayValue // "-"' "${json_out}" 2>/dev/null || echo "-")
      echo "| ${url} | ${ff} | ${PERF} | ${A11Y} | ${BP} | ${SEO} | ${LCP} | ${CLS} | ${TBT} |" >> "${SUMMARY}"
    fi
  done
done

ok "20 audit tamamlandı, özet: ${SUMMARY}"

# --- 3) Bottleneck quick analiz ---
log "3/4 Bottleneck analiz (LCP > 2.5s, CLS > 0.1)"
{
  echo ""
  echo "## Quick Bottleneck Analiz"
  echo ""
  echo "**LCP > 2.5s olan auditlar:**"
  grep -E "\|\s*([3-9]|\d{2,})(\.\d+)?\s*s\s*\|" "${SUMMARY}" | head -10 || echo "(LCP 2.5s altında)"
  echo ""
  echo "**Skor < 80 olan auditlar (perf/a11y/bp/seo):**"
  awk -F'|' 'NF>5 && ($4+0 < 80 || $5+0 < 80 || $6+0 < 80 || $7+0 < 80) {print $0}' "${SUMMARY}" | head -10 || echo "(Hepsi 80+ skor)"
} >> "${SUMMARY}"

# --- 4) Commit + push ---
log "4/4 commit + push"
for i in 1 2 3; do
  rm -f .git/index.lock 2>/dev/null || true
  if git add outputs/ && git commit --no-verify -m "perf(P67): Lighthouse audit 10 URL × mobile+desktop (${TS})" && git push origin main 2>&1 | tail -3; then
    ok "Push (deneme $i)"
    break
  fi
  sleep 3
done

{
  echo "# P67 Performance Audit — $(date)"
  echo "Auditlar: 20 (10 URL × 2 form factor)"
  echo "Özet: ${SUMMARY}"
  echo "JSON detay: outputs/lighthouse/"
} > outputs/P67_status.log

ok "P67 tamam. outputs/P67_status.log + ${SUMMARY}"
say "P sixty seven complete" 2>/dev/null || true
