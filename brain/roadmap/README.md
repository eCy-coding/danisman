# EcyPro — 100-Todo Master Roadmap (Phase 31 → 40)

**Sürüm:** 1.0 | **Tarih:** 5 May 2026 | **Otorite:** Bir sonraki AI ajanı için tek hat yol haritası.

> Prompts klasörü dokunulmazdır (L0 kanon). Bu 10 dosyalık seri L4 canlı yol haritasıdır.

---

## 0. Sentez Çerçevesi

### 0.1 Girdi Katmanları

| Katman | Kaynak | Rolü | Dokunulabilir |
|--------|--------|------|----------------|
| **L0 Vizyon** | `prompts/` (5 dosya: `istek.txt`, `istek1.txt`, `istek2.txt`, `istek3.txt`, `publish.txt`) | Ham talepler (kanon) | **HAYIR** |
| **L1 Yapılandırılmış** | `prompts1/` (10) | `talep1-10.txt` kapatılmış aşamalar | Evet (durum) |
| **L2 Operasyonel** | `prompts2/` (10) | Prompt-engineering standartları | Evet |
| **L3 Hafıza** | `brain/` (6) | Kalıcı bağlam + audit | Evet (sync zorunlu) |
| **L4 Bu Seri** | `brain/roadmap/roadmap_*.md` (10 + README) | 100 önceliklendirilmiş aksiyon | Evet (canlı) |

### 0.2 Mevcut Durum Vektörü (5 May 2026)

```
KOD       : TS 0/0 · ESLint 0 · Vitest 29/29 · Build 41 URL · Playwright 285/285 ✅
LIGHTHOUSE: Performance 73 (lokal) · A11y 100 · BP 100 · SEO 100
TRAFİK    : Google index ❌ · GSC ❌ · GA4 ❌ · Backlink 0 ← KRİTİK GAP (istek3.txt)
İŞLETME   : Conversion tracking yok · ROI ölçülemez · Keyword stratejisi yok
```

### 0.3 Önceliklendirme Formülü (Matematiksel)

```
Skor = (Etki × Aciliyet × Stratejik_Mesafe) / Çaba

Etki       : 1-5  (kullanıcı / iş etkisi)
Aciliyet   : 1-5  (zaman duyarlılığı)
Stratejik  : 1-3  (istek3.txt'e yakın = 3)
Çaba       : 1-5  (mühendislik saati ölçeği)

Skor ≥ 6.0    → Tier 1 (Phase 31-33)  KRİTİK
Skor 3.0-5.9  → Tier 2 (Phase 34-37)  YÜKSEK
Skor 1.5-2.9  → Tier 3 (Phase 38-40)  ORTA
```

### 0.4 Phase × Dosya Eşleşmesi

| Dosya | Phase | Konu | Tier | Skor | Todo Aralığı |
|-------|-------|------|------|------|--------------|
| `roadmap_10.md`  | **31** | SEO + GSC/GA4 + Indexing | T1 | 12.0 | T01-T10 |
| `roadmap_20.md`  | **32** | Keyword Strategy + Content | T1 | 9.0 | T11-T20 |
| `roadmap_30.md`  | **33** | LCP + Performance ≥90 | T1 | 7.5 | T21-T30 |
| `roadmap_40.md`  | **34** | Conversion + Analytics | T2 | 5.4 | T31-T40 |
| `roadmap_50.md`  | **35** | Auth + Security Hardening | T2 | 5.0 | T41-T50 |
| `roadmap_60.md`  | **36** | Admin Panel + CMS | T2 | 4.2 | T51-T60 |
| `roadmap_70.md`  | **37** | Booking + Calendar | T2 | 3.6 | T61-T70 |
| `roadmap_80.md`  | **38** | Backlink + Authority | T3 | 2.8 | T71-T80 |
| `roadmap_90.md`  | **39** | i18n + International SEO | T3 | 2.4 | T81-T90 |
| `roadmap_100.md` | **40** | Observability + DevOps | T3 | 2.0 | T91-T100 |

### 0.5 Görev Şablonu (Her Todo)

```
P{faz}-T{##}: {Başlık}
- NEDEN  : Stratejik gerekçe — neden şimdi, neden böyle
- ÖNEM   : P0/P1/P2 + iş etkisi (revenue / SEO / risk)
- YÖNTEM : En verimli teknik (araştırma kaynağı dahil)
- TEST   : Komut + kabul kriteri (binary geçti/kaldı)
```

---

## 1. Kullanım Akışı

### Yeni AI Ajan Oturumu

```bash
# 1. Bağlam yükle
cat brain/roadmap/README.md
cat prompts2/01-system-master.md
cat brain/memory.md

# 2. Aktif phase belirle
#    İlk ⬜ pending todo = sıradaki görev
ls brain/roadmap/roadmap_*.md | head -3
# → roadmap_10.md (Phase 31, P31-T01'den başla)

# 3. Görev uygula
# Her todo için: NEDEN oku → YÖNTEM uygula → TEST doğrula → checkbox işaretle
```

### Kapatma Protokolü

Her todo tamamlandığında:
1. İlgili `roadmap_XX.md`'de `⬜` → `✅` güncelle
2. `brain/memory.md`'ye 1 cümlelik closure note ekle
3. Kod değişikliği varsa: `npm run typecheck && npm run lint && npm run test` yeşil olmalı
4. Commit mesajı: `feat(P{faz}-T{##}): {Başlık}` formatı

### Phase Kapatma

10 todo'nun hepsi ✅ olduğunda:
1. `roadmap_XX.md` başlığına `✅ TAMAMLANDI` etiketi
2. `brain/memory.md`'ye phase closure bloğu (FV matrisi dahil)
3. Tag: `git tag phase-{faz}-closed`
4. Bir sonraki `roadmap_XX.md`'ye geç

---

## 2. İstek3.txt Eşleştirme Tablosu (Arkadaş Tavsiyesi → Todo)

| İstek3 Tavsiyesi | Karşılık Todo | Dosya |
|------------------|---------------|-------|
| GSC + GA4 kurulumu | P31-T01, P31-T02 | `roadmap_10.md` |
| Site indexlenme | P31-T03, P31-T07, P31-T09 | `roadmap_10.md` |
| Sitemap + robots.txt | P31-T04 | `roadmap_10.md` |
| Backlink (LinkedIn, sektör dizinleri) | P38-T01, P38-T02 | `roadmap_80.md` |
| Görsel mobil LCP | P33-T01, P33-T02 | `roadmap_30.md` |
| Meta tag keyword (stratejik danışmanlık vb.) | P32-T02, P32-T03 | `roadmap_20.md` |
| Ahrefs/Semrush rakip analizi | P32-T01, P38-T10 | `roadmap_20.md`, `roadmap_80.md` |
| ROI aracı GA4 izleme | P31-T05, P34-T02 | `roadmap_10.md`, `roadmap_40.md` |
| Blog keyword içerikleri | P32-T05, P32-T10 | `roadmap_20.md` |

**Kritik Gözlem:** İstek3.txt'in **9/9** tavsiyesi bu 100 todo içinde somut aksiyona dönüştürüldü. Hiçbir tavsiye aksiyonsuz kalmadı.

---

## 3. İlişkili Dosyalar

- `brain/memory.md` — Proje kalıcı hafızası
- `brain/PUBLISH_MASTER_PLAN.md` — Ana yayın planı (Phase 1-30 tamamlandı)
- `brain/COMPETITIVE_AUDIT.md` — 10 rakip matrisi
- `prompts1/README.md` — Talep 1-10 kapatma özeti
- `prompts2/01-system-master.md` — Sistem promptu
- `CLAUDE.md` — Claude Code özel talimatları

---

## 4. İstatistik

- **Toplam Todo:** 100
- **Toplam Phase:** 10
- **P0 Önemli:** 18 (kritik bloker)
- **P1 Önemli:** 42 (yüksek etki)
- **P2 Önemli:** 40 (orta etki)
- **Tahmini Toplam Süre:** 10-12 hafta (1 mühendis, tam zamanlı)
- **Tier 1 (ilk 30):** 2-3 hafta — SEO/trafik üretimi kritik
- **Tier 2 (30-70):** 4-5 hafta — Conversion + operasyon
- **Tier 3 (70-100):** 3-4 hafta — Authority + ölçeklenme

**Son Güncelleme:** 5 Mayıs 2026 — Sentez + 100-todo üretim.
