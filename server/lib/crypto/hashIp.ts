/**
 * Canonical IP pseudonymization helper.
 *
 * Hashes a raw IP address (IPv4 or IPv6, with or without port) to a
 * 128-bit hex digest (32 chars) suitable for audit-trail rows where a
 * stable per-IP identifier is required without storing the real IP.
 *
 * KVKK compliance:
 *   - m.4 (Veri minimizasyonu / Data minimization): raw IP is PII; only
 *     the hashed pseudonym is persisted, so the data we keep is the
 *     minimum needed to detect abuse/duplicate submissions.
 *   - m.12 (Veri güvenliği / Data security): SHA-256 is a one-way
 *     cryptographic hash; 32-char hex = 128-bit collision resistance,
 *     enough to make re-identification impractical at our traffic
 *     volume while still letting us correlate consent + lead rows for
 *     the same client.
 *
 * Vault citations (NotebookLM 2026-06-01 CONVERGENT):
 *   - [Architect] server/lib/<helper>.ts canonical path
 *   - [Standards Lead] SHOULD 32-char (128-bit) — collision-resistance
 *     upgrade from earlier 16-char ad-hoc pattern in contact.ts /
 *     newsletter.ts (PR #135)
 *   - [Coding Patterns Librarian] No canonical hashIp pattern existed
 *     before this PR — Architect codification gap closed.
 *
 * @param ip - Raw IP string from `req.ip` (Express). May be undefined
 *             when the request has no resolvable remote address.
 * @returns 32-char lowercase hex digest, or `null` when input is
 *          missing or empty. NEVER throws — callers can safely write
 *          the result to a nullable column.
 */
import crypto from 'node:crypto';

export function hashIp(ip: string | undefined | null): string | null {
  if (!ip || ip.length === 0) return null;
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
}
