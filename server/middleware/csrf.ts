/**
 * Security hardening — admin CSRF double-submit protection.
 *
 * IMPORTANT CONTEXT (read before touching this file): this app has NO auth
 * cookies. The JWT lives in the Zustand-persisted `localStorage` entry and is
 * manually attached as `Authorization: Bearer …` by the axios interceptor
 * (src/lib/api.ts). A classic CSRF attack — the browser auto-attaching a
 * credential to a forged cross-origin request — does NOT apply to this
 * architecture: an attacker page cannot read the victim's localStorage token,
 * and cannot make the browser send a custom `Authorization` header on a
 * cross-origin request without a CORS preflight, which the Origin allowlist
 * (see `cors.ts` + `originGuard.ts`) already rejects. `originGuard.ts`
 * therefore remains the PRIMARY defense and is left untouched.
 *
 * This double-submit cookie is an additional, independent layer requested as
 * part of a security-hardening pass. Its realistic marginal value is
 * covering the residual case where Origin/Referer are absent or spoofed by a
 * non-browser client that has separately obtained a valid JWT (e.g. an SSRF
 * proxy or misconfigured internal tool) — the request would still need to
 * present a value only a same-site page could have read via `document.cookie`.
 * It does NOT protect anything the Bearer-token model didn't already protect
 * against genuine cross-origin browser CSRF.
 *
 * ── TWO MODES — read this before touching CSRF_COOKIE_DOMAIN ──────────────
 *
 * The API runs on api.ecypro.com while the SPA runs on ecypro.com /
 * www.ecypro.com (see reference_ecypro_cloudflare topology). For the SPA's
 * JS to read this cookie at all, it must be issued with `Domain=.ecypro.com`
 * (a parent-domain cookie) — the host-only default would scope it to
 * api.ecypro.com alone and the client could never echo it back. Vercel
 * preview deployments (*.vercel.app) are a DIFFERENT registrable domain —
 * no `Domain` value makes the cookie visible there.
 *
 * Enforcing the double-submit check unconditionally therefore trades a
 * marginal defense-in-depth gain for a hard failure mode: every preview
 * deployment's admin mutations would 403, and a misconfigured/missing
 * `CSRF_COOKIE_DOMAIN` in production would do the same. That is a bad trade
 * against a control whose primary value is already covered by the Origin
 * guard. So enforcement is explicitly owner-gated:
 *
 *   - `CSRF_COOKIE_DOMAIN` UNSET (default — includes every preview deploy):
 *     the cookie is still ISSUED (host-only) and a header IS still validated
 *     against the cookie *if the client sends one* — a present-but-wrong
 *     token is always rejected (403), since that's a real tamper/bug signal
 *     regardless of mode. A request with NO header at all is allowed
 *     through; the Origin guard is the active protection in this mode. A
 *     startup warning is logged once naming the env var that turns
 *     enforcement on.
 *
 *   - `CSRF_COOKIE_DOMAIN` SET (e.g. `.ecypro.com` on the API service —
 *     the owner's deliberate signal that the cookie domain has been
 *     verified correct for that environment): full enforcement. A missing
 *     OR mismatched header/cookie is rejected (403) on every mutation.
 *
 * Owner step to enable enforcement in production: set
 * `CSRF_COOKIE_DOMAIN=.ecypro.com` on the API service's env (Render), only
 * after confirming the SPA's origin(s) are genuine ecypro.com subdomains.
 * Leave it unset for preview/staging environments that don't share that
 * parent domain.
 */

import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const CSRF_COOKIE_NAME = 'ecypro_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';
export const CSRF_COOKIE_DOMAIN_ENV_VAR = 'CSRF_COOKIE_DOMAIN';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // matches refresh-token lifetime (7d)

// Read directly from `process.env` (not the cached `config/env.ts` singleton)
// so both the cookie's Domain attribute and the enforcement decision reflect
// the CURRENT value on every call — this is what makes the mode testable via
// env mutation and mirrors the existing pattern in cors.ts / originGuard.ts.
function resolveCookieDomain(): string | undefined {
  const raw = process.env[CSRF_COOKIE_DOMAIN_ENV_VAR]?.trim();
  return raw || undefined;
}

function enforcementActive(): boolean {
  return resolveCookieDomain() !== undefined;
}

// Log once at import time (process startup), not per-request — a per-request
// warning would spam the logs for the entire lifetime of an unconfigured
// deployment (every preview build, by design).
if (process.env.NODE_ENV === 'production' && !enforcementActive()) {
  logger.warn(
    `[csrf] ${CSRF_COOKIE_DOMAIN_ENV_VAR} is not set — double-submit ENFORCEMENT IS INACTIVE. ` +
      'Requests without a CSRF header are allowed through; the Origin guard is the active ' +
      'defense in this mode. A present-but-mismatched token is still rejected. Set ' +
      `${CSRF_COOKIE_DOMAIN_ENV_VAR}=.ecypro.com on the API service once its value is verified ` +
      'correct for this environment to enable full enforcement.',
  );
}

/**
 * Issue (or reissue) the CSRF double-submit cookie. Call this at every
 * session-establishing response — login and refresh — so a long-lived
 * session (via refresh-token rotation) never outlives the cookie's 7-day
 * maxAge and silently starts failing validation for clients that DO send
 * the header. Issued unconditionally, regardless of enforcement mode — see
 * the module header for why.
 */
export function issueCsrfCookie(res: Response): string {
  const token = crypto.randomBytes(32).toString('hex');
  const domain = resolveCookieDomain();
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // MUST be readable by JS — the client echoes it into X-CSRF-Token
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE_MS,
    ...(domain ? { domain } : {}),
  });
  return token;
}

// ─── Minimal Cookie header parser ───────────────────────────────────────────
// No `cookie-parser` dependency in this project (checked — not installed);
// we only ever need to read a single, our-own token cookie, so a hand-rolled
// parser avoids pulling in a new package for one line of logic.

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    const rawVal = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(rawVal);
    } catch {
      out[key] = rawVal;
    }
  }
  return out;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export interface CsrfProtectionOptions {
  /**
   * Path prefixes (relative to the mount point of this middleware) that
   * bypass the check entirely. Reserve for genuinely tokenless entry points
   * — a route no admin session could have obtained the cookie for yet, or a
   * third-party UI that issues its own requests our client interceptor never
   * touches. Document WHY inline at the call site.
   */
  exempt?: string[];
}

/**
 * Double-submit CSRF check for state-changing admin requests. Compares the
 * `X-CSRF-Token` header against the `ecypro_csrf` cookie value using a
 * constant-time comparison (mirrors the `crypto.timingSafeEqual` convention
 * already used for password verification in authController.ts).
 *
 * Mode is decided PER REQUEST from `CSRF_COOKIE_DOMAIN` (see module header):
 *   - unset  → a request with no header at all is allowed through; a
 *              present-but-wrong header is still rejected.
 *   - set    → a missing OR mismatched header/cookie is always rejected.
 */
export function csrfProtection(options: CsrfProtectionOptions = {}) {
  const exempt = options.exempt ?? [];
  return function csrfProtectionMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (!MUTATION_METHODS.has(req.method)) {
      next();
      return;
    }

    if (exempt.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`))) {
      next();
      return;
    }

    const cookies = parseCookies(req.headers.cookie);
    const cookieToken = cookies[CSRF_COOKIE_NAME];
    const headerRaw = req.headers[CSRF_HEADER_NAME];
    const headerToken = Array.isArray(headerRaw) ? headerRaw[0] : headerRaw;

    if (!enforcementActive() && !headerToken) {
      // Enforcement inactive AND the client sent nothing to check — allow.
      // The Origin guard remains the active defense in this mode.
      next();
      return;
    }

    // Either enforcement is active, or the client DID send a header — in
    // both cases it must be present, cookie-backed, and matching.
    if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
      res.status(403).json({
        status: 'error',
        code: 'CSRF_TOKEN_INVALID',
        message: 'Missing or invalid CSRF token.',
      });
      return;
    }

    next();
  };
}
