# EcyPro Analytics — Geliştirici Rehberi

Bu doküman, yeni bir analytics event eklerken izlenecek prosedürü ve event taxonomy'sini açıklar. Hedefi: dashboard ve attribution akışı bozulmadan event sayısının zamanla katlanabilmesini sağlamak.

---

## 1) Hızlı başlangıç

```ts
import { emit } from '@/lib/analytics-events';

// Type-safe — payload eksik veya yanlışsa compile error
emit('cta_click', { cta_name: 'Hero CTA', cta_location: 'hero' });
emit('form_submit', { form_id: 'contact', success: true });
```

`emit()` her event'e otomatik olarak şunları ekler:

- `timestamp` (ISO)
- `path` (`window.location.pathname`)
- `title` (sayfa başlığı, 120 char clamp)
- `language` (`tr` | `en`, html lang'den)
- `event_category` (event adından otomatik mapping)

---

## 2) Event eklerken

`src/lib/analytics-events.ts` içinde **3 yerde** değişiklik:

1. **`EventName` union'a ekle** — snake*case, `<category>*<verb>`:

   ```ts
   export type EventName =
     | 'page_view'
     | ...
     | 'my_new_event';  // ← ekle
   ```

2. **`EventMap` interface'ine payload tipini ekle**:

   ```ts
   export interface EventMap {
     ...
     my_new_event: { item_id: string; count: number };
   }
   ```

3. **`EVENT_CATEGORY` map'ine ekle**:
   ```ts
   export const EVENT_CATEGORY: Record<EventName, EventCategory> = {
     ...
     my_new_event: 'engagement',
   };
   ```

Artık `emit('my_new_event', { item_id: 'x', count: 3 })` type-checked.

---

## 3) Naming kuralları

| Pattern                           | Örnek                                                                      |
| --------------------------------- | -------------------------------------------------------------------------- |
| `<category>_<verb>` snake_case    | `cta_click`, `form_submit`                                                 |
| Plural değil singular             | `video_play` (NOT `videos_played`)                                         |
| Verb past tense yok               | `form_submit` (NOT `form_submitted`)                                       |
| Reserved GA4 event'lerinden kaçın | `page_view` OK (GA4 native), `purchase` kullanma — ecommerce taxonomy ayrı |

### Reserved (kullanma)

GA4 otomatik yarattığı + ecommerce taxonomy:

- `purchase`, `add_to_cart`, `begin_checkout`, `sign_up`, `login`, `search`, `select_content`, `view_item`, `add_to_wishlist`

Bunlar yerine: `lead_capture`, `form_submit` vs.

---

## 4) Kategori rehberi

| Kategori       | Ne zaman                                   | Örnek event                       |
| -------------- | ------------------------------------------ | --------------------------------- |
| **navigation** | Sayfa/route geçişleri, breadcrumb          | `page_view`, `route_change`       |
| **engagement** | İçerikle etkileşim, scroll, video          | `cta_click`, `faq_expand`         |
| **conversion** | Form, lead, booking, satın alma niyeti     | `form_submit`, `lead_capture`     |
| **error**      | Hata + kullanıcı görmesin/görsün her ikisi | `form_error`, `api_error`         |
| **system**     | App lifecycle + perf                       | `web_vital`, `app_loaded`         |
| **consent**    | Cookie/marketing tercih değişimi           | `consent_change`                  |
| **pwa**        | PWA install/offline                        | `pwa_install`, `pwa_offline_view` |

---

## 5) Payload kuralları

- **Snake_case** field isimleri — GA4 dashboard'ı camelCase'i parametre olarak göstermez.
- **PII YOK** — email, name, telefon yasak. Hashed lookup OK (`user_id` Sentry id ile aynı).
- **Max 25 custom dimension/event** — GA4 hard limit.
- **String value max 100 char** — uzun mesaj → truncate.
- **Number value** — sayısal metrik için `value` parametresi (GA4 sum/avg desteği).

---

## 6) Legacy helper'lar

`src/lib/analytics.ts` içindeki `trackCTA`, `trackForm`, `trackBooking`, `trackROICalc` çağrıları korunur. Yeni feature'lar `emit()` kullanır. Aşamalı migration:

```ts
// ESKİ (hâlâ çalışır)
trackCTA('Hero CTA', 'hero');

// YENİ (type-safe + future-proof)
emit('cta_click', { cta_name: 'Hero CTA', cta_location: 'hero' });
```

---

## 7) Test + doğrulama

Geliştirme modunda her `emit()` çağrısı:

- `Logger.debug` ile console'a log
- `window._last_analytics_event`'e yazılır → E2E test'ler okuyabilir

Playwright örnek:

```ts
await page.click('[data-testid="hero-cta"]');
const ev = await page.evaluate(() => window._last_analytics_event);
expect(ev?.action).toBe('cta_click');
expect(ev?.cta_location).toBe('hero');
```

---

## 8) Consent gating

Analytics consent verilmeden GA4'e event GİTMEZ (AnalyticsProvider GA4 init'i blokluyor). Ama `emit()` her zaman dev console + `_last_analytics_event` yazar — test akışları etkilenmez.

Consent revoke → GA4 unload → mevcut session sonlanır → yeni event'ler buffer'da kalır + drop edilir.

---

## 9) GA4 Custom Dimensions (kurulum)

Admin'in Sentry/GA4 panel'inde tanımlaması gereken custom dimensions (geçmişe dönük backfill yok):

| Dimension        | Event scope | Source param                        |
| ---------------- | ----------- | ----------------------------------- |
| Page Language    | event       | `language`                          |
| Page Title       | event       | `title`                             |
| CTA Name         | event       | `cta_name`                          |
| CTA Location     | event       | `cta_location`                      |
| Form ID          | event       | `form_id`                           |
| Form Success     | event       | `success`                           |
| Booking Step     | event       | `booking_step` (auto-mapped)        |
| ROI Step         | event       | `roi_step` (legacy) / `step` (yeni) |
| Vital Name       | event       | `name` (web_vital event'i için)     |
| Vital Rating     | event       | `rating`                            |
| Consent Category | event       | `category`                          |
| Consent Source   | event       | `source`                            |
| PWA Source       | event       | `source` (pwa_install\*)            |
| Lead Source      | event       | `source` (lead_capture)             |
| Lead Tier        | event       | `tier`                              |

GA4 Admin → Custom definitions → Custom dimensions → Create. Event scope, parameter name aynen (snake_case).

---

## 10) Yeni event eklenince yapılacaklar

1. `analytics-events.ts` 3 yere ekle (yukarıda Madde 2)
2. `docs/ANALYTICS.md` (bu dosya) → Madde 4'e örnek satır ekle
3. GA4 Admin → Custom Dimensions oluştur (eğer yeni param var)
4. Sentry breadcrumb category eklendi mi? `monitor.ts` / `rum.ts`'te ilgili `addBreadcrumb` çağrısı
5. PR'a `[analytics]` etiket ekle → reviewer taxonomy bozulmasın diye görsün

---

## 11) Anti-pattern listesi

❌ **YAPMA:**

- `emit('thing-clicked', ...)` — kebab-case → snake_case kuralını bozar
- `emit('contactFormSubmitted', ...)` — camelCase ve past tense
- `emitRaw('user_email_collected', { email: 'a@b.com' })` — PII leak
- 25'ten fazla custom param/event — GA4 reddeder
- Aynı event'i farklı param'larla çağırmak — dashboard breaks

✅ **YAP:**

- `emit('form_submit', { form_id: 'contact', success: true })`
- `emit('cta_click', { cta_name: 'Hero', cta_location: 'hero' })`
- `emit('lead_capture', { source: 'pricing_modal', tier: 'warm' })`

---

## 12) Sahip + iletişim

- **Taxonomy owner:** `@emre`
- **GA4 admin:** `@emre`
- **Dashboard owner:** `@emre`
- **Onay süreci:** Yeni event eklenince Slack `#analytics` kanalına bildirin (henüz yoksa Telegram admin kanalı).

---

**Son güncelleme:** 2026-05-16 (P13/5)
