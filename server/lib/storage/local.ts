/**
 * P18 BE Track 2 / Aşama 1 — Local filesystem storage adapter.
 *
 * Backs `StorageAdapter` with a directory on disk. Used in:
 *   - dev (no S3 credentials),
 *   - CI / unit tests (deterministic, hermetic),
 *   - small self-hosted deployments where adding object storage is overkill.
 *
 * Path layout: <root>/<storageKey>. Keys are validated by
 * `assertSafeStorageKey` so `..` traversal cannot escape the root.
 *
 * Signed URL strategy: produces an HMAC-signed Express path
 * `/api/uploads/get?key=...&exp=...&sig=...`. The corresponding GET
 * handler validates the signature with a constant-time compare. The
 * symmetric secret is `STORAGE_SIGNING_SECRET` (env, required when
 * `STORAGE_BACKEND=local` in production).
 *
 * Why HMAC paths and not just public file serving? It mirrors the S3
 * pre-signed pattern so the surface (`POST /api/upload` returns a URL;
 * the URL is the only handle the FE keeps) is invariant across backends.
 */

import { promises as fs } from 'node:fs';
import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import path from 'node:path';
import {
  type StorageAdapter,
  type PutObjectInput,
  type PutObjectResult,
  type GetObjectResult,
  assertSafeStorageKey,
} from './types';
import { logger } from '../../config/logger';

const DEFAULT_ROOT = path.resolve(process.cwd(), 'storage-local');

export interface LocalStorageOptions {
  root?: string;
  /** Base URL clients should hit to fetch objects — Express path. */
  publicBaseUrl?: string;
  signingSecret?: string;
}

function resolveSigningSecret(provided?: string): string {
  const fromEnv = provided ?? process.env.STORAGE_SIGNING_SECRET ?? '';
  if (fromEnv.length >= 32) return fromEnv;
  // In production we must fail loudly so an operator wires a real secret.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'STORAGE_SIGNING_SECRET must be set and >=32 chars when STORAGE_BACKEND=local',
    );
  }
  logger.warn(
    '[storage/local] STORAGE_SIGNING_SECRET missing — using insecure dev fallback. NEVER use in prod.',
  );
  return 'dev-only-insecure-storage-signing-secret-do-not-use-in-prod';
}

export class LocalStorageAdapter implements StorageAdapter {
  readonly name = 'local' as const;
  private readonly root: string;
  private readonly publicBaseUrl: string;
  private readonly signingSecret: string;

  constructor(opts: LocalStorageOptions = {}) {
    this.root = path.resolve(opts.root ?? process.env.STORAGE_LOCAL_ROOT ?? DEFAULT_ROOT);
    this.publicBaseUrl =
      opts.publicBaseUrl ??
      process.env.STORAGE_PUBLIC_BASE_URL ??
      '/api/uploads/get';
    this.signingSecret = resolveSigningSecret(opts.signingSecret);
  }

  private absolutePath(key: string): string {
    assertSafeStorageKey(key);
    const joined = path.join(this.root, key);
    const resolved = path.resolve(joined);
    // Belt-and-braces — ensure the resolved path is still inside root.
    if (!resolved.startsWith(this.root + path.sep) && resolved !== this.root) {
      throw new Error('storage/local: path escapes root');
    }
    return resolved;
  }

  async put(input: PutObjectInput): Promise<PutObjectResult> {
    const abs = this.absolutePath(input.key);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, input.body);
    // Drop a side-car manifest so `get` can return Content-Type without an
    // additional MIME-sniff round-trip. Tiny JSON, written atomically next
    // to the blob.
    await fs.writeFile(
      `${abs}.meta.json`,
      JSON.stringify({ contentType: input.contentType, size: input.body.length }),
    );
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
    const abs = this.absolutePath(key);
    try {
      const body = await fs.readFile(abs);
      let contentType = 'application/octet-stream';
      try {
        const metaRaw = await fs.readFile(`${abs}.meta.json`, 'utf8');
        const meta = JSON.parse(metaRaw) as { contentType?: string };
        if (typeof meta.contentType === 'string') contentType = meta.contentType;
      } catch {
        // No sidecar — fall back to default.
      }
      return { body, contentType, size: body.length };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    const abs = this.absolutePath(key);
    await fs.rm(abs, { force: true });
    await fs.rm(`${abs}.meta.json`, { force: true });
  }

  signSync(key: string, ttlSeconds: number): string {
    const exp = Math.floor(Date.now() / 1000) + Math.max(1, Math.min(ttlSeconds, 7 * 24 * 3600));
    const payload = `${key}.${exp}`;
    const sig = createHmac('sha256', this.signingSecret).update(payload).digest('hex');
    const qs = new URLSearchParams({ key, exp: String(exp), sig });
    return `${this.publicBaseUrl}?${qs.toString()}`;
  }

  async signedUrl(key: string, ttlSeconds: number): Promise<string> {
    return this.signSync(key, ttlSeconds);
  }

  publicUrl(_key: string): string | null {
    // Local adapter never has a public URL — every fetch must be signed
    // so we keep parity with S3 private buckets.
    return null;
  }

  /** Constant-time HMAC verification. Used by the Express get handler. */
  verifySignature(key: string, exp: number, sig: string): boolean {
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
    const expected = createHmac('sha256', this.signingSecret)
      .update(`${key}.${exp}`)
      .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
}
