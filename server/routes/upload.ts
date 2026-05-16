/**
 * P18 BE Track 2 / Aşama 1 — File upload pipeline.
 *
 * `POST /api/upload`     multipart/form-data, single image field "file".
 * `GET  /api/uploads/get` HMAC-signed read endpoint for the local adapter.
 *
 * Pipeline:
 *   1. authenticate (Bearer JWT or API key)
 *   2. parse multipart with `busboy` (dynamic require) → buffer in memory
 *      under MAX_BYTES (5 MB hard cap)
 *   3. MIME whitelist (image/jpeg, image/png, image/webp, image/avif)
 *   4. compute SHA-256, hit the `images` table for a hash dedupe
 *   5. write to storage adapter
 *   6. enqueue `image-resize` job for AVIF/WebP/thumbnail
 *   7. respond with { id, url, key, hash, size, contentType }
 *
 * The route is tier-rate-limited via the existing `tierRateLimiter`
 * (P16 BE Aşama 2). Hard cap of 5 MB enforced before any buffer
 * concatenation to keep memory bounded.
 *
 * Why not multer? busboy is multer's underlying parser; we avoid the
 * Express-specific glue layer because we want full control over the
 * memory cap + content-type validation BEFORE the body is buffered.
 */

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { getStorage } from '../lib/storage';
import { enqueue } from '../queues';

const router = Router();

// ── Tunables ─────────────────────────────────────────────────────────────────

const MAX_BYTES = Number.parseInt(process.env.UPLOAD_MAX_BYTES ?? '', 10) || 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

// ── busboy loader (dynamic require for sandbox / lazy install) ──────────────

interface BusboyInstance {
  on(event: 'file', listener: (
    fieldname: string,
    file: NodeJS.ReadableStream,
    info: { filename?: string; mimeType?: string; mimetype?: string; encoding?: string },
  ) => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  on(event: 'finish', listener: () => void): this;
  on(event: 'close', listener: () => void): this;
  on(event: 'filesLimit' | 'fieldsLimit' | 'partsLimit', listener: () => void): this;
}

type BusboyFactory = (config: {
  headers: Record<string, string | string[] | undefined>;
  limits?: { fileSize?: number; files?: number; fields?: number };
}) => BusboyInstance;

let busboyMod: BusboyFactory | null | undefined;

function loadBusboy(): BusboyFactory | null {
  if (busboyMod !== undefined) return busboyMod;
  try {
    const mod = require('busboy');
    busboyMod = ((mod as any).default ?? mod) as BusboyFactory;
  } catch {
    busboyMod = null;
  }
  return busboyMod;
}

// ── Parsed file shape ───────────────────────────────────────────────────────

interface ParsedUpload {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

async function parseSingleFile(req: Request): Promise<ParsedUpload> {
  const busboyFactory = loadBusboy();
  if (!busboyFactory) {
    throw Object.assign(new Error('busboy not installed'), { code: 'UPLOAD_PARSER_UNAVAILABLE', status: 500 });
  }

  return new Promise<ParsedUpload>((resolve, reject) => {
    const bb = busboyFactory({
      headers: req.headers as Record<string, string>,
      limits: { fileSize: MAX_BYTES, files: 1, fields: 4 },
    });

    let resolved = false;
    let captured: ParsedUpload | null = null;

    const fail = (status: number, code: string, message: string): void => {
      if (resolved) return;
      resolved = true;
      reject(Object.assign(new Error(message), { status, code }));
    };

    bb.on('file', (_fieldname, file, info) => {
      const mimeType = (info.mimeType ?? info.mimetype ?? '').toLowerCase();
      if (!ALLOWED_MIME.has(mimeType)) {
        // Drain the stream — busboy needs it consumed before "finish" fires.
        file.resume();
        return fail(415, 'UPLOAD_MIME_NOT_ALLOWED', `MIME ${mimeType || 'unknown'} is not allowed`);
      }
      const chunks: Buffer[] = [];
      let received = 0;
      let aborted = false;

      file.on('data', (chunk: Buffer) => {
        if (aborted) return;
        received += chunk.length;
        if (received > MAX_BYTES) {
          aborted = true;
          file.resume();
          return fail(413, 'UPLOAD_TOO_LARGE', `File exceeds max ${MAX_BYTES} bytes`);
        }
        chunks.push(chunk);
      });
      // busboy emits 'limit' on the stream when fileSize is hit.
      (file as unknown as { on(event: 'limit', listener: () => void): void }).on('limit', () => {
        aborted = true;
        return fail(413, 'UPLOAD_TOO_LARGE', `File exceeds max ${MAX_BYTES} bytes`);
      });
      file.on('end', () => {
        if (aborted) return;
        captured = {
          filename: info.filename ?? 'upload.bin',
          mimeType,
          buffer: Buffer.concat(chunks, received),
        };
      });
      file.on('error', (err: Error) => fail(400, 'UPLOAD_STREAM_ERROR', err.message));
    });

    bb.on('error', (err: Error) => fail(400, 'UPLOAD_PARSE_ERROR', err.message));
    bb.on('filesLimit', () => fail(400, 'UPLOAD_TOO_MANY_FILES', 'Only one file per request'));
    bb.on('partsLimit', () => fail(400, 'UPLOAD_TOO_MANY_PARTS', 'Too many parts'));
    bb.on('finish', () => {
      if (resolved) return;
      if (!captured) {
        resolved = true;
        return reject(
          Object.assign(new Error('No file field "file" found'), {
            status: 400,
            code: 'UPLOAD_NO_FILE',
          }),
        );
      }
      resolved = true;
      resolve(captured);
    });

    req.pipe(bb as unknown as NodeJS.WritableStream);
  });
}

// ── POST /api/upload ────────────────────────────────────────────────────────

router.post(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Content-Type sanity — `busboy` will reject non-multipart but we want
      // a clean 415 before allocating the parser.
      const ct = (req.headers['content-type'] ?? '').toString().toLowerCase();
      if (!ct.startsWith('multipart/form-data')) {
        res.status(415).json({
          status: 'error',
          code: 'UPLOAD_REQUIRES_MULTIPART',
          message: 'Content-Type must be multipart/form-data',
        });
        return;
      }

      const userId = req.user?.id ?? null;

      const parsed = await parseSingleFile(req).catch((err) => {
        throw err;
      });

      const ext = EXT_BY_MIME[parsed.mimeType] ?? 'bin';
      const now = new Date();
      const yyyy = String(now.getUTCFullYear());
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
      const ownerSegment = userId ?? 'anonymous';
      const id = randomUUID();
      const storageKey = `${ownerSegment}/${yyyy}/${mm}/${id}.${ext}`;

      const storage = getStorage();
      const result = await storage.put({
        key: storageKey,
        body: parsed.buffer,
        contentType: parsed.mimeType,
      });

      // Hash-based dedupe — if the same bytes were uploaded before, return
      // the existing row instead of creating a duplicate. We still keep the
      // newly-written object so a future GET against the new key works;
      // dedupe is at the DB-row level (Image.hash UNIQUE).
      const existing = await (prisma as any).image.findUnique({ where: { hash: result.hash } });
      if (existing) {
        // Delete the just-written duplicate to reclaim space.
        await storage.delete(storageKey).catch((err: Error) =>
          logger.warn('[upload] dedupe cleanup failed', { message: err.message }),
        );
        res.status(200).json({
          status: 'success',
          data: {
            id: existing.id,
            url: storage.publicUrl(existing.storageKey) ?? (await storage.signedUrl(existing.storageKey, 3600)),
            key: existing.storageKey,
            hash: existing.hash,
            size: existing.sizeBytes,
            contentType: existing.contentType,
            deduplicated: true,
          },
        });
        return;
      }

      const row = await (prisma as any).image.create({
        data: {
          id,
          ownerId: userId,
          storageKey: result.key,
          contentType: result.contentType,
          sizeBytes: result.size,
          hash: result.hash,
          status: 'processing',
        },
      });

      // Fire-and-forget enqueue. Failure to enqueue is non-fatal — admin
      // can manually re-run `image-resize` via Bull-Board.
      void enqueue('image-resize', {
        imageId: row.id,
        sourceKey: row.storageKey,
      }).catch((err: Error) =>
        logger.warn('[upload] enqueue image-resize failed', { message: err.message }),
      );

      logger.info('[upload] accepted', {
        imageId: row.id,
        ownerId: userId,
        size: result.size,
        contentType: result.contentType,
      });

      res.status(201).json({
        status: 'success',
        data: {
          id: row.id,
          url: result.url,
          key: row.storageKey,
          hash: row.hash,
          size: row.sizeBytes,
          contentType: row.contentType,
          deduplicated: false,
        },
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      const status = (err as { status?: number }).status;
      if (status && code) {
        res.status(status).json({
          status: 'error',
          code,
          message: (err as Error).message,
        });
        return;
      }
      next(err);
    }
  },
);

export default router;
