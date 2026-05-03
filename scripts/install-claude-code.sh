#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# EcyPro × Claude Code — Idempotent Installer
#
# Resmî yöntem (native): curl -fsSL https://claude.ai/install.sh | bash
# Fallback (npm):        npm install -g @anthropic-ai/claude-code
#
# Özellikler:
#   - Idempotent: zaten yüklüyse exit 0.
#   - macOS + Linux desteği.
#   - Renkli, sessiz-fail-fast log.
#   - PATH ipucu (~/.local/bin veya ~/.claude/bin).
#
# Kullanım:
#   bash scripts/install-claude-code.sh
#   npm run claude:install
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail
umask 077

# ── Renkler ────────────────────────────────────────────────────────────────
if [[ -t 1 ]] && command -v tput >/dev/null 2>&1; then
  C_RESET="$(tput sgr0)"
  C_BOLD="$(tput bold)"
  C_GREEN="$(tput setaf 2)"
  C_YELLOW="$(tput setaf 3)"
  C_RED="$(tput setaf 1)"
  C_BLUE="$(tput setaf 4)"
else
  C_RESET=""; C_BOLD=""; C_GREEN=""; C_YELLOW=""; C_RED=""; C_BLUE=""
fi

log()   { printf '%s[claude-install]%s %s\n' "${C_BLUE}" "${C_RESET}" "$*"; }
ok()    { printf '%s[claude-install] ✓%s %s\n' "${C_GREEN}" "${C_RESET}" "$*"; }
warn()  { printf '%s[claude-install] !%s %s\n' "${C_YELLOW}" "${C_RESET}" "$*" >&2; }
fail()  { printf '%s[claude-install] ✗%s %s\n' "${C_RED}" "${C_RESET}" "$*" >&2; exit 1; }

# ── 0. Önkoşullar ──────────────────────────────────────────────────────────
require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Eksik araç: $1"
}
require_cmd uname

OS="$(uname -s)"
case "${OS}" in
  Darwin|Linux) ok "Desteklenen platform: ${OS}" ;;
  *) fail "Bu installer yalnızca macOS / Linux destekler. Tespit edilen: ${OS}" ;;
esac

# ── 1. Idempotent kontrol ──────────────────────────────────────────────────
if command -v claude >/dev/null 2>&1; then
  CURRENT_VER="$(claude --version 2>/dev/null || echo 'unknown')"
  ok "Claude Code zaten yüklü: ${C_BOLD}${CURRENT_VER}${C_RESET}"
  log "Güncellemek için: ${C_BOLD}npm run claude:update${C_RESET}"
  exit 0
fi

log "Claude Code yüklü değil — kuruluma başlanıyor…"

# ── 2. Birincil yol: native installer ──────────────────────────────────────
INSTALL_OK=0
if command -v curl >/dev/null 2>&1; then
  log "Yöntem 1/2: native installer (curl | bash)"
  if curl -fsSL --connect-timeout 15 --max-time 120 https://claude.ai/install.sh | bash; then
    INSTALL_OK=1
    ok "Native installer tamamlandı."
  else
    warn "Native installer başarısız. npm fallback denenecek."
  fi
else
  warn "curl bulunamadı → native installer atlanıyor."
fi

# ── 3. Fallback: npm global ────────────────────────────────────────────────
if [[ "${INSTALL_OK}" -eq 0 ]]; then
  if command -v npm >/dev/null 2>&1; then
    log "Yöntem 2/2: npm install -g @anthropic-ai/claude-code"
    if npm install -g @anthropic-ai/claude-code; then
      INSTALL_OK=1
      ok "npm global kurulumu tamamlandı."
    else
      fail "npm global kurulum da başarısız oldu. Manuel müdahale gerekli."
    fi
  else
    fail "Hem curl hem npm eksik. Önce Node.js + npm kurun (>= v22)."
  fi
fi

# ── 4. PATH doğrulama ──────────────────────────────────────────────────────
hash -r 2>/dev/null || true

if ! command -v claude >/dev/null 2>&1; then
  warn "Kurulum tamam fakat 'claude' PATH'te bulunamadı."
  cat <<EOF >&2

  Olası kurulum dizinleri:
    - \$HOME/.local/bin
    - \$HOME/.claude/bin
    - \$HOME/.npm-global/bin   (npm yoluyla yüklendiyse)

  Çözüm: shell rc dosyanıza (~/.zshrc, ~/.bashrc) ekleyin:
    export PATH="\$HOME/.local/bin:\$HOME/.claude/bin:\$PATH"

  Ardından yeni terminal açın ve şunu çalıştırın:
    npm run claude:doctor
EOF
  exit 1
fi

# ── 5. Sürüm raporu ────────────────────────────────────────────────────────
FINAL_VER="$(claude --version 2>/dev/null || echo 'unknown')"
ok "Kurulum başarılı: ${C_BOLD}${FINAL_VER}${C_RESET}"
log "Sağlık kontrolü: ${C_BOLD}npm run claude:doctor${C_RESET}"
log "Hızlı başlangıç:  ${C_BOLD}claude${C_RESET}  (ilk kullanımda login akışı tetiklenir)"

exit 0
