/**
 * KVKK accountability regression shield — admin mutation audit coverage.
 *
 * Context: a 2026-07 review found that several admin mutation routes
 * (breach/verbis/ropa notification records, lead/content/collection CRUD,
 * security-critical API-key + IP-whitelist changes) had zero AuditLog
 * trail, despite KVKK m.10/12 requiring accountability for exactly these
 * kinds of admin actions. This test is a *static* regression shield: it
 * reads every `server/routes/admin-*.ts` file and asserts that any file
 * declaring a mutation handler (POST/PATCH/PUT/DELETE) also references
 * one of the two accepted audit mechanisms in this codebase:
 *
 *   1. `auditMiddleware(...)` from server/middleware/audit.ts (composed
 *      directly on the router — e.g. admin-rbac.ts), or
 *   2. an inline `prisma.auditLog.create(...)` call (the dominant
 *      pattern — e.g. admin-deals.ts, admin-breach.ts).
 *
 * This is a coarse, file-level check (does the file participate in the
 * audit pattern at all), not a per-handler line-level check — it exists
 * to catch the *systemic* gap (a whole new admin-*.ts route file shipped
 * with zero audit trail), not to enforce that literally every single
 * mutation is individually audited. New admin-*.ts route files with
 * mutations MUST wire up one of the two mechanisms above or be added to
 * the ALLOWLIST below with a written justification — silent gaps here
 * are exactly the KVKK accountability failure this test exists to catch.
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
  {
    file: 'admin-dsar.ts',
    justification:
      'DSAR requests use a resource-scoped audit trail (prisma.dSARAuditEntry, 7 refs) ' +
      'instead of the central AuditLog table — every POST/PATCH mutation here already ' +
      'writes a DSARAuditEntry row keyed by dsarId. This is a pre-existing, deliberate ' +
      'per-resource pattern (see admin-dsar.ts model comments) and out of scope for the ' +
      "central-AuditLog sweep that added this test. Follow-up: retention.ts's " +
      '/audit-readiness endpoint filters the central AuditLog for a "DSAR_" action prefix ' +
      'that no code currently writes — DSAR entries are therefore invisible to that KVKK ' +
      'report today. Tracked separately; not fixed here to avoid scope creep on this pass.',
  },
];

function isTestFile(name: string): boolean {
  return name.endsWith('.test.ts');
}

function isAdminRouteFile(name: string): boolean {
  return name.startsWith('admin-') && name.endsWith('.ts') && !isTestFile(name);
}

describe('admin-audit-coverage — KVKK accountability regression shield', () => {
  const files = readdirSync(ROUTES_DIR).filter(isAdminRouteFile);

  // Sanity check on the harness itself — if this ever drops to 0, the
  // glob/dir logic broke and the whole test is vacuously true.
  it('discovers admin-*.ts route files to scan', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('every admin-*.ts route file with a POST/PATCH/PUT/DELETE handler references an audit mechanism, unless allowlisted', () => {
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
      `The following admin-*.ts files declare a mutation handler (POST/PATCH/PUT/DELETE) ` +
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
