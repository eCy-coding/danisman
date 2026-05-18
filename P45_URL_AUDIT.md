# P45 — Live URL Audit (2026-05-17)

**Kapsam:** 20 sayfa, masaüstü + 1 mobil. Site: `https://www.ecypro.com` (production, son commit `05ae19b`).

## URL Inventory (sitemap'ten)

| Tür | Sayı | Örnek |
|---|---|---|
| Core sayfalar | 10 | `/`, `/services`, `/about`, `/pricing`, `/contact`, `/blog`, `/case-studies`, `/team`, `/faq`, `/methodology` |
| Service detail | 13 | `/services/strategic-transformation`, `/services/mergers-acquisitions`, vb. |
| Blog posts | 34 | `/blog/lean-ai-operational-excellence`, vb. |
| Case study | 6 | `/case-studies/tech-scaleup-operational-excellence`, vb. |
| Legal | 4 | `/privacy`, `/terms`, `/cookie`, `/data-rights` |
| Diğer | 8 | `/locations`, `/partners`, `/careers`, `/events`, `/founder`, `/industries`, `/login`, `/register` |
| **Toplam** | **~75** | (sitemap'te ~50 entry; service detail ve admin'ler hariç) |

**Status:** Tüm test edilen URL'ler HTTP 200. SPA olduğu için `/404` bile 200 döner ama React NotFoundPage render etmesi gerek.

## Sayfa-Sayfa Audit (test edilen 20)

### ✅ Çalışan / Production-ready

| URL | Visible content | Notlar |
|---|---|---|
| `/` | Hero "Vizyon. Strateji. Sürdürülebilir Sonuç." + persona toggle + 5+/120+ stats + toast | ✅ P42 içerik canlı |
| `/services` | Hero "Entegre Danışmanlık Ekosistemi" + filter chip'ler | ✅ Servis listesi mevcut |
| `/services/strategic-transformation` | Stratejik Dönüşüm hizmet detayı + "5 Live Viewers" badge + "15 dk ücretsiz görüşme" CTA + Kazanımlar listesi | ✅ Detay sayfaları çalışıyor |
| `/contact` | Form (Ad Soyad / Email / Konu / Mesaj) + info@ecypro.com + 7/24 + Telefon | ✅ Form mevcut, **🔴 telefon fake** (`+902125550000`) |
| `/about` | Hero "Dünyanın En İyi Danışmanlık Firmalarından Biri" + giriş paragrafı | 🟡 İddialı hero (P42'de fix edilmedi) |
| `/pricing` | "Şeffaf Fiyatlandırma" hero + billing toggle | ✅ Layout ok; **🟡 `pricing.json` `yearlyDiscount: %20 tasarruf` ama PricingPage.tsx'te annual=monthly (tutarsızlık)** |
| `/locations` | İstanbul "Levent, Büyükdere Cd" + Londra "Canary Wharf" + 2 telefon | 🟡 Telefon fake (`+90 212 555 0000`, `+44 20 7946 0500`); adres fake |
| `/partners` | "Strategic Alliances" + Oracle/Microsoft/Salesforce/SAP partner kartları | 🟡 **Tamamen MOCK partnership** — gerçek partnership yok |
| `/careers` | "Kariyer" + "Açık Pozisyonlar / Currently no open positions" | 🟡 TR-EN mix; profesyonel görünüm yok |
| `/events` | "Etkinlikler" + "Kurumsal AI Stratejisi 2026 Yol Haritası" webinar kartı | 🟡 Mock event |
| `/privacy` | KVKK/GDPR Gizlilik Politikası — uzun içerik + İçindekiler nav | ✅ İçerik var; **🟡 "TASLAK — AVUKAT ONAYINDAN GEÇMEMİŞTİR" banner — yayına çıkmadan önce hukuk onayı gerek** |
| `/login` | "Giriş Yap" formu | 🟡 Stillenmemiş, çok dark; layout sorunu |
| `/team` | "Liderlik" hero + 6+ uzman partner / 12 ülke / 65+ yıl deneyim / 150+ proje | 🟡 **Yanlış stats** (P42'de `/about` düzeltildi, `/team` ayrı page eski mock'u koruyor) |

### 🔴 KRITIK — bozuk / boş

| URL | Sorun |
|---|---|
| `/blog` | Liste sayfası BOŞ ("Bu filtreyle eşleşen yazı bulunamadı") — sitemap'te 34 post var, listing sayfa data fetch fail |
| `/blog/lean-ai-operational-excellence` | "Makele Bulunamadı" — blog post detail sayfası slug'ı tanımıyor (mdx loader fail veya routing typo) |
| `/blog/premium-consulting-komoditelesemez` | Aynı — P44'te yarattığım yeni blog detail erişilemez |
| `/case-studies` | Sayfa tamamen BOŞ — sadece tab filter chip'leri görünür, case listesi yok |
| `/case-studies/tech-scaleup-operational-excellence` | Sayfa tamamen BOŞ — detail render etmiyor |
| `/founder` | TAMAMEN siyah ekran (404 fallback) — route eksik veya page component yok |
| `/data-rights` | TAMAMEN siyah ekran — aynı |
| `/this-page-does-not-exist` (404) | TAMAMEN siyah ekran — NotFoundPage render etmiyor (P43'te conflict resolve'ında bozulmuş olabilir) |
| `/faq` | "Question 1?", "Question 2?", "Question 3?" PLACEHOLDER soruları, hiç cevap yok |
| `/methodology` | "Yaklaşımımız" başlık + tek alt-başlık sonrası tamamen BOŞ |

### Mobile (375×812)

| URL | Sonuç |
|---|---|
| `/` | Screenshot 1512px'de (resize aktif değil) — desktop layout görünüyor. Test inconclusive. |

## Issue Breakdown

### Top 10 CRITICAL (🔴)
1. **`/blog` listesi BOŞ** — 34 post var ama data fetch fail. (`src/pages/BlogPage.tsx` veya `blog-posts.json` import sorunu)
2. **`/blog/<slug>` 404** — tüm blog detail sayfaları "Makele Bulunamadı". MDX content loader veya routing
3. **`/case-studies` listesi BOŞ** — `src/data/mockCaseStudies.ts` import edilmiyor olabilir
4. **`/case-studies/<slug>` BOŞ** — detail page route mismatch
5. **`/404` (NotFound) ekran siyah** — NotFoundPage render etmiyor; P43 conflict resolve'da bozulmuş
6. **`/founder` rotası yok** — link footer/about'tan veriliyor mu? Belirsiz
7. **`/data-rights` BOŞ** — DataRightsPage component sorun
8. **`/faq` placeholder sorular** — "Question 1/2/3?" → gerçek FAQ yok
9. **`/methodology` BOŞ** — sadece başlık, içerik yok
10. **`/team` yanlış stats** — `6+ partner / 12 ülke / 65+ yıl / 150+ proje` (P42 about'taki conservative değerlerle çelişiyor)

### Top 10 MAJOR (🟡)
1. **`/contact` telefon `+902125550000`** — fake placeholder
2. **`/locations` 2 telefon + adres** — fake placeholders
3. **`/partners` Oracle/Microsoft/Salesforce/SAP** — gerçek olmayan partnership
4. **`/pricing` yearly toggle `%20 tasarruf` iddiası** — gerçek indirim yok (PricingPage.tsx annual=monthly)
5. **`/about` hero "Dünyanın En İyi Danışmanlık Firmalarından Biri"** — fazla iddialı
6. **`/careers` TR-EN mix** — "Currently no open positions" English copy
7. **`/privacy` "Draft" banner** — yayına çıkmadan önce hukuk onayı uyarısı
8. **`/login` styling broken** — extra dark, form alanları zor okunuyor
9. **Hero `Welcome Back` toast "yalnızca 3 slot kaldı"** — fake urgency
10. **`pricing.json` `Demo Talep Et` CTA** — demo demek için consulting'de yanlış vocab

### Minor (🟢)
- ~30 minor: animasyon fade-in screenshot timing'i, cookie banner over-prominent, font weight inconsistency, breadcrumb hover state, modulepreload race vs lazy import

## Placeholder Inventory (P42 audit'inden kalanlar)

| Lokasyon | İçerik |
|---|---|
| `index.html:28` | `<meta name="google-site-verification" content="REPLACE_WITH_GSC_TOKEN">` |
| `.env.production` | `VITE_SENTRY_DSN` dashboard URL (DSN format yanlış) |
| `src/pages/RegisterPage.tsx:77` | "John Doe" placeholder |
| `public/locales/en/contact.json:14` | "John Doe" placeholder |
| `src/components/dashboard/DashboardGrid.tsx` | `PlaceholderWidget` "Example Demo" |
| `public/indexnow-key-PLACEHOLDER.txt` | Bing IndexNow key eksik |
| `src/services/emailService.ts:54` | "Demo Modu — simüle" notification |
| `data/copy/pages.ts` veya `LocationsPage.tsx` | İki fake telefon, iki fake adres |

## Önerilen Sıralı Düzeltme Planı

### Sprint A — Kritik Içerik Routing/Data (🔴, 1 saat)
1. **`/blog` data fetch** — `BlogPage.tsx`'i `src/data/blog-posts.json` import edip listele. Şu an muhtemelen MDX glob veya generated index eksik.
2. **`/blog/<slug>` MDX route** — `src/pages/BlogPostPage.tsx`'te slug → MDX content fetch çalışmıyor. `src/content/blog/*.mdx` dosyaları + import.meta.glob veya generated index gerek.
3. **`/case-studies` + `/case-studies/<slug>`** — `mockCaseStudies.ts` import path doğru mu? Page'ler kontrol et.
4. **`/404` NotFoundPage** — P43 conflict resolve'da broken; component import veya layout sorunu.
5. **`/founder`, `/data-rights`** — Route eklenmemiş veya page boş; ya kaldır (yönlendirme) ya implement et.
6. **`/faq` gerçek sorular** — `FAQ_COPY` constants veya MDX'le doldur.
7. **`/methodology` içerik** — `METHODOLOGY_COPY` zaten var (`pages.ts`), MethodologyPage import etmiyor olabilir.

### Sprint B — Mock İçerik Cleanup (🟡, 30 dk)
1. **`/partners` removal** — Oracle/MS/SAP fake kartları kaldır; sayfayı "Geliştirme aşamasında" 1-paragraflık placeholder yap veya navigation'dan gizle.
2. **`/contact` + `/locations` telefonlar** — `+902125550000` ve diğer fake'leri kaldır; sadece `info@ecypro.com` bırak.
3. **`/about` hero** — "Dünyanın En İyi Danışmanlık Firmalarından Biri" → "Premium Consulting Pratiği · eCyverse Ekosistemi"
4. **`/team` stats** — P42 about'taki conservative değerlerle senkronize (`120+ Stratejik Karar / 12+ Sektör / 5+ Yıl / 95%*`).
5. **`/pricing` yearly toggle** — Ya gerçek %20 indirim hesabı ekle, ya da `yearlyDiscount` text'i kaldır.
6. **Hero `Welcome Back` toast** — "yalnızca 3 slot kaldı" countdown timer kaldır.
7. **`/events` mock event** — Hide veya "Yakında" placeholder.
8. **`/careers`** — Türkçe "Şu an açık pozisyon yok" + English fallback.

### Sprint C — Auto-fixable single-commit (🟢)
| # | Dosya | Fix | AUTO_FIXABLE |
|---|---|---|---|
| 1 | `src/data/copy/pages.ts` | TEAM stats sync with P42 about | Y |
| 2 | `src/pages/AboutPage.tsx` hero text | "Dünyanın En İyi" → eCyverse copy | Y |
| 3 | `src/pages/ContactPage.tsx` veya `pages.ts` | Telefon kısmını kaldır | Y |
| 4 | `src/pages/LocationsPage.tsx` | İki adres+telefon kartını kaldır | Y |
| 5 | `src/pages/PartnersPage.tsx` | Oracle/MS/Salesforce/SAP kartlarını sil → "Coming soon" | Y |
| 6 | `public/locales/*/faq.json` veya `FAQ_COPY` | Question 1/2/3 placeholder yerine gerçek SSS | Y |
| 7 | `src/components/sections/Hero.tsx` (Welcome Back toast) | Countdown timer kaldır | Y |
| 8 | `src/pages/MethodologyPage.tsx` | `METHODOLOGY_COPY` import edip render | Y |
| 9 | `src/pages/NotFoundPage.tsx` | render kontrol; layout fix | Y |
| 10 | `src/pages/BlogPage.tsx` | `blog-posts.json` import + map liste | Y |

## Screenshot Yolları (workspace)

| Sayfa | Screenshot ID |
|---|---|
| Home desktop | `ss_2358z270j` |
| Services list | `ss_79501ag15` |
| About | `ss_3610sphyg` |
| Pricing | `ss_9283r7vjp` |
| Contact form | `ss_4713kdb42` |
| Blog list (BOŞ) | `ss_0316x0xv3` |
| Case studies (BOŞ) | `ss_5883d9x5s` |
| Blog post (404) | `ss_1488ojb8b` |
| Case study detail (BOŞ) | `ss_6953ovxyy` |
| Service detail | `ss_2681m63fy` |
| Team | `ss_82854shpk` |
| FAQ (placeholder) | `ss_3956jn3v0` |
| Methodology (BOŞ) | `ss_9581ddlhc` |
| 404 (BOŞ) | `ss_5175cpe1n` |
| Locations | `ss_0606kskwl` |
| Partners (fake) | `ss_6240v2mv4` |
| Careers | `ss_1838chb3z` |
| Privacy | `ss_7485mogx8` |
| Events | `ss_3068lahkq` |
| Login | `ss_87335rr6w` |
| Founder (BOŞ) | `ss_3672d20xx` |
| Data Rights (BOŞ) | `ss_9290eixb8` |
| Blog post premium-consulting (404) | `ss_4914hz2kl` |
| Mobile home | `ss_0575dv9zc` |

## Verdict

**🟡 SARI** — Yayında ama %30+ sayfa BOŞ veya CRITICAL. Önceliklendirme:

1. **🔴 İlk öncelik (Sprint A, 1 saat):** Blog + Case Studies + Methodology + FAQ + NotFoundPage routing/data fetch
2. **🟡 İkinci öncelik (Sprint B, 30 dk):** Mock partnerships, fake telefon/adres, yanıltıcı stats, urgency toast
3. **🟢 Üçüncü öncelik (Sprint C):** Auto-fixable single commits — 10 madde, her biri ≤10 satır değişiklik

Şu an yayında olan **homepage / pricing / contact / services list** çalışıyor → genel marketing yeterli. AMA blog (SEO + content marketing değeri) tamamen kullanılamaz durumda, **bu kritik bir gap**.
