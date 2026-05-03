---
description: Claude Code CLI'ı projeye kur (idempotent native + npm fallback)
---

Bu workflow Claude Code CLI'ı kullanıcının makinesine **idempotent** şekilde kurar. Zaten yüklüyse tekrar yüklemez.

## Adımlar

1. Mevcut yükleme kontrolü:
// turbo
```bash
command -v claude && claude --version || echo "claude bulunamadı — kurulum gerekli"
```

2. Idempotent installer'ı çalıştır:
```bash
npm run claude:install
```
> Bu komut `scripts/install-claude-code.sh` üzerinden:
> - Önce `curl -fsSL https://claude.ai/install.sh | bash` (native).
> - Native fail ederse `npm install -g @anthropic-ai/claude-code` (fallback).

3. Doğrulama:
// turbo
```bash
npm run claude:doctor
```

4. Çıktıdaki uyarılar/hatalara göre:
   - Exit 0 → Kurulum tamam, slash komutları kullanılabilir.
   - Exit 1 → Konfig eksik (CLAUDE.md, settings, API key).
   - Exit 2 → Binary PATH'te yok → `~/.local/bin` veya `~/.claude/bin` PATH'e ekle.
   - Exit 3 → Node 22+ kur.

5. İlk kullanım için kullanıcıya bildir:
```bash
claude   # interaktif, OAuth login akışı veya ANTHROPIC_API_KEY env var
```
