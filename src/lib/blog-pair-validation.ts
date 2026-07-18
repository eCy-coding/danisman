/**
 * EN article-parity — pair reciprocity validation (mechanism only, no EN
 * content yet).
 *
 * Every `pair_id` must resolve to exactly 2 members with opposite `lang`.
 * An orphan `pair_id` (a single member) is allowed with a WARNING only when
 * that member is `status:draft` — a published post with a dangling pair_id
 * is a build error. Today's TR-only corpus has zero `pair_id` values, so
 * this validator is a no-op until EN articles ship (must not break the
 * current build).
 *
 * Pure + framework-free so it's unit-testable without touching the
 * filesystem; consumed by scripts/generate-blog-index.ts.
 */

export interface PairValidationPost {
  slug: string;
  pairId?: string;
  lang: 'tr' | 'en';
}

export interface PairValidationResult {
  errors: string[];
  warnings: string[];
}

export function validatePairReciprocity(
  posts: PairValidationPost[],
  statusBySlug: Map<string, string>,
): PairValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const pairGroups = new Map<string, PairValidationPost[]>();
  for (const p of posts) {
    if (!p.pairId) continue;
    const group = pairGroups.get(p.pairId) ?? [];
    group.push(p);
    pairGroups.set(p.pairId, group);
  }

  for (const [pairId, group] of pairGroups) {
    if (group.length === 1) {
      const only = group[0];
      if (!only) continue; // unreachable (length===1 guarantees this), guard for noUncheckedIndexedAccess
      if (statusBySlug.get(only.slug) === 'draft') {
        warnings.push(
          `pair_id "${pairId}" (${only.slug}.mdx) has no reciprocal counterpart yet — allowed (status:draft)`,
        );
      } else {
        errors.push(
          `${only.slug}.mdx: pair_id "${pairId}" has no reciprocal counterpart (status is not draft)`,
        );
      }
      continue;
    }

    if (group.length === 2) {
      const a = group[0];
      const b = group[1];
      if (!a || !b) continue; // unreachable (length===2 guarantees this), guard for noUncheckedIndexedAccess
      if (a.lang === b.lang) {
        errors.push(
          `pair_id "${pairId}": both members share lang "${a.lang}" (${a.slug}.mdx, ${b.slug}.mdx) — must be opposite languages`,
        );
      }
      continue;
    }

    errors.push(
      `pair_id "${pairId}": ${group.length} members (expected exactly 2) — ${group
        .map((p) => `${p.slug}.mdx`)
        .join(', ')}`,
    );
  }

  return { errors, warnings };
}
