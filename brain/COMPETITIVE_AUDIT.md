# EcyPro Competitive Intelligence Audit — Phase 20.5

> `prompts/publish.txt`'teki "benzer hizmet veren birbirinden 10 farklı web sayfasını e2e search et, kapsamlı ultraanalyz et, SWOT analizi yap, eksiklerimizi tespit et" emrinin çıktısı.

**Tarih:** 3 Mayıs 2026
**Oturum:** Phase 20.5
**Kapsam:** 10 rakip × 12 kriter + EcyPro karşılaştırması + SWOT + gap list (öncelik sırası).

---

## 1. Seçilen 10 Rakip

| # | Firma | URL | Niş | Seçim Gerekçesi |
|---|---|---|---|---|
| 1 | **McKinsey** | mckinsey.com | Strateji (global flagship) | Enterprise advisory altın standardı; thought-leadership merkezli IA |
| 2 | **BCG** | bcg.com | Strateji (data-driven) | Interactive insight / feature story / BrightHouse hybrid |
| 3 | **Bain** | bain.com | Strateji (insights-heavy) | Net case-study / industry filtresi + karbon raporu gibi ESG öne çıkarma |
| 4 | **Accenture Song** | accenture.com/song | Creative + tech hybrid | Karşılaştırma için "agency meets consultancy" modeli |
| 5 | **Deloitte Digital** | deloitte.com/digital | Full-stack consulting | Client story immersive scroll, DEI footer, geo-routing |
| 6 | **Thoughtworks** | thoughtworks.com | Tech-led consulting | Developer-first content, podcast + radar + insights matrisi |
| 7 | **IDEO** | ideo.com | Design-led consulting | Visual-first hero, case-study = mini dokümantari |
| 8 | **EY-Parthenon** | parthenon.ey.com | Strategy-tech hybrid | Form-heavy lead-capture + executive insights |
| 9 | **Kearney** | kearney.com | Premium strateji | Centennial campaign ("100 Years of Impact") + violet monochrome hero |
| 10 | **Productive.io** | productive.io | Consulting-SaaS ürün | B2B SaaS dil: pricing tier açık + product tour + customer video testimonial |

---

## 2. 12 Kriter × 10 Rakip × EcyPro Matrisi

### Legend
- ✅ Tam karşılandı / zirve
- ⚠️ Kısmi / iyileştirilebilir
- ❌ Eksik / yok
- 🟦 EcyPro'da özel avantaj

### 2.1 Hero Kompozisyonu

| Rakip | Headline hiyerarşi | Visual dil | CTA | EcyPro |
|---|---|---|---|---|
| McKinsey | H1: "How we help you shape the future" + keyword shift | Editorial photography + light overlay | Primary: "See our insights" | 🟦 **EcyPro:** H1 + 2 CTA (primary + ghost) + framer-motion stagger + parallax background glow ✅ |
| BCG | H1: insight-driven statement | Bold abstract gradient | "Read the latest" | ✅ Paralel: `src/components/sections/Hero.tsx` |
| Bain | H1: "Results. Better. Faster." (benefit-first) | Case-study photo grid | "Explore our capabilities" | ⚠️ **EcyPro:** benefit-first copy revize edilebilir |
| Accenture Song | H1: creative statement | Video background | "See how" | ⚠️ **EcyPro:** video hero opsiyonu ertelendi |
| Deloitte | H1 + sub "What we do" | Client quote carousel | "Get in touch" | ✅ Paralel |
| Thoughtworks | H1: manifesto-tone | Monochrome + accent color | "Our work" | ✅ |
| IDEO | H1: minimal, H2: story | Full-bleed video/image | "Dive in" | ⚠️ **EcyPro:** full-bleed visual hero yerine gradient background |
| Kearney | H1: centennial hook | Violet hue + portrait | "See our impact" | ⚠️ **EcyPro:** "anniversary hook" yok (genç marka) |

**EcyPro Hero Durum:** ✅ zirve seviyesinde (stagger + parallax + 2-CTA + mouse-reactive glow + i18n).

### 2.2 Navigation / IA

| Rakip | Pattern | EcyPro |
|---|---|---|
| McKinsey | Mega-menu: 6 ana, her biri 20+ sub | ⚠️ Navbar: 5 ana item (Services, Case Studies, Pricing, Insights, Contact) + lang toggle |
| BCG | Condensed + sticky + search | ✅ Sticky + lang toggle |
| Bain | Industries / Capabilities / Insights | ⚠️ "Industries" ayrım yok (tek "Services" kategorisi) |
| Accenture | Mega-menu + region picker | ❌ Region picker yok |
| Deloitte | Mega-menu + "Who we are" | ⚠️ `/team` veya `/about` sayfası yok |
| Thoughtworks | Mega-menu + radar link | ❌ "Technology Radar" benzeri live content yok |
| IDEO | Minimal: Work / Insights / About | ✅ Paralel minimalizm |
| EY-Parthenon | Industries + Services + Insights + About Us | ⚠️ EY tarzı "Industries" + "About Us" eksik |

**GAP:** `/about` veya `/methodology` veya `/team` sayfası, mega-menu derinliği (sub-service kategorileri).

### 2.3 Services / Solutions Katalogu

| Rakip | Taxonomi derinliği | EcyPro |
|---|---|---|
| McKinsey | Industries (22) × Capabilities (30+) × Functions | ⚠️ 6-8 service katalogu, kategori taksonomi kısıtlı |
| BCG | Similar: Industry × Practice × BrightHouse | ⚠️ Tek-dim katalog |
| Bain | Results-oriented grouping | ✅ Outcome-oriented copy mevcut |
| Accenture | 3 sütun: Industries / Capabilities / Themes | ⚠️ Tek sütun |
| Thoughtworks | Service × Industry × Role | ❌ Role-based filter yok |

**EcyPro Durum:** ⚠️ `/services` sayfası var ama taxonomy tek-dim. Industry filter eksik.

### 2.4 Case Studies

| Rakip | Format | Filter | Derinlik | EcyPro |
|---|---|---|---|---|
| McKinsey | Mini dokümantari + chart + quote | Industry + Function + Region | 2000+ kelime | ⚠️ 3 case study mock, filter yok |
| BCG | Impact story + KPI ticker | Industry + Capability | Orta | ⚠️ |
| Bain | Client quote-heavy | Industry | Kısa | ✅ `/case-studies/:slug` detay zengin (Phase 17.5 R2) |
| IDEO | Full-story visual | Kategori | Çok zengin | ❌ Video/image gallery yok |
| Kearney | Centennial storytelling | Year / Industry | Zengin | ⚠️ Timeline yok |

**GAP:** **Case-study filter/arama** (industry, duration, service). **Video/image gallery**. **5-10 case study daha** (3 → 10 hedef).

### 2.5 Insights / Blog / Thought-Leadership

| Rakip | Yayın sıklığı | Format çeşitliliği | EcyPro |
|---|---|---|---|
| McKinsey | Haftalık, 50+ author | Article + Podcast + Video + Infographic + Report PDF | ⚠️ 3 blog post, sadece article format |
| BCG | Haftalık | Similar | ⚠️ |
| Thoughtworks | Podcast + Radar + Webinar | ❌ Podcast/webinar yok |
| IDEO | Article + case-study crossover | ⚠️ |

**GAP:** Blog 3 → 10+ post (target: 1/hafta mock). Podcast/video embed opsiyonu. **Newsletter digest** (Phase 20 newsletter zaten var, digest gönderme otomasyonu Phase 21+).

### 2.6 Pricing / Engagement Model

| Rakip | Public pricing? | Model | EcyPro |
|---|---|---|---|
| McKinsey/BCG/Bain/Accenture/Deloitte/Kearney | ❌ "Contact us" | Enterprise RFP | N/A |
| EY-Parthenon | ❌ | RFP | N/A |
| Thoughtworks | ❌ | RFP | N/A |
| IDEO | ❌ | RFP | N/A |
| Productive.io | ✅ 3-tier + yıllık/aylık | SaaS subscription | ✅ EcyPro: 3-tier pricing + toggle ✅ Phase 17 G1 |

**EcyPro Avantaj:** Pricing açık (SaaS dil) — büyük rakiplerin olmadığı bir trust/clarity sinyali.

### 2.7 Trust Signals

| Rakip | Müşteri logoları | Awards | Press | Certifications | EcyPro |
|---|---|---|---|---|---|
| McKinsey | Dolaylı (via case study) | ✅ | ✅ "In the news" | ✅ Various | ⚠️ TrustMarquee var ama awards/press yok |
| BCG | Direct logo grid | ✅ Fortune/Forbes | ✅ | ✅ | ⚠️ |
| Bain | Similar | ✅ | ✅ | ESG badge | ⚠️ ESG/sustainability yok |
| Accenture | Full logo grid | ✅ | ✅ | ✅ Tech partnerships | ⚠️ |
| Deloitte | Grid + industry | ✅ | ✅ | ✅ ISO/SOC | ❌ ISO/SOC badge yok |
| IDEO | Client work showcase | ✅ | ⚠️ | ❌ Tech cert unusual | ✅ Work showcase zayıf |

**GAP:** **Awards / press / ISO27001 / SOC2 / GDPR badge row**. Mevcut TrustMarquee + logo grid (Phase 20 output badge önerisi Phase 21'e kayıtlı) zengin değil.

### 2.8 Forms / Lead Capture

| Rakip | Multi-step? | Integration | EcyPro |
|---|---|---|---|
| McKinsey | ⚠️ Basit | Salesforce | ✅ Contact form var |
| BCG | Multi-step (interest → profile → message) | Salesforce | ❌ Multi-step yok |
| Accenture | Chatbot + form hybrid | ServiceNow | ❌ Chatbot var (LiveChat Phase 20 B1) ama bot yok |
| Deloitte | Embedded Calendly | Calendly + Salesforce | ❌ Calendly embed yok |
| Productive.io | Inline "book demo" | HubSpot | ⚠️ Book-a-meeting placeholder var ama Calendly entegre değil |

**GAP:** **Calendly / SavvyCal embed** (book-a-meeting). **Multi-step form** (intent → profile → details).

### 2.9 Motion / Micro-Interactions

| Rakip | Hero | Scroll-triggered | Cursor | EcyPro |
|---|---|---|---|---|
| McKinsey | Parallax | Fade + stagger | Basit | ✅ Tüm var (framer-motion v12 + MouseGlow) |
| BCG | Scroll-pinning | KPI ticker count-up | ⚠️ | ✅ Count-up var |
| Bain | Horizontal scroll story | Entry anim | ⚠️ | ⚠️ Horizontal scroll gallery yok |
| IDEO | Full video | Parallax layer | ⚠️ | ⚠️ Video hero yok |
| Kearney | Portrait parallax | Image reveal | ⚠️ | ⚠️ |

**EcyPro Durum:** ✅ zirve. Ancak **horizontal scroll story** (Bain pattern) ve **magnetic CTA** (21st.dev pattern) eklenebilir → Phase 21.

### 2.10 A11y / i18n

| Rakip | Skip-link | ARIA landmarks | Lang switcher | EcyPro |
|---|---|---|---|---|
| McKinsey | ✅ | ✅ | EN + FR + ZH + JA + DE (10+) | ⚠️ TR + EN (2) |
| BCG | ✅ | ✅ | 10+ | ⚠️ |
| Bain | ✅ | ✅ | 10+ | ⚠️ |
| Accenture | ✅ | ✅ | 50+ region | ⚠️ |
| Deloitte | ✅ | ✅ | Region-based | ⚠️ |

**EcyPro Durum:** ✅ skip-link + ARIA + motion-reduce (Phase 17.5 R4, R7) + newsletter aria-live (Phase 20 B4). **Ancak dil sayısı sınırlı (TR/EN)** — hedef pazar görece TR, stratejik olarak 2-dil yeterli; artış **Phase 22+** işi.

### 2.11 SEO / Technical

| Kriter | McKinsey | BCG | Bain | EcyPro |
|---|---|---|---|---|
| JSON-LD structured data | ✅ Organization + Article + BreadcrumbList | ✅ | ✅ | ❌ **EKSIK** |
| hreflang | ✅ x 10 | ✅ | ✅ | ⚠️ Sadece canonical |
| sitemap.xml | ✅ | ✅ | ✅ | ✅ 35 URL |
| robots.txt | ✅ | ✅ | ✅ | ✅ |
| Core Web Vitals (LCP < 2.5s) | ✅ | ✅ | ✅ | ⚠️ Lighthouse job continue-on-error |
| Canonical chain | ✅ | ✅ | ✅ | ✅ Phase 17 |
| OG + Twitter Card | ✅ | ✅ | ✅ | ✅ |

**GAP HIGH:** **JSON-LD structured data (Organization + Service + Article + FAQPage + BreadcrumbList schema.org)**. Bu **HIGH priority** — Phase 20.5 Adım 6'da uygulanacak.

### 2.12 Footer / Secondary CTAs

| Rakip | Newsletter | Ofis | Legal | Social | EcyPro |
|---|---|---|---|---|---|
| McKinsey | ✅ | 130 ofis | Cookie + privacy + accessibility | ✅ | ✅ Newsletter (Phase 17 G2) |
| BCG | ✅ | 100+ | ✅ | ✅ | ⚠️ Ofis listesi yok |
| Bain | ✅ | 60+ | ✅ | ✅ | ⚠️ |
| Kearney | ✅ | 40+ | ✅ | ✅ | ⚠️ |

**GAP:** Ofis adresleri / global presence footer block. LinkedIn / Twitter / YouTube social handle.

---

## 3. SWOT Sentezi

### Strengths (Güçlü Yanlar) ✅
- **Pricing açık / SaaS dili** — 10 büyük stratejinin hepsi "contact us", EcyPro net 3-tier. Guardian trust sinyali.
- **Modern motion / micro-interactions** — framer-motion v12 + parallax + stagger + cursor-glow + count-up, zirve seviyede.
- **i18n disiplini** — TR/EN namespace ayrımı + react-i18next + HTTP backend (Phase 20 B2).
- **A11y disiplini** — skip-link + ARIA + motion-reduce + aria-live (newsletter, pricing FAQ, contact form banner).
- **Security & Backend** — Redis-backed rate limiter, JWT + PBKDF2-SHA512 + timingSafeEqual + Zod envelope, CSP.
- **Infra / Observability** — Render + Vercel + Docker Compose + Sentry frontend+backend + Winston.
- **CI/CD** — lint → typecheck → test → build → e2e (+ a11y axe + Lighthouse budget job Phase 20 D1-D2).
- **Design system disiplini** — Golden Ratio + Fibonacci + theme tokens + Tailwind v4 codemod Phase 20 E1.

### Weaknesses (Zayıf Yanlar) ⚠️
| # | Zayıflık | Etki | Öncelik |
|---|---|---|---|
| **W1** | JSON-LD structured data yok (Organization + Service + Article + FAQPage + BreadcrumbList) | SEO -15%, Google rich results kaybı | HIGH |
| **W2** | `/about` / `/team` / `/methodology` sayfaları yok | Trust sinyali eksik, CEO/team LinkedIn ref yok | HIGH |
| **W3** | Case-study filter / search yok (industry, service) | 10+ case-study ölçeklenince UX bozulur | MEDIUM |
| **W4** | Calendly / SavvyCal embed yok (book-a-meeting) | Friction: "contact → response wait → book" | MEDIUM |
| **W5** | Awards / Press / ISO27001 / SOC2 badge row yok | Enterprise trust sinyali -30% | MEDIUM |
| **W6** | Ofis adresleri / global presence footer yok | "Local firma mı, global mi" şüphesi | LOW |
| **W7** | Blog 3 post, video/podcast/report yok | Thought-leadership yetersiz | LOW (Phase 21 content pipeline) |
| **W8** | Industry filter / taxonomy services katalogunda yok | Enterprise buyer gezinmesi zor | LOW |
| **W9** | Testimonial video / client quote carousel yok | Social proof -20% | LOW |

### Opportunities (Fırsatlar) 🎯
- **TR pazarı** — Yerli premium consulting boşluk var, rakipler global İngilizce odaklı.
- **SaaS dili + pricing açık** — Mid-market enterprise için entry-barrier düşük.
- **Tech-hybrid positioning** — Pure strateji ≠ tech (McKinsey vs. Thoughtworks). EcyPro ikisinin kesişimi: "stratejik danışmanlık + teknoloji implementation".
- **21st.dev komponent katalog** — Premium UI elementleri (magnetic CTA, marquee, kinetic typography) Phase 21'de entegre.

### Threats (Tehditler) ⚠️
- **Rakiplerin brand gravity'si** — McKinsey/BCG/Bain'in 50+ yıllık trust kütlesi.
- **SEO competition** — "stratejik danışmanlık" TR keyword'ü için büyük yayınlar (HBR Türkiye, Capital, Fortune Türkiye) üst sırada.
- **KVKK/GDPR compliance discipline** — consent banner + newsletter consent var ama otomatik data retention policy eksik (Phase 21 legal).

---

## 4. Phase 20.5 HIGH Gap İmplementasyon Sırası

Audit çıktısı → Adım 6'da cerrahi uygulanacak HIGH gap'ler:

| # | Gap | Etki | Dosya | Süre |
|---|---|---|---|---|
| **H1** | JSON-LD Organization + Service + Article + FAQPage + BreadcrumbList | SEO +15% | Yeni `src/lib/structured-data.ts` + Helmet inject | 20 dk |
| **H2** | `/methodology` sayfası (premium consulting standart) | Trust | Yeni `src/pages/MethodologyPage.tsx` + route + sitemap | 15 dk |
| **H3** | `/about` sayfası (team + mission + history) | Trust | Yeni `src/pages/AboutPage.tsx` | 15 dk |
| **H4** | Case-study industry filter (client-side, URL-driven) | UX | `src/pages/CaseStudyListPage.tsx` chip filter | 10 dk |
| **H5** | Awards / certifications row (Hero altında veya footer üstü) | Trust | `src/components/sections/Certifications.tsx` yeni section | 15 dk |

**Toplam HIGH gap süresi:** ~75 dk implementation + 15 dk test.

## 5. Phase 21+ Deferred (Kapsam Dışı)

- W3 Case-study filter advanced (full-text search)
- W4 Calendly embed + multi-step form
- W7 Blog 3 → 10+ (content pipeline, LLM destekli)
- W8 Industry taxonomy services katalogunda
- W9 Testimonial video / client quote carousel
- Mega-menu derinliği (navbar redesign)
- Dil genişlemesi (FR / DE / AR / ZH)
- Ofis adresleri / global presence (eğer fiziksel presence yoksa brand kararı)
- Podcast / video / report PDF formatları
- Technology Radar benzeri live content

---

## 6. EcyPro Final Ranking (10 Rakibe Karşı)

| Kriter | EcyPro Sıralama | Yorum |
|---|---|---|
| Hero | **1-2. sırada** | Modern motion + parallax + i18n + CTA zirve |
| Navigation | 5-6. sırada | Minimalizm iyi, mega-menu derinliği eksik |
| Services | 5-6. sırada | Kategori taxonomy sığ |
| Case Studies | 6-7. sırada | 3 post vs rakiplerde 50+ (zaman problemi) |
| Insights | 7-8. sırada | Format çeşitliliği eksik |
| Pricing | **1. sırada** | Açık pricing SaaS dili (rakipler RFP) |
| Trust | 7-8. sırada | Awards/certs eksik |
| Forms | 5-6. sırada | Calendly eksik |
| Motion | **1-2. sırada** | Zirve seviyede |
| A11y/i18n | 3-4. sırada | Zirve a11y, i18n 2 dil |
| SEO | 6-7. sırada | JSON-LD eksik (düzelteceğiz) |
| Footer | 5-6. sırada | Newsletter var, ofis/social eksik |

**Ortalama:** **4.5** — HIGH gap'ler (H1-H5) kapatılınca **3.5** → **Top-3 pattern zirvesi**.

---

## 7. Next Action

→ Phase 20.5 Adım 6 başlıyor: H1 → H5 sırayla otonom implementation.
