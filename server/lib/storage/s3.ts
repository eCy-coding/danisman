/**
 * P18 BE Track 2 / Aşama 1 — S3-compatible storage adapter.
 *
 * Designed to drive **any** S3-protocol endpoint without code changes:
 *   - AWS S3                (endpoint: default, sigv4)
 *   - Cloudflare R2         (endpoint: https://<account>.r2.cloudflarestorage.com)
 *   - Backblaze B2          (endpoint: https://s3.<region>.backblazeb2.com)
 *   - Hostinger Object S.   (endpoint: https://obj-<region>.hostinger.com)
 *
 * `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` are loaded
 * dynamically via `require` so the file compiles cleanly when the SDK
 * isn't yet in `node_modules` (mirrors the BullMQ/IORedis pattern in
 * `server/queues/bullmq-types.ts`). If the SDK is missing at runtime
 * we fail loud — there is no inline fallback for cloud storage.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import { createHash } from 'node:crypto';
import {
  type StorageAdapter,
  type PutObjectInput,
  type PutObjectResult,
  type GetObjectResult,
  assertSafeStorageKey,
} from './types';
import { logger } from '../../config/logger';

// ── Minimal AWS SDK type surface (loaded dynamically) ────────────────────────

interface AwsS3Module {
  S3Client: new (config: Record<string, unknown>) => AwsS3Client;
  PutObjectCommand: new (input: Record<string, unknown>) => unknown;
  GetObjectCommand: new (input: Record<string, unknown>) => unknown;
  DeleteObjectCommand: new (input: Record<string, unknown>) => unknown;
}

interface AwsS3Client {
  send(cmd: unknown): Promise<{
    Body?: { transformToByteArray(): Promise<Uint8Array> };
    ContentType?: string;
    ContentLength?: number;
  }>;
  destroy?(): void;
}

interface AwsPresignerModule {
  getSignedUrl: (
    client: AwsS3Client,
    command: unknown,
    options: { expiresIn: number },
  ) => Promise<string>;
}

let s3Module: AwsS3Module | null | undefined;
let presignerModule: AwsPresignerModule | null | undefined;

function loadS3(): AwsS3Module | null {
  if (s3Module !== undefined) return s3Module;
  try {
    s3Module = require('@aws-sdk/client-s3') as AwsS3Module;
  } catch {
    s3Module = null;
  }
  return s3Module;
}

function loadPresigner(): AwsPresignerModule | null {
  if (presignerModule !== undefined) return presignerModule;
  try {
    presignerModule = require('@aws-sdk/s3-request-presigner') as AwsPresignerModule;
  } catch {
    presignerModule = null;
  }
  return presignerModule;
}

// ── Config + adapter ─────────────────────────────────────────────────────────

export interface S3StorageOptions {
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  /** Force path-style (R2/B2/Minio) vs virtual-hosted (AWS S3 default). */
  forcePathStyle?: boolean;
  /** Public base URL when the bucket exposes a CDN, e.g.
   *  `https://cdn.ecypro.com`. When set, `publicUrl(key)` returns the joined
   *  URL; otherwise callers must use `signedUrl`. */
  publicBaseUrl?: string;
}

export class S3StorageAdapter implements StorageAdapter {
  readonly name = 's3' as const;
  private readonly bucket: string;
  private readonly publicBaseUrl: string | null;
  private readonly client: AwsS3Client;
  private readonly mod: AwsS3Module;

  constructor(opts: S3StorageOptions) {
    const mod = loadS3();
    if (!mod) {
      throw new Error(
        'S3StorageAdapter: @aws-sdk/client-s3 is not installed. Run: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner',
      );
    }
    this.mod = mod;
    this.bucket = opts.bucket;
    this.publicBaseUrl = opts.publicBaseUrl?.replace(/\/+$/, '') ?? null;

    const config: Record<string, unknown> = {
      region: opts.region ?? process.env.AWS_REGION ?? 'auto',
    };
    if (opts.endpoint) config.endpoint = opts.endpoint;
    if (opts.forcePathStyle !== undefined) config.forcePathStyle = opts.forcePathStyle;
    if (opts.accessKeyId && opts.secretAccessKey) {
      config.credentials = {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
      };
    }
    this.client = new mod.S3Client(config);
  }

  async put(input: PutObjectInput): Promise<PutObjectResult> {
    assertSafeStorageKey(input.key);
    const cmd = new this.mod.PutObjectCommand({
      Bucket: this.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl ?? 'public, max-age=31536000, immutable',
      Metadata: input.metadata,
    });
    await this.client.send(cmd);
    const hash = createHash('sha256').update(input.body).digest('hex');
    const url = this.publicUrl(input.key) ?? (await this.signedUrl(input.key, 3600));
    return {
      key: input.key,
      url,
      hash,
      size: input.body.length,
      contentType: input.contentType,
    };
  }

  async get(key: string): Promise<GetObjectResult | null> {
    assertSafeStorageKey(key);
    try {
      const cmd = new this.mod.GetObjectCommand({ Bucket: this.bucket, Key: key });
      const result = await this.client.send(cmd);
      if (!result.Body) return null;
      const bytes = await result.Body.transformToByteArray();
      return {
        body: Buffer.from(bytes),
        contentType: result.ContentType ?? 'application/octet-stream',
        size: result.ContentLength ?? bytes.byteLength,
      };
    } catch (err) {
      const code = (err as { name?: string; Code?: string }).name ?? (err as { Code?: string }).Code;
      if (code === 'NoSuchKey' || code === 'NotFound') return null;
      logger.warn('[storage/s3] get failed', { key, message: (err as Error).message });
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    assertSafeStorageKey(key);
    const cmd = new this.mod.DeleteObjectCommand({ Bucket: this.bucket, Key: key });
    await this.client.send(cmd);
  }

  async signedUrl(key: string, ttlSeconds: number): Promise<string> {
    assertSafeStorageKey(key);
    const presigner = loadPresigner();
    if (!presigner) {
      throw new Error(
        'S3StorageAdapter.signedUrl: @aws-sdk/s3-request-presigner is not installed',
      );
    }
    const cmd = new this.mod.GetObjectCommand({ Bucket: this.bucket, Key: key });
    return presigner.getSignedUrl(this.client, cmd, {
      expiresIn: Math.max(1, Math.min(ttlSeconds, 7 * 24 * 3600)),
    });
  }

  publicUrl(key: string): string | null {
    if (!this.publicBaseUrl) return null;
    assertSafeStorageKey(key);
    return `${this.publicBaseUrl}/${key}`;
  }
}
