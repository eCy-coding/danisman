# Database Migration Plan — EcyPro Premium Consulting

> **Sahip:** backend-on-call
> **Son güncelleme:** 2026-05-16
> **Kaynak migration'lar:** `prisma/migrations/`

Bu doküman, yeni bir Prisma migration'ı **production**'a uygularken takip
edilmesi gereken adımları, geri-alma stratejilerini ve risk sınıflandırmasını
anlatır. Her migration için kart açılır, sırayla yürütülür, log'lanır.

---

## 1. Risk sınıfları

| Sınıf                                   | Tanım                                                           | Örnek                                  | Maintenance window?                 |
| --------------------------------------- | --------------------------------------------------------------- | -------------------------------------- | ----------------------------------- |
| **A — Additive, idempotent**            | `ADD COLUMN nullable`, `CREATE INDEX IF NOT EXISTS`, yeni tablo | P14-BE indexes + soft-delete kolonları | Hayır                               |
| **B — Additive ama uzun**               | Geniş tabloya `CREATE INDEX` (CONCURRENTLY gerekli)             | Booking composite indexes (50K+ satır) | Düşük trafik penceresi              |
| **C — Destructive ama geri-alınabilir** | `DROP INDEX`, `DROP COLUMN nullable`                            | Redundant unique index temizliği       | Düşük trafik penceresi              |
| **D — Destructive ve geri-alınamaz**    | `DROP TABLE`, `DROP COLUMN NOT NULL`, type değişimi             | Yok (henüz)                            | Tam bakım penceresi + backup gating |

P14-BE Track 1+2 migration'larının tamamı **A sınıfı** (additive +
idempotent). Online uygulamayı kolaylaştırmak için her migration klasörünün
yanına bir `online.sql` kardeş dosyası konur — Prisma runner'ın transaction
sarmasını atlatıp `CREATE INDEX CONCURRENTLY` çalıştırabilen, manuel psql
oturumunda yürütülebilen versiyonudur.

---

## 2. Uygulama akışı (production)

```
1) Pre-flight
   ├── pg_dump --schema-only > /tmp/pre-migration-schema.sql
   ├── pg_dump --data-only --table=audit_logs | wc -l   # baseline boyutu
   ├── SELECT pg_size_pretty(pg_database_size(current_database()));
   └── Render dashboard → Database → "Backups" → Manual snapshot

2) Migration sınıfını seç
   ├── Sınıf A → Prisma migrate deploy (kısa, transactional)
   ├── Sınıf B → Maintenance window aç → online.sql psql ile uygula
   ├── Sınıf C → Maintenance window aç → migrate deploy
   └── Sınıf D → tam bakım → migrate deploy + post-validation script

3) Apply
   ├── Sınıf A:    npm run db:migrate:deploy
   ├── Sınıf B/C/D: psql $DATABASE_URL -v ON_ERROR_STOP=1 -f online.sql

4) Post-flight
   ├── npx prisma migrate status                # her migration "Applied"?
   ├── SELECT count(*) FROM pg_indexes WHERE tablename = '<table>';
   ├── EXPLAIN ANALYZE <hot query>              # plan değişti mi?
   ├── tail Sentry, Logtail 10 dk               # spike var mı?
   └── Bookkeeping: docs/PRODUCTION_RUNBOOK.md → "Migrations" tablosu güncelle
```

---

## 3. Geri-alma (rollback)

### Sınıf A (additive)

Yeni index'i / kolonu **bırak**. Rollback maliyeti = sıfıra yakın. Acil
durumda `DROP INDEX CONCURRENTLY <name>` ile çıkar.

### Sınıf B

Aynı şekilde — index online drop edilir. Hiçbir veri kaybı yok.

### Sınıf C

Önceki `pg_dump --schema-only` snapshot'ından **eski şema parçası** elle
çalıştırılır. Veri kolonu drop edilmemişse, sadece kolon eklenir.

### Sınıf D

**Restore from backup**. Render UI → Database → "Restore from backup" →
en son snapshot. Pencere boyunca uygulama 503 verir (graceful-shutdown
flag'i devrede tutulur).

---

## 4. P14-BE migration envanteri

| Migration                                   | Sınıf | İçerik                                                                                                                                  | Online safe?             |
| ------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `20260516112231_p14_schema_hardening`       | A     | Index trimming + composite indexes (Booking/Analytics/Interactions/ContactSubmission/Newsletter) + soft-delete (User/ContactSubmission) | ✅ — `online.sql` mevcut |
| `20260516125000_p14_be_t2_auditlog_indexes` | A     | AuditLog `(targetType,targetId)` ve `(adminId,createdAt)` composite indexes                                                             | ✅ — `online.sql` mevcut |

İlk uygulama:

```bash
# Render shell veya local psql session (DATABASE_URL bağlı):
cd /opt/render/project/src
npm run db:migrate:deploy
# veya online sürüm:
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f prisma/migrations/20260516112231_p14_schema_hardening/online.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f prisma/migrations/20260516125000_p14_be_t2_auditlog_indexes/online.sql
```

---

## 5. Soft-delete + retention

`User.deletedAt` ve `ContactSubmission.deletedAt` kolonları **opsiyonel**
silme işaretidir. Default uygulama davranışı:

- **Read path:** her sorgu `WHERE deletedAt IS NULL` filtresini KENDİSİ
  uygulamalı. Global Prisma middleware kasten YOK — sessiz veri yutma
  riskini almıyoruz.
- **Hard delete:** GDPR/KVKK Erasure talepleri (`POST /api/gdpr/delete`)
  hâlâ **hard delete** yapar. Soft-delete sadece operasyonel "geri
  alınabilir kullanıcı banı" akışı içindir.
- **Retention:** soft-deleted satırlar **90 gün** içinde hard-delete edilir
  (cron job `server/jobs/retention.ts`, eklenecek). Audit log kalır.

---

## 6. Composite index seçim kriterleri

Aşağıdaki üç pattern, eklenen her composite index için referans olur:

1. **Leftmost prefix:** `(a, b, c)` index'i `WHERE a=?`, `WHERE a=? AND b=?`,
   ve `WHERE a=? AND b=? AND c=?` sorgularına hizmet eder — ama
   `WHERE b=?` tek başına bu index'i kullanamaz.
2. **Equality + range:** equality kolonları ÖNCE, range/sort kolonu SON.
   `(status, scheduledAt)` — status equality, scheduledAt range; tersi
   verimsiz.
3. **Selectivity:** düşük kardinaliteli kolon (örn. boolean) tek başına
   index'lenmez; composite içinde diğer kolonların yanına eklenir
   (örn. `(status, scheduledAt, reminder24hSent)`).

Bu kriterleri **schema değişikliği yapan her PR** açıklamasında
göstermek zorunlu (template var: `.github/pull_request_template.md`).

---

## 7. Acil durum kontak listesi

| Rol             | Kim                      | Ne zaman çağrılır         |
| --------------- | ------------------------ | ------------------------- |
| Backend on-call | rotation @ Render alerts | Migration sırasında error |
| Database SME    | (ekip büyüdükçe atanır)  | Plan bozulduğunda         |
| Founder gating  | @emre                    | Sınıf D migration onayı   |

---

## 8. İlgili dokümanlar

- `docs/PRODUCTION_RUNBOOK.md` — genel production prosedürleri
- `docs/INCIDENT_RUNBOOK.md` — outage akışları
- `docs/adr/ADR-004-database-orm.md` — Prisma + Postgres kararı
- `outputs/P14_BE_SCHEMA_AUDIT.md` — P14-BE schema audit raporu
