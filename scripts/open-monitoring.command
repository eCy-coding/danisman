#!/bin/bash
# ============================================================================
# eCyPro Monitoring Orchestrator (4 sekme)
# ============================================================================
# Açar:
#   1. P68 Health Monitor (60sn loop production endpoint'leri)
#   2. Git status watch (her 10sn refresh)
#   3. Prisma Studio (browser tab açar, terminal tutar — DATABASE_URL şart)
#   4. Vercel + Render log tail (CLI varsa) veya placeholder
# ============================================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "📊 4-sekme monitoring environment açılıyor: ${PROJECT_DIR}"

/usr/bin/osascript <<APPLESCRIPT
tell application "Terminal"
  activate
  do script "cd '${PROJECT_DIR}' && clear && echo '🩺 P68 Health Monitor...' && bash scripts/parallel/p68-health-monitor.command"
  delay 1
  tell application "System Events" to keystroke "t" using command down
  delay 1
  do script "cd '${PROJECT_DIR}' && clear && echo '📁 Git status watch (her 10sn)...' && while true; do clear; date; echo; git status --short; echo; echo '── Son 5 commit ──'; git log --oneline -5; sleep 10; done" in front window
  delay 1
  tell application "System Events" to keystroke "t" using command down
  delay 1
  do script "cd '${PROJECT_DIR}' && clear && echo '🗄  Prisma Studio (port 5555)...' && if [ -n \"\$DATABASE_URL\" ] || [ -f .env ]; then npx prisma studio; else echo 'DATABASE_URL set edili degil — .env yükle veya export et'; fi" in front window
  delay 1
  tell application "System Events" to keystroke "t" using command down
  delay 1
  do script "cd '${PROJECT_DIR}' && clear && echo '☁️  Vercel + Render log tail...' && if command -v vercel >/dev/null 2>&1; then vercel logs --follow; else echo 'Vercel CLI yok — npm i -g vercel ile kur. Render Dashboard: https://dashboard.render.com'; sleep infinity; fi" in front window
end tell
APPLESCRIPT

echo "✅ 4 monitoring sekmesi açıldı."
echo "   - Tab 1: P68 Health (60sn ping, CTRL+C durdurur)"
echo "   - Tab 2: Git status watch (10sn refresh)"
echo "   - Tab 3: Prisma Studio (http://localhost:5555)"
echo "   - Tab 4: Vercel/Render logs"
