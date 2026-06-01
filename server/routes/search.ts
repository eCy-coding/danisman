/**
 * P17 BE Track 2 / Aşama 3 — Full-text search endpoint.
 *
 * Backed by Postgres tsvector + GIN over `services.searchVectorTr` and
 * `services.searchVectorEn`. The migration at
 * `prisma/migrations/20260516200000_p17_be_fts/` provisions the columns,
 * trigger, and indexes.
 *
 * Contract:
 *   GET /api/search?q=<query>&lang=tr|en&type=services&limit=20&cursor=<opaque>
 *
 * Query language:
 *   - `q` is sanitised + tokenised; each token becomes a `prefix:*`
 *     query joined with `&`. This means typing "ai con" matches "AI
 *     Consulting" via prefix on "con*". Stopwords + control characters
 *     are stripped. Empty queries → 400.
 *   - `lang` defaults to 'tr'. Picks which tsvector column + tsquery
 *     dictionary to use. 'en' switches to the english stemmed config.
 *   - `type` is currently fixed to "services" but the response shape
 *     supports a multi-collection union once BlogPost / CaseStudy are
 *     persisted (planned P18).
 *   - `limit` is clamped to [1, 50]; default 20.
 *   - `cursor` is a base64url-encoded `{rank,id}` tuple — we paginate by
 *     rank DESC, id ASC so the order is deterministic across ties.
 *
 * Response (200):
 *   {
 *     status: "ok",
 *     results: [{ type, id, slug, title, snippet, rank }],
 *     nextCursor: string | null,
 *     query: { q, lang, limit }
 *   }
 *
 * Cache: server-side LRU keyed on (q, lang, limit, cursor) for 60s —
 * see P16/1 cache middleware. Public Cache-Control 60s/120s swr.
 */

import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/db';
import { logger } from '../config/logger';
import { cache } from '../middleware/cache';

const router = Router();

// ── Query sanitisation ─────────────────────────────────────────────────────

const TOKEN_PATTERN = /[\p{L}\p{N}]+/gu;
const MAX_TOKENS = 6;
const MAX_TOKEN_LENGTH = 32;

/** Returns a Postgres tsquery string built from a user query. Returns
 *  null when the query collapses to nothing usable (all stop chars).
 *
 *  Note: we explicitly reset `lastIndex` before each call. The module-level
 *  regex is `g`-flagged for `exec()`-loop semantics, but if a previous
 *  call broke out early (MAX_TOKENS cap) the stateful index would leak
 *  into the next invocation and skip valid leading tokens. */
export function buildTsQuery(q: string): string | null {
  const tokens: string[] = [];
  TOKEN_PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_PATTERN.exec(q)) !== null) {
    const tok = m[0].toLowerCase().slice(0, MAX_TOKEN_LENGTH);
    if (tok.length === 0) continue;
    tokens.push(tok);
    if (tokens.length >= MAX_TOKENS) break;
  }
  TOKEN_PATTERN.lastIndex = 0;
  if (tokens.length === 0) return null;
  // `prefix:*` lets the search match incomplete words ("consul" → "consulting").
  return tokens.map((t) => `${t}:*`).join(' & ');
}

// ── Cursor codec ───────────────────────────────────────────────────────────

interface Cursor {
  rank: number;
  id: string;
}

function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

function decodeCursor(s: string | undefined): Cursor | null {
  if (!s) return null;
  try {
    const raw = Buffer.from(s, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as Partial<Cursor>;
    if (typeof parsed.rank !== 'number' || typeof parsed.id !== 'string') return null;
    return { rank: parsed.rank, id: parsed.id };
  } catch {
    return null;
  }
}

// ── Result types ───────────────────────────────────────────────────────────

interface SearchResult {
  type: 'service';
  id: string;
  slug: string;
  title: string;
  snippet: string;
  rank: number;
}

// ── Route handler ──────────────────────────────────────────────────────────

router.get(
  '/',
  cache({
    ttlMs: 60_000,
    staleWhileRevalidateMs: 120_000,
    tier: 'public',
    // Cache key per (q, lang, limit, cursor) so the LRU doesn't collide
    // entries across different queries.
    scope: (req) =>
      [
        String(req.query.q ?? ''),
        String(req.query.lang ?? 'tr'),
        String(req.query.limit ?? '20'),
        String(req.query.cursor ?? ''),
      ].join('|'),
  }),
  async (req: Request, res: Response): Promise<void> => {
    const q = String(req.query.q ?? '').trim();
    const langRaw = String(req.query.lang ?? 'tr').toLowerCase();
    const lang: 'tr' | 'en' = langRaw === 'en' ? 'en' : 'tr';
    const limit = Math.max(
      1,
      Math.min(50, Number.parseInt(String(req.query.limit ?? '20'), 10) || 20),
    );
    const cursor = decodeCursor(req.query.cursor as string | undefined);

    if (q.length === 0) {
      res.status(400).json({
        status: 'error',
        code: 'QUERY_EMPTY',
        message: 'Missing required parameter: q',
      });
      return;
    }
    if (q.length > 256) {
      res.status(400).json({
        status: 'error',
        code: 'QUERY_TOO_LONG',
        message: 'q must be ≤ 256 characters',
      });
      return;
    }

    const tsquery = buildTsQuery(q);
    if (!tsquery) {
      res.json({
        status: 'ok',
        results: [],
        nextCursor: null,
        query: { q, lang, limit },
      });
      return;
    }

    const vectorCol = lang === 'en' ? 'searchVectorEn' : 'searchVectorTr';
    const config = lang === 'en' ? 'english' : 'simple';
    const titleCol = lang === 'en' ? 'titleEn' : 'titleTr';
    const descCol = lang === 'en' ? 'descEn' : 'descTr';

    try {
      // ts_rank_cd is more sensitive to proximity than ts_rank — preferred
      // for "did the matched tokens appear close together?" relevance.
      // We push pagination into SQL via (rank < cursor.rank) OR
      // (rank = cursor.rank AND id > cursor.id) so paging is stable
      // across ties. limit + 1 lets us detect whether another page exists.
      const rows = await prisma.$queryRawUnsafe<
        Array<{ id: string; slug: string; title: string; snippet: string; rank: number }>
      >(
        `
        SELECT
          s.id,
          s.slug,
          s.${titleCol} AS title,
          ts_headline($1, s.${descCol}, to_tsquery($1, $2), 'MaxFragments=2,MinWords=4,MaxWords=12') AS snippet,
          ts_rank_cd(s."${vectorCol}", to_tsquery($1, $2)) AS rank
        FROM "services" s
        WHERE s."isActive" = true
          AND s."${vectorCol}" @@ to_tsquery($1, $2)
          ${cursor ? `AND (ts_rank_cd(s."${vectorCol}", to_tsquery($1, $2)), s.id) < ($3::float, $4)` : ''}
        ORDER BY rank DESC, s.id ASC
        LIMIT ${limit + 1}
        `,
        config,
        tsquery,
        ...(cursor ? [cursor.rank, cursor.id] : []),
      );

      const hasMore = rows.length > limit;
      const page = rows.slice(0, limit);

      interface ServiceRow {
        id: string;
        slug: string;
        title: string;
        snippet: string;
        rank: number;
      }
      const results: SearchResult[] = page.map((r: ServiceRow) => ({
        type: 'service',
        id: r.id,
        slug: r.slug,
        title: r.title,
        snippet: stripTsHeadline(r.snippet),
        rank: r.rank,
      }));

      const last = page[page.length - 1];
      const nextCursor = hasMore && last ? encodeCursor({ rank: last.rank, id: last.id }) : null;

      res.json({
        status: 'ok',
        results,
        nextCursor,
        query: { q, lang, limit },
      });
    } catch (err) {
      logger.error('[search] query failed', {
        message: (err as Error).message,
        q,
        lang,
      });
      res.status(500).json({
        status: 'error',
        code: 'SEARCH_INTERNAL_ERROR',
        message: 'Search engine error',
      });
    }
  },
);

// ── Helpers ────────────────────────────────────────────────────────────────

/** ts_headline wraps matched fragments in <b>…</b>. We keep the markers
 *  but normalise to a safer span tag for the FE. Leaving the substitution
 *  to the FE would be cleaner long-term — left as TODO(P18). */
function stripTsHeadline(s: string): string {
  if (!s) return '';
  return s.replace(/<b>/g, '<mark>').replace(/<\/b>/g, '</mark>');
}

export default router;
