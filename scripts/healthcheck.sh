#!/bin/bash
#
# EcyPro — Post-Deploy Health Check
#
# Validates that a deployment is healthy by checking
# critical endpoints and response times.
#
# Usage: ./scripts/healthcheck.sh <base_url>
# Example: ./scripts/healthcheck.sh https://api.ecypro.com
#

set -euo pipefail

BASE_URL="${1:-http://localhost:3001}"
TIMEOUT=10
PASS=0
FAIL=0
TOTAL=0

# ─── Utilities ────────────────────────────────────────────

check() {
  local name="$1"
  local url="$2"
  local expected_status="${3:-200}"
  TOTAL=$((TOTAL + 1))

  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "000")

  if [ "$status" = "$expected_status" ]; then
    echo "  ✅ $name — HTTP $status"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $name — HTTP $status (expected $expected_status)"
    FAIL=$((FAIL + 1))
  fi
}

check_latency() {
  local name="$1"
  local url="$2"
  local max_ms="${3:-2000}"

  local time_total
  time_total=$(curl -s -o /dev/null -w "%{time_total}" --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "99")
  local ms
  ms=$(echo "$time_total * 1000" | bc 2>/dev/null || echo "9999")
  ms=${ms%.*}

  if [ "$ms" -le "$max_ms" ]; then
    echo "  ⚡ $name — ${ms}ms (≤${max_ms}ms)"
  else
    echo "  ⚠️  $name — ${ms}ms (>${max_ms}ms SLOW)"
  fi
}

# ─── Run Checks ──────────────────────────────────────────

echo ""
echo "🏥 EcyPro Post-Deploy Health Check"
echo "   Target: $BASE_URL"
echo "   Time:   $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "───────────────────────────────────"
echo ""
echo "📡 Endpoint Checks:"

check "Health API"         "$BASE_URL/api/health"      200
check "API Docs"           "$BASE_URL/api/docs"        200
check "Auth (no body)"     "$BASE_URL/api/auth/login"  400

echo ""
echo "⏱️  Latency Checks:"

check_latency "Health API"  "$BASE_URL/api/health"  500
check_latency "API Docs"    "$BASE_URL/api/docs"    1000

echo ""
echo "───────────────────────────────────"
echo "📊 Results: $PASS/$TOTAL passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  echo "❌ DEPLOYMENT UNHEALTHY — $FAIL check(s) failed!"
  exit 1
else
  echo "✅ DEPLOYMENT HEALTHY — All checks passed!"
  exit 0
fi
