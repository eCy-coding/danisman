# OUT_OF_SCOPE — Perspektifler rebuild running log

Entries: dependencies discovered during the build that fall outside SCOPE.md.
Format: `date · what · why out of scope · suggested owner/next step`.

| Date | Item | Why out of scope | Next step |
|---|---|---|---|
| 2026-06-11 | CommentsSection (`src/components/insights/CommentsSection.tsx`) targets `/api/v1/insights/posts/:id/comments` which has no backend | Server work excluded by contract | Component deleted with prototype (Gate-6); backend decision = owner (T0) |
| 2026-06-11 | EN article corpus is empty (49/49 TR) | Content authoring beyond pillar intros excluded | hreflang at hub/category level only (D-4); EN articles = future content sprint |
| 2026-06-11 | `e2e/service_hub.spec.ts` test-1 fails: `/services/crisis-management` → 404 | Pre-existing services.ts↔service-content.ts catalog gap (4/21 match, memory: Tier-3 owner decision); zero service files in this branch diff (`git diff --name-only c648fc7..HEAD | grep -i service` = 0) | Owner: catalog reconcile decision |
