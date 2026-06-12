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
| 2026-06-12 | DB-published post detail page: BlogPostPage is static-MDX-only (`import ../content/blog/${slug}.mdx`), so an appended DB card click lands on "Makele Bulunamadı"; `/api/v1/insights/posts/:slug` has zero frontend consumers | Owner task was (a) CLS-safe feed append + (b) 'arastirma' taxonomy; detail-page DB fallback is a separate render pipeline (MDX vs DB markdown string) with its own test surface | Owner: detail render decision before first DB publish — react-markdown@10 already in deps, unused |
| 2026-06-12 | Local e2e RED pre-existing: a11y-perspektifler ×4 + reader-journey ×1 fail per browser (mega-menu-insights panel stays `invisible` on hover) + sanity Booking Wizard mock submit ×3 — clean-HEAD stash run reproduces identical fails (chromium 5/5), zero delta from DB-feed diff | Mega menu = PR #227 APG surface, Booking Wizard = mock flow; both unrelated to CLS/format task | Owner: APG mega-menu hover intent vs e2e stableHover reconcile + Booking Wizard mock contract check |
