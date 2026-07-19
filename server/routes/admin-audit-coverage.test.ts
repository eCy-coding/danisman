/**
 * KVKK accountability regression shield — admin mutation audit coverage.
 *
 * Context: a 2026-07 review found that several admin mutation routes
 * (breach/verbis/ropa notification records, lead/content/collection CRUD,
 * security-critical API-key + IP-whitelist changes) had zero AuditLog
 * trail, despite KVKK m.10/12 requiring accountability for exactly these
 * kinds of admin actions. This test is a *static* regression shield: it
 * reads every admin route file (`server/routes/admin.ts` and
 * `admin-*.ts`) and asserts that any file declaring a mutation handler
 * (POST/PATCH/PUT/DELETE) also references one of the two accepted audit
 * mechanisms in this codebase:
 *
 *   1. `auditMiddleware(...)` from server/middleware/audit.ts (composed
 *      directly on the router — e.g. admin-rbac.ts), or
 *   2. an inline `prisma.auditLog.create(...)` call (the dominant
 *      pattern — e.g. admin-deals.ts, admin-breach.ts).
 *
 * This is a coarse, file-level check (does the file participate in the
 * audit pattern at all), not a per-handler line-level check — it exists
 * to catch the *systemic* gap (a whole new admin route file shipped with
 * zero audit trail), not to enforce that literally every single mutation
 * is individually audited. New admin route files with mutations MUST wire
 * up one of the two mechanisms above or be added to the ALLOWLIST below
 * with a written justification — silent gaps here are exactly the KVKK
 * accountability failure this test exists to catch.
 *
 * KNOWN LIMIT — file-level, not handler-level: a file passes as soon as it
 * contains one audit reference, so individual unaudited handlers inside an
 * already-participating file are NOT caught. `admin.ts` (14 mutation
 * handlers / 4 auditLog refs) and `admin-insights.ts` (14 / 2) are the two
 * known cases. Closing that needs per-handler analysis, tracked separately.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import path from 'path';

const ROUTES_DIR = path.resolve(__dirname, '.');

// Matches router.post(/patch(/put(/delete( regardless of the router
// variable's name (router, adminDealsRouter, ...) — these files only ever
// call .post/.patch/.put/.delete on an Express Router instance, so a bare
// method-name match is unambiguous here (no redis/prisma method collides
// with these four names).
const MUTATION_METHOD_RE = /\.(post|patch|put|delete)\s*\(/;

// Accepts either audit mechanism, tolerant of Prettier line-wrapping the
// `prisma.auditLog` / `.create(` method chain across multiple lines.
const AUDIT_REFERENCE_RE = /(?:auditMiddleware\s*\(|prisma\.auditLog\s*\.\s*create\s*\()/;

interface AllowlistEntry {
  file: string;
  justification: string;
}

// Every entry here MUST have a written justification. Do not add a file
// here just to make the test pass — fix the route instead unless the
// justification genuinely holds.
const ALLOWLIST: AllowlistEntry[] = [
  {
    file: 'admin-revalidate.ts',
    justification:
      'POST / is a pure cache-invalidation broadcast (adminEventBus.publish) — it never ' +
      'reads or writes personal/business data (no prisma/redis mutation in the handler), ' +
      'so there is no state change for an AuditLog row to describe. The action is already ' +
      'observable via adminEventBus "audit.action" + logger.info.',
  },
];

function isTestFile(name: string): boolean {
  return name.endsWith('.test.ts');
}

// `admin.ts` (the largest admin route file) does not carry the `admin-`
// prefix, so an `admin-`-only match silently excluded it from the shield —
// the exact blind spot this test exists to prevent. Match the whole admin
// route surface: `admin.ts` plus every `admin-*.ts`.
function isAdminRouteFile(name: string): boolean {
  if (!name.endsWith('.ts') || isTestFile(name)) return false;
  return name === 'admin.ts' || name.startsWith('admin-');
}

describe('admin-audit-coverage — KVKK accountability regression shield', () => {
  const files = readdirSync(ROUTES_DIR).filter(isAdminRouteFile);

  // Sanity check on the harness itself — if this ever drops to 0, the
  // glob/dir logic broke and the whole test is vacuously true.
  it('discovers admin route files to scan', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  // Pins the 2026-07 blind spot: the discovery filter used to require an
  // `admin-` prefix, which silently excluded `admin.ts` — the largest admin
  // route file (14 mutation handlers) — from the shield entirely. A shield
  // that skips a mutation-heavy file is worse than no shield: it reports
  // green. Narrowing the filter back must fail here, loudly.
  it('scans admin.ts itself, not only the admin-* prefixed files', () => {
    expect(files).toContain('admin.ts');
    expect(files.some((f) => f.startsWith('admin-'))).toBe(true);
  });

  it('every admin route file with a POST/PATCH/PUT/DELETE handler references an audit mechanism, unless allowlisted', () => {
    const allowlistedFiles = new Set(ALLOWLIST.map((e) => e.file));
    const failures: string[] = [];

    for (const file of files) {
      const content = readFileSync(path.join(ROUTES_DIR, file), 'utf-8');
      const hasMutation = MUTATION_METHOD_RE.test(content);
      if (!hasMutation) continue; // read-only route file — nothing to audit

      const hasAuditReference = AUDIT_REFERENCE_RE.test(content);
      if (hasAuditReference) continue; // covered

      if (allowlistedFiles.has(file)) continue; // covered via documented exception

      failures.push(file);
    }

    expect(
      failures,
      `The following admin route files declare a mutation handler (POST/PATCH/PUT/DELETE) ` +
        `but reference neither auditMiddleware nor prisma.auditLog.create, and are not in ` +
        `the ALLOWLIST above: ${failures.join(', ')}. Every admin mutation must leave a ` +
        `KVKK-accountability trail (m.10/12) — wire up one of the two audit mechanisms, or ` +
        `add a justified ALLOWLIST entry if the mutation is genuinely non-state-changing.`,
    ).toEqual([]);
  });

  it('every ALLOWLIST entry has a non-trivial justification and points at a real file', () => {
    for (const entry of ALLOWLIST) {
      expect(files, `ALLOWLIST entry "${entry.file}" does not match any discovered file`).toContain(
        entry.file,
      );
      expect(
        entry.justification.length,
        `ALLOWLIST entry "${entry.file}" needs a real justification, not a placeholder`,
      ).toBeGreaterThan(20);
    }
  });
});
