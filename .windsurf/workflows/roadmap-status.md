---
description: Roadmap durum raporu — tüm phase'ların tamamlanma yüzdesi
---

# /roadmap-status

10 phase × 100 todo — anlık durum özeti.

## Adım 1: Tüm phase durumu

// turbo
```bash
for f in brain/roadmap/roadmap_*.md; do
  phase=$(grep -m1 "^# Roadmap" "$f" | head -c 60)
  done=$(grep -c "✅" "$f" || echo 0)
  pending=$(grep -c "⬜" "$f" || echo 0)
  echo "[$done✅ / $((done+pending))todo] $phase"
done
```

## Adım 2: Aktif Tier 1 pending'ler

// turbo
```bash
grep -n "⬜" brain/roadmap/roadmap_10.md brain/roadmap/roadmap_20.md brain/roadmap/roadmap_30.md | head -15
```

## Adım 3: Blocking görev analizi

P31 (SEO/GSC) tamamlanmadan P32'ye geçme → roadmap_100.md "Tier 1 önce" kuralı:
```bash
t31=$(grep -c "✅" brain/roadmap/roadmap_10.md || echo 0)
echo "P31 tamamlanan: $t31/10"
```

## Adım 4: Sıradaki hedef

roadmap_100.md final matris:
```
Tier 1 (Kritik)  : Phase 31-33 | 30 todo | SEO + Keyword + Performance
Tier 2 (Yüksek)  : Phase 34-37 | 40 todo | Conversion + Security + Admin + Booking
Tier 3 (Orta)    : Phase 38-40 | 30 todo | Authority + i18n + DevOps
```

Önerilen başlangıç: roadmap_10.md T01 — GSC Property (15 dakika, max etki)

## Adım 5: 3-ay hedef metrikleri

roadmap_100.md başarı kriterleri:
- SEO: 41/41 sayfa indexed, 10+ keyword top-50, DA 25+
- Traffic: 500+ organic/month, 5+ bookings/month
- Performance: Lighthouse ≥90, LCP ≤2.0s
- Security: OWASP Top 10 zero critical

## Notlar
- brain/memory.md ile senkron tut
- Referans: prompts2/10-ai-agent-orchestration.md
