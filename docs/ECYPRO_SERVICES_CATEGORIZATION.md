---
doc: ECYPRO_SERVICES_CATEGORIZATION
title: "eCyPro — Hizmetler Bölümü Workflow Kategorizasyonu"
source: src/data/services.ts
date: 2026-06-10
counts:
  services: 21
  departments: 4
language: "Türkçe (servis başlıkları TR + EN)"
axes: ["workflow (departman lifecycle)", "engagement stage", "doğa (uyum/stratejik)", "hedef-alıcı", "tipik süre"]
---

# eCyPro — Hizmetler Workflow Kategorizasyonu

> **Amaç:** `/services` bölümündeki **21 hizmeti** kusursuz, çok-eksenli kategorilere ayırmak — özellikle her departmanı bir **engagement workflow'u** (sıralı yaşam-döngüsü) olarak göstermek. Kaynak: `src/data/services.ts` (21 servis, 4 departman + "Hepsi" filtresi). Route'lar: `/services/<slug>`.

## 0. Genel Bakış

| Departman | Servis | İkincil tema |
|-----------|--------|--------------|
| **M&A** (`ma`) | 5 | Birleşme & satın alma yaşam-döngüsü |
| **ESG** (`esg`) | 5 | Sürdürülebilirlik & CSRD raporlama |
| **FinTech & Compliance** (`fintech`) | 5 | Regülasyon uyumu (MASAK/KVKK/SPK) |
| **Aile Şirketi** (`aile`) | 6 | Kuşak devri & kurumsallaşma |
| **TOPLAM** | **21** | |

Her hizmet kurucu (Emre Can Yalçın) eşliğiyle, junior delegasyon olmadan yürütülür (founder-led).

---

## 1. Workflow Görünümü (ana eksen) — Departman = Engagement Lifecycle

Her departman, müşterinin geçtiği **sıralı bir akış** olarak okunur. Müşteri akışın herhangi bir adımında girebilir; eCyPro tipik olarak baştan-sona eşlik eder.

### M&A — Anlaşma Yaşam-Döngüsü
```
1. Due Diligence Suite      → mali/hukuki/vergi/tekno/KVKK · 90 gün tek elden
2. Şirket Değerleme & QoE    → DCF + çarpan + EBITDA kalite (add-back metodolojisi)
3. İşlem Yapılandırma        → varlık/hisse/birleşme + vergi optimizasyonu + TTK
4. Müzakere & LOI            → NDA'dan term-sheet'e 4 hafta; deal-breaker erken tespit
5. Birleşme Sonrası Entegrasyon (PMI) → ilk 100 gün playbook + sinerji panosu
```

### ESG — Sürdürülebilirlik Hazırlık Akışı
```
1. Çift Önemlilik Analizi    → içten-dışa / dıştan-içe + paydaş haritası
2. ESRS Yol Haritası         → E1-E5 / S1-S4 / G1 · 6 ayda hazırlık
3. Karbon Muhasebesi         → Scope 1-2-3 envanteri + SBTi hedef
4. CSRD Uyumu                → AB tedarik zinciri baskısına karşı + YK sunumu
5. Sürdürülebilirlik Raporu  → GRI/SASB/ESRS uyumlu yıllık rapor
```

### FinTech & Compliance — Regülasyon Uyum Akışı
```
1. KVKK VERBİS & DSAR        → veri envanteri + DSAR süreç + sözleşme şablonu (temel)
2. MASAK AML/KYC             → risk-bazlı AML + kimlik doğrulama + boşluk analizi
3. SPK & CASP Lisansı        → kripto hizmet sağlayıcı lisans + sermaye yapısı
4. Açık Bankacılık Uyumu     → TCMB/BDDK + PSD2-eşdeğeri API güvenlik
5. Kripto & Web3 Hukuku      → token ihracı + DeFi uyum + stratejik konum
```

### Aile Şirketi — Süreklilik & Kurumsallaşma Akışı
```
1. Kuşak Devri Planlaması    → 1G→2G→3G hisse/yönetim devri + yetkinlik değerlendirme
2. Aile Anayasası            → aile konseyi + atanma kriteri + uyuşmazlık mekanizması
3. Kurumsallaşma & Bağımsız Yönetim → bağımsız YK üyesi + komite + derecelendirme
4. Family Office Kurulumu    → yatırım komitesi + risk politikası + operasyonel çerçeve
5. Servet Transferi Planlaması → çoklu-nesil vergi optimizasyonu + likidite
6. Aile Arabuluculuğu        → hissedar/nesil çatışması + çıkış müzakeresi (tarafsız)
```

---

## 2. Çok-Eksenli Kategoriler

**Eksen B — Engagement Stage** (departmanlar-arası ortak faz):
| Stage | Tanım | Örnek hizmetler |
|-------|-------|-----------------|
| **Teşhis** | mevcut durum + boşluk analizi | DD Suite, Çift Önemlilik, KVKK envanteri, Yetkinlik değerlendirme |
| **Tasarım** | strateji + yapı + yol haritası | Değerleme, İşlem Yapılandırma, ESRS, Aile Anayasası |
| **Uygulama** | hayata geçirme + lisans + uyum | Müzakere, Karbon, CSRD, SPK/MASAK, Kurumsallaşma |
| **Sürdürme** | kalıcılık + raporlama + yönetişim | PMI, Sürdürülebilirlik Raporu, Family Office |

**Eksen C — Doğa:**
- **Regülasyon-uyum** (zorunluluk-tetikli): tüm FinTech (5) + ESG CSRD/ESRS/Rapor + KVKK.
- **Stratejik** (değer-tetikli): tüm M&A (5) + Aile Şirketi (6) + ESG Karbon/Çift Önemlilik.

**Eksen D — Hedef-Alıcı:**
| Departman | Birincil alıcı |
|-----------|----------------|
| M&A | CFO / Kurumsal Geliştirme / sahip-yönetici (satış/alım tarafı) |
| ESG | Sürdürülebilirlik Direktörü / CFO / YK (raporlama yükümlüsü) |
| FinTech | Compliance/Legal lead / fintech kurucusu / CISO |
| Aile Şirketi | Aile/holding sahibi / 2-3. nesil / aile konseyi |

**Eksen E — Tipik Süre:** Teşhis 2-4 hafta · Tasarım 4-12 hafta · Uygulama 3-6 ay · Sürdürme süreklilik (retainer).

---

## 3. Tam Servis Tablosu (21)

| id | Başlık (TR) | Title (EN) | Dept | Stage | Route |
|----|-------------|-----------|------|-------|-------|
| `ma-dd-suite` | Due Diligence Suite | Due Diligence Suite | M&A | Teşhis | `/services/due-diligence-suite` |
| `ma-valuation` | Şirket Değerleme & QoE | Valuation & QoE | M&A | Tasarım | `/services/mergers-acquisitions` |
| `ma-deal-structuring` | İşlem Yapılandırma | Deal Structuring | M&A | Tasarım | `/services/deal-structuring` |
| `ma-negotiation` | Müzakere & LOI | Negotiation & LOI | M&A | Uygulama | `/services/negotiation-loi` |
| `ma-pmi` | Birleşme Sonrası Entegrasyon | Post-Merger Integration | M&A | Sürdürme | `/services/post-merger-integration` |
| `esg-double-materiality` | Çift Önemlilik Analizi | Double Materiality | ESG | Teşhis | `/services/double-materiality` |
| `esg-esrs` | ESRS Yol Haritası | ESRS Roadmap | ESG | Tasarım | `/services/esrs-roadmap` |
| `esg-carbon` | Karbon Muhasebesi | Carbon Accounting | ESG | Uygulama | `/services/carbon-accounting` |
| `esg-csrd` | CSRD Uyumu | CSRD Compliance | ESG | Uygulama | `/services/csrd-compliance` |
| `esg-sustainability-report` | Sürdürülebilirlik Raporları | Sustainability Reports | ESG | Sürdürme | `/services/esg-strategy` |
| `fintech-kvkk` | KVKK VERBİS & DSAR | KVKK VERBİS & DSAR | FinTech | Teşhis | `/services/data-governance` |
| `fintech-masak` | MASAK AML/KYC | MASAK AML/KYC | FinTech | Tasarım | `/services/masak-aml` |
| `fintech-spk` | SPK & CASP Lisansı | SPK & CASP License | FinTech | Uygulama | `/services/spk-casp` |
| `fintech-open-banking` | Açık Bankacılık Uyumu | Open Banking Compliance | FinTech | Uygulama | `/services/open-banking` |
| `fintech-crypto` | Kripto & Web3 Hukuku | Crypto & Web3 Law | FinTech | Tasarım | `/services/crypto-web3` |
| `aile-succession` | Kuşak Devri Planlaması | Succession Planning | Aile | Tasarım | `/services/succession-planning` |
| `aile-anayasa` | Aile Anayasası | Family Constitution | Aile | Tasarım | `/services/family-business` |
| `aile-kurumsallasma` | Kurumsallaşma & Bağımsız Yönetim | Institutionalization & Governance | Aile | Uygulama | `/services/family-business-governance` |
| `aile-family-office` | Family Office Kurulumu | Family Office Setup | Aile | Uygulama | `/services/family-office` |
| `aile-wealth-transfer` | Servet Transferi Planlaması | Wealth Transfer | Aile | Tasarım | `/services/wealth-transfer` |
| `aile-conflict` | Aile Arabuluculuğu | Family Mediation | Aile | Teşhis | `/services/conflict-resolution` |

---

## 4. Kapsam Matrisi (orphan yok kanıtı)

| Departman | Servis sayısı | Teşhis | Tasarım | Uygulama | Sürdürme |
|-----------|--------------|--------|---------|----------|----------|
| M&A | 5 | 1 | 2 | 1 | 1 |
| ESG | 5 | 1 | 1 | 2 | 1 |
| FinTech | 5 | 1 | 2 | 2 | 0 |
| Aile | 6 | 1 | 3 | 2 | 0 |
| **TOPLAM** | **21** | 4 | 8 | 7 | 2 |

21 servisin tamamı bir departman + bir stage'e atandı → **orphan yok**.

---

## 5. Makine-Okunur Özet (JSON)

```json
{
  "doc": "ECYPRO_SERVICES_CATEGORIZATION",
  "source": "src/data/services.ts",
  "counts": { "services": 21, "departments": 4 },
  "workflows": {
    "ma": ["ma-dd-suite", "ma-valuation", "ma-deal-structuring", "ma-negotiation", "ma-pmi"],
    "esg": ["esg-double-materiality", "esg-esrs", "esg-carbon", "esg-csrd", "esg-sustainability-report"],
    "fintech": ["fintech-kvkk", "fintech-masak", "fintech-spk", "fintech-open-banking", "fintech-crypto"],
    "aile": ["aile-succession", "aile-anayasa", "aile-kurumsallasma", "aile-family-office", "aile-wealth-transfer", "aile-conflict"]
  },
  "axes": {
    "stage": ["Teşhis", "Tasarım", "Uygulama", "Sürdürme"],
    "nature": { "regulasyon-uyum": ["fintech-*", "esg-csrd", "esg-esrs", "esg-sustainability-report", "fintech-kvkk"], "stratejik": ["ma-*", "aile-*", "esg-carbon", "esg-double-materiality"] },
    "buyer": { "ma": "CFO/corp-dev", "esg": "Sustainability dir./CFO", "fintech": "Compliance/legal/founder", "aile": "Family/holding owner" }
  },
  "stage_distribution": { "Teşhis": 4, "Tasarım": 8, "Uygulama": 7, "Sürdürme": 2 },
  "route_pattern": "/services/<slug>"
}
```

---

## Doğrulama Notu
21 servis + id'ler + route'lar `src/data/services.ts` ile birebir doğrulandı (`SERVICES` dizisi, `DEPARTMENTS` 4+all). Önceki `ECYPRO_SITE_CATEGORIZATION.md`'deki "22 servis" gevşek sayımdı — kesin sayı **21**. Workflow sıraları engagement yaşam-döngüsünü yansıtır (M&A = anlaşma lifecycle, ESG = raporlama hazırlık, FinTech = uyum kurulum, Aile = süreklilik). Çok-eksenli atama tüm 21 servisi kapsar, orphan yoktur.
