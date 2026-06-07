#!/usr/bin/env bash
# DEPLOY_LIVE_SMOKE.command
# 17-check live URL smoke test. Deploy sonrası tarayıcı/api'yi doğrular.
# Tüm check'ler 200 dönerse ve içerik şartları karşılanırsa GO.
# Push YOK; sadece okuma. Host Finder Cmd+O ile çalıştır.

set -u
cd "$(dirname "$0")"
TS="$(date +%Y%m%d-%H%M%S)"
LOG="outputs/deploy-live-smoke-${TS}.txt"
mkdir -p outputs

exec > >(tee "$LOG") 2>&1
echo "=== DEPLOY_LIVE_SMOKE başlangıç $(date) ==="

FRONT="${FRONT:-https://www.ecypro.com}"
API="${API:-https://api.ecypro.com}"

echo "FRONT=$FRONT"
echo "API=$API"

PASS=0
FAIL=0
WARN=0

check () {
  local name="$1"; shift
  local code expected="$1"; shift
  local url="$1"; shift
  code=$(curl -ksI -o /dev/null -w '%{http_code}' "$url" || echo "000")
  if [ "$code" = "$expected" ]; then
    echo "[PASS] $name → $code"
    PASS=$((PASS+1))
  elif [ "$code" = "000" ]; then
    echo "[FAIL] $name → no response from $url"
    FAIL=$((FAIL+1))
  else
    echo "[FAIL] $name → $code (expected $expected) at $url"
    FAIL=$((FAIL+1))
  fi
}

check_grep () {
  local name="$1" pattern="$2" url="$3"
  if curl -ks "$url" | grep -qE "$pattern"; then
    echo "[PASS] $name (pattern matched)"
    PASS=$((PASS+1))
  else
    echo "[FAIL] $name (pattern \"$pattern\" not in body)"
    FAIL=$((FAIL+1))
  fi
}

check_header () {
  local name="$1" header="$2" expected="$3" url="$4"
  if curl -ksI "$url" | grep -i "^${header}:" | grep -qE "$expected"; then
    echo "[PASS] $name"
    PASS=$((PASS+1))
  else
    echo "[WARN] $name — header missing or doesn't match"
    WARN=$((WARN+1))
  fi
}

echo ""
echo "── 1) Frontend ana sayfalar ──"
check "Landing"      "200" "$FRONT/"
check "Services"     "200" "$FRONT/services"
check "Pricing"      "200" "$FRONT/pricing"
check "CaseStudies"  "200" "$FRONT/case-studies"
check "Blog"         "200" "$FRONT/blog"
check "Contact"      "200" "$FRONT/contact"

echo ""
echo "── 2) Backend API ──"
check "API health"   "200" "$API/api/health"

echo ""
echo "── 3) SEO/meta ──"
check "sitemap.xml"  "200" "$FRONT/sitemap.xml"
check "sitemap-en"   "200" "$FRONT/sitemap-en.xml"
check "sitemap-tr"   "200" "$FRONT/sitemap-tr.xml"
check "robots.txt"   "200" "$FRONT/robots.txt"
check "rss.xml"      "200" "$FRONT/rss.xml"

echo ""
echo "── 4) PWA + manifest ──"
check "manifest"     "200" "$FRONT/manifest.webmanifest"
check "sw.js"        "200" "$FRONT/sw.js"

echo ""
echo "── 5) Security headers (CSP, HSTS, XFO, X-Content-Type) ──"
check_header "HSTS"             "strict-transport-security" "max-age=" "$FRONT/"
check_header "X-Content-Type"   "x-content-type-options"    "nosniff"  "$FRONT/"
check_header "Referrer-Policy"  "referrer-policy"           "strict-origin" "$FRONT/"

echo ""
echo "── 6) İçerik smoke ──"
check_grep "Landing H1 / CTA" "EcyPro|ECYpro|ecypro" "$FRONT/"

echo ""
echo "=========================="
echo " SUMMARY"
echo "=========================="
echo " PASS=$PASS  WARN=$WARN  FAIL=$FAIL"
if [ "$FAIL" -eq 0 ]; then
  echo " → GO (live smoke yeşil)"
  EXIT=0
else
  echo " → HOLD ($FAIL fail check)"
  EXIT=1
fi
echo "=========================="
echo "=== DEPLOY_LIVE_SMOKE bitti $(date) ==="
exit $EXIT
