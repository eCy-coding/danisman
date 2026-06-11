# PROGRESS — Perspektifler Rebuild

## GATE-0 — Recon (DONE 2026-06-11)
- DONE: spec saved (brain/PERSPEKTIFLER_REBUILD_SPEC.md), SCOPE.md + allowlist, bug table
  (12 bugs, root-caused to file:line), benchmark matrix (NN/g + Stripe live; rest staged),
  content-inventory.csv (36 mdx, 108 raw tags, 21 raw cats), PLAN.md + PLAN.json,
  CLAUDE.md working principles, GAPS appended to spec.
- DECISION: /perspektifler becomes canonical hub; adopt /insights subsystem; 301 /blog in.
- DECISION: benchmark = 2 live-verified + 8 inferred (labeled); more live spot-checks on demand.
- NEXT: await user approval → Phase 1 (taxonomy.json + merge-map + check-taxonomy gate).

## Decisions log
- 2026-06-11 D1: scope fenced to Perspektifler vertical (SCOPE.md). /about BUG-07 only if global.
- 2026-06-11 D2: canonical hub = /perspektifler (reverse current /perspektifler->/blog redirect).

## GATE-1 — Taxonomy (DONE 2026-06-11)
- DONE: src/data/perspektifler/{taxonomy,merge-map,redirects}.json + scripts/
  build-perspektifler-taxonomy.mjs + scripts/check-taxonomy.mjs.
- EVIDENCE (node scripts/check-taxonomy.mjs): 13/13 PASS — 10 categories, 57 tags (<=60),
  0 dup normalized slugs, 100% of 108 raw tags mapped, 100% of 21 raw cats mapped,
  /blog->/perspektifler correct, 100% article 301s (36), 100% retired tag-URL 301s (108),
  no chain >1 hop. 146 redirects total.
- DECISION: 57-term controlled vocab (room under 60 for quarterly additions); ecyverse tag
  dropped (brand noise); strateji/m-and-a/degerleme/ESG/Liderlik tags dropped (= categories).
- NEXT: Phase 2 — menu BUG-01..04 + BUG-12.
