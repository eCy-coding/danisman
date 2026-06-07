#!/usr/bin/env bash
# DEPLOY_PRECHECK.command — Deploy öncesi tek tık kalite kapısı
# Host'tan Finder Cmd+O ile çalıştır.
# Push YOK. Sadece okuma + lokal doğrulama.

set -u
cd "$(dirname "$0")"
TS=$(date +%Y%m%d-%H%M%S)
LOG="outputs/deploy-precheck-$TS.log"
DONE="outputs/deploy-precheck-done-$TS.txt"
mkdir -p outputs

# Renkler (opsiyonel — terminal destekliyorsa)
if [ -t 1 ]; then
  G='\033[0;32m'; R='\033[0;31m'; Y='\033[0;33m'; B='\033[0;34m'; NC='\033[0m'
else
  G=''; R=''; Y=''; B=''; NC=''
fi

PASS=0
FAIL=0
WARN=0

check() {
  local name="$1"; local cmd="$2"
  echo -ne "  ${B}[check]${NC} $name ... "
  if eval "$cmd" > "/tmp/deploy-check-$$.log" 2>&1; then
    echo -e "${G}PASS${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${R}FAIL${NC}"
    FAIL=$((FAIL + 1))
    echo "      Detay: /tmp/deploy-check-$$.log son 5 satır:"
    tail -5 "/tmp/deploy-check-$$.log" | sed 's/^/        /'
  fi
}

warn_check() {
  local name="$1"; local cmd="$2"
  echo -ne "  ${B}[warn]${NC}  $name ... "
  if eval "$cmd" > "/tmp/deploy-check-$$.log" 2>&1; then
    echo -e "${G}OK${NC}"
  else
    echo -e "${Y}WARN${NC}"
    WARN=$((WARN + 1))
  fi
}

PREVIEW_PID=""
cleanup() {
  if [ -n "${PREVIEW_PID:-}" ] && kill -0 "$PREVIEW_PID" 2>/dev/null; then
    kill "$PREVIEW_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

{
  echo "================================================================"
  echo "  EcyPro — Deploy Pre-Check Dashboard"
  echo "  $(date)"
  echo "================================================================"
  echo

  # 1. Git temizlik
  echo "${B}[1/8] Git working tree${NC}"
  UNTRACKED=$(git status --porcelain | wc -l | tr -d ' ')
  if [ "$UNTRACKED" = "0" ]; then
    echo -e "  ${G}[ok]${NC} Working tree temiz (0 değişiklik)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${R}[fail]${NC} $UNTRACKED uncommitted dosya"
    git status --short | sed 's/^/    /'
    FAIL=$((FAIL + 1))
  fi
  echo

  # 2. TypeScript
  echo "${B}[2/8] TypeScript (frontend + server)${NC}"
  check "typecheck:web" "npm run typecheck:web --silent"
  check "typecheck:server" "npm run typecheck:server --silent"
  echo

  # 3. Lint
  echo "${B}[3/8] ESLint${NC}"
  check "lint" "npm run lint --silent"
  echo

  # 4. Test (unit)
  echo "${B}[4/8] Vitest unit${NC}"
  check "test --run" "npm test --silent -- --run"
  echo

  # 5. QA parity
  echo "${B}[5/8] Content QA${NC}"
  warn_check "qa:parity" "npm run qa:parity --silent"
  warn_check "qa:missing" "npm run qa:missing --silent"
  echo

  # 6. Build
  echo "${B}[6/8] Production build${NC}"
  rm -rf dist
  if npm run build > "outputs/deploy-build-$TS.log" 2>&1; then
    echo -e "  ${G}[ok]${NC} npm run build başarılı"
    PASS=$((PASS + 1))
    # dist artefakt'ları
    for f in dist/index.html dist/sitemap.xml dist/sitemap-en.xml dist/sitemap-tr.xml dist/rss.xml dist/og-image.jpg; do
      if [ -f "$f" ]; then
        echo -e "    ${G}[ok]${NC} $f var ($(stat -c '%s' "$f" 2>/dev/null || stat -f '%z' "$f" 2>/dev/null) bytes)"
      else
        echo -e "    ${R}[fail]${NC} $f eksik"
        FAIL=$((FAIL + 1))
      fi
    done
  else
    echo -e "  ${R}[fail]${NC} build başarısız — outputs/deploy-build-$TS.log son 30 satır:"
    tail -30 "outputs/deploy-build-$TS.log" | sed 's/^/      /'
    FAIL=$((FAIL + 1))
    echo
    echo "${R}DURDU — build geçmeden deploy edilemez.${NC}"
    exit 1
  fi
  echo

  # 7. Preview + smoke
  echo "${B}[7/8] Preview server + smoke${NC}"
  npm run preview > "outputs/deploy-preview-$TS.log" 2>&1 &
  PREVIEW_PID=$!
  for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    if curl -fsS "http://localhost:4173/" > /dev/null 2>&1; then
      echo -e "  ${G}[ok]${NC} preview ready"
      break
    fi
    [ "$i" = "10" ] && { echo -e "  ${R}[fail]${NC} preview boot fail"; FAIL=$((FAIL + 1)); exit 1; }
  done

  for path in / /services /pricing /case-studies /blog /contact /sitemap.xml /rss.xml /og-image.jpg; do
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4173$path")
    if [ "$HTTP" = "200" ]; then
      echo -e "    ${G}[200]${NC} $path"
      PASS=$((PASS + 1))
    else
      echo -e "    ${R}[$HTTP]${NC} $path"
      FAIL=$((FAIL + 1))
    fi
  done
  echo

  # 8. Lighthouse hızlı bakış (sadece LandingPage)
  echo "${B}[8/8] Lighthouse — LandingPage hızlı sanity${NC}"
  if [ -f scripts/lh-5run.mjs ]; then
    if node scripts/lh-5run.mjs --runs 1 --pages LandingPage --label "deploy-precheck-$TS" > "outputs/deploy-lh-$TS.log" 2>&1; then
      SUMMARY=$(ls -td outputs/lh-deploy-precheck-$TS-*/summary.md 2>/dev/null | head -1)
      if [ -n "$SUMMARY" ]; then
        grep -E "LandingPage" "$SUMMARY" | head -2
        PERF=$(grep "^| LandingPage" "$SUMMARY" | awk -F'|' '{gsub(/ /,"",$3); print $3}')
        if [ -n "$PERF" ] && [ "$PERF" -ge 60 ]; then
          echo -e "  ${G}[ok]${NC} LandingPage Perf $PERF (≥60 minimum)"
          PASS=$((PASS + 1))
        else
          echo -e "  ${Y}[warn]${NC} LandingPage Perf $PERF (<60 minimum) — publish öncesi P8 öneriliyor"
          WARN=$((WARN + 1))
        fi
      fi
    else
      echo -e "  ${Y}[warn]${NC} Lighthouse koşusu hatalı — outputs/deploy-lh-$TS.log"
      WARN=$((WARN + 1))
    fi
  else
    echo -e "  ${Y}[warn]${NC} scripts/lh-5run.mjs yok — skip"
    WARN=$((WARN + 1))
  fi
  echo

  # 9. Env şablonu
  echo "${B}[9/9] Production env şablonu${NC}"
  if [ -f .env.production.example ]; then
    echo -e "  ${G}[ok]${NC} .env.production.example var — gerçek .env.production'a kopyala ve doldur"
    PASS=$((PASS + 1))
  else
    echo -e "  ${R}[fail]${NC} .env.production.example yok"
    FAIL=$((FAIL + 1))
  fi
  if [ -f .env.production ]; then
    echo -e "  ${G}[ok]${NC} .env.production mevcut (deploy hedefine yüklenmek üzere)"
  else
    echo -e "  ${Y}[warn]${NC} .env.production yok — .example'dan kopyala ve gerçek değerlerle doldur"
    WARN=$((WARN + 1))
  fi
  echo

  # Özet
  echo "================================================================"
  echo "  ÖZET"
  echo "================================================================"
  echo -e "  ${G}PASS:${NC} $PASS"
  echo -e "  ${Y}WARN:${NC} $WARN"
  echo -e "  ${R}FAIL:${NC} $FAIL"
  echo
  if [ "$FAIL" = "0" ]; then
    echo -e "  ${G}>>> Deploy edilebilir.${NC} outputs/DEPLOY_BRIDGE.md'deki sıralamayı takip et."
    EXIT_CODE=0
  else
    echo -e "  ${R}>>> $FAIL blocker var. Deploy etmeden önce çöz.${NC}"
    EXIT_CODE=1
  fi
  echo
  echo "Log: $LOG"

  exit $EXIT_CODE
} 2>&1 | tee "$LOG"

cp "$LOG" "$DONE"
