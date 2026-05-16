#!/usr/bin/env bash
# eCyPro — DEPLOY_NOW.command  (P10 — master deploy orchestrator)
#
# Tek-tık: Finder Cmd+O ile çalıştır. Eğer credentials hazırsa zinciri
# yürütür; yoksa hangi env var / CLI eksik diye açık liste basar ve durur.
#
# Çalıştırma sırası:
#   0) Pre-checks: typecheck + lint + test + build + integration-health
#   1) git status temizliği
#   2) Backend deploy (Render CLI veya API)
#   3) Frontend deploy (Hostinger — rsync veya curl)
#   4) DNS check (dig)
#   5) SSL check (openssl s_client)
#   6) Live smoke (DEPLOY_LIVE_SMOKE.command)
#   7) SEO submit (IndexNow + Indexing API)

set -euo pipefail
cd "$(dirname "$0")"

TS=$(date +%Y%m%d-%H%M%S)
LOG="outputs/deploy-now-${TS}.log"
mkdir -p outputs

say()  { printf "\n\033[1;36m▸ %s\033[0m\n" "$*" | tee -a "$LOG"; }
ok()   { printf "  \033[32m✅ %s\033[0m\n" "$*" | tee -a "$LOG"; }
warn() { printf "  \033[33m⚠  %s\033[0m\n" "$*" | tee -a "$LOG"; }
fail() { printf "  \033[31m❌ %s\033[0m\n" "$*" | tee -a "$LOG"; }
hr()   { printf "%s\n" "────────────────────────────────────────────────────────────────────" | tee -a "$LOG"; }

say "eCyPro DEPLOY_NOW — ${TS}"
hr

# ──────────────────────────────────────────────────────────
# 0) Pre-checks
# ──────────────────────────────────────────────────────────
say "0) Pre-checks (typecheck / lint / test / build / integration)"

if ! command -v node >/dev/null 2>&1; then fail "node yok — Homebrew + nvm yükle"; exit 1; fi
if ! command -v npm  >/dev/null 2>&1; then fail "npm yok"; exit 1; fi

npm run typecheck            2>&1 | tee -a "$LOG" && ok "typecheck"        || { fail "typecheck FAILED"; exit 1; }
npm run lint                 2>&1 | tee -a "$LOG" && ok "lint"             || { fail "lint FAILED"; exit 1; }
npm test -- --run --silent   2>&1 | tee -a "$LOG" && ok "vitest"           || { fail "vitest FAILED"; exit 1; }

if [ -f .env.production ]; then
  node scripts/integration-health.mjs --env=.env.production 2>&1 | tee -a "$LOG"
  if [ $? -ne 0 ]; then
    fail "integration-health REQUIRED entegrasyonlardan en az biri eksik veya hatalı."
    fail "Önce .env.production'ı tamamla. Çıkıyorum."
    exit 1
  fi
  ok "integration-health PASS"
else
  fail ".env.production yok — .env.production.example'dan kopyala + gerçek değerlerle doldur"
  fail "  cp .env.production.example .env.production && open .env.production"
  exit 1
fi

npm run build 2>&1 | tee -a "$LOG" && ok "build" || { fail "build FAILED"; exit 1; }

hr

# ──────────────────────────────────────────────────────────
# 1) Git status
# ──────────────────────────────────────────────────────────
say "1) Git status"
DIRTY=$(git status --porcelain | wc -l | tr -d ' ')
if [ "$DIRTY" -ne 0 ]; then
  warn "Working tree temiz değil ($DIRTY dosya). Önce commit veya stash et."
  git status --short | tee -a "$LOG"
else
  ok "Working tree temiz"
fi

AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "?")
say "  Origin'in $AHEAD commit önünde."
hr

# ──────────────────────────────────────────────────────────
# 2) Backend deploy (Render)
# ──────────────────────────────────────────────────────────
say "2) Backend deploy — Render"
if [ -n "${RENDER_API_KEY:-}" ] && [ -n "${RENDER_SERVICE_ID:-}" ]; then
  curl -fsS -X POST \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H "Content-Type: application/json" \
    "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys" \
    -d '{"clearCache":"do_not_clear"}' 2>&1 | tee -a "$LOG"
  ok "Render deploy tetiklendi (asenkron — Dashboard'dan progress)"
else
  warn "RENDER_API_KEY veya RENDER_SERVICE_ID env yok — manual yol:"
  warn "  Render Dashboard → Manual Deploy → Deploy latest commit"
  warn "  veya: export RENDER_API_KEY=... RENDER_SERVICE_ID=srv-..."
fi
hr

# ──────────────────────────────────────────────────────────
# 3) Frontend deploy (Hostinger)
# ──────────────────────────────────────────────────────────
say "3) Frontend deploy — Hostinger"
if [ -n "${HOSTINGER_FTP_HOST:-}" ] && [ -n "${HOSTINGER_FTP_USER:-}" ] && [ -n "${HOSTINGER_FTP_PASS:-}" ]; then
  if command -v lftp >/dev/null 2>&1; then
    lftp -e "set ftp:ssl-allow yes; set ssl:verify-certificate no; mirror -R --delete --parallel=4 dist/ public_html/; bye" \
      -u "${HOSTINGER_FTP_USER},${HOSTINGER_FTP_PASS}" "${HOSTINGER_FTP_HOST}" 2>&1 | tee -a "$LOG"
    ok "Hostinger upload tamam (lftp mirror)"
  else
    warn "lftp yok — Homebrew: brew install lftp; veya File Manager üzerinden manual"
  fi
else
  warn "HOSTINGER_FTP_* env yok — manual yol:"
  warn "  hPanel → File Manager → public_html/ → dist/ içeriğini sürükle"
fi
hr

# ──────────────────────────────────────────────────────────
# 4) DNS check
# ──────────────────────────────────────────────────────────
say "4) DNS check"
for host in www.ecypro.com ecypro.com api.ecypro.com; do
  ip=$(dig +short "$host" | head -1)
  if [ -n "$ip" ]; then ok "$host → $ip"; else warn "$host → DNS resolve yok"; fi
done
hr

# ──────────────────────────────────────────────────────────
# 5) SSL check
# ──────────────────────────────────────────────────────────
say "5) SSL check"
for host in www.ecypro.com api.ecypro.com; do
  if echo | openssl s_client -servername "$host" -connect "${host}:443" -brief 2>/dev/null | grep -q "Verification: OK"; then
    ok "$host SSL OK"
  else
    warn "$host SSL doğrulama başarısız (DNS daha propagate olmamış olabilir)"
  fi
done
hr

# ──────────────────────────────────────────────────────────
# 6) Live smoke
# ──────────────────────────────────────────────────────────
say "6) Live smoke"
if [ -x ./DEPLOY_LIVE_SMOKE.command ]; then
  bash ./DEPLOY_LIVE_SMOKE.command 2>&1 | tee -a "$LOG"
else
  warn "DEPLOY_LIVE_SMOKE.command yok veya executable değil"
fi
hr

# ──────────────────────────────────────────────────────────
# 7) SEO submit
# ──────────────────────────────────────────────────────────
say "7) SEO submit (IndexNow + Indexing API)"
if grep -q "^INDEXNOW_KEY=" .env.production 2>/dev/null; then
  npm run seo:push 2>&1 | tee -a "$LOG" && ok "seo:push tamam"
else
  warn "INDEXNOW_KEY env'de yok — sonra: npm run seo:push"
fi
hr

say "DEPLOY_NOW bitti. Log: $LOG"
