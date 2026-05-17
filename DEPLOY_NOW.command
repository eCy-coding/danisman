#!/usr/bin/env bash
# eCyPro — DEPLOY_NOW.command  (P30 Track 2 — Master Deploy Orchestrator)
#
# Tek dosyadan tüm canlıya çıkış yolculuğu:
#   0) Push readiness gate (READY_TO_PUSH.command)
#   1) [user] git push origin main
#   2) Backend deploy (outputs/DEPLOY_BACKEND_RENDER.command)
#   3) Frontend deploy (outputs/DEPLOY_FRONTEND_HOSTINGER.command)
#   4) DNS + SSL setup (outputs/DEPLOY_DNS_SSL.command)
#   5) Live verification (outputs/DEPLOY_POST_LIVE.command)
#
# Çalıştırma:
#   Finder'da çift-tık (Terminal ile aç)  veya  bash DEPLOY_NOW.command
#
# Geçmek istediğin aşamayı SKIP_<N>=1 ile atla:
#   SKIP_0=1 bash DEPLOY_NOW.command     # push readiness'i atla
#   SKIP_2=1 bash DEPLOY_NOW.command     # backend deploy'u atla
#
# Her alt-script kendi log dosyasını outputs/ altında üretir.

set -uo pipefail
cd "$(dirname "$0")"

TS=$(date +%Y%m%d-%H%M%S)
MASTER_LOG="outputs/deploy-now-${TS}.log"
mkdir -p outputs
exec > >(tee -a "$MASTER_LOG") 2>&1

# ─── colors / helpers ────────────────────────────────────────
say()  { printf "\n\033[1;36m▸ %s\033[0m\n" "$*"; }
ok()   { printf "  \033[32m✅ %s\033[0m\n" "$*"; }
warn() { printf "  \033[33m⚠  %s\033[0m\n" "$*"; }
fail() { printf "  \033[31m❌ %s\033[0m\n" "$*"; }
hr()   { printf "%s\n" "════════════════════════════════════════════════════════════════════"; }

run_stage() {
  local n="$1" name="$2" script="$3"
  local skip_var="SKIP_${n}"
  if [[ "${!skip_var:-0}" == "1" ]]; then
    warn "Aşama $n ($name) — ATLANDI (${skip_var}=1)"
    return 0
  fi
  hr
  say "AŞAMA $n: $name"
  hr
  if [[ ! -f "$script" ]]; then
    fail "$script bulunamadı"; return 1
  fi
  if bash "$script"; then
    ok "Aşama $n tamam"
    return 0
  else
    fail "Aşama $n BAŞARISIZ"
    return 1
  fi
}

# ─── banner ──────────────────────────────────────────────────
clear || true
cat <<'BANNER'
  ╔═══════════════════════════════════════════════════════════╗
  ║          eCyPro — MASTER DEPLOY ORCHESTRATOR              ║
  ║                  P30 Track 2 — go live                    ║
  ╚═══════════════════════════════════════════════════════════╝
BANNER
echo ""
echo "  Timestamp : $TS"
echo "  Log       : $MASTER_LOG"
echo ""
echo "  Aşamalar:"
echo "    0) Push readiness gate"
echo "    1) git push origin main  (manuel — sen yapacaksın)"
echo "    2) Backend deploy (Render)"
echo "    3) Frontend deploy (Hostinger)"
echo "    4) DNS + SSL"
echo "    5) Live verification + Sentry + SEO + Lighthouse"
echo ""

read -r -p "Tüm zinciri çalıştır mı? (y/n) " ans
[[ "$ans" != "y" ]] && { warn "Kullanıcı iptal etti"; exit 0; }

# ─── Aşama 0: Push readiness ─────────────────────────────────
if [[ "${SKIP_0:-0}" != "1" ]]; then
  hr
  say "AŞAMA 0: Push readiness gate"
  hr
  if [[ -x ./READY_TO_PUSH.command ]]; then
    if bash ./READY_TO_PUSH.command; then
      ok "Push readiness GREEN"
    else
      fail "Push readiness FAIL — düzelt, sonra tekrar dene"
      exit 1
    fi
  else
    warn "READY_TO_PUSH.command yok veya executable değil — atlanıyor"
  fi
else
  warn "Aşama 0 SKIP_0=1"
fi

# ─── Aşama 1: git push (manuel) ──────────────────────────────
if [[ "${SKIP_1:-0}" != "1" ]]; then
  hr
  say "AŞAMA 1: git push origin main (manuel)"
  hr
  cat <<'PUSHHELP'

  Bu aşamayı sen yapacaksın. Yeni terminalde:

      cd ~/Desktop/ecypro
      git push origin main

  (Veya iki-faktörlü ise gh CLI kullan: gh auth status && git push)

PUSHHELP
  read -r -p "Push tamamlandı mı? (y/skip) " ans
  case "$ans" in
    y) ok "Push beyan edildi" ;;
    skip) warn "Push atlandı — backend deploy eski commit'i build edebilir" ;;
    *) fail "İptal"; exit 1 ;;
  esac
else
  warn "Aşama 1 SKIP_1=1"
fi

# ─── Aşama 2-5: Otomatik alt-scriptler ───────────────────────
run_stage 2 "Backend deploy (Render)"          "outputs/DEPLOY_BACKEND_RENDER.command"     || exit 1
run_stage 3 "Frontend deploy (Hostinger)"      "outputs/DEPLOY_FRONTEND_HOSTINGER.command" || exit 1
run_stage 4 "DNS + SSL"                        "outputs/DEPLOY_DNS_SSL.command"            || exit 1
run_stage 5 "Live verification"                "outputs/DEPLOY_POST_LIVE.command"          || exit 1

# ─── Final ───────────────────────────────────────────────────
hr
say "🚀 DEPLOY_NOW tamam — eCyPro canlıda"
hr
cat <<DONE

  Sonraki adımlar:
   • https://www.ecypro.com   → manuel sanity (homepage render, contact form)
   • Sentry → Issues          → ilk 30 dk hata akışı izle
   • Render Dashboard         → CPU/RAM/error rate
   • Google Search Console    → sitemap durum
   • PageSpeed Insights       → real-world LCP

  Rollback gerekirse:
   • Frontend: public_html_backup_${TS}/ klasörünü public_html/ yap
   • Backend : Render Dashboard → Deploys → önceki LIVE → "Rollback"

  Master log: $MASTER_LOG
DONE
