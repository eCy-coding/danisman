# EcyPro — Ollama Model Rehberi & Görev Matrisi
# Sistem: Apple Silicon M-series, 48GB RAM, 16 çekirdek
# ─────────────────────────────────────────────────────────

## Mevcut Model Envanteri

| Model | Boyut | Sıcaklık | Kullanım Alanı |
|-------|-------|----------|----------------|
| `ecycode-orchestrator:latest` | 42 GB | 0.4 | Tüm görev koordinasyonu |
| `qwen2.5-coder:32b` | 19 GB | 0.2 | Üst kalite kod üretimi |
| `ecycode-code-editor:latest` | 9 GB | 0.2 | Kod düzenleme, refactor |
| `qwen2.5-coder:14b` | 9 GB | 0.2 | Dengeli kod görevi |
| `ecycode-math:latest` | 9.1 GB | 0.1 | Matematiksel analiz |
| `phi4:latest` | 9.1 GB | 0.2 | Genel amaçlı |
| `gemma4:e2b` | 7.2 GB | 0.2 | Kullanıcı tercihi (istek2.txt) |
| `ecycode-self-improvement:latest` | 6.6 GB | 0.3 | Öz-iyileştirme, meta-analiz |
| `qwen2.5-coder:7b` | 4.7 GB | 0.2 | Hızlı kod üretimi |
| `deepseek-r1:8b` | 5.2 GB | 0.1 | Derin muhakeme, planlama |
| `qwen2.5-coder:3b` | 1.9 GB | 0.2 | Ultra hızlı tamamlama |

## Görev → Model Haritası

```bash
# Mimari kararlar, büyük refactor
npm run ollama -- -m ecycode-orchestrator:latest -t orchestrate

# TypeScript bileşen yazımı, React hooks
npm run ollama -- -m qwen2.5-coder:32b -t code

# Hızlı düzeltme, küçük değişiklik
npm run ollama -- -m qwen2.5-coder:14b -t code

# Performans hesapları, algoritma analizi
npm run ollama -- -m ecycode-math:latest -t math

# E2E test yazımı
npm run ollama -- -m qwen2.5-coder:14b -t code

# Prompt mühendisliği, içerik üretimi
npm run ollama -- -m phi4:latest -t creative
```

## Otomatik Model Seçimi Mantığı (scripts/ollama-launch.sh)

```
RAM 48GB → Safe RAM ~38GB

Öncelik sırası:
1. ecycode-orchestrator (42GB) — 42 > 38 → ATLA
2. qwen2.5-coder:32b (19GB)   — 19 ≤ 38 → SEÇ ✅

Görev = code → OLLAMA_TEMPERATURE=0.2
```

## Optimum Ayarlar

```bash
# Kod üretimi için düşük sıcaklık (deterministik)
OLLAMA_TEMPERATURE=0.2   # TypeScript, React bileşenleri

# Matematiksel analiz için çok düşük
OLLAMA_TEMPERATURE=0.1   # Hesaplamalar, algoritmalar

# Orkestrasyonda biraz daha esnek
OLLAMA_TEMPERATURE=0.4   # Planlama, koordinasyon

# İçerik üretimi için daha yaratıcı
OLLAMA_TEMPERATURE=0.7   # Blog yazıları, pazarlama
```

## Claude Code Entegrasyon Ortam Değişkenleri

```bash
export ANTHROPIC_BASE_URL="http://localhost:11434/v1"
export ANTHROPIC_API_KEY="ollama"
export ANTHROPIC_MODEL="qwen2.5-coder:32b"
export CLAUDE_CODE_SUBAGENT_MODEL="qwen2.5-coder:14b"
export OLLAMA_TEMPERATURE=0.2
export CLAUDE_CODE_SKIP_PROJECT_SETTINGS=1
export CLAUDE_CODE_USE_SYSTEM_PROMPT=1
```
