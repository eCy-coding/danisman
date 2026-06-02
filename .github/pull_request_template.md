<!--
eCyPro PR Template
Adoption path: .github/PULL_REQUEST_TEMPLATE.md
Authority: protocols/AI_COORDINATION_PROTOCOL_v1.md §3 (7-step canonical) + DoD #24 NotebookLM Consensus
Lexicon: Aday/Süreç/Anlaşma canonical. "Müşteri/Lead" YASAK.
git push --no-verify YASAK. git push --force YASAK.
-->

## Özet (TR)

<!-- Tek paragraf, 2-3 cümle. Aday/Süreç/Anlaşma terminolojisi. -->

## Summary (EN)

<!-- 2-3 sentences. -->

## Atomic spec reference

- ROADMAP: `sprint-11-12/ROADMAP_2026_06_02.md` § __
- Atomic ID: S__.A__
- BUILD_MANIFEST: §__

## Değişiklik tipi

- [ ] feat — yeni yetenek
- [ ] fix — hata düzeltme
- [ ] refactor — davranış değişmedi
- [ ] perf — performans iyileştirme
- [ ] docs — sadece dokümantasyon
- [ ] test — sadece test
- [ ] chore — bağımlılık / CI / yapı
- [ ] security — KVKK / GDPR / PII

## 7-step canonical (protocols §3)

- [ ] 1. Plan modu (READ-ONLY, atomic spec netleşti)
- [ ] 2. NotebookLM consensus (vault citation veya `DEFERRED — RESOURCE_EXHAUSTED YYYY-MM-DD`)
- [ ] 3. Code mode (lefthook pre-commit yeşil)
- [ ] 4. Vitest +N delta (baseline ~1909)
- [ ] 5. Playwright smoke (etkilenen kategori)
- [ ] 6. PR body bu şablon ile dolu
- [ ] 7. CI yeşil, push standart kanaldan

## DoD checklist

- [ ] Typecheck (`pnpm typecheck`) yeşil
- [ ] Lint + Prettier yeşil
- [ ] Vitest tüm paketler yeşil, delta belirtildi: `__`
- [ ] Playwright smoke etkilenen kategori yeşil
- [ ] axe-core 4 critical route regresyon yok
- [ ] Sentry PII fixture yeşil (KVKK gate)
- [ ] PostHog opt-out-default davranışı bozulmadı
- [ ] Lexicon (Aday/Süreç/Anlaşma) ihlali yok
- [ ] CHANGELOG / changeset eklendi
- [ ] Dokümantasyon güncellendi (gerekiyorsa)

## NotebookLM Consensus

<!-- ZORUNLU. Format: -->
<!-- "NotebookLM consensus on YYYY-MM-DD: <vault-name> notebook + <vault-name> notebook → consensus on <decision>." -->
<!-- veya quota durumunda: -->
<!-- "DEFERRED — NotebookLM RESOURCE_EXHAUSTED YYYY-MM-DD. Fallback: memory + closed-track citation." -->

```
<NotebookLM consensus statement>
```

## KVKK / Güvenlik etkisi

- [ ] PII alanı eklendi veya kaldırıldı (sentry/posthog scrub etkilendi mi?)
- [ ] Yeni dış servis çağrısı (KVKK m.9 yurt dışı aktarım?)
- [ ] Yeni cookie / localStorage / sessionStorage anahtarı (consent gate?)
- [ ] Yeni log alanı (Better Stack quota / PII?)
- [ ] Secret eklendi → `SECRETS_INVENTORY.md` güncellendi

## Test kanıtı

<!-- Komut çıktısı + ekran görüntüsü -->

```bash
pnpm test
pnpm playwright test e2e/smoke/<category>
```

## Rollback planı

<!-- Tek-cümle: revert nasıl çalışır, etki nedir, kaç dakika sürer. -->

## Cross-link

- launch-readiness: `__`
- owner-manual: `__`
- protocols: `__`

---

**Sözlü taahhüt:** Bu PR `git push --no-verify` veya `--force` kullanmadan açıldı. Standardı bozmadım.
