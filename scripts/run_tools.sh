#!/usr/bin/env bash
# scripts/run_tools.sh
# EcyPro E2E Araç Paketi — Tek Komutla Çalıştır
# istek5.txt 15-Pane Araç Merkezi
#
# KULLANIM (sadece tek argüman):
#   bash scripts/run_tools.sh health
#   bash scripts/run_tools.sh seo
#   bash scripts/run_tools.sh perf
#   bash scripts/run_tools.sh coverage
#   bash scripts/run_tools.sh dashboard
#   bash scripts/run_tools.sh open
#   bash scripts/run_tools.sh ts
#   bash scripts/run_tools.sh all
#
# NOT: Her komutu AYRI terminalde çalıştır — çok satırlı toplu çalıştırma desteklenmiyor.

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Ctrl+C temiz çık
trap 'echo -e "\n  ⚠ Araç durduruldu (SIGINT)"; exit 130' INT

GREEN='\033[92m'
YELLOW='\033[93m'
CYAN='\033[96m'
BOLD='\033[1m'
RESET='\033[0m'

banner() { echo -e "\n${BOLD}${CYAN}▶ $*${RESET}"; }
ok()     { echo -e "  ${GREEN}✅ $*${RESET}"; }
warn()   { echo -e "  ${YELLOW}⚠  $*${RESET}"; }

CMD="${1:-all}"

run_health() {
    banner "E2E Sağlık Raporu"
    python3 scripts/e2e_health.py --output public/tools/e2e-dashboard.html
    ok "Dashboard: public/tools/e2e-dashboard.html"
}

run_coverage() {
    banner "Coverage Raporu"
    python3 scripts/e2e_coverage_report.py
}

run_seo() {
    banner "SEO Denetimi (localhost:4173)"
    # no_proxy: Python 3.14 macOS getproxies_macosx_sysconf() donma önlemi
    no_proxy="*" NO_PROXY="*" \
    python3 scripts/seo_audit.py \
        --base-url http://localhost:4173 \
        --output public/tools/seo-audit.html \
    && ok "Rapor: public/tools/seo-audit.html" \
    || warn "SEO audit tamamlanamadı (sunucu çalışmıyor veya proxy sorunu)"
}

run_perf() {
    banner "Lighthouse CI Raporu"
    python3 scripts/performance_report.py \
        --dir lighthouse-reports \
        --output public/tools/lhci-report.html
    ok "Rapor: public/tools/lhci-report.html"
}

run_dashboard() {
    banner "HTML Dashboard Paketi Üretiliyor"
    python3 scripts/e2e_health.py --output public/tools/e2e-dashboard.html
    python3 scripts/performance_report.py --output public/tools/lhci-report.html
    python3 -c "
import subprocess, json
r = subprocess.run(['python3','scripts/e2e_health.py','--json'], capture_output=True, text=True)
with open('e2e_health.json','w') as f:
    f.write(r.stdout)
print('[run_tools] e2e_health.json guncellendi')
"
    ok "Tüm HTML araçlar: public/tools/"
}

run_open() {
    banner "Araçları Tarayıcıda Aç"
    local files=(
        "public/tools/e2e-dashboard.html"
        "public/tools/coverage-matrix.html"
        "public/tools/lhci-report.html"
        "public/tools/seo-audit.html"
    )
    for f in "${files[@]}"; do
        if [ -f "$f" ]; then
            open "$f" 2>/dev/null || xdg-open "$f" 2>/dev/null || echo "  → $f"
            ok "$f"
        else
            warn "$f yok (önce 'bash scripts/run_tools.sh dashboard' çalıştır)"
        fi
    done
}

run_typecheck() {
    banner "TypeScript Kontrol"
    npx tsc --noEmit && ok "TS: 0 hata"
}

case "$CMD" in
    health)   run_health ;;
    coverage) run_coverage ;;
    seo)      run_seo ;;
    perf)     run_perf ;;
    dashboard)run_dashboard ;;
    open)     run_open ;;
    ts)       run_typecheck ;;
    all)
        set +e
        run_health
        run_coverage
        run_perf
        run_dashboard
        echo -e "\n${BOLD}${GREEN}✅ Tüm araçlar tamamlandı!${RESET}"
        echo -e "  → Araçları aç: bash scripts/run_tools.sh open"
        ;;
    *)
        echo "Kullanım: bash scripts/run_tools.sh [health|coverage|seo|perf|dashboard|open|ts|all]"
        exit 1
        ;;
esac
