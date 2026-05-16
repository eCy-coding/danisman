import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { logger } from './logger';

/**
 * P13/1 + P20 — Tuned Postgres connection pool (mathematically sized).
 *
 * Sizing formula (PostgreSQL Wiki + Render limits):
 *   pool = (cpu_cores × 2) + effective_spindle_count
 *
 *   Tier            vCPU  RAM     Safe pool   Aggressive  Render PG limit
 *   Render Starter  0.5   512MB   5           10          97 connections
 *   Render Standard 1     2 GB    15          20          197 connections
 *   Render Pro      2     4 GB    30          50          497 connections
 *
 * Memory cost ≈ 10 MB / Postgres backend → pool 10 ≈ 100 MB DB-side RAM.
 *
 * Env knobs (validated by config/env.ts in P20):
 *   PG_POOL_MAX         — hard ceiling on concurrent connections. Default 10.
 *   PG_POOL_MIN         — warm minimum to keep ready. Default 0 (serverless).
 *   PG_POOL_IDLE_MS     — close idle conns after N ms. Default 30s.
 *   PG_POOL_CONN_MS     — abort acquisition after N ms. Default 30s.
 *   PG_POOL_QUERY_MS    — single query timeout. Default 10s.
 *   PG_STATEMENT_MS     — Postgres `statement_timeout`. Default 15s.
 *
 * Read replica (P20): see `server/lib/db/read-replica.ts` for a thin
 * wrapper that routes read-only queries to DATABASE_URL_REPLICA when set.
 * This module always returns the primary client (write-capable).
 */

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

const max = Number.parseInt(process.env.PG_POOL_MAX ?? '10', 10) || 10;
const min = Number.parseInt(process.env.PG_POOL_MIN ?? '0', 10) || 0;
const idleTimeoutMillis = Number.parseInt(process.env.PG_POOL_IDLE_MS ?? '30000', 10) || 30_000;
const connectionTimeoutMillis =
  Number.parseInt(process.env.PG_POOL_CONN_MS ?? '30000', 10) || 30_000;
const query_timeout = Number.parseInt(process.env.PG_POOL_QUERY_MS ?? '10000', 10) || 10_000;
const statementTimeoutMs = Number.parseInt(process.env.PG_STATEMENT_MS ?? '15000', 10) || 15_000;

export const pgPool: Pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max,
    min,
    idleTimeoutMillis,
    connectionTimeoutMillis,
    query_timeout,
    allowExitOnIdle: false,
    // Statement timeout enforces a Postgres-side ceiling on individual
    // queries — required so a runaway analytics query can't lock a worker
    // beyond the request-level timeout middleware.
    statement_timeout: statementTimeoutMs,
  });

pgPool.on('error', (err) => {
  // pg can emit on a backend disconnect — log but don't crash; new conns are
  // acquired on demand.
  logger.error(`[pg] idle client error: ${err.message}`);
});

const adapter = new PrismaPg(pgPool);

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pgPool;
}

/**
 * Graceful disconnect — called from server/index.ts SIGTERM handler.
 * Order matters: stop accepting new queries via Prisma, then drain pg pool.
 */
export async function shutdownDatabase(timeoutMs = 8000): Promise<void> {
  const drain = (async () => {
    try {
      await prisma.$disconnect();
    } catch (err) {
      logger.warn(`[pg] prisma disconnect failed: ${(err as Error).message}`);
    }
    try {
      await pgPool.end();
    } catch (err) {
      logger.warn(`[pg] pool end failed: ${(err as Error).message}`);
    }
  })();

  const guard = new Promise<void>((resolve) =>
    setTimeout(() => {
      logger.warn(`[pg] shutdown drain hit ${timeoutMs}ms ceiling`);
      resolve();
    }, timeoutMs).unref?.(),
  );

  await Promise.race([drain, guard]);
}
