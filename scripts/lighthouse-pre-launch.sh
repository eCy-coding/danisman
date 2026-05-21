#!/usr/bin/env bash
# eCyPro Premium Consulting — Lighthouse Pre-Launch Gate
#
# Runs Lighthouse on the local preview build for desktop + mobile and
# enforces the launch-day quality budget:
#   Performance >= 85   (mobile + desktop)
#   SEO         >= 95   (mobile + desktop)
#
# JSON reports land in ./lighthouse-reports/<timestamp>/.
# Exits non-zero (CI gate) if any category falls below threshold.

set -euo pipefail

# -------- config --------
URL="${LIGHTHOUSE_URL:-http://localhost:4173}"
PERF_MIN=85
SEO_MIN=95
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="lighthouse-reports/${TIMESTAMP}"
CHROME_FLAGS="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage"

# -------- preflight --------
command -v npx >/dev/null || { echo "npx not found"; exit 127; }

mkdir -p "${OUT_DIR}"
echo "==> Lighthouse pre-launch gate"
echo "    target : ${URL}"
echo "    perf>= ${PERF_MIN}    seo>= ${SEO_MIN}"
echo "    out    : ${OUT_DIR}"

# -------- helpers --------
run_lh () {
  local preset="$1"
  local out_json="${OUT_DIR}/lighthouse-${preset}.json"
  echo "==> Running Lighthouse (${preset})"
  npx --yes lighthouse "${URL}" \
    --preset="${preset}" \
    --output=json \
    --output-path="${out_json}" \
    --chrome-flags="${CHROME_FLAGS}" \
    --quiet
  echo "    report -> ${out_json}"
  echo "${out_json}"
}

read_score () {
  local report_json="$1"
  local category="$2"
  node -e "
    const r=require('./${report_json}');
    const c=r.categories && r.categories['${category}'];
    if(!c){console.error('missing category: ${category}');process.exit(2);}
    process.stdout.write(String(Math.round(c.score*100)));
  "
}

assert_threshold () {
  local label="$1"; local actual="$2"; local minimum="$3"
  if [[ "${actual}" -lt "${minimum}" ]]; then
    echo "FAIL ${label}=${actual} (min=${minimum})"
    return 1
  fi
  echo "PASS ${label}=${actual} (min=${minimum})"
  return 0
}

# -------- run --------
DESKTOP_JSON="$(run_lh desktop)"
MOBILE_JSON="$(run_lh mobile)"

DESKTOP_PERF="$(read_score "${DESKTOP_JSON}" performance)"
DESKTOP_SEO="$(read_score "${DESKTOP_JSON}" seo)"
MOBILE_PERF="$(read_score "${MOBILE_JSON}" performance)"
MOBILE_SEO="$(read_score "${MOBILE_JSON}" seo)"

echo
echo "==> Scores"
printf "    desktop perf=%s seo=%s\n" "${DESKTOP_PERF}" "${DESKTOP_SEO}"
printf "    mobile  perf=%s seo=%s\n" "${MOBILE_PERF}" "${MOBILE_SEO}"
echo

GATE_FAIL=0
assert_threshold "desktop.perf" "${DESKTOP_PERF}" "${PERF_MIN}" || GATE_FAIL=1
assert_threshold "desktop.seo"  "${DESKTOP_SEO}"  "${SEO_MIN}"  || GATE_FAIL=1
assert_threshold "mobile.perf"  "${MOBILE_PERF}"  "${PERF_MIN}" || GATE_FAIL=1
assert_threshold "mobile.seo"   "${MOBILE_SEO}"   "${SEO_MIN}"  || GATE_FAIL=1

if [[ "${GATE_FAIL}" -ne 0 ]]; then
  echo
  echo "GATE FAIL — review ${OUT_DIR}/*.json before launch."
  exit 1
fi

echo
echo "GATE PASS — launch-day Lighthouse budget met."
