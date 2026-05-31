# eCyPro — Bilingual (TR + EN) Launch Report

> Track 4 — Resend e-posta şablonları (EN) + Playwright çift-dil QA.
> Tarih: 2026-05-22 · Branch: `feat/i18n-emails-qa-suite-report`

## TL;DR

| Alan | Durum |
|---|---|
| 5 transactional e-posta şablonu (TR + EN) | ✅ Eklendi, 22 unit test PASS |
| Playwright çift-dil smoke suite | ✅ 10/10 PASS (local preview build) |
| hreflang validator (Google-compliant) | ✅ 8/8 sayfa GREEN — **ön koşul: bir kök SEO bug'ı düzeltildi** |
| Lighthouse SEO (TR + EN, mobil) | ✅ 8/8 sayfa **SEO = 100** |
| Canonical self-reference (locale) | ❌ **Açık launch blocker** (per-page hardcoded canonical) |
| Prod deploy | ⚠️ Prod **eski build** serve ediyor — hreflang düzeltmesi deploy edilmeli |

---

## F1 — E-posta Şablonları (TR + EN)

Mevcut mimari korundu: `server/emails/templates.ts` saf tagged-template fonksiyonları
(`react-email` YOK — server bundle küçük kalsın). Her şablon `{ subject, html, text }`
döner ve `lang: 'tr' | 'en'` ile dallanır. Konu satırı (subject) her dilde lokalize.

Akış: `templates.ts` (render) → `server/queues/index.ts` (`EmailJobPayload` union)
→ `server/lib/mailer.ts` (dispatcher + `queue*` producer). Union exhaustiveness
(`never`) yeni şablon eklenince dispatcher'ı derleme zamanı zorluyor.

| # | Şablon (`type`) | TR konu | EN konu |
|---|---|---|---|
| 1 | `founder-letter` | eCyPro'ya Hoş Geldiniz | Welcome to eCyPro |
| 2 | `quickcheck-result` | KVKK Hızlı Kontrol Sonuçlarınız | Your KVKK Quick Check Results |
| 3 | `pricing-inquiry-ack` | Talebiniz Alındı — eCyPro | Your inquiry has been received — eCyPro |
| 4 | `discovery-confirmed` | Discovery Call Onayı — eCyPro | Discovery Call Confirmed — eCyPro |
| 5 | `generic-notif` | (dinamik başlık) | (dinamik başlık) |

- `quickcheck-result` opsiyonel PDF eki (`pdfBase64`) destekler — KVKK rapor PDF'i.
- Tüm kullanıcı değişkenleri (`firstName`, `company`, `heading`, `message`) HTML-escape edilir
  (mevcut `escapeHtml`/`escapeAttr` — `javascript:`/`data:` URL şemaları reddedilir).
- KVKK/GDPR: KVKK Hızlı Kontrol şablonu uyum dili içerir; GDPR şablonları (mevcut) Madde 17/20 atıfları.
- Yan düzeltme: `baseLayout` artık `lang` parametresi alıyor; eski `title.length > 0 ? 'en' : 'tr'`
  hatası (her zaman `en` üretiyordu) düzeltildi → `<html lang>` doğru.

Producer API:
```ts
await queueFounderLetter(to, firstName, 'en');
await queueQuickCheckResult(to, company, 'tr', pdfBase64);
await queuePricingInquiryAck(to, firstName, 'en');
await queueDiscoveryConfirmed(to, '5 Haziran 2026', 'tr');
await queueGenericNotification(to, heading, message, 'en', { url, label });
```

Test: `npx vitest --config vitest.server.config.ts --run server/emails/templates.test.ts`
→ **22 passed** (escape, lokalizasyon, `<html lang>`, CTA).

---

## F2 — Playwright Çift-Dil Smoke Suite

`scripts/qa/bilingual-smoke.spec.ts` + `playwright.bilingual.config.ts`.
Hedef `BASE_URL` (varsayılan `http://localhost:4173` = test edilen build; prod için override).

Her locale (`tr`, `en`) için:

| Test | Doğrulama | Sonuç |
|---|---|---|
| `<html lang>` | URL locale ile eşleşir | ✅ |
| hreflang | tr-TR + en + x-default mevcut (≥3) | ✅ |
| canonical | mevcut + absolute https eCyPro URL | ✅ |
| dil değiştirici | `language-toggle` locale'e doğru `aria-label` | ✅ |
| çerez banner | accept metni locale'e doğru (Kabul Et / Accept) | ✅ |

**10/10 PASS.** Gerçek seçiciler kullanıldı (`data-testid="language-toggle"`,
`data-testid="cookie-banner"`/`cookie-accept-all`) — spec'teki varsayımsal
`aria-label="English"` seçicileri uygulamayla uyuşmadığı için terk edildi.

Çalıştır: `npx playwright test --config playwright.bilingual.config.ts`

---

## F3 — Lighthouse (Her İki Locale, Mobil)

`scripts/qa/lighthouse-bilingual.sh` (BASE_URL parametrik). Local preview build:

| Locale | Path | Performance | SEO |
|---|---|---:|---:|
| tr | / | 74 | **100** |
| tr | /services | 67 | **100** |
| tr | /pricing | 70 | **100** |
| tr | /about | 67 | **100** |
| en | / | 65 | **100** |
| en | /services | 70 | **100** |
| en | /pricing | 62 | **100** |
| en | /about | 63 | **100** |

**SEO = 100 her iki locale'de, hedef (≥95) aşıldı** (hreflang düzeltmesi sayesinde).
Performance 62-74: ayrı bir konu (perf-optimizer kapsamı), Track 4 dışı; local
preview ölçümü (prerender'sız) gerçek prod CDN performansını yansıtmaz.

---

## F4 — hreflang Validator (Google-Compliant)

`scripts/qa/hreflang-validator.ts` — SPA olduğu için `fetch`+jsdom yerine
**headless Chromium** ile hydrated DOM okur (Googlebot WRS gibi). 8 sayfa × kontrol:
tr-TR / en / x-default mevcut, href'ler absolute https, mevcut locale self-referenced.

```
PAGE                  tr-TR en  x-def abs  self  RESULT
/tr                     ✓    ✓   ✓    ✓    ✓   PASS
/tr/services            ✓    ✓   ✓    ✓    ✓   PASS
/tr/pricing             ✓    ✓   ✓    ✓    ✓   PASS
/tr/about               ✓    ✓   ✓    ✓    ✓   PASS
/en … (×4)              ✓    ✓   ✓    ✓    ✓   PASS
✅ GREEN — 8/8 pages compliant
```

Çalıştır: `npx tsx scripts/qa/hreflang-validator.ts` (exit 0 = green).

---

## Kök Sebep Düzeltmeleri (Bilingual SEO)

QA suite kurulurken çift-dil SEO'yu kıran iki kök bug ortaya çıktı. İlki düzeltildi
(track'in çekirdeği), ikincisi kapsam dışı — aşağıda belgelendi.

### ✅ DÜZELTİLDİ — hreflang hiç render olmuyordu

**Belirti:** prod + local build'de yalnızca tek statik `x-default` (`www.ecypro.com/`)
vardı; `tr-TR` ve `en` alternatif'leri yoktu → Google dil varyantlarını göremez.

**Kök sebep:** `SeoManager.tsx` `react-helmet-async`'ten import ediyordu; bu paket
React 19'da head'e flush etmiyor (zaten P46 C2'de imperatif `src/lib/seo-helmet.tsx`
shim'i bu yüzden yazılmış). hreflang YALNIZCA ölü `SeoManager` içinde tanımlıydı →
hiç DOM'a girmiyordu. Ayrıca shim, `<link rel="alternate">` etiketlerini sadece `rel`'e
göre dedupe ediyordu → 3 alternatif tek selector'a çöküyordu.

**Düzeltme (cerrahi, 2 dosya):**
1. `src/lib/seo-helmet.tsx` — alternate link'ler `rel`+`hreflang` ile key'lenir (bir arada yaşar).
2. `src/components/seo/SeoManager.tsx` — import çalışan shim'e çevrildi; hreflang doğrudan
   `<Helmet>` child olarak verildi (IIFE/Fragment shim'de flatten edilmiyor). Path'e bağlı
   `canonical` + `og:url` SeoManager'dan KALDIRILDI (per-page SEO sahip; override önlenir),
   böylece davranış değişikliği yalnızca eksik hreflang'i eklemekle sınırlı.

Doğrulama: validator 8/8 GREEN, Lighthouse SEO 100.

### ✅ DÜZELTİLDİ — Çerez onayı tarayıcı diline bağlıydı (KVKK)

`src/components/CookieBanner.tsx` `lang`'ı `navigator.language`'tan türetiyordu →
`/tr` URL'inde İngilizce tarayıcıyla İngilizce onay metni. KVKK için onay dili sitenin
seçili locale'ini (URL `/tr`|`/en`, i18n) izlemeli. `lang` artık `i18n.language`'tan
türetiliyor (LocaleRoute URL'e senkronize eder).

### ❌ AÇIK — Canonical "collapse" (launch blocker, kapsam dışı)

Per-page canonical'lar **hardcoded**, non-www ve locale-stripped
(örn. `src/pages/ServicesPage.tsx:141` → `https://ecypro.com/services`). Sonuç:
`/tr/services` ve `/en/services` aynı tek non-locale URL'e canonical veriyor → her iki
dil tek URL'e collapse, hreflang sinyaliyle çelişiyor (Google hreflang'i yok sayabilir).
Ek olarak www tutarsızlığı (anasayfa www, alt sayfalar non-www).

**Öneri (ayrı PR):** canonical her locale için self-referential olmalı
(`https://www.ecypro.com/{locale}{path}`), www tutarlı. ~100 sayfada hardcoded olduğu için
merkezi bir SEO bileşenine taşınıp regression test edilmeli.

### ⚠️ NOT — Çift çerez banner + prod stale

- İki `CookieBanner` mount ediliyor (`App.tsx` + `MainLayout.tsx`), ikisi de aynı
  `data-testid="cookie-banner"` → DOM'da yinelenen banner. Tek kaynağa indirilmeli (ayrı iş).
- Prod (`ecypro.com`) bu düzeltmeleri içermeyen eski build serve ediyor; hreflang prod'da
  hâlâ tek `x-default`. **Bu branch deploy edilince düzelir.**

---

## LanguageSwitcher Erişilebilirlik Denetimi

`src/components/ui/LanguageToggle.tsx`:
- ✅ `<button>` semantiği, `min-h-11 min-w-11` (≥44px dokunma hedefi), `aria-label`
  locale'e duyarlı (TR→"Switch language to English", EN→"Dili Türkçe'ye değiştir"),
  `title` ipucu, `Globe` ikonu `aria-hidden`.
- ⚠️ Toggle yalnızca `i18n.changeLanguage` çağırıyor; **URL'i değiştirmiyor**. `/tr`
  üzerinde EN'e geçince LocaleRoute i18n'i tekrar URL locale'ine (`tr`) senkronize edeceği
  için toggle ile LocaleRoute çatışabilir. Doğru UX: toggle `/en{path}`'e navigate etmeli.
  (Davranışsal değişiklik — ayrı iş; bu track'te smoke testi gerçek kontrata göre yazıldı.)

---

## Çalıştırma Özeti

```bash
# E-posta şablon testleri
npx vitest --config vitest.server.config.ts --run server/emails/templates.test.ts

# Çift-dil smoke (test edilen build / prod)
npx playwright test --config playwright.bilingual.config.ts
BASE_URL=https://ecypro.com npx playwright test --config playwright.bilingual.config.ts

# hreflang validator
npx tsx scripts/qa/hreflang-validator.ts

# Lighthouse her iki locale
scripts/qa/lighthouse-bilingual.sh
```
