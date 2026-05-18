# API — EcyPro Premium Consulting

> REST endpoint spesifikasyonları. Base URL: `https://api.ecypro.com/api`.

Tüm yanıtlar JSON. Auth gerektiren endpoint'lerde `Authorization: Bearer <jwt>` header beklenir. Tarihler ISO 8601 UTC. Hata yanıt zarfı: `{ status:'error', code, message, requestId, eventId, issues? }`.

## Sağlık

### `GET /api/health`
- **Auth:** none
- **Yanıt:** `{ status:'ok', uptime:<seconds>, db, redis, calcom, telegram, resend }`
- **Kullanım:** Load balancer + Render auto-health-check.

## İletişim

### `POST /api/contact`
- **Auth:** none — rate limit 5/15dk/IP.
- **Body:** `{ fullName, email, company?, phone?, service?, messageTr?, messageEn?, source? }`
- **Yanıt:** `201 { status:'success', id }`
- **Side effect:** ContactSubmission insert + Telegram notify + drip enroll (contact-followup-tr).

## Newsletter

### `POST /api/newsletter/subscribe`
- **Auth:** none — rate limit 5/saat/IP.
- **Body:** `{ email, consent: true, source? }`
- **Yanıt:** `201 SUBSCRIBED | 200 ALREADY_SUBSCRIBED | 200 RESUBSCRIBED`
- **Notes:** Double opt-in; subscriber consent=false ile insert edilir, confirm token gönderilir.

### `GET /api/newsletter/confirm/:token`
- **Auth:** none — HMAC token.
- **Yanıt:** 302 redirect → `/newsletter/confirmed` (success) veya `/newsletter/invalid-token`.
- **Side effect:** consent=true + welcome drip enroll.

### `GET /api/newsletter/unsubscribe/:token`
- **Auth:** none — HMAC token (1 yıl geçerli).
- **Yanıt:** 302 redirect → `/newsletter/unsubscribed`.

### `POST /api/newsletter/feedback`
- **Auth:** none — rate limit 5/15dk/IP.
- **Body:** `{ email, reason?, category? }`
- **Yanıt:** `204` (no content)
- **Notes:** Reason gövde DB'ye yazılmaz; sadece kategori + sayım agrege.

### `GET /api/newsletter/stats`
- **Auth:** none.
- **Yanıt:** `{ status:'ok', total:<aktif abone sayısı> }`

## Booking

### `POST /api/bookings`
- **Auth:** opsiyonel (JWT varsa user'a bağlanır).
- **Body:** `{ slot, fullName, email, phone?, service?, ... }`
- **Yanıt:** `201 { status:'ok', booking:{ id, slot, ... } }`

### `GET /api/bookings`
- **Auth:** JWT user.
- **Query:** `?page=1&limit=10`
- **Yanıt:** `{ data:{ items, total, page, limit } }`

## Lead Scoring

### `POST /api/leads/score`
- **Auth:** JWT admin.
- **Body:** `{ interactions, email, lastActivityAt? }`
- **Yanıt:** `{ behavioralScore, firmographicMultiplier, decayFactor, totalScore, tier:'A'|'B'|'C' }`

## Admin

### `GET /api/admin/contacts`
- **Auth:** JWT admin.
- **Query:** `?page=1&limit=20&isRead=false`
- **Yanıt:** paginated `ContactSubmission` list.

### `GET /api/admin/newsletter`
- **Auth:** JWT admin.
- **Query:** `?page=1&limit=20&active=true`
- **Yanıt:** paginated subscriber list.

### `GET /api/admin/newsletter/campaigns`
- **Auth:** JWT admin.
- **Query:** `?limit=20&offset=0`
- **Yanıt:** `{ data:{ items:Campaign[], total, limit, offset } }`

### `POST /api/admin/newsletter/campaigns`
- **Auth:** JWT admin.
- **Body:** `{ subject, body, audienceFilter:{ source?, consentOnly:boolean }, templateKey? }`
- **Yanıt:** `201 { data: Campaign }`

### `GET /api/admin/newsletter/campaigns/:id`
- **Auth:** JWT admin.
- **Yanıt:** `{ data: Campaign }`

### `POST /api/admin/newsletter/campaigns/:id/send`
- **Auth:** JWT admin.
- **Yanıt:** `{ data:{ id, recipients:<count>, enrolled:<count> } }`
- **Side effect:** Her audience subscriber için drip queue'ya enroll edilir.

### `GET /api/admin/newsletter/campaigns/metrics`
- **Auth:** JWT admin.
- **Yanıt:** `{ data:{ queue:<int>, dlq:<int>, counters:{ sent, failed, dlq, enqueued } } }`

### `GET /api/admin/queues` (Bull-Board)
- **Auth:** JWT admin + IP allowlist.
- **Yanıt:** Bull-Board HTML UI — BullMQ queue inspector.

## Webhooks (entegrasyon)

### `POST /api/webhooks/email-bounce`
- **Auth:** HMAC signature (env `EMAIL_WEBHOOK_SECRET`).
- **Body:** `{ messageId, to, reason }`
- **Yanıt:** `204`
- **Side effect:** `BounceLog` insert (P55).

## Analytics

### `POST /api/analytics/pageview`
- **Auth:** none.
- **Body:** `{ path, referrer?, sessionId?, lang? }`
- **Yanıt:** `204`

### `POST /api/analytics/interaction`
- **Auth:** none.
- **Body:** `{ type, target?, value?, sessionId?, metadata? }`
- **Yanıt:** `204`

## Hata Kodları

| HTTP | code | Anlam |
|---|---|---|
| 400 | VALIDATION_ERROR | Zod validation başarısız (issues array'inde detay) |
| 401 | UNAUTHORIZED | JWT yok / geçersiz / süresi dolmuş |
| 403 | FORBIDDEN | Role yetersiz (örn. user → admin endpoint) |
| 404 | NOT_FOUND | Resource bulunamadı |
| 409 | CONFLICT | Idempotency çakışması veya state conflict (örn. zaten queued kampanya) |
| 429 | RATE_LIMITED | IP rate limit aşıldı |
| 500 | INTERNAL_ERROR | Sunucu hatası (Sentry'ye otomatik bildirilir; eventId yanıt zarfında) |

## Rate Limit

| Endpoint | Limit |
|---|---|
| `POST /api/contact` | 5 / 15 dakika / IP |
| `POST /api/newsletter/subscribe` | 5 / saat / IP |
| `POST /api/newsletter/feedback` | 5 / 15 dakika / IP |
| Genel public API | 60 / dakika / IP |
| Admin API | 600 / dakika / IP (allowlist'li) |

## Pagination

Tüm liste endpoint'leri `?page=<n>&limit=<n>` formatını destekler. Yanıt zarfı: `{ data:{ items, total, page, limit } }`.

## CORS

`ALLOWED_ORIGINS` env'de listelenen origin'ler için `Access-Control-Allow-Origin` döner. Diğer origin'ler reddedilir (no CORS headers → browser preflight fail).

## Versiyonlama

API şu an `v1` (implicit, path prefix yok). Breaking change durumunda `/api/v2/*` namespace açılacak; v1 6 ay daha desteklenecek.
