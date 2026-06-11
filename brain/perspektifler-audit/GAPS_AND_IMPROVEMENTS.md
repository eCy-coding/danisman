# GAPS & IMPROVEMENTS (Claude) — Perspektifler spec

Critical, runtime-efficiency-first additions after Phase-0 recon (2026-06-11).
The original spec is preserved verbatim in `brain/PERSPEKTIFLER_REBUILD_SPEC.md`.
Each item: gap → decision (default + rationale), per OPERATING RULE R3.

**G1 — Single content source of truth** (3 systems exist: /blog MDX×36, /insights/* orphaned,
/case-studies). Decision: MDX frontmatter (src/content/blog + case-studies) is the source; a
build-time normalizer emits one `perspektifler-index.json` consumed by hub/category/search.
Idempotent. Rationale: MDX already authored; one derived index kills the parallel-taxonomy bug
and keeps runtime data small.

**G2 — Search engine for THIS stack** (spec: "Pagefind if static else Fuse/Lunr"). Evidence:
Vite SPA + prerender.mjs (154 routes), not pure static HTML. Decision: Fuse.js over a
build-time JSON index (title+excerpt+tags+category+format+lang ONLY, never body), lazy-loaded
on first search focus (dynamic import), NOT in hub bundle. Rationale: protects ≤150KB hub-JS
budget; deterministic; diacritic-fold at build.

**G3 — Index size at 1,000 scale.** Cap fields; precompute diacritic-folded keys at build;
gzip; target <120KB at 1,000. If exceeded, shard by category and load active shard only.

**G4 — URL-state contract** (spec: "all state in URL", no schema). Decision: canonical order
`?kategori&format&konu&yil&sirala&page`; omit defaults (sirala=yeni, page=1) → clean base URL;
`<link rel=canonical>` drops page/sort. One `useSearchParams` reducer. Shareable + SEO-safe.

**G5 — hreflang with 1 EN article** (35 tr / 1 en). Emitting hreflang for unpaired articles is
invalid. Decision: emit hreflang only when pair_id has both langs; else x-default→TR, no
alternate. Avoids Search Console errors.

**G6 — Route/redirect graph (no loops).** TR `/perspektifler`, EN `/en/insights`. 301:
`/blog`→`/perspektifler`, `/blog/:slug`→`/perspektifler/:slug`, legacy `/insights`→
`/perspektifler`, retired tag/category→survivor/category. Every legacy URL points DIRECTLY at
final survivor (no chain >1 hop).

**G7 — Pagination only when needed** (today ~36). Render Load-More + ?page=N only when
results>12; never an empty page 2. Hide facets with <2 results (from G1 counts).

**G8 — Image budget pipeline** (cards need 16:9 AVIF/WebP ≤40KB; many MDX use SVG or
blog-default.jpg). Decision: reuse `scripts/optimize-images.ts` + `convert-images.mjs`;
deterministic default cover per category; lazy + width/height for CLS≤0.1.

**G9 — Menu a11y consistency** (reuse shipped Hizmetler fix, commit 8af969d): insights panel
uses the SAME hover+focus open + aria-hidden/pointer-events toggles; e2e opens via focus()
for cross-browser determinism (Firefox hover-flake lesson).

**G10 — Analytics, no new vendor** (AC-12). Reuse `src/lib/analytics` trackEvent/posthog;
payloads {search_query, zero_result, load_more, category_click, newsletter_submit}; record
pre-launch baseline. (New vendor is a NON-GOAL.)

**G11 — Prerender + sitemap wiring.** Add /perspektifler, each /perspektifler/kategori/<slug>,
and migrated article URLs to `scripts/prerender.mjs` route source AND
`scripts/generate-sitemap.ts`. Tag pages noindex,follow.

**G12 — Definition of done per gate** = the gate's own tool output pasted into PROGRESS.md +
commit. "Looks done"/"flawless" banned. Sandbox can't run Firefox/Lighthouse fully → those
gates emit the command and run on the user's machine; jsdom/unit/build gates run in-session.
