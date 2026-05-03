---
description: Claude Code kurulum + konfig sağlık kontrolü
---

Claude Code CLI'ın bu projedeki sağlığını ölç.

## Adımlar

1. Doctor scripti çalıştır:
// turbo
```bash
npm run claude:doctor
```

2. Çıktıyı yorumla:
   - **Exit 0** — Her şey yolunda, raporu özetle ve dur.
   - **Exit 1** — Konfig eksik:
     - Eksik dosyaları tespit et (`CLAUDE.md`, `.claude/settings.json`).
     - `ANTHROPIC_API_KEY` veya `~/.claude/credentials.json` yoksa kullanıcıya login akışını öner.
   - **Exit 2** — Binary eksik → `/claude-install` workflow'una yönlendir.
   - **Exit 3** — Node sürümü < 22 → `nvm install 22 && nvm use 22` öner.

3. Detaylı rapor:
   - Binary versiyonu, yolu.
   - Auth durumu (env / credentials).
   - Konfig dosyaları (`CLAUDE.md`, `.claude/settings.json`, `.claude/commands/*.md` sayısı).
   - Çevre (git, lefthook, package.json).

4. Eğer her şey yolundaysa:
```bash
claude   # oturumu başlat
```
