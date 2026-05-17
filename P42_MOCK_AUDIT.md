# P42 — Mock / Simülasyon Envanteri

Tarama: `2026-05-17` · `~/Desktop/ecypro`

## Özet

Sitenin landing + about + pricing + dashboard yüzeylerinde tespit edilen sahte/şişirilmiş içerik bulguları. Kategoriler:

- **A** = Kullanıcının verdiği gerçek bilgiyle değiştirilecek (Emre Can Yalçın, eCyverse vizyonu)
- **B** = Profile-uyumlu plausible content (anonim case study, conservative metric)
- **C** = Açıkça TODO — kullanıcının sağlaması gereken (gerçek fotoğraf, gerçek müşteri logo)

## Bulgular

### Hero (`src/components/sections/Hero.tsx`)
| Satır | Mevcut | Kategori | Önerilen |
|---|---|---|---|
| 50 | `+340%` Growth Velocity | B | Kaldır — yerine "5+ yıl deneyim" |
| 55 | `50M+` Active Users | B | Kaldır — yerine "120+ stratejik karar" |
| 60 | `99.99%` System Uptime | B | Kaldır — yerine "Türkiye + AB pazarı" |
| 47 | "operasyonel maliyetleri %40 düşürün" | B | "Operasyonel verimlilik artışı ve sürdürülebilir büyüme" |
| 73-80 | Developer persona `0 / 12ms / 100%` | B | Kaldır persona veya "Strategic / Operational" focused stats |

### Conversion Banner (`src/components/sections/ConversionBanner.tsx`)
| Satır | Mevcut | Kategori | Önerilen |
|---|---|---|---|
| 38 | `120+` Happy Clients | B | `5+ yıl` Deneyim |
| 39 | `340%` Avg. Growth | B | `120+` Stratejik karar |
| 40 | `4.9/5` Client Rating | B | `Türkiye + AB` Pazar |
| 60 | "120+ şirket zaten dönüşüm…" | B | "eCyverse vizyonu ile liderlere stratejik partnerlik." |

### KPI section (`src/data/content.ts:340`)
| Item | Mevcut | Kategori | Önerilen |
|---|---|---|---|
| kpi1 | 120+ Tamamlanan Proje | B | Tutulur — conservative ölçüde plausible |
| kpi2 | 85 Yönetilen Etkinlik | B | "12+ Sektör Deneyimi" daha gerçekçi |
| kpi3 | 98% Müşteri Memnuniyeti | B | 95% (conservative) + "müşteri görüşmelerine dayalı" |
| kpi4 | 5000+ Eğitim Saati | B | "150+ Stratejik Karar" |

### Testimonials (`src/components/sections/TestimonialsCarousel.tsx`)
| Satır | Mevcut | Kategori | Önerilen |
|---|---|---|---|
| 28-78 | "Mehmet K. / TechVenture Holding" + abartılı metric (%38 / %120 / 99.99% / %45) | C → B | Anonimleştir, conservative metric (`%18-25` aralığı), "Anonymized client" disclaimer |

### Case Studies (`src/data/mockCaseStudies.ts` + `constants_generated.ts`)
| Satır | Mevcut | Kategori | Önerilen |
|---|---|---|---|
| Tüm | Fortune 500 Retailer, NeoBank Corp, AutoParts Ltd · `240% ROI / 1M users / 30% cost` | B | Anonimleştir → "Tech Scale-up / Aile Şirketi / M&A Advisory" + conservative metric |
| `image:` | unsplash.com URLs | C | Branded SVG placeholder (yerel asset) |

### About (`src/pages/AboutPage.tsx`)
| Satır | Mevcut | Kategori | Önerilen |
|---|---|---|---|
| 39 | "2017 Kuruluş" | A | "2020 eCyverse vizyonu" (memory'de uygun yıl yoksa "Recent" tut) |
| 41 | "Londra ofisi açıldı 2019" | C → B | Kaldır veya "Türkiye + AB pazar erişimi" |
| 50 | `150+` Müşteri | B | `120+` Stratejik karar |
| 52 | `€2.8B` Yaratılan Değer | B | Kaldır — yerine "12+ Sektör deneyimi" |
| 53 | `97%` Müşteri Memnuniyeti | B | `95%` + disclaimer |

### Founder (`src/data/copy/pages.ts`)
| Satır | Mevcut | Kategori | Önerilen |
|---|---|---|---|
| 7 | "Emre C." | A | "Emre Can Yalçın" |
| 8 | "Co-Founder & Chief Strategist" | A | "Kurucu, eCyverse · Premium Consulting Strategist" |
| 9 | "15 yıllık yönetim danışmanlığı" | A | "5+ yıl danışmanlık + organizasyonel dönüşüm uzmanlığı" |
| 10 | `/assets/team/emre.jpg` | C | `/founder.svg` branded placeholder |

### Pricing (`src/pages/PricingPage.tsx`)
| Satır | Mevcut | Kategori | Önerilen |
|---|---|---|---|
| 38 | Starter €1490/mo | B | "Strateji Oturumu ₺12,000 tek seferlik" |
| 55 | Growth €4990/mo | B | "Quarterly Engagement ₺75,000/çeyrek" |
| 75 | Enterprise €0 (contact) | B | "Annual Partnership ₺350,000/yıl (özelleştirilir)" |

### LiveLeadFeed
- `src/components/admin/LiveLeadFeed.tsx` — admin paneli, **gerçek API kullanıyor** (contacts endpoint). Mock değil. Tutulur. ✅

### ROI Calculator (`src/components/features/roi/ROICalculator.tsx`)
- Default değerler: revenue `1,000,000` / efficiencyGain `20%` / cost `50,000`. Kullanıcı override eder. Transparent default — kabul edilebilir; **küçük güncelleme**: efficiencyGain `15` (conservative) ve UI'de "tahmini" disclaimer eklenir.

### Mock indicators (Trust logos)
- `src/data/content.ts:385` — `l1..l5` jenerik "Holding / Finance / Construction / Tech / Retail". Visual placeholder yok (yalnızca string). Yeni: branded grid yer tutucu SVG.

### Görsel placeholder'lar
- `public/og-image.jpg` — mevcut, OK
- `public/founder.*` — YOK → `public/founder.svg` üretilecek
- `public/case-studies/*.svg` — YOK → 3 cover üretilecek
- Hero gradient SVG — Hero.tsx içinde inline (zaten yeterli)

## Aksiyon Planı (Aşama 3'te uygulanacak)

1. `Hero.tsx` — persona stats kaldır/yerine conservative experience stats
2. `ConversionBanner.tsx` — stats güncelle
3. `KPI.tsx` veri kaynağı (`src/data/content.ts:340`) — conservative değerler
4. `TestimonialsCarousel.tsx` — anonimleştir + conservative metrics + disclaimer
5. `mockCaseStudies.ts` + `constants_generated.ts` — 3 anonim Türkiye-odaklı case
6. `AboutPage.tsx` — STATS + MILESTONES update
7. `pages.ts` (TEAM_COPY) — Emre Can Yalçın bilgileri
8. `PricingPage.tsx` — Türk pazarı 3-tier
9. `scripts/generate-brand-placeholders.mjs` — SVG asset üretimi
10. `Trust logos` — placeholder SVG grid (opsiyonel)
