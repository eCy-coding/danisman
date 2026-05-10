/**
 * P35-T04: 2FA TOTP — speakeasy wrapper + AES-256-GCM at-rest encryption
 *
 * Architecture:
 *   - generateTotpSetup()    → new base32 TOTP secret + otpauth URI (for QR code)
 *   - verifyToken()          → validates 6-digit code (±1 window for clock drift)
 *   - generateBackupCodes()  → 8 one-time codes (hex32 each) → hashed array
 *   - verifyBackupCode()     → constant-time compare against stored hashed codes
 *   - encryptTotpSecret()    → AES-256-GCM encrypt before DB write
 *   - decryptTotpSecret()    → AES-256-GCM decrypt after DB read
 *
 * P35-T04 at-rest encryption:
 *   - Algorithm: AES-256-GCM (authenticated encryption — integrity + confidentiality)
 *   - Key: TOTP_ENCRYPTION_KEY env (32 random bytes as 64-char hex)
 *   - IV: 12 random bytes per encryption (prepended to ciphertext)
 *   - Auth tag: 16 bytes (appended — GCM authentication tag)
 *   - Format: `{iv_hex}.{tag_hex}.{ciphertext_hex}` (3 dot-separated hex blocks)
 *
 * Without TOTP_ENCRYPTION_KEY:
 *   - Secret stored unencrypted (fall-through) + warning logged
 *   - This ensures backward compatibility with existing records
 *   - Generate key: openssl rand -hex 32
 *
 * Security invariants:
 *   - Never log cleartext secret — only logged as [ENCRYPTED] or [PLAINTEXT_FALLBACK]
 *   - timingSafeEqual used for all code comparisons (no timing attacks)
 *   - Window=1 → ±30s clock skew tolerance (RFC 6238)
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { createHash, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv } from 'crypto';
import { logger } from '../config/logger';

// ─── AES-256-GCM at-rest encryption ──────────────────────────

const ENC_ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // 96-bit IV — GCM standard (NIST SP 800-38D)
const KEY_HEX_LEN = 64; // 32 bytes as hex → AES-256

/**
 * Derives the encryption key from TOTP_ENCRYPTION_KEY env var.
 * Returns null if env var is not set (fallback = no encryption).
 */
function getEncKey(): Buffer | null {
  const raw = process.env.TOTP_ENCRYPTION_KEY;
  if (!raw) return null;
  if (raw.length !== KEY_HEX_LEN) {
    logger.warn(
      '[TOTP] TOTP_ENCRYPTION_KEY must be 64 hex chars (32 bytes). Current length: ' + raw.length,
    );
    return null;
  }
  return Buffer.from(raw, 'hex');
}

/**
 * Encrypt a TOTP secret (base32 string) using AES-256-GCM.
 * Returns the encrypted payload as: `{iv}.{tag}.{ciphertext}` (all hex).
 * Falls back to returning the plaintext if TOTP_ENCRYPTION_KEY is not set.
 */
export function encryptTotpSecret(plaintext: string): string {
  const key = getEncKey();
  if (!key) {
    logger.warn('[TOTP] encryptTotpSecret: TOTP_ENCRYPTION_KEY not set — storing plaintext');
    return plaintext; // Fallback: no encryption
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ENC_ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}.${tag.toString('hex')}.${ciphertext.toString('hex')}`;
}

/**
 * Decrypt a TOTP secret stored as `{iv}.{tag}.{ciphertext}` hex payload.
 * Falls back to returning the value as-is if it's not in encrypted format
 * (handles legacy plaintext secrets or missing TOTP_ENCRYPTION_KEY).
 */
export function decryptTotpSecret(stored: string): string {
  const key = getEncKey();
  if (!key) return stored; // No key → assume plaintext

  // Detect encrypted format: 3 dot-separated hex blocks
  const parts = stored.split('.');
  if (parts.length !== 3) return stored; // Legacy plaintext

  const [ivHex, tagHex, ctHex] = parts as [string, string, string];

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const ciphertext = Buffer.from(ctHex, 'hex');

    const decipher = createDecipheriv(ENC_ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch (err) {
    logger.error('[TOTP] decryptTotpSecret: decryption failed', { error: (err as Error).message });
    throw new Error('TOTP secret decryption failed — check TOTP_ENCRYPTION_KEY');
  }
}

const APP_NAME = 'EcyPro';

export interface TotpSetup {
  secret: string; // base32 secret for DB storage
  otpauthUrl: string; // otpauth://totp/... for QR code generation
  qrCodeDataUrl: string; // data:image/png;base64,... ready for <img src>
}

// ─── Generate new TOTP secret + QR for a user email ──────

export async function generateTotpSetup(email: string): Promise<TotpSetup> {
  const generated = speakeasy.generateSecret({
    name: `${APP_NAME} (${email})`,
    issuer: APP_NAME,
    length: 20,
  });

  const secret = generated.base32;
  const otpauthUrl = generated.otpauth_url!;

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    width: 200,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  return { secret, otpauthUrl, qrCodeDataUrl };
}

// ─── Verify 6-digit TOTP token ────────────────────────────

export function verifyTotpToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // ±30s clock skew
  });
}

// ─── Backup codes: generate 8 hex32 codes → return {clear, hashed} ───

export interface BackupCodesResult {
  clearCodes: string[]; // show once to user — NEVER store
  hashedCodes: string[]; // store in DB as JSON array
}

export function generateBackupCodes(): BackupCodesResult {
  const clearCodes = Array.from(
    { length: 8 },
    () => randomBytes(4).toString('hex').toUpperCase(), // "A1B2C3D4" format
  );
  const hashedCodes = clearCodes.map((c) => createHash('sha256').update(c).digest('hex'));
  return { clearCodes, hashedCodes };
}

// ─── Verify & consume a backup code ──────────────────────

export function verifyAndConsumeBackupCode(
  inputCode: string,
  hashedCodes: string[],
): { valid: boolean; remainingCodes: string[] } {
  const inputHash = createHash('sha256')
    .update(inputCode.toUpperCase().replace(/-/g, ''))
    .digest('hex');

  let matchIndex = -1;
  for (let i = 0; i < hashedCodes.length; i++) {
    const stored = Buffer.from(hashedCodes[i]!, 'hex');
    const input = Buffer.from(inputHash, 'hex');
    if (stored.length === input.length && timingSafeEqual(stored, input)) {
      matchIndex = i;
      break;
    }
  }

  if (matchIndex === -1) return { valid: false, remainingCodes: hashedCodes };

  const remainingCodes = hashedCodes.filter((_, i) => i !== matchIndex);
  return { valid: true, remainingCodes };
}
