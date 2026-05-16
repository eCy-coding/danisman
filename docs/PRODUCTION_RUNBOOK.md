# EcyPro — Production Runbook

**Owner:** operasyon (1 kişilik veya küçük takım)
**Son güncelleme:** 16 Mayıs 2026 (P11)
**Eşlik eden doküman:** [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md), [MAINTENANCE_GUIDE.md](./MAINTENANCE_GUIDE.md)

Bu doküman canlı sistemde alarm aldığınızda ya da düzenli sağlık kontrolü yaparken bakacağınız tek-noktadır. Hızlı triage, log'a nereden bakılır, rollback nasıl yapılır — hepsi burada.

---

## 1) Sistem topolojisi (özet)

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐
│  Cloudflare     │ →  │  Hostinger       │    │  Render        │
│  (DNS + WAF)    │    │  www.ecypro.com  │    │  api.ecypro.com│
│                 │    │  (static SPA)    │    │  (Express API) │
└─────────────────┘    └──────────────────┘    └────┬───────────┘
                                                     │
                                              ┌──────▼──────┐
                                              │  Postgres   │
                                              │  (managed)  │
                                              └─────────────┘

GA4 ─── tracking
Sentry ─── FE + BE error reporting
Telegram bot ─── contact form notifications
```

---

## 2) Alarm türleri ve nerede izlenir

| Alarm | Kaynak | Eşik | Notification |
|---|---|---|---|
| Error rate spike | Sentry (frontend + backend) | >1% session error rate, 10 dk pencere | Sentry Slack/email integration |
| New Sentry issue (P1) | Sentry | İlk görülen exception, environment=production | Sentry Slack |
| Render deployment fail | Render dashboard | Build veya healthcheck FAIL | Email + Render UI |
| Render OOM / restart loop | Render logs | Memory > 90% veya restart ≥ 3/saat | Email |
| Render healthcheck FAIL | `GET /api/health` 5xx | Otomatik rollback (Render config) | Email |
| Hostinger 5xx spike | Hostinger panel + Cloudflare analytics | >50 5xx/dakika | Cloudflare alert |
| SSL expiry warning | Let's Encrypt auto-renewal | <14 gün | Hostinger email |
| Bandwidth limit | Hostinger panel | >80% plan limiti | Hostinger email |
| GA4 conversion drop | GA4 Intelligence | -50% conversion ↓ 24 saat | GA4 email |
| GA4 bounce rate spike | GA4 | >+20 puan 24 saat | GA4 email |
| Telegram bot down | `getMe` probe FAIL | `bot.api.telegram.org` 5xx 3 ardışık | Manuel (cron probe) |

---

## 3) Alarm-by-alarm runbook

### 3.1 — Sentry error rate spike

**Belirti:** "Sentry: error rate is 5.2% (threshold 1%), production"

**Triage (5 dk):**
1. Sentry Dashboard → Issues filter: `environment:production is:unresolved sort:freq`
2. Top issue'nun stack trace + breadcrumb'larına bak (PII scrub aktif, kişisel veri görünmez)
3. "Affects" sütununda kullanıcı sayısını kontrol et — geniş etkili mi?
4. Release tag'ine bak — son deploy mu tetikledi? Sentry release map sourcemap upload edildi mi (`npm run release:sentry`)?

**Karar matriksi:**
- Yeni deploy son 30 dk → **Rollback**: Render dashboard → Deploys → önceki release → "Rollback".
  Alternatif: `git revert <commit-sha> && git push origin main`.
- Eski regression değil + 1 endpoint'e özel → "Bekle ve gözle" 1 saat; trend devam ederse hotfix branch.
- Tüm trafik etkili (login, ana sayfa) → P0 incident (bkz. INCIDENT_RESPONSE.md).

---

### 3.2 — Render deployment fail

**Belirti:** "Render: Build failed for service srv-XXX"

**Log'a nereden bak:**
1. Render Dashboard → ecypro-api → Deploys → en üst FAIL → Logs
2. Build stage mı, runtime mı?
   - Build: TypeScript/dependency hatası. Lokalde `npm run build:server` ile yeniden üret + düzelt.
   - Runtime: healthcheck endpoint `/api/health` 200 dönmüyor → backend boot etmiyor.

**Aksiyon:**
- Önceki deploy stable → **rollback** (Render UI).
- Düzeltme + yeni deploy: lokalde `npm run typecheck:server && npm run build:server` PASS → push.
- Render env vars eksikse: Service → Environment → ekle, sonra "Manual Deploy" tetikle.

---

### 3.3 — Render OOM / restart loop

**Belirti:** "Service restarted 3 times in last 10 minutes"

**Triage:**
1. Render Dashboard → Metrics → Memory + CPU son 1 saat
2. Logs → restart öncesi son satırlar; `Killed` veya `JavaScript heap out of memory` aranan ipuçları
3. Trafiğe denk gelen bir route var mı (admin/dashboard bulk fetch?)

**Aksiyon:**
- Anlık: Render plan'ı 1 tier yükselt (RAM artırma).
- Kalıcı: Sentry'de performance trace bak; N+1 query veya unbounded `findMany` araştır.
- Prisma `take` + `cursor` ile paginate edilmeyen endpoint varsa P0 fix.

---

### 3.4 — Hostinger 5xx spike

**Belirti:** Cloudflare analytics 5xx rate sıçraması

**Triage:**
1. Cloudflare Dashboard → Analytics → Status codes
2. Hostinger Panel → hPanel → Logs → access/error log
3. 502/504 ise upstream (Render API) sorunlu olabilir — bkz. §3.2
4. 500 + Hostinger origin'den geliyorsa: SPA build sorunu mu (`.htaccess` SPA rewrite kayıp?)

**Aksiyon:**
- SPA rewrite kayıp/bozuk → `.htaccess` redeploy (`scripts/deploy-microweber.ts` veya manuel SFTP).
- Hostinger tarafı doğrulanırsa fakat hâlâ kötü → Cloudflare "Always Online" mode yedek olarak göster.

---

### 3.5 — SSL expiry warning

**Belirti:** Hostinger email "SSL cert için 14 gün kaldı"

**Triage:**
- Let's Encrypt otomatik yenileme (Hostinger default) AÇIK mı?
- `openssl s_client -connect www.ecypro.com:443 -servername www.ecypro.com 2>/dev/null | openssl x509 -noout -dates`

**Aksiyon:**
- Otomatik yenileme açık + cert 30 gün → ignore (Hostinger 14 gün threshold çok erken uyarıyor).
- Manuel yenile: hPanel → SSL/TLS → Renew.
- DNS doğrulama (Cloudflare DNS-only mode) gerekiyorsa: Cloudflare Proxy'yi geçici kapat → renew → tekrar aç.

---

### 3.6 — GA4 conversion drop

**Belirti:** "Form submission events -50% son 24 saat"

**Olası nedenler:**
1. Telegram bot down → form submit ediyor ama notification gitmiyor → `submitBooking` `success:false` döner → conversion event tetiklenmiyor
2. CSP regression → contact form `connect-src` Telegram bloklanıyor (P10 fix edilmiş, ama yeni deploy bozabilir)
3. JS error landing → analyticsConsumer event firing fail

**Triage:**
1. `node scripts/integration-health.mjs --probe` → Telegram getMe PASS mı?
2. Sentry → frontend → "contact" route'a filter → exception var mı?
3. Tarayıcıda incognito → /contact'a git → DevTools Console → CSP violation var mı?
4. GA4 Realtime → /contact aktif kullanıcı var ama event yok → tracking script'i sayfa load oldu mu?

**Aksiyon:** root cause'a göre §3.7 (Telegram), §3.8 (CSP), §3.9 (Analytics) runbook'larına git.

---

### 3.7 — Telegram bot down

**Belirti:** Manuel cron veya kullanıcı raporu — form gönderiyor, mesaj gelmiyor.

**Triage:**
```bash
curl -fsS "https://api.telegram.org/bot${VITE_TELEGRAM_BOT_TOKEN}/getMe"
# Expected: {"ok":true,"result":{...bot info...}}
```

**Aksiyon:**
- 401 Unauthorized → token revoked → @BotFather → `/token` → yeni token al → Hostinger env güncelle → frontend yeniden deploy.
- `chat not found` (`sendMessage` çağrısında) → bot, hedef chat'te ekleyici/admin değil → manuel ekle.
- API 5xx → Telegram tarafı, bekle.

---

### 3.8 — CSP violation suite

**Belirti:** Sentry'de `Refused to connect to '<URL>'` veya GA4 / Telegram bağlantı hatası.

**Triage:**
- DevTools Console → `Refused to connect` satırını oku
- `index.html` `<meta http-equiv="Content-Security-Policy">` içinde ilgili host'u kontrol et

**Aksiyon:**
- Beyaz listeye eklenecek host: `index.html` → CSP'nin `connect-src` (veya `script-src`) bölümüne ekle.
- Production'da `Content-Security-Policy-Report-Only` modu önerilir → ihlal Sentry tunnel'a düşer, kullanıcı engellenmez. **TODO P12**: CSP report-uri Sentry'ye yönlendir.

---

### 3.9 — Sentry'nin kendisi down

**Belirti:** Sentry dashboard ulaşılmıyor + status.sentry.io kırmızı

**Aksiyon:** beklenti, kendi tarafımızda iş yok. Backup error reporting yok (P12 adayı: Logflare/Datadog ikincil sink).

---

## 4) Düzenli sağlık kontrolleri

### Haftalık (her Pazartesi)

```bash
cd ~/Desktop/ecypro
node scripts/integration-health.mjs --probe
# Beklenen: PASS=N, FAIL=0 (placeholder yok)
```

Çıktı `outputs/weekly-health-<TS>.log`'a yönlendirilebilir.

### Aylık (her ayın 1'i)

```bash
npm audit --production
# Beklenen: 0 high/critical
```

Hangi paket vulnerable → `npm audit fix` veya manuel bump.

### Quarterly (3 aylık)

- Lighthouse re-baseline: `./RUN_P11_MEASURE.command`
- Visual regression baseline: `./RUN_VISUAL_BASELINE.command`
- Dependency major bump'ları: `npx npm-check-updates -u` → manuel review → test → merge

---

## 5) Rotation politikaları

| Item | Frequency | Recipe |
|---|---|---|
| JWT secret | 90 gün | Render env `JWT_SECRET` rotate → backend restart → eski oturumlar invalid olur (kullanıcı re-login) |
| Sentry DSN | Annual | Yeni Sentry project oluştur → DSN güncelle → eski projeyi delete (KVKK retention) |
| Telegram bot token | İhtiyaca göre | @BotFather → `/revoke` → yeni token → env güncelle → re-deploy |
| Database password | 180 gün | Managed Postgres provider'da rotate → Render env güncelle → restart |
| SSL cert | 90 gün otomatik | Let's Encrypt auto-renew (Hostinger) |
| Admin TOTP backup codes | İhtiyaca göre | Admin panel → Security → "Regenerate backup codes" |

---

## 6) Erişim & permissions

| Servis | Bağlanma yöntemi | 2FA |
|---|---|---|
| Render | Email + password + 2FA TOTP | ✅ Zorunlu |
| Hostinger | Email + password + 2FA SMS | ✅ Zorunlu |
| Cloudflare | Email + password + 2FA TOTP | ✅ Zorunlu |
| GA4 (Google) | Workspace SSO + 2FA | ✅ Zorunlu |
| Sentry | Email + 2FA TOTP | ✅ Zorunlu |
| Telegram bot | @BotFather → Telegram client | Telegram 2FA önerilir |
| GitHub | SSH key + 2FA | ✅ Zorunlu |

**Hiçbir credential commit edilmez.** `.env.production` lokalde, gitignore'da. Production secrets sadece Render/Hostinger UI'sından yönetilir.

---

## 7) Performance budget

P9 baseline (Lighthouse 5-run median):

| Sayfa | Perf | A11y | SEO | BP |
|---|---:|---:|---:|---:|
| LandingPage | 66 | 96 | 100 | 96 |
| ServicesPage | ölçülecek (P11/2) | 95+ | 100 | 96 |
| PricingPage | 65 | 95 | 100 | 92 |
| BlogPage | 69 | 98 | 100 | 96 |
| ContactPage | 68 | 99 | 100 | 96 |
| CaseStudiesPage | 66 | 99 | 100 | 96 |

**Charter:** ≥ 80 perf. RUM verisi 1 hafta toplandıktan sonra agresif optimization (P12+).

**Regression threshold:** -3 puan median Performance → uyarı, -5 → P1.

---

## 8) Backup ve recovery

| Veri | Backup yöntemi | Retention | Test |
|---|---|---|---|
| Postgres (`ecypro`) | Render daily automated | 30 gün | Quarterly restore drill (P12+) |
| Static assets (`dist/`) | Git repo'da değil; Hostinger backup | Hostinger plan | Manuel restore |
| Sentry replay | Sentry retention plan | 30/90 gün (plan'a göre) | Cloud-side |
| GA4 data | Google retention 14 ay default | 14 ay (uzat: 50 ay) | Otomatik |

**Recovery time objective (RTO):** 1 saat (Render rollback) için frontend; 4 saat (Postgres restore) için veri.
**Recovery point objective (RPO):** Postgres günlük backup → max 24 saat veri kaybı kabul. P12+ point-in-time recovery için Postgres plan upgrade.

---

## 9) "Bekle ve gözle" eşikleri

Acil müdahale yerine 1-2 saat izlemenin makul olduğu durumlar:

- Sentry error rate **<2%** + tek bir route etkilenmiş + yeni release yok
- Render restart 1-2 kez/saat (rate-limit'siz scale up)
- Hostinger 5xx rate **<10/dakika** + Cloudflare cache hit normal
- GA4 conversion drop **<%20** + 24 saat içinde geri dönüyor

Eşik aşılırsa derhal §3'e geç.

---

## 10) Acil iletişim

| Rol | Kim | Kanal | SLA |
|---|---|---|---|
| Owner (tek kişilik durumda) | emre | Telegram, email | Best-effort |
| Render support | Render UI | Ticket | 24 saat (Pro plan) |
| Hostinger support | hPanel | Live chat | 1 saat |
| Cloudflare support | Cloudflare UI | Email/community | 24-72 saat (Free) |
| Sentry support | Sentry UI | Ticket | 24 saat (Team plan) |

---

## 11) Kapanış

Bu doküman canlı. Her gerçek incident sonrası "Lessons learned" maddesi ekle. P12 + sonrası: dedicated incident tracker (incident.io veya internal `outputs/incidents/*.md`).
