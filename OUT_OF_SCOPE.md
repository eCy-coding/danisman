# OUT_OF_SCOPE — Perspektifler rebuild running log

Entries: dependencies discovered during the build that fall outside SCOPE.md.
Format: `date · what · why out of scope · suggested owner/next step`.

| Date | Item | Why out of scope | Next step |
|---|---|---|---|
| 2026-06-11 | CommentsSection (`src/components/insights/CommentsSection.tsx`) targets `/api/v1/insights/posts/:id/comments` which has no backend | Server work excluded by contract | Component deleted with prototype (Gate-6); backend decision = owner (T0) |
| 2026-06-11 | EN article corpus is empty (49/49 TR) | Content authoring beyond pillar intros excluded | hreflang at hub/category level only (D-4); EN articles = future content sprint |
| 2026-06-11 | `e2e/service_hub.spec.ts` test-1 fails: `/services/crisis-management` → 404 | Pre-existing services.ts↔service-content.ts catalog gap (4/21 match, memory: Tier-3 owner decision); zero service files in this branch diff (`git diff --name-only c648fc7..HEAD | grep -i service` = 0) | Owner: catalog reconcile decision |
| 2026-06-11 | `e2e/i18n-smoke.spec.ts` 5 tests fail: `/en|tr/{founder,pricing,discovery}` → 404 | Pre-existing: those pages were never mounted in the `/:locale/*` tree (verified: `git show c648fc7:src/App.tsx` has no locale `founder` route); zero locale-route removals in branch diff | Owner: locale tree completion (i18n sprint) |
| 2026-06-11 | BUG-07 /about overlapping headline REPRODUCED (gate6-about-headline.png): single h1 stacks "Stratejik Danışmanlık/eCyverse/Ekosistemi" into the navbar zone | Page-local AboutPage hero layering (no shared layer involved — recon + axe hub/category/article clean) | Owner: /about hero CSS fix (about content out of contract) |
| 2026-06-11 | Homepage hero CTA contrast (slate-400 on gold, axe serious) surfaced during open-menu scan | Homepage hero out of vertical | Owner: hero CTA token fix |


Format: [date] item — reason — where it should be handled instead.

(seed) 2026-06-11 — /about duplicated headline (BUG-07): IF root cause is page-local
(not a global style layer) it is OUT OF SCOPE per spec; to be confirmed in Phase 2. If
global-layer, it is in scope.
