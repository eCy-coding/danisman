#!/bin/bash
# ============================================================================
# P68 — Continuous Health Monitor (otonom, sürekli)
# ============================================================================
# Görev: Her 60sn'de bir backend + frontend + admin login URL'lerini ping'ler,
#        renkli log + alert. CTRL+C ile durdurulur.
# ============================================================================

set -uo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${PROJECT_DIR}"

DATE_TAG=$(date +%Y%m%d)
LOG_FILE="outputs/P68_health_${DATE_TAG}.log"
mkdir -p outputs

# Color codes
G='\033[32m'; Y='\033[33m'; R='\033[31m'; C='\033[36m'; N='\033[0m'

CONSEC_5XX=0
ITER=0

trap 'echo ""; echo -e "${C}🩺 P68 Health Monitor durduruldu. Log: ${LOG_FILE}${N}"; exit 0' INT TERM

echo -e "${C}🩺 P68 — Continuous Health Monitor başlıyor${N}"
echo -e "${C}    Interval: 60sn · Log: ${LOG_FILE} · Durdur: CTRL+C${N}"
echo ""

API="https://ecypro-api.onrender.com/api/v1/health"
SITE="https://www.ecypro.com"
ADMIN="https://www.ecypro.com/admin/login"

check_url() {
  local url="$1"
  curl -s -o /dev/null -w "%{http_code}|%{time_total}" --max-time 15 "$url" 2>/dev/null || echo "000|0"
}

color_for() {
  local code="$1"
  local time="$2"
  if [ "$code" = "200" ]; then
    if awk "BEGIN {exit !($time > 3.0)}"; then
      printf "${Y}%s${N}" "$code"
    else
      printf "${G}%s${N}" "$code"
    fi
  elif [[ "$code" =~ ^[45] ]]; then
    printf "${R}%s${N}" "$code"
  else
    printf "${R}%s${N}" "$code"
  fi
}

while true; do
  ITER=$((ITER+1))
  TS=$(date "+%Y-%m-%d %H:%M:%S")

  API_RES=$(check_url "$API")
  SITE_RES=$(check_url "$SITE")
  ADMIN_RES=$(check_url "$ADMIN")

  API_CODE="${API_RES%%|*}"; API_T="${API_RES##*|}"
  SITE_CODE="${SITE_RES%%|*}"; SITE_T="${SITE_RES##*|}"
  ADMIN_CODE="${ADMIN_RES%%|*}"; ADMIN_T="${ADMIN_RES##*|}"

  # Status string
  STATUS="ok"
  if [[ "$API_CODE" =~ ^[45] ]] || [[ "$SITE_CODE" =~ ^[45] ]] || [[ "$ADMIN_CODE" =~ ^[45] ]]; then
    STATUS="ERROR"
  elif [ "$API_CODE" != "200" ] || [ "$SITE_CODE" != "200" ] || [ "$ADMIN_CODE" != "200" ]; then
    STATUS="degraded"
  fi

  # Console output (colored)
  printf "%s | api=" "$TS"
  color_for "$API_CODE" "$API_T"
  printf " (%.2fs) | site=" "$API_T"
  color_for "$SITE_CODE" "$SITE_T"
  printf " (%.2fs) | admin=" "$SITE_T"
  color_for "$ADMIN_CODE" "$ADMIN_T"
  printf " (%.2fs) | %s\n" "$ADMIN_T" "$STATUS"

  # File log (no colors)
  printf "%s | api=%s (%.2fs) | site=%s (%.2fs) | admin=%s (%.2fs) | %s\n" \
    "$TS" "$API_CODE" "$API_T" "$SITE_CODE" "$SITE_T" "$ADMIN_CODE" "$ADMIN_T" "$STATUS" \
    >> "$LOG_FILE"

  # Alert on 5xx ardışık
  if [[ "$API_CODE" =~ ^5 ]] || [[ "$SITE_CODE" =~ ^5 ]]; then
    CONSEC_5XX=$((CONSEC_5XX+1))
    if [ "$CONSEC_5XX" -ge 3 ]; then
      printf '\007'  # terminal bell
      say "Backend down" 2>/dev/null || true
      printf "${R}🚨 ALERT: 5xx ardışık 3 hit detected!${N}\n"
      CONSEC_5XX=0  # reset to avoid spam
    fi
  else
    CONSEC_5XX=0
  fi

  sleep 60
done
