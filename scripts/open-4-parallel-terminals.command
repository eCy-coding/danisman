#!/bin/bash
# ============================================================================
# eCyPro Parallel Sprint Orchestrator
# ============================================================================
# Açar: macOS Terminal.app'te 4 sekme, her birinde otonom sprint çalıştırır.
#
# Kullanım:
#   Finder'dan çift tıkla VEYA terminalden:
#   bash scripts/open-4-parallel-terminals.command
#
# Sekmeler:
#   1. P65 — SSE Authentication Fix
#   2. P66 — Backend Test Coverage
#   3. P67 — Frontend Performance Lighthouse
#   4. P68 — Continuous Health Monitor (CTRL+C ile durdurulur)
# ============================================================================

set -e

# Proje kökü (script'in bulunduğu dizinin üst klasörü)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "📍 Proje dizini: ${PROJECT_DIR}"
echo "🚀 4 paralel sprint sekmesi açılıyor..."
echo ""

# Parallel scripts mevcut mu kontrol
for script in p65-sse-auth-fix p66-backend-tests p67-performance p68-health-monitor; do
  if [ ! -x "${PROJECT_DIR}/scripts/parallel/${script}.command" ]; then
    echo "❌ Hata: scripts/parallel/${script}.command bulunamadı veya executable değil."
    echo "   Çözüm: chmod +x scripts/parallel/*.command"
    exit 1
  fi
done

# osascript ile Terminal sekmelerini aç
/usr/bin/osascript <<APPLESCRIPT
tell application "Terminal"
  activate

  -- İlk sekme (eğer Terminal kapalıysa yeni window açar)
  set t1 to do script "cd '${PROJECT_DIR}' && clear && echo '🚀 P65 — SSE Auth Fix başlıyor...' && bash scripts/parallel/p65-sse-auth-fix.command"
  delay 1

  -- Yeni sekme P66
  tell application "System Events" to keystroke "t" using command down
  delay 1
  set t2 to do script "cd '${PROJECT_DIR}' && clear && echo '🧪 P66 — Backend Tests başlıyor...' && bash scripts/parallel/p66-backend-tests.command" in front window
  delay 1

  -- Yeni sekme P67
  tell application "System Events" to keystroke "t" using command down
  delay 1
  set t3 to do script "cd '${PROJECT_DIR}' && clear && echo '⚡ P67 — Performance Lighthouse başlıyor...' && bash scripts/parallel/p67-performance.command" in front window
  delay 1

  -- Yeni sekme P68 (background daemon)
  tell application "System Events" to keystroke "t" using command down
  delay 1
  set t4 to do script "cd '${PROJECT_DIR}' && clear && echo '🩺 P68 — Health Monitor başlıyor (CTRL+C ile durdur)...' && bash scripts/parallel/p68-health-monitor.command" in front window

end tell
APPLESCRIPT

echo "✅ 4 sekme açıldı."
echo ""
echo "📊 İzleme:"
echo "   - Tab 1 (P65 SSE Fix):   ~3-5 dk, tamamlandığında 'say P65 complete'"
echo "   - Tab 2 (P66 Tests):     ~5-10 dk, coverage raporu çıktısı"
echo "   - Tab 3 (P67 Lighthouse): ~3-7 dk, JSON + delta rapor"
echo "   - Tab 4 (P68 Monitor):   sürekli (CTRL+C ile durdur)"
echo ""
echo "📁 Output'lar: outputs/P65_*, outputs/P66_*, outputs/P67_*, outputs/P68_*"
