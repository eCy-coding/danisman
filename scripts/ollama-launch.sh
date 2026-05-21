#!/usr/bin/env bash
# ============================================================
# eCyPro — Ollama + Claude Code Akıllı Başlatıcı
# Sistem RAM'ini ve mevcut modelleri analiz ederek
# otomatik olarak en uygun modeli seçer.
# ============================================================
set -euo pipefail

# ── Renkler ──────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
die()     { echo -e "${RED}[ERROR]${RESET} $*" >&2; exit 1; }

# ── Ortam Değişkenleri ────────────────────────────────────
export OLLAMA_TEMPERATURE="${OLLAMA_TEMPERATURE:-0.2}"
export ANTHROPIC_BASE_URL="http://localhost:11434/v1"
export ANTHROPIC_API_KEY="ollama"
export CLAUDE_CODE_SKIP_PROJECT_SETTINGS=1
export CLAUDE_CODE_USE_SYSTEM_PROMPT=1
export ANTHROPIC_CUSTOM_PROMPT="
You are an elite AI software engineer running inside Claude Code for the eCyPro Premium Consulting project.
Rules:
- Always inspect the repository before making changes.
- Use file reading tools to understand context before coding.
- Prefer editing existing files over creating new ones.
- Never hallucinate APIs or library methods — verify first.
- Explain which files you will modify before writing code.
- Write clean, type-safe, production-ready TypeScript/React.
- Follow the project's Tailwind v4 utility class conventions.
- Respect existing design system tokens (primary, secondary, neutral).
- Run typecheck and lint mentally before proposing changes.
- Reference brain/memory.md for project history and decisions.
"

# ── RAM Tespiti (macOS) ───────────────────────────────────
detect_ram_gb() {
  local bytes
  bytes=$(sysctl -n hw.memsize 2>/dev/null || echo 0)
  echo $(( bytes / 1073741824 ))
}

# ── En İyi Model Seçimi ───────────────────────────────────
# Öncelik: kod kalitesi > hız > boyut
# Güvenli eşik: mevcut RAM'in %80'i
select_best_model() {
  local ram_gb="$1"
  local available
  available=$(ollama list 2>/dev/null | awk 'NR>1 {print $1}')

  # Kod kalitesi için öncelikli model listesi (büyük→küçük)
  local candidates=(
    "ecycode-orchestrator:latest"  # özel oluşturulmuş, 42 GB
    "qwen2.5-coder:32b"            # en kaliteli kod, 19 GB
    "qwen2.5-coder:14b"            # dengeli, 9 GB
    "ecycode-code-editor:latest"   # özel, 9 GB
    "ecycode-math:latest"          # matematik/analiz, 9.1 GB
    "phi4:latest"                  # Microsoft Phi-4, 9.1 GB
    "qwen2.5-coder:7b"             # hızlı, 4.7 GB
    "gemma4:e2b"                   # kullanıcı tercihi, 7.2 GB
    "ecycode-self-improvement:latest" # öz-geliştirme, 6.6 GB
    "qwen2.5-coder:3b"             # ultra hızlı, 1.9 GB
    "qwen2.5-coder:0.5b"           # minimal, 397 MB
  )

  # Boyut eşikleri (GB)
  declare -A MODEL_SIZE=(
    ["ecycode-orchestrator:latest"]=44
    ["qwen2.5-coder:32b"]=21
    ["qwen2.5-coder:14b"]=10
    ["ecycode-code-editor:latest"]=10
    ["ecycode-math:latest"]=10
    ["phi4:latest"]=10
    ["qwen2.5-coder:7b"]=6
    ["gemma4:e2b"]=8
    ["ecycode-self-improvement:latest"]=8
    ["qwen2.5-coder:3b"]=3
    ["qwen2.5-coder:0.5b"]=1
  )

  local safe_ram=$(( ram_gb * 80 / 100 ))

  for model in "${candidates[@]}"; do
    local size="${MODEL_SIZE[$model]:-99}"
    if echo "$available" | grep -qx "$model" && (( size <= safe_ram )); then
      echo "$model"
      return
    fi
  done

  # Fallback: ilk mevcut model
  echo "$available" | head -1
}

# ── Kullanım Bilgisi ──────────────────────────────────────
usage() {
  cat <<USAGE
${BOLD}eCyPro Ollama Başlatıcı${RESET}

Kullanım:
  $(basename "$0") [SEÇENEKLER]

Seçenekler:
  -m, --model MODEL    Spesifik model adını belirt
  -t, --task GÖREV     Görev türü: code | math | search | orchestrate
  -l, --list           Mevcut modelleri listele
  -h, --help           Bu yardım metnini göster

Örnekler:
  $(basename "$0")                        # Otomatik en iyi modeli seç
  $(basename "$0") -m qwen2.5-coder:32b  # Belirli model
  $(basename "$0") -t code               # Kod görevi için optimize et
  $(basename "$0") --list                # Model listesi
USAGE
  exit 0
}

# ── Argüman Ayrıştırıcı ───────────────────────────────────
FORCED_MODEL=""
TASK_TYPE="code"

while [[ $# -gt 0 ]]; do
  case $1 in
    -m|--model)    FORCED_MODEL="$2"; shift 2 ;;
    -t|--task)     TASK_TYPE="$2";    shift 2 ;;
    -l|--list)
      info "Mevcut Ollama Modelleri:"
      ollama list
      exit 0
      ;;
    -h|--help)     usage ;;
    *)             warn "Bilinmeyen argüman: $1"; shift ;;
  esac
done

# ── Görev Bazlı Sıcaklık Ayarı ───────────────────────────
case "$TASK_TYPE" in
  code)       export OLLAMA_TEMPERATURE=0.2  ;;
  math)       export OLLAMA_TEMPERATURE=0.1  ;;
  search)     export OLLAMA_TEMPERATURE=0.3  ;;
  orchestrate) export OLLAMA_TEMPERATURE=0.4 ;;
  creative)   export OLLAMA_TEMPERATURE=0.7  ;;
esac

# ── Ana Akış ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   eCyPro × Ollama × Claude Code      ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════╝${RESET}"
echo ""

# 1. Ollama kontrolü
if ! command -v ollama &>/dev/null; then
  die "Ollama kurulu değil. Kurmak için: brew install ollama"
fi
success "Ollama bulundu: $(which ollama)"

# 2. Ollama servisini başlat (gerekirse)
if ! curl -sf http://localhost:11434/api/tags &>/dev/null; then
  info "Ollama servisi başlatılıyor..."
  ollama serve &>/dev/null &
  OLLAMA_PID=$!
  sleep 3
  if curl -sf http://localhost:11434/api/tags &>/dev/null; then
    success "Ollama servisi başlatıldı (PID: $OLLAMA_PID)"
  else
    die "Ollama servisi başlatılamadı"
  fi
else
  success "Ollama servisi aktif"
fi

# 3. RAM tespit
RAM_GB=$(detect_ram_gb)
info "Sistem RAM: ${RAM_GB}GB"
info "Mimari: $(uname -m) | CPU: $(sysctl -n hw.ncpu) çekirdek"

# 4. Model seçimi
if [[ -n "$FORCED_MODEL" ]]; then
  SELECTED_MODEL="$FORCED_MODEL"
  info "Manuel model seçimi: $SELECTED_MODEL"
else
  SELECTED_MODEL=$(select_best_model "$RAM_GB")
  if [[ -z "$SELECTED_MODEL" ]]; then
    die "Uygun model bulunamadı. 'ollama pull qwen2.5-coder:7b' çalıştırın."
  fi
  success "Otomatik seçilen model: $SELECTED_MODEL"
fi

# 5. Modelin varlığını doğrula
if ! ollama list 2>/dev/null | grep -q "^${SELECTED_MODEL}"; then
  warn "Model bulunamadı, indiriliyor: $SELECTED_MODEL"
  ollama pull "$SELECTED_MODEL" || die "Model indirilemedi: $SELECTED_MODEL"
fi

# 6. Ortam değişkenlerini ayarla
export ANTHROPIC_MODEL="$SELECTED_MODEL"
export CLAUDE_CODE_SUBAGENT_MODEL="$SELECTED_MODEL"

# 7. Özet
echo ""
echo -e "  ${BOLD}Model       :${RESET} $SELECTED_MODEL"
echo -e "  ${BOLD}Sıcaklık    :${RESET} $OLLAMA_TEMPERATURE"
echo -e "  ${BOLD}Görev Türü  :${RESET} $TASK_TYPE"
echo -e "  ${BOLD}API Adresi  :${RESET} $ANTHROPIC_BASE_URL"
echo -e "  ${BOLD}RAM         :${RESET} ${RAM_GB}GB"
echo ""

# 8. Claude Code kontrolü
if ! command -v claude &>/dev/null; then
  warn "Claude Code CLI bulunamadı."
  warn "Kurmak için: npm install -g @anthropic-ai/claude-code"
  warn ""
  warn "Ortam değişkenleri ayarlandı. Manuel başlatmak için:"
  warn "  claude"
  exit 0
fi

success "Claude Code başlatılıyor..."
echo ""
exec claude
