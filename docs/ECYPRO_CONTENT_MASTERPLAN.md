---
doc: ECYPRO_CONTENT_MASTERPLAN
title: "eCyPro.com — İçerik + SEO + GEO Master Plan ($1M-grade, TR/EN)"
source_path: /Users/emrecnyngmail.com/Desktop/ecypro
date: 2026-06-09
scope: "5 sektör + servis + blog + GEO/FAQ katmanı; TR + EN"
methodology: "1 internal content/SEO audit (Explore) + 2 WebSearch (GEO 2026, pillar/cluster SEO)"
language: "Türkçe (içerik örnekleri TR+EN; kod/şema İngilizce)"
goal: "Premium-tier ($1M-grade) içerik derinliği — pillar/cluster SEO + GEO citation + tam TR/EN parite"
target_net_new_words: 430000
status: PLAN (içerik üretimi onaydan sonraki ayrı adım)
sources:
  - https://www.enrichlabs.ai/blog/generative-engine-optimization-geo-complete-guide-2026
  - https://www.frase.io/blog/what-is-generative-engine-optimization-geo
  - https://www.brafton.com/blog/strategy/topic-cluster-content-strategy/
  - https://www.w3era.com/blog/seo/pillar-page-strategy-guide/
---

# eCyPro.com — İçerik + SEO + GEO Master Plan

> **Amaç:** eCyPro'yu içerik derinliği bakımından "$1M-grade" premium danışmanlık platformuna taşımak. Bu doküman **ne üretileceğini hesaplar** (sayfa/kelime/makale + efor + maliyet), **nasıl** (pillar/cluster SEO + GEO citation + humanizer) ve **hangi sırayla**. Gerçek içerik üretimi onaydan sonraki ayrı adımdır.
> **Tamamlayıcı dokümanlar:** yapı → `ECYPRO_SITE_CATEGORIZATION.md` · eksikler → `ECYPRO_PROJECT_GAPS.md`.

---

## 1. Yönetici Özeti

eCyPro'nun **SEO altyapısı güçlü** (7 schema tipi, hreflang tr/en/x-default, 5 sitemap, 4 sektör RSS) ama **içerik derinliği premium seviyenin altında**:
- 5 sektör sayfası **ince** (~450 kelime, landing-grade), thought-leadership yok.
- Blog **~%95 Türkçe** (49 yazıdan yalnız ~1 EN) → İngilizce pazar görünmez.
- **Pillar/cluster topical authority mimarisi yok**; içerik silo halinde.
- **FAQPage schema var ama sektör/servis sayfalarında kullanılmıyor** → GEO citation kaçırılıyor.

**Hedef:** ≈ **430.000 net-yeni kelime (TR+EN)** — 5 sektör pillar + ~35 cluster + 22 derin servis + EN rollout + GEO/FAQ katmanı. Beklenen etki: topical authority (12 ayda +%40 organik trafik), GEO citation (+%61 FAQPage etkisi), LLM-referred dönüşüm %5-16 (organik %1.76'ya karşı).

| Eksen | Mevcut | $1M-grade hedef |
|-------|--------|-----------------|
| Sektör sayfası | 5 × ~450 kelime (landing) | 5 pillar × 4.000 + 35 cluster × 2.000 |
| Dil paritesi | %95 TR / %5 EN | %100 TR + %100 EN (transcreation) |
| GEO katmanı | yok | answer-first + FAQPage schema her sayfada |
| Topical authority | silo | pillar↔cluster↔servis↔blog link grafiği |
| Freshness | düzensiz | <13 hafta cadence (GEO kritik) |

---

## 2. Mevcut Durum Skoru (kanıtlı)

| Varlık | Konum | Hacim | Skor |
|--------|-------|-------|------|
| Sektör sayfaları (5) | `src/pages/Sektorler*Page.tsx` | ~450 kelime/sayfa, inline JSX, TR+EN parite | 🟡 İnce |
| Servisler (22) | `src/data/services.ts` + `locales/*/services.json` | 100-200 karakter copy/servis | 🟡 Sığ |
| Blog (49) | `src/content/blog/*.mdx` | ~790 kelime ort, ~38.7k toplam, %95 TR | 🟠 TR-ağırlıklı |
| Case studies | `src/content/case-studies/` | 1 gerçek (atlas-freight) + loader kuruldu | 🟢 Altyapı hazır |
| Schema.org | `src/lib/structured-data.ts` | 7 tip (Org/Article/Service/FAQPage/Breadcrumb/AudioObject/CaseStudy) | 🟢 Güçlü |
| Hreflang/canonical | `src/components/seo/Hreflang.tsx`, `src/i18n/canonical.ts` | tr-TR/en/x-default | 🟢 Tam |
| Sitemap/RSS | `scripts/generate-sitemap.ts` | 5 sitemap + 4 sektör RSS | 🟢 Tam |
| FAQPage kullanımı | `buildFaqSchema()` mevcut | sektör/servis sayfalarında **wire EDİLMEMİŞ** | 🔴 Boş |
| Pillar/cluster | — | yok | 🔴 Yok |
| Keyword stratejisi | — | doküman yok (audit scriptleri var) | 🔴 Yok |

**Ana boşluklar:** (1) İngilizce içerik, (2) sektör derinliği, (3) GEO/FAQ katmanı, (4) topical authority mimarisi.

---

## 3. SEO Mimarisi — Pillar / Cluster

**Model ([Brafton](https://www.brafton.com/blog/strategy/topic-cluster-content-strategy/), [w3era](https://www.w3era.com/blog/seo/pillar-page-strategy-guide/)):** Her sektör = 1 **pillar** (3-5k kelime, top-funnel hub) + 6-8 **cluster** (1.5-2.5k, micro-intent). Cluster'lar pillar'a, pillar tüm cluster'lara link verir → link equity konsantrasyonu, topical authority (12 ayda +%40 trafik).

**Mimari (5 sektör):**
```
[Sektör Pillar 4k] ──┬── Cluster 1 (2k) ──┐
  /sektorler/<x>     ├── Cluster 2 (2k)   ├─→ ilgili Servis (/services/<id>)
  (genişletilmiş)    ├── ...              └─→ ilgili Blog (/blog/<slug>)
                     └── Cluster 6-8 (2k)
         ↕ cross-link: KVKK · M&A · ESG · Dijital Dönüşüm (cross-cutting pillar'lar)
```

### Sektör Keyword Cluster Tablosu (TR + EN seed)

**İmalat Sanayi / Manufacturing** (`/sektorler/imalat-sanayi`)
| Cluster | TR seed | EN seed |
|---------|---------|---------|
| Operasyonel mükemmellik | lean üretim danışmanlığı, OEE iyileştirme | lean manufacturing consulting, OEE improvement |
| Endüstri 4.0 | akıllı fabrika dönüşümü, MES/SCADA | smart factory transformation, industry 4.0 |
| Tedarik zinciri | tedarik zinciri optimizasyonu, S&OP | supply chain optimization, S&OP planning |
| Maliyet | birim maliyet düşürme, six sigma | cost reduction, six sigma manufacturing |

**Finansal Hizmetler / Financial Services** (`/sektorler/finansal-hizmetler`)
| Cluster | TR seed | EN seed |
|---------|---------|---------|
| FinTech uyum | MASAK AML/KYC, fintech regülasyon | AML/KYC compliance, fintech regulation |
| Risk yönetimi | operasyonel risk, Basel uyum | operational risk, Basel compliance |
| Dijital bankacılık | açık bankacılık, ödeme sistemleri | open banking, payment systems |

**İlaç & Sağlık / Pharma & Healthcare** (`/sektorler/ilac-saglik`)
| Cluster | TR seed | EN seed |
|---------|---------|---------|
| Regülasyon | GMP uyum, ruhsatlandırma süreci | GMP compliance, regulatory affairs |
| Veri & KVKK | sağlık verisi KVKK, hasta mahremiyeti | health data GDPR, patient privacy |
| Pazara erişim | geri ödeme stratejisi, market access | reimbursement strategy, market access |

**Perakende & E-Ticaret / Retail & E-Commerce** (`/sektorler/perakende-e-ticaret`)
| Cluster | TR seed | EN seed |
|---------|---------|---------|
| Omnichannel | omnichannel strateji, mağaza+online | omnichannel strategy, unified commerce |
| Müşteri analitiği | CLV, kohort analizi, kişiselleştirme | customer LTV, cohort analysis |
| Operasyon | tedarik & envanter, son-mil lojistik | inventory ops, last-mile logistics |

**Teknoloji & SaaS / Tech & SaaS** (`/sektorler/teknoloji-saas`)
| Cluster | TR seed | EN seed |
|---------|---------|---------|
| Büyüme | SaaS metrikleri (MRR/NRR/churn), GTM | SaaS metrics, go-to-market |
| AI benimseme | AI ürün stratejisi, ROI | AI adoption strategy, AI ROI |
| Ölçeklenme | org tasarımı, ürün-led büyüme | org design, product-led growth |

**Cross-cutting pillar'lar (sektörler-üstü):** KVKK & GDPR uyum · M&A advisory · ESG & sürdürülebilirlik · Dijital dönüşüm · Aile şirketleri yönetişimi. Her biri kendi cluster setine sahip; sektör pillar'larına çapraz link.

---

## 4. GEO Katmanı (Generative Engine Optimization)

**Neden:** AI cevap motorları (ChatGPT, Perplexity, Google AI Overviews) artık trafik kaynağı. LLM-referred ziyaretçi **%5-16 dönüşüm** (organik %1.76). GEO ≠ SEO; ama tamamlayıcı ([Enrich Labs](https://www.enrichlabs.ai/blog/generative-engine-optimization-geo-complete-guide-2026), [Frase](https://www.frase.io/blog/what-is-generative-engine-optimization-geo)).

**Kurallar (her pillar + cluster + servis sayfasına uygulanır):**
1. **Answer-first:** İlk 200 kelime birincil soruyu **doğrudan ve tam** yanıtlar (build-up yok). AI retrieval açılış içeriğine bakar.
2. **FAQPage schema:** Her sayfaya 6-10 Q&A → **+%61 citation**. `buildFaqSchema()` zaten var (`src/lib/structured-data.ts`) — sadece sektör/servis/pillar sayfalarına **wire** edilecek (quick-win).
3. **Freshness:** Cited içeriğin %50'si <13 hafta. `updatedAt` frontmatter + görünür "Son güncelleme" + cluster rotasyonu (haftalık).
4. **Yapı:** Bullet, tablo, net H2/H3 soru-başlıklar (ChatGPT verbatim alır). TL;DR kutusu.
5. **E-E-A-T / entity:** Founder first-person, gerçek sayı/vaka, yazar bio + schema `author`, kaynak atfı.
6. **Platform:** ChatGPT (FAQ/bullet) · Perplexity (taze + atıf + dış otorite) · AIO (organik sıralama → AIO'ya taşınır).
7. **Ölçüm:** Otterly.ai / Semrush AI Toolkit / Ahrefs Brand Radar — citation frequency + share of voice.

**Quick-win:** 60+ sayfaya FAQPage schema wire + answer-first ilk-paragraf rewrite = düşük efor, yüksek GEO etkisi.

---

## 5. TR/EN Üretim Matrisi

**Prensip:** EN = **transcreation** (kültürel uyarlama), düz çeviri değil. KVKK→GDPR eşlemesi, TR örnek→global örnek. hreflang/sitemap otomatik (mevcut altyapı).

| İçerik türü | Adet | Kelime/birim | TR | EN | Toplam kelime |
|-------------|------|--------------|----|----|---------------|
| Sektör pillar | 5 | 4.000 | ✓ | ✓ | 40.000 |
| Sektör cluster | 35 (5×7) | 2.000 | ✓ | ✓ | 140.000 |
| Cross-cutting pillar | 5 | 3.500 | ✓ | ✓ | 35.000 |
| Servis derin sayfa | 22 | 1.200 | ✓ | ✓ | 52.800 |
| Sektör landing upgrade | 5 | +750 net | ✓ | ✓ | 7.500 |
| Blog EN rollout | 49 | ~800 | — | ✓ | 39.200 |
| Yeni blog (freshness/yıl) | 24 | 1.200 | ✓ | ✓ | 57.600 |
| FAQ setleri (GEO) | ~60 | ~640 (8×80) | ✓ | ✓ | ~38.400 → 76.800 |
| Case study (gerçek) | 6 | 1.500 | ✓ | ✓ | 18.000 |
| **TOPLAM** | | | | | **≈ 430.000 kelime** |

---

## 6. Humanizer Metodolojisi (AI-pattern kaçınma + E-E-A-T)

**Hedef:** Premium, insan-sesli, AI-detector geçen, E-E-A-T sinyali güçlü içerik.

**KAÇINILACAK (AI-tells):**
- Genel/boş ifadeler ("günümüzün rekabetçi dünyasında", "her geçen gün").
- Bağlaç şişirme ("moreover", "furthermore", "ayrıca ayrıca"), liste-cümle döngüsü.
- Somut veri olmadan iddia; eşit-uzunluk paragraf monotonluğu; aşırı simetrik yapı.

**UYGULANACAK:**
- **Founder voice** (Emre Can Yalçın first-person) — "2025'te bir imalatçıda OEE'yi 6 ayda %18 artırdık" gibi **gerçek/anonim vaka + sayı**.
- Değişken cümle/paragraf ritmi; spesifik örnek, isimli framework, gerçek tablo.
- **TR:** doğal Türkçe akış (çeviri kokmayan); **EN:** native-grade, bölge-uygun örnek.
- E-E-A-T: yazar bio + kaynak atıf + tarih + "neden bize güven" (bağımsızlık, KVKK).
- **QA checklist (her içerik):** answer-first ✓ · ≥1 gerçek sayı/vaka ✓ · FAQ 6-10 ✓ · AI-detector <%20 ✓ · TR+EN parite ✓ · internal link ≥3 ✓ · schema ✓.

---

## 7. İçerik Hesabı (Calculations)

**Hacim:** ≈ **430.000 net-yeni kelime** (TR+EN), ~132 yeni sayfa/içerik birimi (5 pillar + 35 cluster + 5 cross-pillar + 22 servis + 49 EN blog + 24 yeni blog + 6 case study + ~60 FAQ seti).

**Efor (AI-assisted + insan humanizer pass):**
- Premium araştırma-bazlı içerik: insan yazar ~600-800 bitmiş kelime/gün → saf insan ≈ 430k/700 ≈ **~615 yazar-günü**.
- AI-assisted taslak + insan humanizer/editör (3-4×): **~180-230 yazar-günü**.

**Timeline (kademeli):**
| Faz | Süre | Çıktı |
|-----|------|-------|
| 90 gün | quick-win + 5 pillar + sektör başına 2 cluster | GEO/FAQ wire + topical seed |
| 180 gün | kalan cluster + 22 servis derin + EN rollout başlangıç | tam pillar/cluster |
| 365 gün | tam EN parite + freshness cadence + case study | $1M-grade tamam |

**Maliyet aralığı (içerik tek başına):** premium bilingual writer **$0.50-1.50/kelime** → 430k × = **$215k-645k**. AI-assisted + editör modeli alt banda yakın. **"$1M-grade" tam paket** = içerik + premium tasarım/UX + dev + dağıtım/PR (içerik bunun ~%30-50'si).

---

## 8. Önceliklendirme Roadmap

```
P0 Quick-win (hafta 1-4)  → FAQPage schema wire (mevcut buildFaqSchema) + 5 sektör answer-first rewrite
                            + sektör landing 450→1200 kelime. Düşük efor, yüksek GEO/SEO etki.
P1 Pillar build (ay 2-3)  → 5 sektör pillar (4k) + sektör başına 2 öncelikli cluster. Topical seed.
P2 EN rollout (ay 3-6)    → 49 blog transcreation + pillar/cluster EN parite. İngilizce pazar açılır.
P3 Derinleştirme (ay 6-12)→ kalan cluster + 22 servis derin + 6 gerçek case study + freshness cadence.
```

---

## 9. Production Pipeline

- **CMS:** Keystatic `caseStudies`/blog collections. Case-study loader **kuruldu** (EK GÖREV 6 — `getCaseStudies()` + `gen:case-studies`).
- **Pillar/cluster:** `.mdx` (blog gibi) veya yeni `src/content/pillars/` + gen script (blog generator mirror). Dynamic import render.
- **Otomatik:** hreflang/canonical (`src/i18n/canonical.ts`), sitemap + RSS (`generate-sitemap.ts`), schema (`structured-data.ts`).
- **Üretim:** onaydan sonra paralel agent'lar (sektör başına 1 agent, TR+EN), her çıktı humanizer QA checklist'inden geçer.
- **Doğrulama:** `audit-h1-keywords`, `audit-jsonld`, `audit-internal-links`, `seo-watch` scriptleri + Lighthouse SEO 100.

---

## 10. Makine-Okunur Özet (JSON)

```json
{
  "doc": "ECYPRO_CONTENT_MASTERPLAN",
  "date": "2026-06-09",
  "goal": "$1M-grade bilingual content depth (pillar/cluster SEO + GEO citation)",
  "target_net_new_words": 430000,
  "current_state": {
    "sector_pages": { "count": 5, "avg_words": 450, "grade": "thin", "bilingual": true },
    "services": { "count": 22, "depth": "shallow" },
    "blog": { "count": 49, "avg_words": 790, "tr_pct": 95, "en_pct": 5 },
    "seo_infra": { "schema_types": 7, "hreflang": true, "sitemaps": 5, "faqpage_wired_on_marketing": false },
    "pillar_cluster": false,
    "keyword_strategy_doc": false
  },
  "seo_architecture": {
    "model": "pillar+cluster",
    "pillar_words": 4000,
    "cluster_words": 2000,
    "sector_pillars": 5,
    "clusters_per_sector": 7,
    "cross_cutting_pillars": ["kvkk-gdpr", "ma-advisory", "esg", "digital-transformation", "family-business"]
  },
  "geo": {
    "rules": ["answer-first-200w", "faqpage-schema", "freshness-under-13w", "structured-bullets-tables", "eeat-first-person", "platform-specific"],
    "faqpage_citation_uplift_pct": 61,
    "llm_referred_conversion_pct": { "chatgpt": 15.9, "perplexity": 10.5, "claude": 5 },
    "tools": ["otterly.ai", "semrush-ai-toolkit", "ahrefs-brand-radar"]
  },
  "production_matrix": {
    "sector_pillar": { "count": 5, "words_each": 4000, "langs": 2, "total": 40000 },
    "sector_cluster": { "count": 35, "words_each": 2000, "langs": 2, "total": 140000 },
    "cross_pillar": { "count": 5, "words_each": 3500, "langs": 2, "total": 35000 },
    "service_deep": { "count": 22, "words_each": 1200, "langs": 2, "total": 52800 },
    "sector_landing_upgrade": { "count": 5, "net_words": 750, "langs": 2, "total": 7500 },
    "blog_en_rollout": { "count": 49, "words_each": 800, "langs": 1, "total": 39200 },
    "new_blog_yearly": { "count": 24, "words_each": 1200, "langs": 2, "total": 57600 },
    "faq_sets": { "count": 60, "words_each": 640, "langs": 2, "total": 76800 },
    "case_studies": { "count": 6, "words_each": 1500, "langs": 2, "total": 18000 }
  },
  "effort": { "writer_days_ai_assisted": "180-230", "writer_days_human_only": 615 },
  "cost_usd_content_only": { "low": 215000, "high": 645000, "per_word_range": [0.5, 1.5] },
  "roadmap": {
    "P0_quickwin_w1_4": ["faqpage-schema-wire", "sector-answer-first-rewrite", "sector-landing-450-to-1200"],
    "P1_pillars_m2_3": ["5-sector-pillars", "2-priority-clusters-each"],
    "P2_en_rollout_m3_6": ["49-blog-transcreation", "pillar-cluster-en-parity"],
    "P3_deepen_m6_12": ["remaining-clusters", "22-service-deep", "6-real-case-studies", "freshness-cadence"]
  },
  "humanizer": {
    "avoid": ["generic-filler", "connector-bloat", "claim-without-data", "monotone-paragraphs"],
    "apply": ["founder-first-person", "real-numbers-cases", "natural-tr-native-en", "eeat-author-bio-sources"],
    "qa_checklist": ["answer-first", "min-1-real-number", "faq-6-10", "ai-detector-under-20pct", "tr-en-parity", "min-3-internal-links", "schema"]
  },
  "pipeline": {
    "cms": "keystatic",
    "case_study_loader": "getCaseStudies() + gen:case-studies (EK GÖREV 6, kuruldu)",
    "auto": ["hreflang", "sitemap", "rss", "schema"],
    "production": "post-approval parallel agents (1/sector, TR+EN), humanizer QA gate"
  }
}
```

---

## Doğrulama Notu
Mevcut durum 1 internal audit ajanı (Explore) ile, GEO/SEO best-practice 2 WebSearch (2026 kaynakları, yukarıda cite) ile doğrulandı. Infra referansları gerçek: `src/lib/structured-data.ts` (`buildFaqSchema` mevcut, marketing sayfalarda wire edilmemiş), `scripts/generate-sitemap.ts`, `src/i18n/canonical.ts`. Hesaplar yaklaşık; üretim öncesi keyword volume (Ahrefs/Semrush) ile kalibre edilmeli. Bu doküman = strateji+hesap; içerik üretimi onaydan sonraki ayrı adım.
