/**
 * P18 BE Track 2 / Aşama 1 — HMAC-signed object fetch (local adapter only).
 *
 * Public path: `GET /api/uploads/get?key=<>&exp=<>&sig=<>`.
 *
 * Provides the read side of the local storage adapter — the upload route
 * stamps a time-limited signed URL into the response; clients hit this
 * handler to fetch the bytes. The S3 adapter is never routed here
 * because S3 pre-signed URLs go straight to the bucket (no Express hop).
 *
 * Lives in its own file so the contract-test extractor picks the
 * canonical `/uploads/get` path up from `router.get('/get', ...)`.
 */

import { Router, Request, Response } from 'express';
import { getStorage, LocalStorageAdapter } from '../lib/storage';

const router = Router();

router.get('/get', async (req: Request, res: Response): Promise<void> => {
  const storage = getStorage();
  if (!(storage instanceof LocalStorageAdapter)) {
    res.status(404).json({ status: 'error', message: 'Local adapter not active' });
    return;
  }
  const key = typeof req.query.key === 'string' ? req.query.key : '';
  const expRaw = typeof req.query.exp === 'string' ? req.query.exp : '';
  const sig = typeof req.query.sig === 'string' ? req.query.sig : '';
  const exp = Number.parseInt(expRaw, 10);

  if (!key || !sig || !Number.isFinite(exp)) {
    res.status(400).json({ status: 'error', code: 'UPLOAD_GET_BAD_PARAMS' });
    return;
  }
  if (!storage.verifySignature(key, exp, sig)) {
    res.status(403).json({ status: 'error', code: 'UPLOAD_GET_SIG_INVALID' });
    return;
  }
  const obj = await storage.get(key);
  if (!obj) {
    res.status(404).json({ status: 'error', code: 'UPLOAD_GET_NOT_FOUND' });
    return;
  }
  res.setHeader('Content-Type', obj.contentType);
  res.setHeader('Content-Length', String(obj.size));
  res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
  res.status(200).end(obj.body);
});

export default router;
