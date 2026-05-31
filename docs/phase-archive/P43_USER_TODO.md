# P43 — Kullanıcı Yapılacaklar (Toplam ~5 dk)

Production'da hâlâ eksik 3 madde. Her biri 1-2 dakika.

## 1. Sentry DSN — ⚠️ ACİL (kullanılan değer geçersiz)

`.env.production` içindeki `VITE_SENTRY_DSN` ve `SENTRY_DSN` değerleri Sentry dashboard URL'i, gerçek DSN değil. SDK init başarısız oluyor → hata izleme çalışmıyor.

**Doğru DSN biçimi:**

```
https://<PUBLIC_KEY>@o<ORG_ID>.ingest.sentry.io/<PROJECT_ID>
```

**Adım:** Sentry → Settings → Projects → ecypro-web → Client Keys (DSN) → kopyala → Vercel + Render env'larında `VITE_SENTRY_DSN` ve `SENTRY_DSN` değerlerine yapıştır → redeploy.

## 2. Google Search Console verification

`index.html`'e P43'te placeholder eklendi:

```html
<meta name="google-site-verification" content="REPLACE_WITH_GSC_TOKEN" />
```

**Adım:** Search Console → Property → "HTML tag" yöntemi → verification token kopyala → `index.html` içinde `REPLACE_WITH_GSC_TOKEN` yerine yapıştır → commit + push → verify butonu.

## 3. (Opsiyonel) Lighthouse LCP iyileştirme

Mobile LCP 3.07s (hedef ≤2.5s). Yapı temiz (0 unused JS, 0 render-block), ama hero hydration geç. İki seçenek:

**(a)** Hero kullandığı varsa `<img fetchpriority="high">` ekle (Hero.tsx'te ana görsel için)
**(b)** Render origin'e `<link rel="preconnect" href="https://ecypro-api.onrender.com" crossorigin>` ekle → cold-start ping erken atlatır (40-60s)

## Halihazırda Çalışan (Aksiyon Gerekmez)

- ✅ GA4 `G-89FNB9PWE5` aktif, gtag yükleniyor
- ✅ GTM script load ediliyor
- ✅ Backend `/api/health` 200 OK
- ✅ Telegram bot env değişkenleri set (contact form smoke için CSP fix deploy sonrası tetiklenecek)
- ✅ Vercel auto-deploy çalışıyor
- ✅ Render service up (free tier cold start 30-50s normal)
- ✅ Sitemap + robots.txt valid (200, hreflang TR/EN/x-default)
- ✅ OG tags + Twitter cards + canonical hepsi present

## P43 Otomatik Düzeltmeler (kodda yapıldı, deploy sonrası aktif)

- `vercel.json` → `connect-src` CSP'ye `ecypro-api.onrender.com` eklendi (contact formu engelleniyordu)
- `index.html` → CSP same fix
- `vercel.json` → `/assets/(lp|lc).js` için cache `must-revalidate` (immutable + non-hash kombinasyonu kullanıcıları 1 yıl eski JS bundle'a kilitliyordu)
- `index.html` → GSC verification meta placeholder
