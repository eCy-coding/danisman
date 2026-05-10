#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# EcyPro Logs Tail — multitail tarzı paralel log akışı
# ═══════════════════════════════════════════════════════════════════════════
# Aynı pane'de:
#   - logs/ecypro-*.log (Winston rotating)
#   - logs/sec-watch.log
#   - logs/analytics-dev.log
#   - Docker container log (postgres-dev, redis-dev, mailpit) — opsiyonel
#
# Renk: dosya başına farklı renk (tail -f stilinde).
# ═══════════════════════════════════════════════════════════════════════════

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT/logs"

# ── Renk kodları ────────────────────────────────────────────
C_RESET='\033[0m'
C_BLUE='\033[34m'
C_GREEN='\033[32m'
C_YELLOW='\033[33m'
C_MAGENTA='\033[35m'
C_CYAN='\033[36m'

mkdir -p "$LOG_DIR"

# Boş dosyaları oluştur ki tail başlasın
for f in ecypro-combined.log ecypro-error.log sec-watch.log analytics-dev.log lhci-history.json; do
  [ -e "$LOG_DIR/$f" ] || touch "$LOG_DIR/$f"
done

echo -e "${C_CYAN}╔═══════════════════════════════════════════════════════╗${C_RESET}"
echo -e "${C_CYAN}║       EcyPro Logs Tail — paralel log akışı            ║${C_RESET}"
echo -e "${C_CYAN}╚═══════════════════════════════════════════════════════╝${C_RESET}"
echo ""
echo "İzlenen kaynaklar:"
echo -e "  ${C_BLUE}■${C_RESET} ecypro-combined.log    (Winston: tüm seviyeler)"
echo -e "  ${C_YELLOW}■${C_RESET} ecypro-error.log       (Winston: error+)"
echo -e "  ${C_MAGENTA}■${C_RESET} sec-watch.log          (Security audit)"
echo -e "  ${C_GREEN}■${C_RESET} analytics-dev.log      (Mock GA4 events)"
if command -v docker >/dev/null 2>&1; then
  echo -e "  ${C_CYAN}■${C_RESET} docker logs (postgres-dev, redis-dev, mailpit)"
fi
echo ""

# ── tail -f paralel + prefix renklendir ────────────────────
tail_with_prefix() {
  local file="$1"
  local color="$2"
  local label="$3"

  tail -F "$file" 2>/dev/null | while IFS= read -r line; do
    printf "${color}[%s]${C_RESET} %s\n" "$label" "$line"
  done
}

# Paralel tail'leri başlat
tail_with_prefix "$LOG_DIR/ecypro-combined.log" "$C_BLUE"    "WIN" &
PIDS+=($!)
tail_with_prefix "$LOG_DIR/ecypro-error.log"    "$C_YELLOW"  "ERR" &
PIDS+=($!)
tail_with_prefix "$LOG_DIR/sec-watch.log"        "$C_MAGENTA" "SEC" &
PIDS+=($!)
tail_with_prefix "$LOG_DIR/analytics-dev.log"   "$C_GREEN"   "ANA" &
PIDS+=($!)

# Docker container logs — varsa
if command -v docker >/dev/null 2>&1; then
  for container in ecypro-postgres-dev ecypro-redis-dev ecypro-mailpit-dev; do
    if docker ps --format '{{.Names}}' | grep -q "^$container$"; then
      docker logs -f --tail=20 "$container" 2>&1 | while IFS= read -r line; do
        printf "${C_CYAN}[%s]${C_RESET} %s\n" "${container#ecypro-}" "$line"
      done &
      PIDS+=($!)
    fi
  done
fi

# ── Graceful shutdown ──────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${C_YELLOW}[logs-tail] kapatılıyor...${C_RESET}"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  exit 0
}

trap cleanup SIGINT SIGTERM

# Tüm paralel tail'leri bekle
wait
