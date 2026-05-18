#!/bin/bash
# ============================================================================
# eCyPro Dev Environment Orchestrator (6 sekme)
# ============================================================================
# Açar:
#   1. Vite frontend dev server (port 5173)
#   2. Express backend dev server (tsx watch)
#   3. Docker compose dev stack (postgres + redis + mailpit)
#   4. TypeScript watch (frontend)
#   5. TypeScript watch (backend)
#   6. Vitest watch (unit tests)
# ============================================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "🛠 6-sekme dev environment açılıyor: ${PROJECT_DIR}"

/usr/bin/osascript <<APPLESCRIPT
tell application "Terminal"
  activate
  do script "cd '${PROJECT_DIR}' && clear && echo '🎨 Vite frontend (port 5173)...' && npm run dev"
  delay 1
  tell application "System Events" to keystroke "t" using command down
  delay 1
  do script "cd '${PROJECT_DIR}' && clear && echo '⚙️  Express backend (tsx watch)...' && npm run dev:server" in front window
  delay 1
  tell application "System Events" to keystroke "t" using command down
  delay 1
  do script "cd '${PROJECT_DIR}' && clear && echo '🐘 Docker dev stack (postgres+redis+mailpit)...' && docker compose -f docker-compose.dev.yml up" in front window
  delay 1
  tell application "System Events" to keystroke "t" using command down
  delay 1
  do script "cd '${PROJECT_DIR}' && clear && echo '🔍 TypeScript watch (frontend)...' && npx tsc --noEmit --watch" in front window
  delay 1
  tell application "System Events" to keystroke "t" using command down
  delay 1
  do script "cd '${PROJECT_DIR}' && clear && echo '🔍 TypeScript watch (backend)...' && npx tsc -p tsconfig.server.json --noEmit --watch" in front window
  delay 1
  tell application "System Events" to keystroke "t" using command down
  delay 1
  do script "cd '${PROJECT_DIR}' && clear && echo '🧪 Vitest watch...' && npm test" in front window
end tell
APPLESCRIPT

echo "✅ 6 dev sekmesi açıldı."
echo "   - Tab 1: Vite (http://localhost:5173)"
echo "   - Tab 2: Backend (http://localhost:3001)"
echo "   - Tab 3: Docker (postgres:5432, redis:6379, mailpit:8025)"
echo "   - Tab 4-5: tsc watch (web + server)"
echo "   - Tab 6: Vitest watch"
