# SVC Gate-10 — Handoff (2026-06-12)

Spec: `~/Desktop/istemek.md` · ADR: `docs/adr/ADR-services-taxonomy-v2.md` ·
Evidence log: root `PROGRESS.md` → "SERVICES VERTICAL" section (Gate-0..10).

## What shipped (provably working)

- **Root cause fixed:** registry-first resolver — the owner's prod 404 screenshot
  scenario (5/9 menu items dead, 17 sitemap URLs 404) is e2e-armored:
  `e2e/services-menu.spec.ts` 6/6 + `e2e/services-filter.spec.ts` 5/5 +
  `e2e/a11y-services.spec.ts` 5/5 on chromium/firefox/webkit (80/80 total).
- Taxonomy v2: 7 departments (3 new adopt all 14 orphans), 39 canonical slugs,
  single source `src/data/service-taxonomy.ts`, drift test-blocked.
- Mega menu: APG disclosure, opaque surface, Esc focus-return, 9/9 unique
  content-true targets.
- /services index: debounced search + aria-live count + 8 chips + lifecycle
  visualizer (7 numbered workflows) + 3D-tilt cards (reduced-motion safe).
- Detail v2: lifecycle prev/next nav, sticky section pills, 63 CTA variants
  wired, illustration fallback + GSAP entrance, company-valuation page authored.
- SEO: sitemap registry-derived (39 URLs, 0 dead), prerender 170/170,
  i18n parity script exit 0, consent-gated KVKK-safe analytics.
- 4 real a11y contrast/label bugs found by the axe battery and fixed.

## Keyboard + reduced-motion walkthrough (manual pass notes)

- Tab → services trigger: aria-expanded toggles, panel opens on focus; Tab
  traverses 9 items + featured; **Esc closes and returns focus to trigger**
  (unit + e2e asserted).
- `prefers-reduced-motion: reduce`: card tilt disabled (matchMedia guard),
  GSAP illustration renders static final frame (`gsap.matchMedia`), stepper
  reveals render visible-static. All movement transform/opacity-only,
  120–400 ms band (docs/reports/services-design-motion-spec.md).

## Screenshots (this folder)

after-mega-menu-open · after-services-index-{desktop,mobile} ·
after-lifecycle-visualizer · after-detail-{company-valuation, payroll-audit-orphan, pillar-ma}.
"Before" = owner's prod screenshots (404 page + ghosted H1 under translucent
panel) — the bugs themselves; prod still serves old code until merge+deploy.

## OWNER QUEUE (Tier-3 / cannot be done from this session)

1. **Merge decision** — PR open from `claude/competent-burnell-270d4d`; squash
   like #222/#224. No main merge performed (owner-only by contract).
2. **Post-deploy verification:** prod Lighthouse on /services + 1 detail
   (`npm run lh:audit` against live), then Search Console: submit refreshed
   sitemap (39 service URLs; 17 previous 404s now resolve — expect recrawl).
3. **gitleaks history:** 24 hits in OLD git history (pre-branch) — review/rotate
   if any are real; my commits scan clean.
4. **CI full-matrix e2e:** 581 local fails are env classes (backend down, API
   keys, prod-URL audits, visual baselines after intended UI change) — CI with
   backend+secrets is the authoritative run; visual snapshots need re-baseline.
5. **EN content strategy:** `list.*` EN keys exist but card/detail copy is
   TR-first by deliberate strategy — decide if/when to wire EN content.
6. **Backlog seeds (optional):** maturity-assessment teaser band + compare tray
   (istemek.md B5 "may design" items — not shipped; ≤2-widget budget respected).
