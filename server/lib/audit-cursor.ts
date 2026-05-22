/**
 * P16 BE Track 2 / Aşama 3 — Opaque cursor codec for the audit-log API.
 *
 * The audit-log endpoint paginates by `(createdAt DESC, id DESC)` tuple,
 * matching the @@index([adminId, createdAt]) + @@index([createdAt]) composite
 * indexes set up in P14-BE Track 2. The cursor is the tuple of the LAST row
 * of the previous page, base64url-encoded so it's URL-safe and opaque to
 * clients (we want to migrate to a different shape later without versioning).
 *
 * Format: base64url(`<ISO-8601 createdAt>|<UUID id>`).
 */

export interface AuditCursor {
  /** ISO-8601 string — must round-trip through `new Date(...)`. */
  createdAt: string;
  /** Stable row id (UUID in our schema). */
  id: string;
}

export function encodeAuditCursor(c: AuditCursor): string {
  return Buffer.from(`${c.createdAt}|${c.id}`, 'utf8').toString('base64url');
}

export function decodeAuditCursor(raw: string): AuditCursor | null {
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf8');
    const sep = decoded.indexOf('|');
    if (sep <= 0) return null;
    const createdAt = decoded.slice(0, sep);
    const id = decoded.slice(sep + 1);
    if (!createdAt || !id) return null;
    if (Number.isNaN(Date.parse(createdAt))) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

// ── Filter parsing ───────────────────────────────────────────────────────────

export interface AuditFilterInput {
  adminId?: unknown;
  action?: unknown;
  targetType?: unknown;
  targetId?: unknown;
  startDate?: unknown;
  endDate?: unknown;
}

export interface AuditFilters {
  adminId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  createdAt?: { gte?: Date; lte?: Date };
}

export interface ParseFiltersResult {
  filters: AuditFilters;
  error?: { code: string; message: string };
}

function trimmedString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t === '' ? undefined : t;
}

export function parseAuditFilters(input: AuditFilterInput): ParseFiltersResult {
  const filters: AuditFilters = {};

  const adminId = trimmedString(input.adminId);
  if (adminId) filters.adminId = adminId;
  const action = trimmedString(input.action);
  if (action) filters.action = action;
  const targetType = trimmedString(input.targetType);
  if (targetType) filters.targetType = targetType;
  const targetId = trimmedString(input.targetId);
  if (targetId) filters.targetId = targetId;

  const range: { gte?: Date; lte?: Date } = {};
  const startRaw = trimmedString(input.startDate);
  if (startRaw) {
    const d = new Date(startRaw);
    if (Number.isNaN(d.getTime())) {
      return {
        filters,
        error: { code: 'INVALID_DATE_RANGE', message: 'startDate is not a valid ISO date.' },
      };
    }
    range.gte = d;
  }
  const endRaw = trimmedString(input.endDate);
  if (endRaw) {
    const d = new Date(endRaw);
    if (Number.isNaN(d.getTime())) {
      return {
        filters,
        error: { code: 'INVALID_DATE_RANGE', message: 'endDate is not a valid ISO date.' },
      };
    }
    range.lte = d;
  }
  if (range.gte && range.lte && range.gte > range.lte) {
    return {
      filters,
      error: { code: 'INVALID_DATE_RANGE', message: 'startDate must be ≤ endDate.' },
    };
  }
  if (range.gte || range.lte) filters.createdAt = range;

  return { filters };
}

export function clampAuditLimit(raw: unknown, defaultLimit = 50, max = 200): number {
  const n = parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n)) return defaultLimit;
  return Math.min(max, Math.max(1, n));
}
