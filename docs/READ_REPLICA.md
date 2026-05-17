# Read Replica Deployment Guide (P20 BE Aşama 3)

> Render Postgres **Standard tier ve üstü** read replica destekler. Starter
> tier'da bu rehber geçersizdir — single primary kullanılır.

## 1) Render dashboard'da replica oluştur

1. https://dashboard.render.com → `ecypro-db` Postgres servisi.
2. **Replicas** sekmesi → **Add Replica**.
3. Replica region: primary ile aynı (Frankfurt önerilen, lag minimum).
4. Provision tamamlandıktan sonra Replica **Connection String**'i kopyala.

## 2) Web service env var olarak gir

Render dashboard → `ecypro-api` → **Environment**:

```
DATABASE_URL_REPLICA = postgresql://<replica-host>/<db>?sslmode=require
```

Sync OFF (per-environment value); commit etme.

Boot'ta server `[db/replica] read replica wired up` log'unu basarsa wiring
başarılı.

## 3) Kod tarafında kullanım

Mevcut `prisma` import'larını otomatik route etmiyoruz (implicit detection
riskli). Read-only endpoint'leri **explicit** olarak `db.read` üzerinden geçir:

```ts
// ESKİ (her zaman primary):
import { prisma } from 'server/config/db';
const services = await prisma.service.findMany();

// YENİ (read replica when available):
import { db } from 'server/lib/db/read-replica';
const services = await db.read.service.findMany();
```

Write işlemleri **her zaman primary**:
```ts
await db.write.booking.create({ data: ... });
```

Post-write-then-read (eventual consistency boğazı):
```ts
// "Yeni kaydı hemen göster" pattern → primary'den oku
const fresh = await db.write.booking.findUnique({ where: { id } });
```

## 4) Migration güvenliği

- `prisma migrate deploy` **yalnızca primary**'de çalıştırılır
  (`render.yaml` `buildCommand` zaten primary `DATABASE_URL` kullanıyor).
- Replica read-only; schema replication Render replication tarafından
  ~100 ms içinde replay edilir.
- Yeni migration deploy'undan **sonra** sanity check:
  ```bash
  # primary'de migration_lock'ı doğrula
  psql "$DATABASE_URL" -c "SELECT * FROM _prisma_migrations ORDER BY started_at DESC LIMIT 3;"

  # replica'da aynı migration ID görünmeli
  psql "$DATABASE_URL_REPLICA" -c "SELECT * FROM _prisma_migrations ORDER BY started_at DESC LIMIT 3;"
  ```

## 5) Replication lag izleme

Render replica `pg_stat_replication` view'ı primary'de mevcut:

```sql
-- primary üzerinde
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replay_lag_bytes
FROM pg_stat_replication;
```

Lag > 1 MB sustained → write-heavy load veya network bottleneck.

## 6) Failover senaryosu

Render replica primary olamaz (managed PaaS). Replica down olursa:
- `DATABASE_URL_REPLICA` env'i temizle veya geçici primary URL ata.
- Redeploy → `read-replica.ts` fallback path primary'ye düşer.
- Zero-downtime; latency artar (extra hop yok ama primary load bumps).

## 7) Maliyet

Render Postgres Standard replica: primary ile aynı plan tier'ı (~$35/ay).
Pro replica: ~$95/ay. Cost vs. throughput trade-off:
- Starter (single primary): $7 → ~30 req/sec ceiling
- Standard primary + replica: $70 → ~200 req/sec sustained
- Pro primary + replica: $190 → ~500 req/sec sustained

Geçiş eşiği: sustained > 100 req/sec → replica devreye al.
