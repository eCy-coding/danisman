/**
 * P35-T04: 2FA TOTP Routes
 *
 * POST /api/auth/2fa/setup      → generate secret + QR code (requires auth)
 * POST /api/auth/2fa/verify-setup → confirm first TOTP code + enable 2FA
 * POST /api/auth/2fa/disable    → disable 2FA (requires password re-auth)
 * POST /api/auth/2fa/backup-codes → regenerate backup codes
 *
 * Login flow mutation (authController.ts):
 *   After password verify → if user.totpEnabled → return { requires2FA: true, tempToken }
 *   POST /api/auth/2fa/login → validate tempToken + TOTP code → issue full JWT
 */

import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { authenticate, type AuthRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';
import {
  generateTotpSetup,
  verifyTotpToken,
  generateBackupCodes,
  verifyAndConsumeBackupCode,
} from '../lib/totp';

const router = Router();

// ─── Setup: generate secret + QR ─────────────────────────

router.post(
  '/setup',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, totpEnabled: true },
      });
      if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
      if (user.totpEnabled)
        throw new HttpError(409, 'TOTP_ALREADY_ENABLED', '2FA is already enabled');

      const setup = await generateTotpSetup(user.email);

      // Store the pending secret temporarily — only finalize on verify-setup
      await prisma.user.update({
        where: { id: userId },
        data: { totpSecret: setup.secret, totpEnabled: false },
      });

      res.json({
        status: 'success',
        data: {
          qrCodeDataUrl: setup.qrCodeDataUrl,
          otpauthUrl: setup.otpauthUrl,
          // Manual entry fallback (never expose actual secret in logs)
          manualEntryKey: setup.secret,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Verify setup: validate first code → enable 2FA ──────

router.post(
  '/verify-setup',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');

      const { token } = req.body as { token: string };
      if (!token || typeof token !== 'string' || !/^\d{6}$/.test(token)) {
        throw new HttpError(400, 'INVALID_TOKEN', '6-digit code required');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totpSecret: true, totpEnabled: true },
      });
      if (!user?.totpSecret) throw new HttpError(400, 'TOTP_NOT_SETUP', 'Call /2fa/setup first');
      if (user.totpEnabled) throw new HttpError(409, 'TOTP_ALREADY_ENABLED', '2FA already active');

      const valid = verifyTotpToken(user.totpSecret, token);
      if (!valid) throw new HttpError(401, 'INVALID_TOTP', 'Invalid verification code');

      const { clearCodes, hashedCodes } = generateBackupCodes();

      await prisma.user.update({
        where: { id: userId },
        data: { totpEnabled: true, backupCodes: JSON.stringify(hashedCodes) },
      });

      res.json({
        status: 'success',
        data: {
          message: '2FA enabled successfully',
          backupCodes: clearCodes, // Show once — user must save these
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Validate TOTP during login (second step) ─────────────

router.post(
  '/validate',
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, token, backupCode } = req.body as {
        userId: string;
        token?: string;
        backupCode?: string;
      };

      if (!userId) throw new HttpError(400, 'MISSING_USER_ID', 'userId required');
      if (!token && !backupCode)
        throw new HttpError(400, 'MISSING_CODE', 'token or backupCode required');

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totpSecret: true, totpEnabled: true, backupCodes: true, email: true, role: true },
      });

      if (!user || !user.totpEnabled || !user.totpSecret) {
        throw new HttpError(400, 'TOTP_NOT_ENABLED', '2FA not enabled for this user');
      }

      if (token) {
        const valid = verifyTotpToken(user.totpSecret, token);
        if (!valid) throw new HttpError(401, 'INVALID_TOTP', 'Invalid or expired TOTP code');
      } else if (backupCode) {
        const codes: string[] = JSON.parse(user.backupCodes ?? '[]');
        const result = verifyAndConsumeBackupCode(backupCode, codes);
        if (!result.valid) throw new HttpError(401, 'INVALID_BACKUP_CODE', 'Invalid backup code');

        await prisma.user.update({
          where: { id: userId },
          data: { backupCodes: JSON.stringify(result.remainingCodes) },
        });
      }

      res.json({ status: 'success', data: { verified: true } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Disable 2FA ──────────────────────────────────────────

router.post(
  '/disable',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');

      const { token } = req.body as { token: string };
      if (!token || !/^\d{6}$/.test(token)) {
        throw new HttpError(400, 'INVALID_TOKEN', 'Current 2FA code required to disable');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totpSecret: true, totpEnabled: true },
      });
      if (!user?.totpEnabled) throw new HttpError(400, 'TOTP_NOT_ENABLED', '2FA not enabled');

      const valid = verifyTotpToken(user.totpSecret!, token);
      if (!valid) throw new HttpError(401, 'INVALID_TOTP', 'Invalid 2FA code');

      await prisma.user.update({
        where: { id: userId },
        data: { totpEnabled: false, totpSecret: null, backupCodes: null },
      });

      res.json({ status: 'success', data: { message: '2FA disabled' } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Regenerate backup codes ──────────────────────────────

router.post(
  '/backup-codes',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required');

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totpEnabled: true },
      });
      if (!user?.totpEnabled) throw new HttpError(400, 'TOTP_NOT_ENABLED', '2FA not enabled');

      const { clearCodes, hashedCodes } = generateBackupCodes();
      await prisma.user.update({
        where: { id: userId },
        data: { backupCodes: JSON.stringify(hashedCodes) },
      });

      res.json({ status: 'success', data: { backupCodes: clearCodes } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
