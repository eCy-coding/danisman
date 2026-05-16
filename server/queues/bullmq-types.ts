/**
 * P17 BE Track 2 / Aşama 1 — Minimal local types for the subset of
 * BullMQ we use, plus a runtime loader that resolves the real package
 * if it's installed (`npm install bullmq`) and returns null otherwise.
 *
 * Why a local type declaration?
 *   - In the sandbox/CI environment we want `tsc --noEmit` to pass
 *     even when `bullmq` is not yet in `node_modules`. Declaring the
 *     5–6 fields we actually call lets us avoid a `@ts-ignore` and
 *     keeps the surface explicit. Once `bullmq` is installed the
 *     local types are still compatible (they're a strict subset).
 *   - This is the SAME pattern used in `server/middleware/idempotency.ts`
 *     for redis — host-agnostic compile path.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MinimalJobsOptions {
  attempts?: number;
  delay?: number;
  jobId?: string;
  priority?: number;
  backoff?: { type: 'exponential' | 'fixed'; delay: number };
  removeOnComplete?: boolean | { age?: number; count?: number };
  removeOnFail?: boolean | { age?: number; count?: number };
}

export interface MinimalQueueOptions {
  connection: unknown;
  prefix?: string;
}

export interface MinimalJob<T = unknown> {
  id?: string;
  data: T;
  attemptsMade: number;
  opts: MinimalJobsOptions;
}

export interface MinimalQueue {
  add(name: string, data: object, opts?: MinimalJobsOptions): Promise<MinimalJob>;
  close(): Promise<void>;
  getWaitingCount(): Promise<number>;
  getActiveCount(): Promise<number>;
  getDelayedCount(): Promise<number>;
  getFailedCount(): Promise<number>;
  getCompletedCount(): Promise<number>;
}

export interface MinimalWorker {
  on(event: 'failed', listener: (job: MinimalJob | undefined, err: Error) => void): this;
  close(): Promise<void>;
}

export interface MinimalWorkerOptions {
  connection: unknown;
  prefix?: string;
  concurrency?: number;
  lockDuration?: number;
}

export interface BullMQModule {
  Queue: new (name: string, opts: MinimalQueueOptions) => MinimalQueue;
  Worker: new <T = unknown>(
    name: string,
    processor: (job: MinimalJob<T>) => Promise<unknown>,
    opts: MinimalWorkerOptions,
  ) => MinimalWorker;
}

let cached: BullMQModule | null | undefined;

export function loadBullMQ(): BullMQModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('bullmq') as unknown as BullMQModule;
    cached = mod;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export interface IORedisLike {
  on(event: 'error', listener: (err: Error) => void): unknown;
  quit(): Promise<unknown>;
  status?: string;
}

export interface IORedisCtor {
  new (url: string, options: Record<string, unknown>): IORedisLike;
}

let cachedIORedis: IORedisCtor | null | undefined;

export function loadIORedis(): IORedisCtor | null {
  if (cachedIORedis !== undefined) return cachedIORedis;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('ioredis') as { default?: IORedisCtor } & IORedisCtor;
    cachedIORedis = ((mod as any).default ?? mod) as IORedisCtor;
    return cachedIORedis;
  } catch {
    cachedIORedis = null;
    return null;
  }
}

/** Test seam — clear caches so a unit test can swap implementations. */
export function _resetBullMQLoaderCache(): void {
  cached = undefined;
  cachedIORedis = undefined;
}
