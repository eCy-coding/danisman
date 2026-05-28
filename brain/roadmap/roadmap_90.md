# Roadmap 90 — PHASE 39: i18n + International SEO ✅ TAMAMLANDI (kod)

**Tier:** 3 (ORTA) · **Skor:** 2.4 · **Süre:** 1 hafta · **Todo:** T81-T90

> **Reconcile 2026-05-29 (premise-verify):** 9/10 todo kodda hazır bulundu —
> hreflang (`src/components/seo/Hreflang.tsx`), locale routing (`LocaleRoute.tsx`),
> currency (`src/stores/currencyStore.ts` + `CurrencySwitcher.tsx`), intl Schema.org
> (`src/lib/seo/organization-schema.ts` areaServed/availableLanguage), i18next ICU
> (`i18next-icu` + `src/lib/i18n-react.ts`), TMS (`brain/i18n/memory.json` +
> `scripts/i18n-suggest.ts`), RTL scaffold (`src/lib/rtl.ts`), multilingual sitemap
> (`sitemap-tr/en/index.xml`). Gerçek delta = **dead duplicate** `src/lib/stores/currencyStore.ts`
> (0 importer; canlı store `src/stores/currencyStore.ts`) silindi. **T06** GSC International
> Targeting = owner dashboard aksiyonu (Phase B).

**Stratejik Hedef:** TR + EN bilingual production-grade SEO. hreflang, locale-specific URL, currency, schema.org international compliance.

**Mevcut Durum:** i18next 4 namespace × 2 dil (8 JSON) var (Phase 20). TR/EN bilingual content (6 case + 8 blog) var. Ancak hreflang tags + URL strategy + currency switcher eksik.

---

## ✅ P39-T01 (T81): hreflang Tag Her Sayfa

- **NEDEN:** Google multilingual site'lar için hreflang bilmek zorunda. Yanlış/eksik hreflang = wrong-language SERP. Örn: İngiliz user TR sayfayı görebilir.
- **ÖNEM:** P0 — Bilingual SEO foundation.
- **YÖNTEM:** Her sayfa için `<link rel="alternate" hreflang="tr" href="https://ecypro.com/tr/...">` + `<link rel="alternate" hreflang="en" href="https://ecypro.com/en/...">` + `<link rel="alternate" hreflang="x-default" href="https://ecypro.com/">`. `src/components/seo/Hreflang.tsx` component (route-aware). `react-helmet-async` ile inject.
- **TEST:** `curl -s https://ecypro.com/tr/services | grep hreflang | wc -l` → 3 tag. GSC → International Targeting → "No errors". `https://technicalseo.com/tools/hreflang/` checker green.

## ✅ P39-T02 (T82): TR/EN URL Strategy (Path-Based)

- **NEDEN:** Şu an dil switcher i18next client-side (URL değişmiyor). SEO için `/tr/services` + `/en/services` path-based URL strategy gerekli (Google her dili ayrı sayfa indexler).
- **ÖNEM:** P0 — Bilingual SEO core decision.
- **YÖNTEM:** React Router path param: `/:locale(tr|en)/*` → `useParams` locale → i18next setLanguage. Fallback: no locale in URL → detect browser → redirect `/` → `/tr` veya `/en`. Vercel config redirect. Sitemap'te her URL × 2 locale = 82 URL.
- **TEST:** `/tr/services` ve `/en/services` → farklı content (language). Browser locale EN → `/` → redirect `/en/`. Sitemap URL sayısı 41 → 82.

## ✅ P39-T03 (T83): Locale-Specific Content (Kültürel Adaptation)

- **NEDEN:** TR EN kelime çevirisi yeterli değil. "Case study" TR'de "Vaka çalışması" değil "Başarı hikayesi" daha uygun. Example company names localize (TR → Turkish company, EN → global).
- **ÖNEM:** P1 — Conversion rate lokalize content'te 2× yüksek.
- **YÖNTEM:** Her locale için audit: (a) idiom/deyim uygun mu, (b) example names uygun (TR: "Şirket A", EN: "ACME Corp"), (c) currency (TRY / USD / EUR), (d) cultural references (TR'de "çay" EN'de "coffee"). `src/content/blog/*.mdx` bilingual review.
- **TEST:** Native TR speaker + native EN speaker review → "natural" rating 8+/10. Analytics engagement (time on page) iki dilde benzer.

## ✅ P39-T04 (T84): Currency Switcher (TRY / USD / EUR)

- **NEDEN:** Pricing page currency hardcoded. Uluslararası user için USD/EUR option. Otomatik detection (browser geolocation) default.
- **ÖNEM:** P1 — International pricing UX.
- **YÖNTEM:** `src/stores/currencyStore.ts` (Zustand): currency + rates. Rate source: ExchangeRate-API.com free tier (1500 req/month). Cache: localStorage + refresh daily. PricingPage component dynamic display. CurrencySwitcher top-right header.
- **TEST:** PricingPage TRY default → USD switch → price × rate displayed. Rate fallback: API fail → last cached rate. Geolocation US → default USD.

## ✅ P39-T05 (T85): International Schema.org (Country, Address, Organization)

- **NEDEN:** Organization schema'da `address`, `areaServed`, `availableLanguage` zorunlu international trust signal.
- **ÖNEM:** P2 — Schema enhancement.
- **YÖNTEM:** `src/lib/structured-data.ts` Organization builder update: `{address: {streetAddress, addressLocality: 'Istanbul', addressCountry: 'TR'}, areaServed: ['TR', 'EU', 'US'], availableLanguage: ['tr-TR', 'en-US']}`. LocalBusiness schema opsiyonel (fiziksel ofis varsa).
- **TEST:** `https://search.google.com/test/rich-results` homepage → Organization valid + address visible. GSC Enhancements → Organization "Valid".

## ✅ P39-T06 (T86): GSC International Targeting

- **NEDEN:** GSC'de "International Targeting" section'da ülke/dil preferansları belirtilmeli. Aksi halde Google global gösterme eğiliminde.
- **ÖNEM:** P2 — GSC optimization.
- **YÖNTEM:** GSC → Legacy Tools → International Targeting: (a) Country → "Turkey" (if TR-focused) veya "Unlisted" (global). (b) Language → hreflang'tan auto-read. Single domain strategy için "Unlisted" tercih (global reach).
- **TEST:** GSC International Targeting "No errors" + country preference set (optional).

## ✅ P39-T07 (T87): i18next ICU MessageFormat (Plurals/Gender)

- **NEDEN:** Plural formats "1 hour" vs "2 hours" vs Turkish "1 saat" / "2 saat" (no plural) — ICU MessageFormat standart.
- **ÖNEM:** P2 — Proper i18n grammar.
- **YÖNTEM:** `i18next-icu` package. JSON locale files ICU syntax: `"bookingDuration": "{count, plural, one {# saat} other {# saat}}"`. Component usage: `t('bookingDuration', {count: 2})`. Gender, date, number formatting ICU.
- **TEST:** `t('bookingDuration', {count: 1})` → "1 saat" (TR) / "1 hour" (EN). `count: 5` → "5 hours" (EN plural). Dates/numbers locale-aware.

## ✅ P39-T08 (T88): Translation Memory (TMS Lite)

- **NEDEN:** Translator/editor için aynı string'in önceki çevirisine erişim. Enterprise'da Phrase/Lokalise ama MVP için basit TMS yeterli.
- **ÖNEM:** P2 — Translation consistency.
- **YÖNTEM:** JSON-based TMS: `brain/i18n/memory.json` — her source string için tüm target dillerdeki çeviriler + metadata (context, last updated). `scripts/i18n-suggest.ts` → new key için similar source match → suggestion.
- **TEST:** "Book a meeting" → memory.json "Randevu al / Görüşme planla" (2 variants) → suggestion. Translator consistency improved.

## ✅ P39-T09 (T89): RTL Support Scaffold (Arabic Future)

- **NEDEN:** Arabic / Hebrew / Persian RTL dilleri için hazırlık. Şu an TR/EN LTR ama Middle East expansion ihtimali için infrastructure.
- **ÖNEM:** P2 — Future-proofing.
- **YÖNTEM:** Tailwind CSS v4 logical properties: `me-4` (margin-end) `ms-4` (margin-start) `text-start` `text-end`. `dir="rtl"` HTML attr locale-based. `src/main.tsx` i18next change event → `document.dir = locale.dir`. Testing RTL: `/ar/` route scaffold.
- **TEST:** LTR layout unchanged (TR/EN). `/ar/` (stub) → RTL layout mirror. No Arabic content, sadece infrastructure.

## ✅ P39-T10 (T90): Multilingual Sitemap Split

- **NEDEN:** Tek sitemap.xml'de 82 URL (41 × 2). Google sitemap index daha temiz. `sitemap-tr.xml` + `sitemap-en.xml` + `sitemap-index.xml`.
- **ÖNEM:** P2 — Sitemap organization + debugging.
- **YÖNTEM:** `scripts/generate-sitemap.ts` update: per-locale sitemap generate + sitemap index file. `robots.txt` → `Sitemap: sitemap-index.xml`. GSC'de her sitemap ayrı submit (daha granular coverage reporting).
- **TEST:** `curl https://ecypro.com/sitemap-tr.xml` → 41 URL `hreflang="tr"`. `sitemap-index.xml` → 2 child sitemap. GSC submit 2 + index.

---

## Phase 39 Kapatma Kriterleri

- [x] 9/10 todo kod `✅` (T06 GSC International Targeting = owner, Phase B)
- [x] hreflang (`src/components/seo/Hreflang.tsx` + `SeoManager.tsx`)
- [x] `/:locale/` path-based routing (`src/components/routing/LocaleRoute.tsx`)
- [x] Locale-specific bilingual content (TR/EN MDX)
- [x] Currency switcher (`src/stores/currencyStore.ts` + `CurrencySwitcher.tsx`) — dead lib/ dup silindi
- [x] Organization schema address + areaServed (`src/lib/seo/organization-schema.ts`)
- [ ] GSC International Targeting (owner — Phase B)
- [x] i18next ICU plural/gender (`i18next-icu` + `src/lib/i18n-react.ts`)
- [x] Translation memory (`brain/i18n/memory.json` + `scripts/i18n-suggest.ts`)
- [x] RTL scaffold (`src/lib/rtl.ts`)
- [x] Multilingual sitemap split + index (`sitemap-tr/en/index.xml`)
- [ ] Tag: `git tag phase-39-closed` (merge sonrası)

**Bir Sonraki:** `roadmap_100.md` — Phase 40 Observability + DevOps (son faz).
