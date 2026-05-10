---
description: /model — Görev tipine göre AI model seçim matrisi
---

# /model [görev_tipi]

**istek4.txt:** "Planlamayı opus → Kodlamayı sonnet"
prompts2/03-ollama-model-guide.md + prompts2/10-ai-agent-orchestration.md tabanlı.

## Model Seçim Matrisi

| Görev | Claude Model | Ollama Alternatif | Sıcaklık |
|-------|-------------|-------------------|----------|
| Stratejik planlama (/ultrathink, /plan) | claude-opus-4 | ecycode-orchestrator | 0.4 |
| Feature implementation (/implement) | claude-sonnet-4 | qwen2.5-coder:32b | 0.2 |
| Bug fix (/fix) | claude-sonnet-4 | qwen2.5-coder:32b | 0.2 |
| Kod inceleme (/review) | claude-sonnet-4 | qwen2.5-coder:14b | 0.2 |
| Test yazımı (/test-gen) | claude-sonnet-4 | qwen2.5-coder:14b | 0.2 |
| Matematiksel analiz | claude-opus-4 | ecycode-math | 0.1 |
| Dokümantasyon | claude-haiku-4 | phi4:latest | 0.3 |
| Hızlı tamamlama | claude-haiku-4 | qwen2.5-coder:3b | 0.2 |
| Güvenlik audit | claude-opus-4 | qwen2.5-coder:32b | 0.2 |
| i18n / çeviri | claude-haiku-4 | phi4:latest | 0.3 |

## Ollama ile Claude Code başlatma

```bash
# Planlama (Opus-seviye):
MY_MODEL="ecycode-orchestrator:latest"
ANTHROPIC_BASE_URL="http://localhost:11434/v1" ANTHROPIC_API_KEY="ollama" \
ANTHROPIC_MODEL="$MY_MODEL" claude

# Kodlama (Sonnet-seviye):
MY_MODEL="qwen2.5-coder:32b"
ANTHROPIC_BASE_URL="http://localhost:11434/v1" ANTHROPIC_API_KEY="ollama" \
ANTHROPIC_MODEL="$MY_MODEL" OLLAMA_TEMPERATURE=0.2 claude
```

## Cascad'te auto-model kuralı

Her işlemde:
- Görev = planlama/analiz/mimari → Opus mindset (derin, çok-boyutlu)
- Görev = kod yazma/düzenleme → Sonnet mindset (cerrahi, minimal)
- Görev = hızlı bilgi → Haiku mindset (kısa, özlü)

## Notlar
- TOKEN ZERO kuralı: smart_router.py üzerinden git
- Referans: prompts2/03-ollama-model-guide.md
- Referans: scripts/ollama-launch.sh
