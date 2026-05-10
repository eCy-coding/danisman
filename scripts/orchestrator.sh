#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# EcyPro 15-Pane Dev Orchestrator (istek5 disiplini)
# ═══════════════════════════════════════════════════════════════════════════
# Tek komutla tüm geliştirme stack'ini ayağa kaldırır:
#   - Docker (Postgres + Redis + Mailpit)
#   - 15 paralel pane (frontend, backend, DB, E2E, SEO, media, geo, CRM…)
#
# Çalıştır: bash scripts/orchestrator.sh
#          npm run dev:tmux
#
# Tmux yoksa veya CI ortamındaysa otomatik concurrently fallback'a düşer.
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

SESSION="ecypro-dev"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ── Renkli log helpers ───────────────────────────────────────────────
c_green()  { printf '\033[32m%s\033[0m\n' "$*"; }
c_yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
c_red()    { printf '\033[31m%s\033[0m\n' "$*"; }
c_cyan()   { printf '\033[36m%s\033[0m\n' "$*"; }

# ── Ön kontroller ────────────────────────────────────────────────────
if ! command -v tmux >/dev/null 2>&1; then
  c_yellow "[orchestrator] tmux bulunamadı → concurrently fallback (npm run dev:full)"
  exec npm --prefix "$ROOT" run dev:full
fi

if [ -n "${CI:-}" ] || [ -n "${GITHUB_ACTIONS:-}" ]; then
  c_yellow "[orchestrator] CI ortamı tespit edildi → concurrently fallback"
  exec npm --prefix "$ROOT" run dev:full
fi

# Mevcut session varsa sadece attach
if tmux has-session -t "$SESSION" 2>/dev/null; then
  c_cyan "[orchestrator] $SESSION zaten açık → attach ediyorum"
  exec tmux attach -t "$SESSION"
fi

# ── 1) Docker dev container'larını başlat ────────────────────────────
c_cyan "[orchestrator] Docker dev stack başlatılıyor (Postgres + Redis + Mailpit)..."
if command -v docker >/dev/null 2>&1; then
  docker compose -f "$ROOT/docker-compose.dev.yml" up -d || c_yellow "[orchestrator] Docker başlatılamadı (devam)"
else
  c_yellow "[orchestrator] Docker yok → host'taki servisler kullanılacak"
fi

# ── 2) Tmux session + 15 pane ────────────────────────────────────────
c_cyan "[orchestrator] Tmux session $SESSION oluşturuluyor (15 pane)..."

cd "$ROOT"

tmux new-session -d -s "$SESSION" -n main -c "$ROOT"

# 15 pane = 1 + 14 split. Tile layout otomatik düzenler.
for _ in $(seq 1 14); do
  tmux split-window -t "$SESSION:main" -c "$ROOT"
  tmux select-layout -t "$SESSION:main" tiled >/dev/null
done
tmux select-layout -t "$SESSION:main" tiled >/dev/null

# ── 3) Pane görev ataması ────────────────────────────────────────────
# Her pane'e isim + komut gönder
assign() {
  local pane="$1"
  local title="$2"
  local cmd="$3"
  tmux select-pane -t "$SESSION:main.$pane" -T "$title" 2>/dev/null || true
  tmux send-keys -t "$SESSION:main.$pane" "clear; printf '\033[1;36m▶ %s\033[0m\n' '$title'; $cmd" C-m
}

assign 0  "🖥️ Frontend-Dev"    "npm run vite"
assign 1  "🛠️ Backend-API"     "npm run server"
assign 2  "💾 DB-Postgres"      "npm run dev:db:logs"
assign 3  "🧪 E2E-Cypress"      "npm run e2e:watch"
assign 4  "🔎 SEO-Geo-Admin"    "npm run seo:watch"
assign 5  "🎨 UI-Storybook"     "npm run stories"
assign 6  "📦 Media-Watcher"    "node scripts/watch-media.js"
assign 7  "⚙️ CI-Lighthouse"    "npm run lhci:watch"
assign 8  "🗒️ Log-Tail"         "npm run logs:tail"
assign 9  "📈 Analytics-Dev"    "node scripts/analytics-dev.js"
assign 10 "🔐 Sec-Watch"        "npm run sec:watch"
assign 11 "🚀 Deploy-Watch"     "npm run deploy:watch"
assign 12 "🏗️ UI-Designer"      "npm run geo:watch"
assign 13 "� Geo-Manager"      "node scripts/geo-manager.js --watch"
assign 14 "🧑‍� Lead-CRM"         "node scripts/crm-sync.js --watch"

# Pane border + title gösterimi
tmux set -t "$SESSION" pane-border-status top >/dev/null
tmux set -t "$SESSION" pane-border-format " #{pane_index} #{pane_title} " >/dev/null
tmux set -t "$SESSION" mouse on >/dev/null

c_green "[orchestrator] ✅ 15 pane hazır. Attach ediyorum..."
echo ""
echo "  Pane gezinti:  Ctrl-b + ok tuşları | Ctrl-b q (numara göster)"
echo "  Detach:        Ctrl-b d            | tekrar attach: tmux attach -t $SESSION"
echo "  Kapat:         npm run dev:down"
echo ""

exec tmux attach -t "$SESSION"
