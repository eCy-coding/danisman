---
description: Brain/memory sync — kalıcı proje hafızasını güncelle
allowed-tools: Read, Edit, Bash, Glob
---

# /memory-sync $ARGUMENTS

brain/memory.md ile proje durumunu senkronize et.

1. `cat brain/memory.md | head -40` — mevcut durumu oku
2. Roadmap status: `grep -c "✅" brain/roadmap/roadmap_10.md brain/roadmap/roadmap_20.md brain/roadmap/roadmap_30.md`
3. Son commit: `git log --oneline -5`
4. brain/memory.md'ye ekle: $ARGUMENTS (phase closure, milestone, önemli karar)

Format:
```markdown
## [Tarih] — [Milestone]
- **Tamamlanan:** [liste]
- **Doğrulama:** typecheck ✅ lint ✅ test X/X ✅
- **Sonraki:** [görev]
```

5. brain/skills.md güncel mi? `cat brain/skills.md | head -20`
6. prompts2/ ile sync: yeni pattern var mı?

Kural: Her phase closure sonrası 1 memory güncellemesi zorunlu (istek1.txt Kural 7).
Referans: prompts2/01-system-master.md, prompts2/10-ai-agent-orchestration.md
