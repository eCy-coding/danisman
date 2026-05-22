# EcyPro — Incident Response Runbook

**Sürüm:** 1.0 | **Tarih:** 5 Mayıs 2026 | **On-Call:** Emre (primary)

> **Blameless culture:** Hatalar sistemin başarısızlığıdır, bireyinki değil.
> Postmortem'de kişi suçlamak yasak. Kök neden + aksiyon odaklı kal.

---

## 0. Hızlı Referans

| Sistem            | URL                               | Kontrol |
| ----------------- | --------------------------------- | ------- |
| Status Page       | https://status.ecypro.com         | Uptime  |
| Sentry (Frontend) | https://sentry.io/ecypro/frontend | Errors  |
| Sentry (Backend)  | https://sentry.io/ecypro/backend  | Errors  |
| Vercel Dashboard  | https://vercel.com/ecypro         | Deploy  |
| Render Dashboard  | https://render.com                | Backend |
| Database (Render) | Render PostgreSQL panel           | DB      |
| Redis (Render)    | Render Redis panel                | Cache   |

## 1. Severity Seviyeleri

| Seviye    | Tanım                     | Örnek                              | Yanıt Süresi |
| --------- | ------------------------- | ---------------------------------- | ------------ |
| **SEV-1** | Production tam devre dışı | Site 404, API down                 | 15 dakika    |
| **SEV-2** | Kritik fonksiyon bozuk    | Booking çalışmıyor, login hataları | 1 saat       |
| **SEV-3** | Önemli degradasyon        | Yavaş API, tek sayfa hatalı        | 4 saat       |
| **SEV-4** | Küçük sorun               | Görsel bozuk, küçük UI hatası      | 24 saat      |

---

## 2. Incident Başlatma

### Adım 1 — Tespit

```bash
# UptimeRobot alert geldi veya kullanıcı bildirdi
# Hemen şunu doğrula:
curl -s https://ecypro.com/api/health | jq .
# Beklenen: {"status":"ok","timestamp":"..."}
```

### Adım 2 — Scope Belirleme

```bash
# Frontend çalışıyor mu?
curl -o /dev/null -w "%{http_code}" https://ecypro.com/

# Backend çalışıyor mu?
curl -o /dev/null -w "%{http_code}" https://api.ecypro.com/api/health

# DB ping (backend /ready endpoint'inden)
curl https://api.ecypro.com/api/ready | jq .checks
```

### Adım 3 — Severity Ata

Yukarıdaki tablo ile severity belirle. SEV-1 veya SEV-2 ise:

- [ ] Status Page'de "investigating" yayınla
- [ ] Slack/email ile stakeholder bildirim (şimdilik sadece Emre)

---

## 3. Yaygın Incident Playbook'ları

### 🔴 SEV-1: Site Tamamen Down

```bash
# 1. Vercel Deploy Status
open https://vercel.com/ecypro/consulting/deployments
# Son deploy başarılı mı? Rollback mı gerekiyor?

# 2. Eğer recent deploy var → rollback
vercel rollback --token=$VERCEL_TOKEN

# 3. DNS check
dig ecypro.com +short
# 0 sonuç → DNS sorunlu → Cloudflare/Hostinger DNS panel kontrol

# 4. Sentry error burst?
open https://sentry.io/ecypro/frontend/issues/
```

**Beklenen RTO (Recovery Time Objective): 30 dakika**

---

### 🔴 SEV-1: API Backend Down

```bash
# 1. Render dashboard
open https://render.com/dashboard

# 2. Recent deploy check
# Render → Service → Events → son event başarılı mı?

# 3. Render otomatik restart denedi mi?
# Render → Service → Logs → son restart ne zaman?

# 4. DB bağlantısı?
# Render → PostgreSQL → Connections panel → aktif bağlantı sayısı

# 5. Redis bağlantısı?
# Render → Redis → Monitor
```

**Beklenen RTO: 15 dakika (Render auto-restart genellikle otomatik)**

---

### 🟠 SEV-2: Booking Sistemi Bozuk

```bash
# 1. Cal.com webhook çalışıyor mu?
# Cal.com → Webhooks → Recent deliveries → status code

# 2. Resend email çalışıyor mu?
open https://resend.com/dashboard/logs

# 3. Booking DB kayıtları?
# Admin panel → /admin/bookings → son booking ne zaman?

# 4. Server log'lar
# Render → Service → Logs → grep "Booking"
```

---

### 🟠 SEV-2: Auth / Login Çalışmıyor

```bash
# 1. Redis blacklist çalışıyor mu?
# Render → Redis → Monitor → PING test

# 2. JWT_SECRET env doğru mu?
# Render → Service → Environment → JWT_SECRET set?

# 3. Rate limit tetiklendi mi?
# Sentry → Issues → "Rate limit exceeded"

# 4. CORS hatası?
# Browser DevTools → Network → login request → Response headers → Access-Control-Allow-Origin
```

---

### 🟠 SEV-2: Database Down / Connection Refused

```bash
# 1. Render PostgreSQL panel
open https://render.com/dashboard # → PostgreSQL → Status

# 2. Connection limit aşıldı mı?
# PostgreSQL panel → Connections → max_connections default 97

# 3. Emergency: DB reset connections (dikkatli!)
# psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid();"

# 4. Backup'tan geri yükle (son çare)
pg_restore --clean --no-acl --no-owner -d $DATABASE_URL ./backups/ecypro_LATEST.dump.gpg
```

**RTO: 30-60 dakika (backup restore case)**

---

### 🟡 SEV-3: Yavaş API (>2s latency)

```bash
# 1. N+1 query? Sentry Performance → slowest transactions
# 2. Redis memory high?
# Render → Redis → Memory usage > 80%? → redis-cli FLUSHDB (dikkatli!)
# 3. Unindexed DB query? → psql → EXPLAIN ANALYZE
# 4. Rate limiter triggered? → logs'da "Rate limit exceeded" burst
```

---

### 🟡 SEV-3: SSL Sertifikası Süresi Dolan

```bash
# Vercel/Netlify otomatik yeniler — sadece custom domain için sorun olabilir
# Vercel → Settings → Domains → SSL status
# Eğer "Invalid" → Remove domain → Add domain (re-provision)
```

---

## 4. Incident Yanıt Akışı

```
1. DETECT  → UptimeRobot alert / kullanıcı bildirimi
2. TRIAGE  → curl health check → severity belirle
3. SCOPE   → affected users, affected features
4. MITIGATE → playbook uygula
5. RESOLVE  → sistem normal, monitoring onay
6. COMMUNICATE → status page update "resolved"
7. POSTMORTEM → 24 saat içinde (SEV-1/2 için zorunlu)
```

---

## 5. Postmortem Şablonu

**Incident ID:** INC-{YYYYMMDD}-{###}
**Tarih/Saat:** [UTC]
**Severity:** SEV-{1|2|3|4}
**Duration:** {X} dakika
**Affected:** {feature/service}

### Özet (1-2 cümle)

_Ne oldu, kim etkilendi, ne kadar sürdü._

### Timeline (UTC)

| Zaman | Olay                       |
| ----- | -------------------------- |
| HH:MM | Incident başladı (tahmini) |
| HH:MM | İlk tespit                 |
| HH:MM | Scope belirlendi           |
| HH:MM | Mitigation başladı         |
| HH:MM | Incident çözüldü           |

### Kök Neden (5-Why)

1. **Neden?** \_\_\_
2. **Neden?** \_\_\_
3. **Neden?** \_\_\_
4. **Neden?** \_\_\_
5. **Kök Neden:** \_\_\_

### Etkisi

- Etkilenen kullanıcı sayısı: \_\_\_
- Etkilenen transaction/booking: \_\_\_
- Revenue impact (tahmini): \_\_\_

### Çözüm Öğesi (Action Items)

| #   | Aksiyon | Sorumlu | Deadline |
| --- | ------- | ------- | -------- |
| 1   |         |         |          |
| 2   |         |         |          |

### Prevention (Bu tekrar nasıl önlenir?)

---

---

## 6. Deployment Rollback (Emergency)

### Vercel Frontend Rollback

```bash
# Option A: Vercel CLI
npx vercel rollback --token=$VERCEL_TOKEN

# Option B: Dashboard
# vercel.com → Project → Deployments → previous deploy → "..." → Promote to Production
```

### Render Backend Rollback

```bash
# Render dashboard → Service → Deployments → previous → "Rollback"
# NOT: Render otomatik rollback desteklemiyor CLI'da
```

### Database Rollback (son çare)

```bash
# UYARI: Bu tüm son işlemleri siler!
# Onay al: Emre (Baş)

# 1. Stop backend (Render → Service → Suspend)
# 2. Restore from backup:
gpg --batch --passphrase "$BACKUP_ENCRYPTION_KEY" --decrypt ecypro_BACKUP.dump.gpg > ecypro_BACKUP.dump
pg_restore --clean --no-acl --no-owner -d $DATABASE_URL ecypro_BACKUP.dump
# 3. Resume backend (Render → Service → Resume)
```

---

## 7. Yıllık DR Testi (Disaster Recovery)

Her 6 ayda bir:

- [ ] Backup restore testi (staging DB)
- [ ] Rollback prosedürü testi
- [ ] On-call rotation güncellemesi
- [ ] Runbook gözden geçirme

**Son DR Testi:** _(henüz yapılmadı)_

---

_EcyPro Incident Runbook v1.0 — 5 Mayıs 2026_
