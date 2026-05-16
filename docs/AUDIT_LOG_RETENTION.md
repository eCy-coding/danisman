# Audit Log Retention & Archival

Bu doküman `audit_logs` tablosunun retention politikası, haftalık cold-storage
arşivleme akışı ve forensic restore prosedürünü tanımlar.

## Retention politikası

| Window | Konum | Erişim |
|---|---|---|
| **0–90 gün** (hot) | Postgres `audit_logs` | Admin panel + API |
| **90+ gün** (cold) | Object storage `audit-archive/<yyyy>/<mm>/<yyyy-mm-dd>.json.gz` | `scripts/restore-audit-archive.mjs` |

90 gün, GDPR Madde 5 (storage limitation) + iç compliance gereksinimi uyumlu
default. `AUDIT_RETENTION_DAYS` env üzerinden override edilebilir.

## Haftalık archive cron

`server/workers/audit-archive-worker.ts` Pazar 03:00 UTC'de çalışır:

1. `audit_logs` → 90 günden eski rows (batch 5000, ASC createdAt).
2. JSON encode → gzip → `storage.put('audit-archive/yyyy/mm/yyyy-mm-dd.json.gz', ...)`.
3. `archived_audit_logs` UNIQUE(`coldKey`) pointer row — idempotent (re-run = no-op).
4. Sadece COLD WRITE BAŞARILI olduktan SONRA hot rows DELETE (two-phase, orphan yok).

Bullmq queue: `cron`, task variant: `audit-log-archive`.

### Scheduler kurulumu (operator, bir kez)

```bash
# Render shell veya local
node -e "import('./server/queues/index.js').then(m => m.enqueue('cron', { task: 'audit-log-archive', retentionDays: 90 }, { jobId: 'audit-archive-bootstrap' }))"
```

Cron tetiklemesi için BullMQ scheduler kullanılır — `repeat: '0 3 * * 0'`
(Pazar 03:00 UTC). Bull-Board üzerinden re-arm edilebilir.

## Restore prosedürü

```bash
# 1. Hangi window? archived_audit_logs sorgu:
psql $DATABASE_URL -c "SELECT \"coldKey\", \"windowStart\", \"windowEnd\", \"rowsArchived\" FROM archived_audit_logs ORDER BY \"windowEnd\" DESC LIMIT 20;"

# 2. Dry-run — manifest doğrula
node scripts/restore-audit-archive.mjs --key=audit-archive/2026/05/2026-05-01.json.gz --dry-run

# 3. Gerçek restore — hot tabloya INSERT
node scripts/restore-audit-archive.mjs --key=audit-archive/2026/05/2026-05-01.json.gz
```

Restore IDEMPOTENT'dır — duplicate primary-key (P2002) hatasında satır
zaten varsa skip eder, üzerine yazmaz.

## Doğrulama checklisti

- [ ] `STORAGE_BACKEND` prod'da `s3` (cold storage local FS'de OLMAMALI).
- [ ] `archived_audit_logs.coldKey` UNIQUE constraint aktif.
- [ ] Restoration sonrası `audit_logs` row sayısı manifest `rowsArchived` ile eşleşmeli.
- [ ] Forensic session bittiğinde re-archive: `enqueue('cron', { task: 'audit-log-archive', retentionDays: 90 })`.

## Felaket senaryosu

`audit_logs` tablosu yanlışlıkla TRUNCATE edildiğinde tüm cold archive'lar
sırayla restore edilebilir:

```bash
psql $DATABASE_URL -c "SELECT \"coldKey\" FROM archived_audit_logs ORDER BY \"windowEnd\" ASC;" \
  | xargs -I{} node scripts/restore-audit-archive.mjs --key={}
```

Bütçe: ~10000 satır / saniye INSERT throughput; 1M satır arşiv ~2 dakika.
