---
description: Yeni roadmap phase başlat — checklist + SwarmBus kayıt
---

# /phase-start [phase_no]

Örn: `/phase-start 32` → P32 Keyword Strategy başlat.

## Adım 1: Phase dosyasını oku

// turbo
```bash
cat brain/roadmap/roadmap_20.md   # P32 için
# roadmap_10.md=P31, 20=P32, 30=P33, 40=P34, 50=P35, 60=P36, 70=P37, 80=P38, 90=P39, 100=P40
```

## Adım 2: Tüm ⬜ todo'ları listele

// turbo
```bash
grep -n "⬜" brain/roadmap/roadmap_20.md
```

## Adım 3: Phase kapatma kriterlerini oku

```bash
grep -A 15 "Phase.*Kapatma" brain/roadmap/roadmap_20.md
```

## Adım 4: Önceki phase tamamlandı mı?

```bash
t=$(grep -c "✅" brain/roadmap/roadmap_10.md); echo "P31: $t/10 tamamlandı"
```

Tier 1 prensibi: P31 tamamlanmadan P32'ye ciddi yatırım yapma.

## Adım 5: İlk todo'yu /ultrathink ile analiz et

Phase'ın ilk ⬜ görevini okuduktan sonra:
→ /ultrathink [görev] ile ICE scoring yap
→ /implement ile uygula
→ roadmap.md'de `⬜` → `✅` işaretle

## Adım 6: Phase tamamlanınca

```bash
git tag phase-[no]-closed
# brain/memory.md'ye phase closure bloğu ekle
```

## Notlar
- roadmap_100.md Tier sırası zorunlu
- Her phase: 10 todo × ortalama 2-4 saat = 20-40 saat
- Referans: docs/prompts/10-ai-agent-orchestration.md
