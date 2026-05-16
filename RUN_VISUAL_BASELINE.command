#!/usr/bin/env bash
# eCyPro — P11 Visual Regression Baseline (host-only)
# P11/3 — devops-publisher + a11y-fixer
#
# Boots vite preview on :4173, captures screenshots + axe-core + console for
# 20 routes (mobile + desktop), writes outputs/P11_VISUAL_BASELINE.json.
#
# Sandbox cannot launch a real Chromium. This runs on the user's MacBook.

set -uo pipefail
cd "$(dirname "$0")"
mkdir -p outputs/screenshots/{mobile,desktop}

TS=$(date +%Y%m%d-%H%M%S)
LOG="outputs/p11-visual-${TS}.log"
exec > >(tee -a "$LOG") 2>&1

echo "============================================================"
echo " eCyPro P11 visual baseline"
echo " Timestamp : $TS"
echo " Log       : $LOG"
echo "============================================================"

# Ensure dist + preview are fresh
if [ ! -d dist ] || [ -n "$(find src vite.config.ts -type f -newer dist/index.html 2>/dev/null | head -1)" ]; then
  echo "▶ Rebuilding production bundle"
  npm run build || { echo "❌ build failed"; exit 1; }
fi

# Clear port 4173
PORT_PID=$(lsof -ti :4173 || true)
if [ -n "$PORT_PID" ]; then
  echo "▶ Killing existing process on :4173 (pid $PORT_PID)"
  kill -9 "$PORT_PID" || true
  sleep 1
fi

# Start preview in background
echo "▶ Starting vite preview on :4173"
npm run preview >/tmp/p11-preview.log 2>&1 &
PREVIEW_PID=$!
sleep 4

# Wait for preview to be reachable
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf http://localhost:4173/ > /dev/null; then
    echo "  preview ready (attempt $i)"
    break
  fi
  echo "  waiting for preview... ($i/10)"
  sleep 1
done

if ! curl -sf http://localhost:4173/ > /dev/null; then
  echo "❌ preview not reachable at http://localhost:4173"
  kill "$PREVIEW_PID" 2>/dev/null || true
  exit 1
fi

# Ensure playwright + axe deps
if ! [ -d node_modules/playwright ]; then
  echo "▶ Installing playwright"
  npm install --no-save playwright @axe-core/playwright
fi
npx playwright install chromium 2>&1 | tail -3 || true

# Run capture
PREVIEW_URL=http://localhost:4173 node scripts/capture-visual-baseline.mjs
RC=$?

# Teardown
kill "$PREVIEW_PID" 2>/dev/null || true

if [ $RC -ne 0 ]; then
  echo "❌ capture failed (RC=$RC)"
  exit $RC
fi

# Generate human-readable manifest
JSON="outputs/P11_VISUAL_BASELINE.json"
MD="outputs/P11_VISUAL_BASELINE.md"

if [ -f "$JSON" ]; then
  node -e "
    const data = require('./$JSON');
    const lines = [];
    lines.push('# P11/3 — Visual Regression Baseline');
    lines.push('');
    lines.push('**Tarih:** ' + data.captured_at);
    lines.push('**Preview:** ' + data.preview_url);
    lines.push('**Route sayısı:** ' + data.route_count);
    lines.push('**Viewport'lar:** mobile 375×667, desktop 1440×900');
    lines.push('');
    lines.push('## Route × viewport sonuçları');
    lines.push('');
    lines.push('| Route | Path | Mobile status | Mobile axe | Mobile console.err | Desktop status | Desktop axe | Desktop console.err |');
    lines.push('|---|---|---:|---:|---:|---:|---:|---:|');
    for (const r of data.results) {
      const m = r.mobile || {};
      const d = r.desktop || {};
      lines.push('| ' + r.slug + ' | \`' + r.path + '\` | ' + (m.status ?? '×') + ' | ' + (m.axe_violations ?? '×') + ' | ' + (m.console?.error ?? '×') + ' | ' + (d.status ?? '×') + ' | ' + (d.axe_violations ?? '×') + ' | ' + (d.console?.error ?? '×') + ' |');
    }
    lines.push('');
    lines.push('## Screenshot paths');
    lines.push('');
    for (const r of data.results) {
      lines.push('- **' + r.slug + '** — mobile: \`' + (r.mobile?.screenshot ?? 'n/a') + '\` · desktop: \`' + (r.desktop?.screenshot ?? 'n/a') + '\`');
    }
    require('fs').writeFileSync('$MD', lines.join('\n'));
    console.log('✅ Wrote $MD');
  "
fi

echo
echo "Done. Open $MD for the manifest."
