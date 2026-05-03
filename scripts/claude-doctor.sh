#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# EcyPro × Claude Code — Health Check (doctor)
#
# Çıkış kodları:
#   0 — Her şey yolunda.
#   1 — Konfig eksik (CLAUDE.md, .claude/settings.json, API key).
#   2 — Binary eksik (claude PATH'te yok).
#   3 — Node sürümü uyumsuz (< 22).
#
# Kullanım:
#   bash scripts/claude-doctor.sh
#   npm run claude:doctor
# ─────────────────────────────────────────────────────────────────────────────

set -uo pipefail
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

ok()    { printf '  %s✓%s %s\n' "${C_GREEN}" "${C_RESET}" "$*"; }
warn()  { printf '  %s!%s %s\n' "${C_YELLOW}" "${C_RESET}" "$*"; }
err()   { printf '  %s✗%s %s\n' "${C_RED}" "${C_RESET}" "$*"; }
hdr()   { printf '\n%s%s%s\n' "${C_BOLD}${C_BLUE}" "$*" "${C_RESET}"; }

EXIT_CODE=0
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

printf '%sEcyPro × Claude Code — Doctor%s\n' "${C_BOLD}" "${C_RESET}"
printf 'Proje kökü: %s\n' "${PROJECT_ROOT}"

# ── 1. Binary kontrolü ─────────────────────────────────────────────────────
hdr "1) Claude Code CLI"
if command -v claude >/dev/null 2>&1; then
  VER="$(claude --version 2>/dev/null || echo 'unknown')"
  ok "claude bulundu — ${C_BOLD}${VER}${C_RESET}"
  ok "Yol: $(command -v claude)"
else
  err "claude PATH'te bulunamadı."
  warn "Çözüm: ${C_BOLD}npm run claude:install${C_RESET}"
  EXIT_CODE=2
fi

# ── 2. Node sürümü ─────────────────────────────────────────────────────────
hdr "2) Node.js sürümü (>= 22)"
if command -v node >/dev/null 2>&1; then
  NODE_VER="$(node --version 2>/dev/null | sed 's/^v//')"
  NODE_MAJOR="${NODE_VER%%.*}"
  if [[ -n "${NODE_MAJOR}" ]] && [[ "${NODE_MAJOR}" -ge 22 ]]; then
    ok "node v${NODE_VER}"
  else
    err "node v${NODE_VER} (>= 22 gerekli)"
    [[ "${EXIT_CODE}" -lt 3 ]] && EXIT_CODE=3
  fi
else
  err "node bulunamadı."
  [[ "${EXIT_CODE}" -lt 3 ]] && EXIT_CODE=3
fi

# ── 3. Kimlik doğrulama (API key veya credentials) ─────────────────────────
hdr "3) Kimlik doğrulama"
AUTH_OK=0
if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
  KEY_LEN="${#ANTHROPIC_API_KEY}"
  ok "ANTHROPIC_API_KEY ortam değişkeni mevcut (${KEY_LEN} karakter)"
  AUTH_OK=1
fi
if [[ -f "${HOME}/.claude/credentials.json" ]] || [[ -f "${HOME}/.claude/.credentials.json" ]]; then
  ok "Yerel credentials dosyası mevcut (~/.claude/)"
  AUTH_OK=1
fi
if [[ "${AUTH_OK}" -eq 0 ]]; then
  warn "Kimlik bilgisi bulunamadı."
  warn "Seçenek 1: ${C_BOLD}export ANTHROPIC_API_KEY=\"sk-…\"${C_RESET}"
  warn "Seçenek 2: ${C_BOLD}claude${C_RESET} → interaktif login (OAuth)"
  [[ "${EXIT_CODE}" -lt 1 ]] && EXIT_CODE=1
fi

# ── 4. Proje konfigürasyonu ────────────────────────────────────────────────
hdr "4) Proje konfigürasyonu"
[[ -f "${PROJECT_ROOT}/CLAUDE.md" ]] \
  && ok "CLAUDE.md mevcut" \
  || { err "CLAUDE.md eksik"; [[ "${EXIT_CODE}" -lt 1 ]] && EXIT_CODE=1; }

[[ -f "${PROJECT_ROOT}/.claude/settings.json" ]] \
  && ok ".claude/settings.json mevcut" \
  || { err ".claude/settings.json eksik"; [[ "${EXIT_CODE}" -lt 1 ]] && EXIT_CODE=1; }

if [[ -d "${PROJECT_ROOT}/.claude/commands" ]]; then
  CMD_COUNT="$(find "${PROJECT_ROOT}/.claude/commands" -maxdepth 1 -type f -name '*.md' | wc -l | tr -d ' ')"
  ok ".claude/commands/ mevcut (${CMD_COUNT} slash komut)"
else
  warn ".claude/commands/ dizini yok — slash komutlar kullanılamaz."
fi

# ── 5. Mevcut zincir (lefthook + gitleaks) bilgi amaçlı ────────────────────
hdr "5) Çevre (bilgi amaçlı)"
if command -v git >/dev/null 2>&1 && git -C "${PROJECT_ROOT}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  ok "git deposu aktif"
else
  warn "git deposu tespit edilemedi"
fi

if [[ -f "${PROJECT_ROOT}/lefthook.yml" ]]; then
  ok "lefthook.yml mevcut (pre-commit + gitleaks zinciri aktif)"
fi

if [[ -f "${PROJECT_ROOT}/package.json" ]]; then
  ok "package.json mevcut"
fi

# ── 6. Özet ───────────────────────────────────────────────────────────────
hdr "Özet"
case "${EXIT_CODE}" in
  0) printf '  %s✓ Her şey yolunda.%s\n' "${C_GREEN}${C_BOLD}" "${C_RESET}" ;;
  1) printf '  %s! Konfig eksik — yukarıdaki uyarıları gider.%s\n' "${C_YELLOW}${C_BOLD}" "${C_RESET}" ;;
  2) printf '  %s✗ Binary eksik — npm run claude:install çalıştır.%s\n' "${C_RED}${C_BOLD}" "${C_RESET}" ;;
  3) printf '  %s✗ Node sürümü uyumsuz — Node 22+ kur.%s\n' "${C_RED}${C_BOLD}" "${C_RESET}" ;;
esac

exit "${EXIT_CODE}"
