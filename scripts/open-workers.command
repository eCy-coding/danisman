#!/bin/bash
# ============================================================================
# eCyPro Background Workers Orchestrator (4 sekme)
# ============================================================================
# Açar:
#   1. Drip campaign worker (60sn tick)
#   2. IndexNow cron (03:00 UTC sahte trigger)
#   3. BullMQ standalone workers (email + gdpr + cron + image + webhook)
#   4. Worker logs tail (production observability)
#
# NOT: Production'da Render separate worker service çalıştırıyor; bu local dev için.
# ============================================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "⚙️  4-sekme background workers açılıyor: ${PROJECT_DIR}"

/usr/bin/osascript <<APPLESCRIPT
tell application "Terminal"
  activate
  do script "cd '${PROJECT_DIR}' && clear && echo '📬 Drip campaign worker...' && DRIP_CAMPAIGN_ENABLED=1 npx tsx -e \"import('./server/jobs/drip-campaign').then(m => { m.startDripCron(); console.log('drip cron started'); }).catch(e => { console.error(e); process.exit(1); })\""
  delay 1
  tell application "System Events" to keystroke "t" using command down
  delay 1
  do script "cd '${PROJECT_DIR}' && clear && echo '🔎 IndexNow cron...' && INDEXNOW_ENABLED=1 npx tsx -e \"import('./server/jobs/indexnow-cron').then(m => { m.startIndexNowCron(); console.log('indexnow cron started'); }).catch(e => { console.error(e); process.exit(1); })\"" in front window
  delay 1
  tell application "System Events" to keystroke "t" using command down
  delay 1
  do script "cd '${PROJECT_DIR}' && clear && echo '🔄 BullMQ standalone workers (email + gdpr + cron + image + webhook)...' && npx tsx server/workers/standalone.ts" in front window
  delay 1
  tell application "System Events" to keystroke "t" using command down
  delay 1
  do script "cd '${PROJECT_DIR}' && clear && echo '📜 Worker log tail (production)...' && if [ -f logs/workers.log ]; then tail -f logs/workers.log; else echo 'Local log dosyasi yok — Render Dashboard ecypro-api > Logs tab izleyin'; sleep infinity; fi" in front window
end tell
APPLESCRIPT

echo "✅ 4 worker sekmesi açıldı."
echo "   - Tab 1: Drip campaign (60sn tick)"
echo "   - Tab 2: IndexNow cron (03:00 UTC)"
echo "   - Tab 3: BullMQ standalone (email/gdpr/cron/image/webhook)"
echo "   - Tab 4: Worker logs"
echo ""
echo "⚠️  Worker'lar Redis + Postgres bağlantısı bekliyor — önce open-dev-environment.command çalıştır."
