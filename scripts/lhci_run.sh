#!/usr/bin/env bash
# scripts/lhci_run.sh
# Lighthouse CI Otomatik Çalıştırıcı
# istek5.txt Pane 7 — ⚙️ CI-Lighthouse
#
# KULLANIM:
#   bash scripts/lhci_run.sh              (preview build + lhci)
#   bash scripts/lhci_run.sh --no-build   (sadece mevcut preview)
#   bash scripts/lhci_run.sh --report     (sadece rapor üret)
#
# Adımlar:
#   1. npm run build (eğer --no-build yoksa)
#   2. Preview server başlat (localhost:4173)
#   3. Server hazır olana kadar bekle
#   4. npx lhci autorun (6 sayfa x 3 run)
#   5. python3 scripts/performance_report.py
#   6. Preview server kapat

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GREEN='\033[92m'
YELLOW='\033[93m'
RED='\033[91m'
CYAN='\033[96m'
BOLD='\033[1m'
RESET='\033[0m'

banner() { echo -e "\n${BOLD}${CYAN}▶ $*${RESET}"; }
ok()     { echo -e "  ${GREEN}✅ $*${RESET}"; }
warn()   { echo -e "  ${YELLOW}⚠  $*${RESET}"; }
fail()   { echo -e "  ${RED}❌ $*${RESET}"; }

NO_BUILD=0
REPORT_ONLY=0

for arg in "$@"; do
    case "$arg" in
        --no-build)   NO_BUILD=1 ;;
        --report)     REPORT_ONLY=1 ;;
    esac
done

PREVIEW_PID=""

cleanup() {
    if [ -n "$PREVIEW_PID" ] && kill -0 "$PREVIEW_PID" 2>/dev/null; then
        banner "Preview server kapatılıyor (PID: $PREVIEW_PID)"
        kill "$PREVIEW_PID" 2>/dev/null || true
        wait "$PREVIEW_PID" 2>/dev/null || true
        ok "Preview server durduruldu"
    fi
}
trap cleanup EXIT INT TERM

# ─── REPORT ONLY MODE ────────────────────────────────────────
if [ "$REPORT_ONLY" = "1" ]; then
    banner "Lighthouse Raporu Üretiliyor"
    no_proxy="*" NO_PROXY="*" \
    python3 scripts/performance_report.py \
        --dir lighthouse-reports \
        --output public/tools/lhci-report.html
    ok "Rapor: public/tools/lhci-report.html"
    exit 0
fi

# ─── BUILD AŞAMASI ───────────────────────────────────────────
if [ "$NO_BUILD" = "0" ]; then
    banner "Proje Build Ediliyor (npm run build)"
    npm run build 2>&1 | tail -20
    ok "Build tamamlandı"
fi

# ─── PREVIEW SERVER ──────────────────────────────────────────
banner "Preview Server Başlatılıyor (port 4173)"

# Önce mevcut 4173 process'ini kontrol et
if lsof -i:4173 -t >/dev/null 2>&1; then
    warn "Port 4173 zaten kullanımda — mevcut server kullanılacak"
    PREVIEW_PID=""
else
    npx vite preview --port 4173 &
    PREVIEW_PID="$!"
    echo "  Preview PID: $PREVIEW_PID"

    # Server hazır olana kadar bekle (max 60sn)
    banner "Server hazır bekleniyor (max 60sn)..."
    WAIT=0
    until curl -sf http://localhost:4173 >/dev/null 2>&1; do
        sleep 1
        WAIT=$((WAIT + 1))
        if [ "$WAIT" -ge 60 ]; then
            fail "Server 60sn içinde başlamadı"
            exit 1
        fi
        echo -n "."
    done
    echo ""
    ok "Preview server hazır (${WAIT}sn)"
fi

# ─── LHCI ÇALIŞTIR ───────────────────────────────────────────
banner "Lighthouse CI Çalıştırılıyor (6 sayfa × 3 run)"

mkdir -p lighthouse-reports

if command -v npx >/dev/null 2>&1; then
    npx lhci autorun 2>&1 | tail -30 || {
        warn "lhci autorun başarısız — @lhci/cli yüklü değil olabilir"
        warn "Yükle: npm install -D @lhci/cli"
        warn "Veya: npx @lhci/cli@latest autorun"
    }
else
    fail "npx bulunamadı"
    exit 1
fi

# ─── RAPOR ───────────────────────────────────────────────────
banner "Lighthouse Raporu Üretiliyor"

# Bozuk raporları temizle (chrome-error)
python3 -c "
import json, glob, os
removed = []
for f in glob.glob('lighthouse-reports/*.json'):
    try:
        d = json.load(open(f))
        url = d.get('finalUrl', d.get('requestedUrl', ''))
        if 'chrome-error' in url or 'chromewebdata' in url:
            os.remove(f)
            removed.append(os.path.basename(f))
    except Exception:
        os.remove(f)
        removed.append(os.path.basename(f))
if removed:
    print('[lhci_run] Bozuk raporlar silindi:', removed)
"

no_proxy="*" NO_PROXY="*" \
python3 scripts/performance_report.py \
    --dir lighthouse-reports \
    --output public/tools/lhci-report.html

ok "Rapor: public/tools/lhci-report.html"
echo -e "\n${BOLD}${GREEN}✅ LHCI tamamlandı!${RESET}"
echo -e "  → Raporu aç: bash scripts/run_tools.sh open"
