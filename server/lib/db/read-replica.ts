/**
 * P20 BE Aşama 3 — Read Replica Wrapper
 * ──────────────────────────────────────────────────────────────────────────
 * Prisma 7 + `pg` adapter ile read/write split.
 *
 * Tasarım kararı:
 *   - PRIMARY (write) → `server/config/db.ts` `prisma` export'u.
 *   - REPLICA (read)  → bu modül, `DATABASE_URL_REPLICA` set ise ayrı bir
 *     PrismaClient + pg.Pool çifti döndürür; değilse primary'ye düşer
 *     (kaldıraç yok ama API her zaman çalışır).
 *
 * Neden custom wrapper (vs. `@prisma/extension-read-replicas`)?
 *   - Prisma 7 + adapter-pg kombinasyonu için extension henüz stable değil
 *     (changelog 2025-Q4); kendi adapter'ımız ile interop daha açık.
 *   - Bizim kullanım deseni explicit: route handler `db.read.<model>` /
 *     `db.write.<model>` ayrımını okur. Implicit detection (SELECT vs ?)
 *     ORM tarafında risk taşır (transaction içinde SELECT bile write
 *     olabilir).
 *
 * Eventual consistency:
 *   - Render Postgres read replica lag ortalama ~100 ms (max 1-2 s).
 *   - Write-after-read pattern (post → list) için **kritik route'larda**
 *     `db.write.<model>.findMany` veya transaction kullanın.
 *
 * Migration safety:
 *   - `prisma migrate deploy` SADECE primary'de çalıştırılır.
 *   - Replica read-only; schema drift Render replication tarafından
 *     otomatik replay.
 *
 * Health:
 *   - `getReplicaStatus()` operasyonel /health endpoint'ine eklenebilir.
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { logger } from '../../config/logger';
import { prisma as primaryPrisma } from '../../config/db';

interface ReplicaHandle {
  prisma: PrismaClient;
  pool: Pool | null;
  isReplica: boolean;
}

const REPLICA_URL = process.env.DATABASE_URL_REPLICA?.trim();

const max = Number.parseInt(process.env.PG_POOL_MAX ?? '10', 10) || 10;
const min = Number.parseInt(process.env.PG_POOL_MIN ?? '0', 10) || 0;
const idleTimeoutMillis = Number.parseInt(process.env.PG_POOL_IDLE_MS ?? '30000', 10) || 30_000;
const connectionTimeoutMillis =
  Number.parseInt(process.env.PG_POOL_CONN_MS ?? '30000', 10) || 30_000;
const query_timeout = Number.parseInt(process.env.PG_POOL_QUERY_MS ?? '10000', 10) || 10_000;
const statementTimeoutMs = Number.parseInt(process.env.PG_STATEMENT_MS ?? '15000', 10) || 15_000;

function buildReplica(): ReplicaHandle {
  if (!REPLICA_URL) {
    logger.info('[db/replica] DATABASE_URL_REPLICA not set → routing reads to primary');
    return { prisma: primaryPrisma, pool: null, isReplica: false };
  }

  const pool = new Pool({
    connectionString: REPLICA_URL,
    max,
    min,
    idleTimeoutMillis,
    connectionTimeoutMillis,
    query_timeout,
    statement_timeout: statementTimeoutMs,
    allowExitOnIdle: false,
  });

  pool.on('error', (err) => {
    logger.error(`[db/replica] idle client error: ${err.message}`);
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  logger.info('[db/replica] read replica wired up (DATABASE_URL_REPLICA detected)');
  return { prisma, pool, isReplica: true };
}

const replica = buildReplica();

/**
 * Read/write split DB facade.
 *
 *   import { db } from 'server/lib/db/read-replica';
 *
 *   // READS (replica when available, primary fallback)
 *   const services = await db.read.service.findMany();
 *
 *   // WRITES (always primary)
 *   await db.write.booking.create({ data: ... });
 *
 *   // EXPLICIT FRESH READ (post-write-then-read pattern)
 *   const just = await db.write.booking.findUnique({ where: { id } });
 */
export const db = {
  read: replica.prisma,
  write: primaryPrisma,
  /**
   * Backward-compat: legacy code may import `db.prisma` expecting the
   * primary client. Keep this so a single-shot migration doesn't break
   * 80 call sites.
   */
  prisma: primaryPrisma,
} as const;

export interface ReplicaStatus {
  configured: boolean;
  healthy: boolean;
  lagSeconds?: number;
  error?: string;
}

/**
 * Quick readiness probe — used by /health endpoint operator overlay.
 * Does NOT measure replication lag with pg_last_xact_replay_timestamp
 * (requires read access; pg_stat_replication only on primary). Use a
 * dedicated tool (`pg_stat_replication`) when investigating drift.
 */
export async function getReplicaStatus(): Promise<ReplicaStatus> {
  if (!replica.isReplica) {
    return { configured: false, healthy: true };
  }
  try {
    await replica.prisma.$queryRawUnsafe('SELECT 1');
    return { configured: true, healthy: true };
  } catch (err) {
    return {
      configured: true,
      healthy: false,
      error: (err as Error).message,
    };
  }
}

/**
 * Shutdown — called from server/index.ts SIGTERM handler.
 * Primary disconnect is handled by `shutdownDatabase()` in config/db.ts;
 * this only tears down the replica pool when present.
 */
export async function shutdownReplica(timeoutMs = 8000): Promise<void> {
  if (!replica.isReplica) return;
  const drain = (async () => {
    try {
      await replica.prisma.$disconnect();
    } catch (err) {
      logger.warn(`[db/replica] disconnect failed: ${(err as Error).message}`);
    }
    try {
      await replica.pool?.end();
    } catch (err) {
      logger.warn(`[db/replica] pool end failed: ${(err as Error).message}`);
    }
  })();

  const guard = new Promise<void>((resolve) =>
    setTimeout(() => {
      logger.warn(`[db/replica] shutdown drain hit ${timeoutMs}ms ceiling`);
      resolve();
    }, timeoutMs).unref?.(),
  );

  await Promise.race([drain, guard]);
}

// ── Testing hooks ───────────────────────────────────────────────────────────
export const _replicaTesting = {
  isReplicaConfigured: () => replica.isReplica,
};
