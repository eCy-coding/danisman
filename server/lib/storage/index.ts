/**
 * P18 BE Track 2 / Aşama 1 — Storage adapter factory.
 *
 * Singleton entry point. `getStorage()` returns the configured adapter
 * based on env. Constructed lazily so a sandbox import doesn't try to
 * reach AWS endpoints.
 *
 * Selection:
 *   - `STORAGE_BACKEND=s3` → S3-compatible adapter. Requires
 *       `STORAGE_S3_BUCKET` and either `AWS_ACCESS_KEY_ID/SECRET` or
 *       IAM role attached to the runtime.
 *   - anything else (default) → local filesystem adapter.
 *
 * Tests can call `setStorage(adapter)` to inject a fake.
 */

import type { StorageAdapter } from './types';
import { LocalStorageAdapter } from './local';
import { S3StorageAdapter } from './s3';
import { logger } from '../../config/logger';

let cached: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (cached) return cached;
  const backend = (process.env.STORAGE_BACKEND ?? 'local').toLowerCase();
  if (backend === 's3') {
    const bucket = process.env.STORAGE_S3_BUCKET;
    if (!bucket) {
      throw new Error('STORAGE_BACKEND=s3 requires STORAGE_S3_BUCKET to be set');
    }
    cached = new S3StorageAdapter({
      bucket,
      region: process.env.STORAGE_S3_REGION,
      endpoint: process.env.STORAGE_S3_ENDPOINT,
      accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey:
        process.env.STORAGE_S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY,
      forcePathStyle: process.env.STORAGE_S3_FORCE_PATH_STYLE === '1',
      publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL,
    });
    logger.info('[storage] backend=s3', {
      bucket,
      endpoint: process.env.STORAGE_S3_ENDPOINT ?? 'aws-default',
    });
    return cached;
  }
  cached = new LocalStorageAdapter();
  logger.info('[storage] backend=local');
  return cached;
}

/** Test seam. */
export function setStorage(adapter: StorageAdapter | null): void {
  cached = adapter;
}

export type { StorageAdapter, PutObjectInput, PutObjectResult, GetObjectResult } from './types';
export { LocalStorageAdapter } from './local';
export { S3StorageAdapter } from './s3';
export { assertSafeStorageKey } from './types';
