---
description: Mevcut publish phase (1-17) durumunu özetle.
allowed-tools: Read(brain/**), Read(docs/**), Bash(git log -n *), Bash(git status)
---

# /phase-status

Publish hazırlık fazlarının (1-17) mevcut durumunu raporla.

Adımlar:

1. `brain/PUBLISH_MASTER_PLAN.md` oku — tüm phase tanımlarını çıkar.
2. `brain/FINAL_PUBLISH_ROADMAP.md` oku — ilerleme notlarını çıkar.
3. `brain/memory.md` ve `brain/skills.md` oku — son durum.
4. `git log -n 20 --oneline` → son 20 commit'ten phase tag'leri tespit et (`Phase X:`, `phase-X-`).
5. `docs/E2E_ANALYSIS.md`, `docs/E2E_FAILURES.md` → açık E2E sorunları.

Çıktı formatı:

```
Phase 1  [✓] tamamlandı
Phase 2  [✓] tamamlandı
…
Phase 7  [→] aktif      → açık iş: <madde>
Phase 8  [ ] pending
Phase 17 [ ] pending
```

Sonra:
- Sıradaki önerilen adımı tek paragrafta belirt.
- Açık blocker varsa kırmızı bayrakla işaretle.
- Kullanıcıya sor: "Phase X'e başlayalım mı?"
